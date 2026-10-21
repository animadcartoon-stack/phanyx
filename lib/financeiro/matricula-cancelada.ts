import type { Prisma } from "@prisma/client";

/** Cancelamento da matrícula também bloqueia parcelas antigas ainda pendentes. */
export function matriculaCancelada(matricula?: {
  status: string;
  canceladaEm?: Date | string | null;
} | null) {
  return matricula?.status === "CANCELADA" || Boolean(matricula?.canceladaEm);
}

/** Também aceita lançamentos avulsos, sem matrícula. */
export function filtroMatriculaNaoCancelada(): Prisma.LancamentoFinanceiroWhereInput {
  return { OR: [
    { matriculaId: null },
    { matricula: { is: { status: { not: "CANCELADA" }, canceladaEm: null } } },
  ] };
}
