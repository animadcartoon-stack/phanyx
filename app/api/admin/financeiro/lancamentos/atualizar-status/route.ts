import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function addDias(data: Date, dias: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

function diferencaEmDias(inicio: Date, fim: Date) {
  const msPorDia = 1000 * 60 * 60 * 24;
  const inicioZerado = new Date(inicio);
  const fimZerado = new Date(fim);

  inicioZerado.setHours(0, 0, 0, 0);
  fimZerado.setHours(0, 0, 0, 0);

  return Math.floor((fimZerado.getTime() - inicioZerado.getTime()) / msPorDia);
}

function arredondar2(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export async function POST() {
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

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

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

    const jurosPadrao = Number(config.jurosPadrao || 0);
    const multaPadrao = Number(config.multaPadrao || 0);
    const descontoPadrao = Number(config.descontoPadrao || 0);
    const diasTolerancia = Number(config.diasTolerancia || 0);
    const permitirPagamentoParcial = Boolean(config.permitirPagamentoParcial);
    const bloquearAlunoInadimplente = Boolean(config.bloquearAlunoInadimplente);
    const quantidadeMensalidadesParaBloqueio = Number(
      config.quantidadeMensalidadesParaBloqueio || 3
    );

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        pagamentos: true,
      },
      orderBy: {
        vencimento: "asc",
      },
    });

    let totalAtualizados = 0;
    let totalPendentes = 0;
    let totalParciais = 0;
    let totalAtrasados = 0;
    let totalPagos = 0;

    const contadorMensalidadesAtrasadas: Record<number, number> = {};

    for (const lancamento of lancamentos) {
      const valorOriginal = Number(lancamento.valorOriginal || 0);

      const totalPago = arredondar2(
        lancamento.pagamentos.reduce((acc, pag) => {
          return acc + Number(pag.valorPago || 0);
        }, 0)
      );

      const dataLimiteSemAtraso = addDias(lancamento.vencimento, diasTolerancia);
      const diasEmAtraso =
        hoje > dataLimiteSemAtraso
          ? diferencaEmDias(dataLimiteSemAtraso, hoje)
          : 0;

      let valorComDesconto = valorOriginal;

      if (descontoPadrao > 0) {
        valorComDesconto =
          valorComDesconto - (valorOriginal * descontoPadrao) / 100;
      }

      let valorFinalCalculado = valorComDesconto;

      if (diasEmAtraso > 0) {
        const valorMulta = (valorComDesconto * multaPadrao) / 100;
        const valorJuros =
          ((valorComDesconto * jurosPadrao) / 100) * diasEmAtraso;

        valorFinalCalculado = valorComDesconto + valorMulta + valorJuros;
      }

      valorFinalCalculado = arredondar2(valorFinalCalculado);

      let novoStatus: "PENDENTE" | "PARCIAL" | "ATRASADO" | "PAGO";

      let totalPagoAjustado = totalPago;

      if (totalPago > valorFinalCalculado) {
        totalPagoAjustado = valorFinalCalculado;
      }

      if (totalPagoAjustado >= valorFinalCalculado && valorFinalCalculado > 0) {
        novoStatus = "PAGO";
      } else if (totalPagoAjustado > 0) {
        if (!permitirPagamentoParcial) {
          novoStatus = diasEmAtraso > 0 ? "ATRASADO" : "PENDENTE";
        } else {
          novoStatus = diasEmAtraso > 0 ? "ATRASADO" : "PARCIAL";
        }
      } else {
        novoStatus = diasEmAtraso > 0 ? "ATRASADO" : "PENDENTE";
      }

      if (novoStatus === "ATRASADO" && lancamento.tipo === "MENSALIDADE") {
        if (!contadorMensalidadesAtrasadas[lancamento.alunoId]) {
          contadorMensalidadesAtrasadas[lancamento.alunoId] = 0;
        }

        contadorMensalidadesAtrasadas[lancamento.alunoId] += 1;
      }

      await prisma.lancamentoFinanceiro.update({
        where: {
          id: lancamento.id,
        },
        data: {
          valorFinal: valorFinalCalculado,
          valorPago: totalPagoAjustado,
          status: novoStatus,
        },
      });

      totalAtualizados += 1;

      if (novoStatus === "PENDENTE") totalPendentes += 1;
      if (novoStatus === "PARCIAL") totalParciais += 1;
      if (novoStatus === "ATRASADO") totalAtrasados += 1;
      if (novoStatus === "PAGO") totalPagos += 1;
    }

    const idsInadimplentes = Object.entries(contadorMensalidadesAtrasadas)
      .filter(
        ([_, quantidade]) =>
          quantidade >= quantidadeMensalidadesParaBloqueio
      )
      .map(([alunoId]) => Number(alunoId));

    if (idsInadimplentes.length > 0) {
      await prisma.aluno.updateMany({
        where: {
          instituicaoId: user.instituicaoId,
          id: {
            in: idsInadimplentes,
          },
        },
        data: {
          statusAluno: bloquearAlunoInadimplente ? "INADIMPLENTE" : "ATIVO",
        },
      });
    }

    await prisma.aluno.updateMany({
      where: {
        instituicaoId: user.instituicaoId,
        id: {
          notIn: idsInadimplentes.length > 0 ? idsInadimplentes : [-1],
        },
        statusAluno: "INADIMPLENTE",
      },
      data: {
        statusAluno: "ATIVO",
      },
    });

    return NextResponse.json({
      message: "Status financeiros atualizados com sucesso",
      configuracaoAplicada: {
        jurosPadrao,
        multaPadrao,
        descontoPadrao,
        diasTolerancia,
        permitirPagamentoParcial,
        bloquearAlunoInadimplente,
        quantidadeMensalidadesParaBloqueio,
      },
      resumo: {
        totalAtualizados,
        totalPendentes,
        totalParciais,
        totalAtrasados,
        totalPagos,
        totalAlunosInadimplentes: idsInadimplentes.length,
      },
    });
  } catch (e: any) {
    console.error("ERRO ATUALIZAR STATUS FINANCEIRO:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao atualizar status financeiro" },
      { status: 500 }
    );
  }
}