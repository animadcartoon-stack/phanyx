import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

async function fecharCaixasOnlineIbeAntigos() {
  const agora = new Date();

  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);

  const caixasAntigos = await prisma.caixa.findMany({
    where: {
      instituicaoId: 1,
      origem: "ONLINE_ASAAS_IBE",
      fechamentoAutomatico: true,
      status: "ABERTO",
      dataAbertura: {
        lt: inicioHoje,
      },
    },
  });

  for (const caixa of caixasAntigos) {
    await prisma.caixa.update({
      where: { id: caixa.id },
      data: {
        status: "FECHADO",
        dataFechamento: new Date(),
        saldoInformado: Number(caixa.saldoSistema || 0),
        diferenca: 0,
        observacaoFechamento:
          "Fechamento automático do Caixa Online Asaas IBE realizado pelo sistema.",
      },
    });
  }
}

export async function POST() {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA" &&
        user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const podeSincronizarIbe =
      user.instituicaoId === 1 ||
      user.role === "SUPER_ADMIN" ||
      Boolean((user as any).isMasterAdmin);

    if (!podeSincronizarIbe) {
      return NextResponse.json(
        { error: "Este caixa online é exclusivo do IBE." },
        { status: 403 }
      );
    }

    await fecharCaixasOnlineIbeAntigos();

    const instituicaoIdIbe = 1;

    const agora = new Date();

    const inicioDoDia = new Date(agora);
    inicioDoDia.setHours(0, 0, 0, 0);

    const fimDoDia = new Date(agora);
    fimDoDia.setHours(23, 59, 59, 999);

    const identificadorOnline = `ONLINE_ASAAS_IBE_${inicioDoDia
      .toISOString()
      .slice(0, 10)}`;

    let caixaOnline = await prisma.caixa.findFirst({
      where: {
        instituicaoId: instituicaoIdIbe,
        origem: "ONLINE_ASAAS_IBE",
        identificadorOnline,
      },
    });

    if (!caixaOnline) {
      caixaOnline = await prisma.caixa.create({
        data: {
          instituicaoId: instituicaoIdIbe,
          origem: "ONLINE_ASAAS_IBE",
          identificadorOnline,
          fechamentoAutomatico: true,
          status: "ABERTO",
          saldoInicial: 0,
          saldoSistema: 0,
          observacaoAbertura:
            "Caixa online criado automaticamente para pagamentos Asaas da matrícula IBE.",
        },
      });
    }

    const matriculasPagasHoje = await prisma.matriculaOnlineIbe.findMany({
      where: {
        status: "PAGO",
        updatedAt: {
          gte: inicioDoDia,
          lte: fimDoDia,
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    let totalSincronizado = 0;
    let quantidadeSincronizada = 0;
    const ignoradas: string[] = [];

    for (const preMatricula of matriculasPagasHoje) {
      const jaTemMovimento = await prisma.movimentoCaixa.findFirst({
        where: {
          OR: [
            preMatricula.asaasPaymentId
              ? { asaasPaymentId: preMatricula.asaasPaymentId }
              : undefined,
            preMatricula.externalReference
              ? { externalReference: preMatricula.externalReference }
              : undefined,
          ].filter(Boolean) as any,
        },
      });

      if (jaTemMovimento) {
        ignoradas.push(preMatricula.externalReference);
        continue;
      }

      const aluno = await prisma.aluno.findFirst({
        where: {
          instituicaoId: instituicaoIdIbe,
          user: {
            email: preMatricula.email,
          },
        },
        orderBy: {
          id: "desc",
        },
      });

      if (!aluno) {
        ignoradas.push(preMatricula.externalReference);
        continue;
      }

      const matricula = await prisma.matricula.findFirst({
        where: {
          instituicaoId: instituicaoIdIbe,
          alunoId: aluno.id,
          realizadaPeloAluno: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const lancamentoExistente = await prisma.lancamentoFinanceiro.findFirst({
        where: {
          instituicaoId: instituicaoIdIbe,
          alunoId: aluno.id,
          matriculaId: matricula?.id,
          descricao: {
            contains: "Matrícula online IBE",
          },
        },
        orderBy: {
          id: "desc",
        },
      });

      const lancamento =
        lancamentoExistente ||
        (await prisma.lancamentoFinanceiro.create({
          data: {
            tipo: "MATRICULA",
            descricao: "Matrícula online IBE - Bacharel Livre em Teologia",
            valorOriginal: Number(preMatricula.valorTotal || 0),
            valorFinal: Number(preMatricula.valorTotal || 0),
            valorPago: Number(preMatricula.valorTotal || 0),
            vencimento: new Date(),
            pagoEm: new Date(),
            status: "PAGO",
            observacao: `Sincronizado manualmente no caixa online IBE. Referência: ${preMatricula.externalReference}`,
            instituicaoId: instituicaoIdIbe,
            alunoId: aluno.id,
            matriculaId: matricula?.id || null,
          },
        }));

      await prisma.movimentoCaixa.create({
        data: {
          tipo: "ENTRADA",
          descricao: "Recebimento online Asaas - matrícula IBE",
          valor: Number(preMatricula.valorTotal || 0),
          formaPagamento: "PIX",
          origem: "ONLINE_ASAAS_IBE",
          asaasPaymentId: preMatricula.asaasPaymentId || null,
          externalReference: preMatricula.externalReference,
          instituicaoId: instituicaoIdIbe,
          caixaId: caixaOnline.id,
          alunoId: aluno.id,
          lancamentoId: lancamento.id,
        },
      });

      totalSincronizado += Number(preMatricula.valorTotal || 0);
      quantidadeSincronizada += 1;
    }

    if (totalSincronizado > 0) {
      await prisma.caixa.update({
        where: { id: caixaOnline.id },
        data: {
          saldoSistema: Number(caixaOnline.saldoSistema || 0) + totalSincronizado,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      quantidadeSincronizada,
      totalSincronizado,
      ignoradas,
    });
  } catch (e: any) {
    console.error("ERRO SINCRONIZAR CAIXA ONLINE IBE:", e);

    return NextResponse.json(
      { error: e?.message || "Erro ao sincronizar caixa online IBE" },
      { status: 500 }
    );
  }
}