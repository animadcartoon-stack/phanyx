// Enquanto a transferencia por turma avulsa nao e suportada, bloqueia-se
// a movimentacao da matricula inteira antes de atualizar polo, turma ou itens.
// Nao altera os estados de cancelamento/trancamento, preservando o historico.
import type { Prisma } from "@prisma/client";

export async function possuiVinculoDiretoMatricula(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  matriculaId: number,
): Promise<boolean> {
  if (!Number.isSafeInteger(instituicaoId) || instituicaoId <= 0 ||
      !Number.isSafeInteger(matriculaId) || matriculaId <= 0) {
    throw new Error("Identificadores invalidos para a transferencia");
  }
  const vinculo = await tx.matriculaTurmaAvulsa.findFirst({
    where: { instituicaoId, matriculaId },
    select: { id: true },
  });
  return Boolean(vinculo);
}
