import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function parseDate(valor: any) {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function parseDecimal(valor: any) {
  if (valor === undefined || valor === null || valor === "") return null;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const ferias = await prisma.feriasRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivada: false,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            cargo: true,
            salarioBase: true,
            departamento: {
              select: { nome: true },
            },
          },
        },
      },
      orderBy: [{ criadoEm: "desc" }],
    });

    return NextResponse.json(ferias);
  } catch (error: any) {
    console.error("Erro ao listar férias RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar férias RH" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const funcionarioId = Number(body?.funcionarioId || 0);

    if (!funcionarioId) {
      return NextResponse.json(
        { error: "Funcionário é obrigatório." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const periodoAquisitivoInicio = parseDate(body?.periodoAquisitivoInicio);
    const periodoAquisitivoFim = parseDate(body?.periodoAquisitivoFim);
    const periodoGozoInicio = parseDate(body?.periodoGozoInicio);
    const periodoGozoFim = parseDate(body?.periodoGozoFim);
    const dataPagamento = parseDate(body?.dataPagamento);
    const dataRetorno = parseDate(body?.dataRetorno);

    if (!periodoAquisitivoInicio || !periodoAquisitivoFim) {
      return NextResponse.json(
        { error: "Informe o período aquisitivo." },
        { status: 400 }
      );
    }

    if (!periodoGozoInicio || !periodoGozoFim) {
      return NextResponse.json(
        { error: "Informe o período de gozo das férias." },
        { status: 400 }
      );
    }

    const dias = Number(body?.dias || 0);

    if (!dias || dias <= 0) {
      return NextResponse.json(
        { error: "Informe a quantidade de dias de férias." },
        { status: 400 }
      );
    }

    const ferias = await prisma.feriasRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId,

        periodoAquisitivoInicio,
        periodoAquisitivoFim,
        dataInicio: periodoGozoInicio,
dataFim: periodoGozoFim,
dias,

dataPagamento,
dataRetorno,

abonoPecuniario: Boolean(body?.abonoPecuniario ?? false),

valorFerias: parseDecimal(body?.valorFerias),
valorTercoConstitucional: parseDecimal(body?.valorTercoConstitucional),
valorLiquidoFerias: parseDecimal(body?.valorLiquidoFerias),

status: String(body?.status || "AGENDADA"),
        observacoes: body?.observacoes ? String(body.observacoes).trim() : null,

        criadoPorId: user.id,
      },
    });

    return NextResponse.json(ferias, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar férias RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar férias RH" },
      { status: 500 }
    );
  }
}