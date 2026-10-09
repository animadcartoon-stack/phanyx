import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { arquivoPdfLeitor, corpoLeitor, erroLeitor, exigirEscritaLeitor, falhaLeitor, idLeitor, jsonLeitor, obterLeitorBiblioteca } from "@/lib/biblioteca-leitor";
import { validarPosicaoLeitura } from "@/lib/biblioteca-direitos-leitura";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { arquivoId: string } }) {
  try {
    const leitor = await obterLeitorBiblioteca();
    const { arquivo } = await arquivoPdfLeitor(leitor, idLeitor(params.arquivoId));
    const progresso = await prisma.bibliotecaProgressoLeitura.findFirst({
      where: { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId, itemId: arquivo.itemId, arquivoId: arquivo.id },
      select: { paginaAtual: true, totalPaginas: true, percentual: true, concluidoEm: true },
    });
    return jsonLeitor({ progresso });
  } catch (erro) { return erroLeitor(erro); }
}

export async function PUT(request: NextRequest, { params }: { params: { arquivoId: string } }) {
  try {
    const leitor = await obterLeitorBiblioteca(); exigirEscritaLeitor(request, leitor);
    const { arquivo } = await arquivoPdfLeitor(leitor, idLeitor(params.arquivoId));
    const corpo = await corpoLeitor(request);
    const posicao = validarPosicaoLeitura(corpo.paginaAtual, corpo.totalPaginas);
    if (!posicao) falhaLeitor(400, "POSICAO_INVALIDA");
    const progresso = await prisma.bibliotecaProgressoLeitura.upsert({
      where: { instituicaoId_usuarioId_itemId: { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId, itemId: arquivo.itemId } },
      create: { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId, itemId: arquivo.itemId,
        arquivoId: arquivo.id, ...posicao, concluidoEm: posicao.paginaAtual === posicao.totalPaginas ? new Date() : null },
      update: { arquivoId: arquivo.id, ...posicao, ultimoAcessoEm: new Date(),
        concluidoEm: posicao.paginaAtual === posicao.totalPaginas ? new Date() : null },
      select: { paginaAtual: true, totalPaginas: true, percentual: true },
    });
    return jsonLeitor({ progresso });
  } catch (erro) { return erroLeitor(erro); }
}
