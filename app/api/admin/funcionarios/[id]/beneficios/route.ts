import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function numeroOuNull(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const funcionarioId = Number(params.id);

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const [beneficiosDisponiveis, beneficiosVinculados] = await Promise.all([
      prisma.beneficioRH.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
        },
        orderBy: { nome: "asc" },
      }),

      prisma.funcionarioBeneficioRH.findMany({
        where: {
          funcionarioId,
          instituicaoId: user.instituicaoId,
        },
        include: {
          beneficio: true,
        },
        orderBy: [{ ativo: "desc" }, { id: "desc" }],
      }),
    ]);

    return NextResponse.json({
      beneficiosDisponiveis,
      beneficiosVinculados,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao listar benefícios do funcionário." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const funcionarioId = Number(params.id);
    const body = await req.json();

    const beneficioId = Number(body.beneficioId);

    if (!beneficioId) {
      return NextResponse.json(
        { error: "Selecione um benefício." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const beneficio = await prisma.beneficioRH.findFirst({
      where: {
        id: beneficioId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!beneficio) {
      return NextResponse.json(
        { error: "Benefício não encontrado." },
        { status: 404 }
      );
    }

    const vinculo = await prisma.funcionarioBeneficioRH.create({
      data: {
        funcionarioId,
        beneficioId,
        instituicaoId: user.instituicaoId,
        valor: numeroOuNull(body.valor) as any,
        percentual: numeroOuNull(body.percentual) as any,
        descontaFolha:
          body.descontaFolha === undefined
            ? beneficio.descontaFolha
            : Boolean(body.descontaFolha),
        ativo: body.ativo === undefined ? true : Boolean(body.ativo),
      },
      include: {
        beneficio: true,
      },
    });

    return NextResponse.json({ vinculo });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao vincular benefício." },
      { status: 500 }
    );
  }
}