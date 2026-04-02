import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

async function buscarConfiguracaoFinanceira(instituicaoId: number) {
  const config = await prisma.configuracaoFinanceiraInstituicao.findUnique({
    where: {
      instituicaoId,
    },
  });

  return {
    diasTolerancia: Number(config?.diasTolerancia || 0),
    bloquearAlunoInadimplente: Boolean(config?.bloquearAlunoInadimplente),
  };
}

async function atualizarAtrasosEInadimplencia(instituicaoId: number) {
  const config = await buscarConfiguracaoFinanceira(instituicaoId);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() - config.diasTolerancia);

  await prisma.lancamentoFinanceiro.updateMany({
    where: {
      instituicaoId,
      status: {
        in: ["PENDENTE", "PARCIAL"] as any,
      },
      vencimento: {
        lt: dataLimite,
      },
    },
    data: {
      status: "ATRASADO",
    },
  });

  if (config.bloquearAlunoInadimplente) {
    const lancamentosAtrasados = await prisma.lancamentoFinanceiro.findMany({
      where: {
        instituicaoId,
        status: "ATRASADO",
      },
      select: {
        alunoId: true,
      },
      distinct: ["alunoId"],
    });

    const alunoIds = lancamentosAtrasados
      .map((item) => item.alunoId)
      .filter((id) => Number.isFinite(id));

    if (alunoIds.length > 0) {
      await prisma.aluno.updateMany({
        where: {
          instituicaoId,
          id: {
            in: alunoIds,
          },
        },
        data: {
          statusAluno: "INADIMPLENTE" as any,
        },
      });
    }
  }
}

export async function GET(_req: NextRequest) {
  try {
    const user = getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    await atualizarAtrasosEInadimplencia(user.instituicaoId);

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        status: "ATRASADO",
      },
      include: {
        aluno: {
          include: {
            user: true,
          },
        },
        pagamentos: {
          orderBy: {
            pagoEm: "desc",
          },
        },
      },
      orderBy: [{ alunoId: "asc" }, { vencimento: "asc" }],
    });

    const mapa = new Map<number, any>();

    for (const item of lancamentos) {
      const chave = item.alunoId;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          alunoId: item.alunoId,
          nome: item.aluno?.nome || "Aluno",
          matricula: item.aluno?.matricula || null,
          email: item.aluno?.user?.email || null,
          statusAluno: item.aluno?.statusAluno || null,
          totalAtrasado: 0,
          quantidadeLancamentos: 0,
          lancamentos: [],
        });
      }

      const grupo = mapa.get(chave);

      const saldoLancamento =
        Number(item.valorFinal ?? item.valorOriginal ?? 0) -
        Number(item.valorPago || 0);

      grupo.totalAtrasado += saldoLancamento;
      grupo.quantidadeLancamentos += 1;
      grupo.lancamentos.push({
        id: item.id,
        tipo: item.tipo,
        descricao: item.descricao,
        valorOriginal: item.valorOriginal,
        valorFinal: item.valorFinal,
        valorPago: item.valorPago,
        descontoValor: item.descontoValor,
        jurosValor: item.jurosValor,
        multaValor: item.multaValor,
        vencimento: item.vencimento,
        status: item.status,
        saldoAberto: saldoLancamento,
      });
    }

    const resultado = Array.from(mapa.values()).sort(
      (a, b) => b.totalAtrasado - a.totalAtrasado
    );

    return NextResponse.json(resultado);
  } catch (e: any) {
    console.error("ERRO GET INADIMPLENTES:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar inadimplentes" },
      { status: 500 }
    );
  }
}