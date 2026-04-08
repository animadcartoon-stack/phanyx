import { prisma } from "@/lib/prisma";

export async function atividadePertenceAoProfessor(params: {
  atividadeId: number;
  professorId: number;
  instituicaoId: number;
}) {
  const atividade = await prisma.atividade.findFirst({
    where: {
      id: params.atividadeId,
      instituicaoId: params.instituicaoId,
    },
  });

  if (!atividade) {
    throw new Error("ATIVIDADE_NAO_ENCONTRADA_OU_SEM_PERMISSAO");
  }

  return atividade as any;
}