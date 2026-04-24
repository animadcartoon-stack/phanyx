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
    { error: "Seu plano não permite acessar os relatórios financeiros." },
    { status: 403 }
  );
}

    const { searchParams } = new URL(req.url);

    const inicioStr = String(searchParams.get("inicio") || "").trim();
    const fimStr = String(searchParams.get("fim") || "").trim();
    const poloId = String(searchParams.get("poloId") || "").trim();

    const whereBase: any = {
  instituicaoId: user.instituicaoId,
  ...(poloId ? { poloId: Number(poloId) } : {}),
};

    if (inicioStr || fimStr) {
      whereBase.createdAt = {};
      if (inicioStr) {
        whereBase.createdAt.gte = new Date(`${inicioStr}T00:00:00`);
      }
      if (fimStr) {
        whereBase.createdAt.lte = new Date(`${fimStr}T23:59:59.999`);
      }
    }

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where: whereBase,
      include: {
        aluno: true,
        pagamentos: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
// buscar configuração da instituição
const config = await prisma.configuracaoFinanceiraInstituicao.upsert({
  where: {
    instituicaoId: user.instituicaoId,
  },
  update: {},
  create: {
    instituicaoId: user.instituicaoId,
    jurosPadrao: 0,
    multaPadrao: 0,
    descontoPadrao: 0,
    diasTolerancia: 0,
    bloquearAlunoInadimplente: false,
    quantidadeMensalidadesParaBloqueio: 3,
    permitirPagamentoParcial: true,
  },
});

const quantidadeMensalidadesParaBloqueio = Number(
  config.quantidadeMensalidadesParaBloqueio || 3
);

// contar mensalidades atrasadas por aluno
const contador: Record<number, number> = {};

for (const item of lancamentos) {
  if (
    item.tipo === "MENSALIDADE" &&
    item.status === "ATRASADO"
  ) {
    if (!contador[item.alunoId]) {
      contador[item.alunoId] = 0;
    }
    contador[item.alunoId]++;
  }
}

// contar apenas alunos com >= X mensalidades atrasadas
const alunosInadimplentes = Object.values(contador).filter(
  (qtd) => qtd >= quantidadeMensalidadesParaBloqueio
).length;

    const totalLancado = lancamentos.reduce(
      (acc, item) => acc + Number(item.valorFinal ?? item.valorOriginal ?? 0),
      0
    );

    const totalPago = lancamentos.reduce(
      (acc, item) => acc + Number(item.valorPago || 0),
      0
    );

    const totalPendente = lancamentos
      .filter((item) => item.status === "PENDENTE" || item.status === "PARCIAL")
      .reduce(
        (acc, item) =>
          acc +
          (Number(item.valorFinal ?? item.valorOriginal ?? 0) -
            Number(item.valorPago || 0)),
        0
      );

    const totalAtrasado = lancamentos
      .filter((item) => item.status === "ATRASADO")
      .reduce(
        (acc, item) =>
          acc +
          (Number(item.valorFinal ?? item.valorOriginal ?? 0) -
            Number(item.valorPago || 0)),
        0
      );

    const resumoPorTipo = {
      MATRICULA: 0,
      MENSALIDADE: 0,
      TAXA: 0,
      DESCONTO: 0,
      OUTRO: 0,
    };

    for (const item of lancamentos) {
      const valor = Number(item.valorFinal ?? item.valorOriginal ?? 0);
      if (item.tipo in resumoPorTipo) {
        resumoPorTipo[item.tipo as keyof typeof resumoPorTipo] += valor;
      }
    }

    return NextResponse.json({
      resumo: {
        quantidadeLancamentos: lancamentos.length,
        totalLancado,
        totalPago,
        totalPendente,
        totalAtrasado,
        alunosInadimplentes,
      },
      resumoPorTipo,
      lancamentos,
    });
  } catch (e: any) {
    console.error("ERRO RELATORIOS FINANCEIROS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar relatórios financeiros" },
      { status: 500 }
    );
  }
}