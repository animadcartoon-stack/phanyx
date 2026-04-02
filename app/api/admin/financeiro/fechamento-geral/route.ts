import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarFinanceiroCompleto } from "@/lib/permissoesPlano";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

if (!podeUsarFinanceiroCompleto(user.plano || "ESSENCIAL")) {
  return NextResponse.json(
    { error: "Seu plano não permite acessar o fechamento geral." },
    { status: 403 }
  );
}

    const { searchParams } = new URL(req.url);
    const data = String(searchParams.get("data") || "").trim();

    const base = data ? new Date(`${data}T00:00:00`) : new Date();
    const inicio = new Date(base);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(base);
    fim.setHours(23, 59, 59, 999);

    const caixas = await prisma.caixa.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        status: "FECHADO",
        dataFechamento: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        movimentos: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        dataFechamento: "desc",
      },
    });

    const resumo = {
  totalCaixas: caixas.length,
  saldoSistema: 0,
  saldoInformado: 0,
  diferenca: 0,
  dinheiro: 0,
  pix: 0,
  cartao: 0,
  boleto: 0,
  transferencia: 0,
  outro: 0,
};

for (const c of caixas) {
  resumo.saldoSistema += Number(c.saldoSistema || 0);
  resumo.saldoInformado += Number(c.saldoInformado || 0);
  resumo.diferenca += Number(c.diferenca || 0);

  if (!c.movimentos) continue;

  for (const mov of c.movimentos) {
    if (mov.tipo !== "ENTRADA") continue;

    const valor = Number(mov.valor || 0);

    if (mov.formaPagamento === "DINHEIRO") resumo.dinheiro += valor;
    else if (mov.formaPagamento === "PIX") resumo.pix += valor;
    else if (mov.formaPagamento === "CARTAO") resumo.cartao += valor;
    else if (mov.formaPagamento === "BOLETO") resumo.boleto += valor;
    else if (mov.formaPagamento === "TRANSFERENCIA") resumo.transferencia += valor;
    else resumo.outro += valor;
  }
}

    return NextResponse.json({
      data: inicio.toISOString(),
      resumo,
      caixas,
    });
  } catch (e: any) {
    console.error("ERRO FECHAMENTO GERAL:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar fechamento geral" },
      { status: 500 }
    );
  }
}