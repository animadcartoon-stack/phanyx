import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

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

    return NextResponse.json({
      id: config.id,
      instituicaoId: config.instituicaoId,
      jurosPadrao: Number(config.jurosPadrao),
      multaPadrao: Number(config.multaPadrao),
      descontoPadrao: Number(config.descontoPadrao),
      diasTolerancia: config.diasTolerancia,
      bloquearAlunoInadimplente: config.bloquearAlunoInadimplente,
      quantidadeMensalidadesParaBloqueio:
        config.quantidadeMensalidadesParaBloqueio,
      permitirPagamentoParcial: config.permitirPagamentoParcial,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao buscar configuração financeira:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuração financeira" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const jurosPadrao = toNumber(body.jurosPadrao);
    const multaPadrao = toNumber(body.multaPadrao);
    const descontoPadrao = toNumber(body.descontoPadrao);
    const diasTolerancia = Math.max(
      0,
      parseInt(String(body.diasTolerancia || 0), 10) || 0
    );
    const bloquearAlunoInadimplente = Boolean(body.bloquearAlunoInadimplente);
    const quantidadeMensalidadesParaBloqueio = Math.max(
      1,
      parseInt(String(body.quantidadeMensalidadesParaBloqueio || 3), 10) || 3
    );
    const permitirPagamentoParcial = Boolean(body.permitirPagamentoParcial);

    const config = await prisma.configuracaoFinanceiraInstituicao.upsert({
      where: {
        instituicaoId: user.instituicaoId,
      },
      update: {
        jurosPadrao,
        multaPadrao,
        descontoPadrao,
        diasTolerancia,
        bloquearAlunoInadimplente,
        quantidadeMensalidadesParaBloqueio,
        permitirPagamentoParcial,
      },
      create: {
        instituicaoId: user.instituicaoId,
        jurosPadrao,
        multaPadrao,
        descontoPadrao,
        diasTolerancia,
        bloquearAlunoInadimplente,
        quantidadeMensalidadesParaBloqueio,
        permitirPagamentoParcial,
      },
    });

    return NextResponse.json({
      message: "Configuração financeira salva com sucesso",
      data: {
        id: config.id,
        instituicaoId: config.instituicaoId,
        jurosPadrao: Number(config.jurosPadrao),
        multaPadrao: Number(config.multaPadrao),
        descontoPadrao: Number(config.descontoPadrao),
        diasTolerancia: config.diasTolerancia,
        bloquearAlunoInadimplente: config.bloquearAlunoInadimplente,
        quantidadeMensalidadesParaBloqueio:
          config.quantidadeMensalidadesParaBloqueio,
        permitirPagamentoParcial: config.permitirPagamentoParcial,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar configuração financeira:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configuração financeira" },
      { status: 500 }
    );
  }
}