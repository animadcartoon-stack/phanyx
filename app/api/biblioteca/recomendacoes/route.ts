import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corpoLeitor, erroLeitor, exigirEscritaLeitor, falhaLeitor, idLeitor, itemPublicadoLeitor, jsonLeitor, obterLeitorBiblioteca } from "@/lib/biblioteca-leitor";
import { destinosProfessor, listarRecomendacoes, selecaoRecomendacao, validarDadosRecomendacao } from "@/lib/biblioteca-recomendacoes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leitor = await obterLeitorBiblioteca();
    const [recebidas, minhas, destinos] = await Promise.all([
      listarRecomendacoes(leitor),
      leitor.portal === "professor" ? prisma.bibliotecaRecomendacao.findMany({ where: {
        instituicaoId: leitor.instituicaoId, professorId: leitor.vinculoId,
        item: { instituicaoId: leitor.instituicaoId, status: "PUBLICADO" },
      }, select: selecaoRecomendacao, orderBy: { criadoEm: "desc" }, take: 100 }) : Promise.resolve([]),
      destinosProfessor(leitor),
    ]);
    return jsonLeitor({ recebidas, minhas, destinos });
  } catch (erro) { return erroLeitor(erro); }
}

export async function POST(request: NextRequest) {
  try {
    const leitor = await obterLeitorBiblioteca(); exigirEscritaLeitor(request, leitor);
    const corpo = await corpoLeitor(request);
    const dados = await validarDadosRecomendacao(leitor, corpo);
    const item = await itemPublicadoLeitor(leitor, idLeitor(corpo.itemId));
    const { destinos, ...campos } = dados;
    const recomendacao = await prisma.bibliotecaRecomendacao.create({ data: {
      ...campos, instituicaoId: leitor.instituicaoId, professorId: leitor.vinculoId, itemId: item.id,
      publicadaEm: dados.status === "PUBLICADA" ? new Date() : null, destinos: { create: destinos },
    }, select: selecaoRecomendacao });
    return jsonLeitor({ recomendacao }, 201);
  } catch (erro) { return erroLeitor(erro); }
}

export async function PATCH(request: NextRequest) {
  try {
    const leitor = await obterLeitorBiblioteca(); exigirEscritaLeitor(request, leitor);
    if (leitor.portal !== "professor") falhaLeitor(403, "SOMENTE_PROFESSOR");
    const corpo = await corpoLeitor(request); const id = idLeitor(corpo.id);
    const existente = await prisma.bibliotecaRecomendacao.findFirst({ where: {
      id, instituicaoId: leitor.instituicaoId, professorId: leitor.vinculoId,
    }, select: { id: true, itemId: true, publicadaEm: true } });
    if (!existente) falhaLeitor(404, "RECOMENDACAO_NAO_ENCONTRADA");
    if (corpo.status === "ENCERRADA" || corpo.status === "CANCELADA") {
      await prisma.bibliotecaRecomendacao.updateMany({ where: { id, instituicaoId: leitor.instituicaoId, professorId: leitor.vinculoId },
        data: { status: corpo.status, encerradaEm: corpo.status === "ENCERRADA" ? new Date() : null,
          canceladaEm: corpo.status === "CANCELADA" ? new Date() : null } });
      return jsonLeitor({ atualizada: true });
    }
    await itemPublicadoLeitor(leitor, existente.itemId);
    const { destinos, ...dados } = await validarDadosRecomendacao(leitor, corpo);
    const recomendacao = await prisma.$transaction(async (tx) => {
      await tx.bibliotecaRecomendacaoDestino.deleteMany({ where: { recomendacaoId: id, instituicaoId: leitor.instituicaoId } });
      return tx.bibliotecaRecomendacao.update({ where: { id_instituicaoId: { id, instituicaoId: leitor.instituicaoId }, professorId: leitor.vinculoId },
        data: { ...dados, publicadaEm: dados.status === "PUBLICADA" ? existente.publicadaEm || new Date() : null,
          encerradaEm: null, canceladaEm: null, destinos: { create: destinos } }, select: selecaoRecomendacao });
    });
    return jsonLeitor({ recomendacao });
  } catch (erro) { return erroLeitor(erro); }
}
