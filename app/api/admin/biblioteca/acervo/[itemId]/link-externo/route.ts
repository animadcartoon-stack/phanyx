import { AcaoAuditoriaBiblioteca, ModalidadeAcessoBiblioteca, StatusArquivoBiblioteca, StatusItemBiblioteca, TipoArquivoBiblioteca } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ErroBiblioteca, exigirPermissaoBiblioteca, obterContextoBiblioteca, respostaErroBiblioteca } from "@/lib/biblioteca-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const usuario = await getUserFromToken();
    const contexto = await obterContextoBiblioteca(usuario);
    if (!usuario) throw new ErroBiblioteca(401, "Usuário não autenticado.", "NAO_AUTENTICADO");
    if (usuario.impersonacao) throw new ErroBiblioteca(403, "Operação bloqueada durante sessão de suporte.", "OPERACAO_BLOQUEADA_EM_IMPERSONACAO");
    exigirPermissaoBiblioteca(usuario, contexto, "biblioteca.arquivos.gerenciar");

    const itemId = Number(params.itemId);
    if (!Number.isSafeInteger(itemId) || itemId <= 0) throw new ErroBiblioteca(400, "Item inválido.", "ITEM_ID_INVALIDO");
    const corpo = await request.json() as { url?: unknown };
    if (!corpo || typeof corpo.url !== "string") throw new ErroBiblioteca(400, "Informe um endereço HTTPS.", "URL_INVALIDA");
    const valor = corpo.url.trim();
    if (valor.length > 2048) throw new ErroBiblioteca(400, "Endereço muito longo.", "URL_INVALIDA");
    let url: URL | null = null;
    if (valor) {
      try { url = new URL(valor); } catch { throw new ErroBiblioteca(400, "Endereço inválido.", "URL_INVALIDA"); }
      if (url.protocol !== "https:" || url.username || url.password || !url.hostname) {
        throw new ErroBiblioteca(400, "Use um endereço HTTPS sem credenciais.", "URL_INVALIDA");
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const item = await tx.bibliotecaItem.findFirst({
        where: { id: itemId, instituicaoId: contexto.instituicaoId },
        select: { id: true, modalidade: true, status: true },
      });
      if (!item) throw new ErroBiblioteca(404, "Item não encontrado.", "ITEM_NAO_ENCONTRADO");
      if (item.status === StatusItemBiblioteca.ARQUIVADO || item.modalidade !== ModalidadeAcessoBiblioteca.LINK_EXTERNO) {
        throw new ErroBiblioteca(409, "Este item não aceita um link externo.", "MODALIDADE_INVALIDA");
      }
      const anterior = await tx.bibliotecaArquivo.findFirst({
        where: { instituicaoId: contexto.instituicaoId, itemId, tipo: TipoArquivoBiblioteca.LINK_EXTERNO, arquivadoEm: null },
        select: { id: true, urlExterna: true }, orderBy: { id: "desc" },
      });
      if (url && anterior) {
        await tx.bibliotecaArquivo.update({ where: { id: anterior.id }, data: { urlExterna: url.href, nomeOriginal: url.hostname, status: StatusArquivoBiblioteca.DISPONIVEL } });
      } else if (url) {
        await tx.bibliotecaArquivo.create({ data: {
          instituicaoId: contexto.instituicaoId, itemId,
          tipo: TipoArquivoBiblioteca.LINK_EXTERNO,
          status: StatusArquivoBiblioteca.DISPONIVEL,
          nomeOriginal: url.hostname,
          urlExterna: url.href,
          provedorArmazenamento: "LINK_EXTERNO",
          protegido: false,
          permitirDownload: false,
          enviadoPorId: usuario.id,
        } });
      } else if (anterior) {
        await tx.bibliotecaArquivo.update({ where: { id: anterior.id }, data: {
          status: StatusArquivoBiblioteca.ARQUIVADO, arquivadoEm: new Date(), arquivadoPorId: usuario.id,
          motivoArquivamento: "Link externo removido do item.",
        } });
      }
      await tx.bibliotecaAuditoria.create({ data: {
        instituicaoId: contexto.instituicaoId, usuarioId: usuario.id,
        entidade: "BibliotecaArquivo", entidadeId: String(anterior?.id ?? itemId),
        acao: AcaoAuditoriaBiblioteca.ATUALIZAR,
        descricao: "Endereço externo do item atualizado.",
        dadosAnteriores: { url: anterior?.urlExterna ?? null },
        dadosPosteriores: { url: url?.href ?? null },
        metadados: { itemId },
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: request.headers.get("user-agent")?.slice(0, 2000) ?? null,
      } });
      return url?.href ?? null;
    });
    return NextResponse.json({ ok: true, url: resultado }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    const resposta = respostaErroBiblioteca(erro);
    return NextResponse.json({ ok: false, ...resposta.corpo }, { status: resposta.status });
  }
}
