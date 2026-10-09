import { StatusArquivoBiblioteca, StatusItemBiblioteca, TipoAcessoBiblioteca } from "@prisma/client";
import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { ErroBiblioteca, obterContextoBiblioteca, respostaErroBiblioteca } from "@/lib/biblioteca-acesso";
import { obterTokenBibliotecaBlob } from "@/lib/biblioteca-storage";
import { podeBaixarPdfBiblioteca } from "@/lib/biblioteca-direitos-download";
import { prisma } from "@/lib/prisma";
import { obterLeitorBiblioteca } from "@/lib/biblioteca-leitor";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { arquivoId: string } }) {
  try {
    await obterLeitorBiblioteca();
    const usuario = await getUserFromToken();
    const contexto = await obterContextoBiblioteca(usuario);
    if (!usuario || usuario.impersonacao || !["ALUNO", "PROFESSOR"].includes(usuario.role.toUpperCase())) {
      throw new ErroBiblioteca(403, "Acesso não permitido.", "ACESSO_NEGADO");
    }

    const vinculo = usuario.role.toUpperCase() === "ALUNO"
      ? await prisma.aluno.findFirst({ where: { userId: usuario.id, instituicaoId: contexto.instituicaoId }, select: { id: true } })
      : await prisma.professor.findFirst({ where: { userId: usuario.id, instituicaoId: contexto.instituicaoId }, select: { id: true } });
    if (!vinculo) throw new ErroBiblioteca(403, "Vínculo acadêmico não encontrado.", "VINCULO_INVALIDO");

    const arquivoId = Number(params.arquivoId);
    if (!Number.isSafeInteger(arquivoId) || arquivoId <= 0) {
      throw new ErroBiblioteca(400, "Arquivo inválido.", "ARQUIVO_ID_INVALIDO");
    }

    const agora = new Date();
    const arquivo = await prisma.bibliotecaArquivo.findFirst({
      where: {
        id: arquivoId, instituicaoId: contexto.instituicaoId, tipo: "PDF",
        status: StatusArquivoBiblioteca.DISPONIVEL, arquivadoEm: null,
        item: {
          instituicaoId: contexto.instituicaoId, status: StatusItemBiblioteca.PUBLICADO,
          modalidade: { in: ["ACESSO_LIVRE", "DOWNLOAD_AUTORIZADO"] },
        },
      },
      select: {
        id: true, itemId: true, nomeOriginal: true, storageKey: true,
        item: {
          select: {
            acessoLivre: true, permitirDownload: true,
            licencas: {
              where: {
                instituicaoId: contexto.instituicaoId, ativo: true,
                OR: [{ inicioVigencia: null }, { inicioVigencia: { lte: agora } }],
                AND: [{ OR: [{ fimVigencia: null }, { fimVigencia: { gte: agora } }] }],
              },
              select: { permitirVisualizacao: true, permitirDownload: true },
            },
          },
        },
      },
    });
    if (!arquivo?.storageKey) throw new ErroBiblioteca(404, "PDF não encontrado.", "PDF_NAO_ENCONTRADO");

    if (!podeBaixarPdfBiblioteca({
      configuracao: contexto.configuracao, item: arquivo.item, licencas: arquivo.item.licencas,
    })) {
      throw new ErroBiblioteca(403, "O download deste PDF não foi autorizado.", "DOWNLOAD_NAO_AUTORIZADO");
    }

    const resultado = await get(arquivo.storageKey, { access: "private", token: obterTokenBibliotecaBlob() });
    if (!resultado || resultado.statusCode !== 200 || !resultado.stream) {
      throw new ErroBiblioteca(404, "PDF indisponível no armazenamento.", "PDF_INDISPONIVEL");
    }

    await prisma.bibliotecaHistoricoAcesso.create({
      data: {
        instituicaoId: contexto.instituicaoId, usuarioId: usuario.id,
        itemId: arquivo.itemId, arquivoId: arquivo.id, tipo: TipoAcessoBiblioteca.DOWNLOAD,
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
        userAgent: request.headers.get("user-agent")?.slice(0, 2_000) || null,
      },
    });

    const nome = arquivo.nomeOriginal.replace(/[\r\n"]/g, "").trim() || "obra.pdf";
    return new NextResponse(resultado.stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (erro) {
    const resposta = respostaErroBiblioteca(erro);
    return NextResponse.json(resposta.corpo, { status: resposta.status, headers: { "Cache-Control": "no-store" } });
  }
}
