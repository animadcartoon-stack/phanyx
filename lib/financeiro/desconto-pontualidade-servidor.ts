import type { Prisma } from "@prisma/client";
import { lerDescontoPontualidade } from "./desconto-pontualidade";

export async function buscarDescontoPontualidade(db: Prisma.TransactionClient, instituicaoId: number) {
  const config = await db.configuracaoFinanceiraInstituicao.findUnique({
    where: { instituicaoId },
    select: { descontoPontualidade: true },
  });
  return lerDescontoPontualidade(config?.descontoPontualidade);
}

export async function condicoesPontualidadeMatricula(db: Prisma.TransactionClient, instituicaoId: number) {
  const descontoPontualidade = await buscarDescontoPontualidade(db, instituicaoId);
  return descontoPontualidade ? { descontoPontualidade } : {};
}
