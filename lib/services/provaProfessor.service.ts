import { prisma } from "@/lib/prisma";

export async function provaPertenceAoProfessor(params: {
  provaId: number;
  professorId: number;
  instituicaoId: number;
}) {
  const { provaId, professorId, instituicaoId } = params;

  const prova = await prisma.prova.findFirst({
    where: {
      id: provaId,
      instituicaoId,
      disciplina: {
        professorId,
      },
    },
    include: {
      disciplina: true,
    },
  });

  if (!prova) {
    throw new Error("PROVA_NAO_ENCONTRADA_OU_SEM_PERMISSAO");
  }

  return prova as any;
}