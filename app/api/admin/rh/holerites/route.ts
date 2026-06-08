import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toDecimalNumber(valor: any) {
  return Number(valor || 0);
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const holerites = await prisma.holeriteRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            codigoFuncionario: true,
            departamento: { select: { nome: true } },
          },
        },
        eventos: true,
      },
      orderBy: [
        { competenciaAno: "desc" },
        { competenciaMes: "desc" },
      ],
      take: 100,
    });

    return NextResponse.json(holerites);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar holerites." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const funcionarioId = Number(body.funcionarioId);
    const competenciaMes = Number(body.competenciaMes);
    const competenciaAno = Number(body.competenciaAno);

    const salarioBase = toDecimalNumber(body.salarioBase);
    const eventos = Array.isArray(body.eventos) ? body.eventos : [];

    if (!funcionarioId || !competenciaMes || !competenciaAno) {
      return NextResponse.json(
        { error: "Informe funcionário, mês e ano da competência." },
        { status: 400 }
      );
    }

    const totalEventosVencimentos = eventos
  .filter((e: any) => e.tipo === "VENCIMENTO")
  .reduce((acc: number, e: any) => acc + toDecimalNumber(e.valor), 0);

const totalDescontos = eventos
  .filter((e: any) => e.tipo === "DESCONTO")
  .reduce((acc: number, e: any) => acc + toDecimalNumber(e.valor), 0);

const totalVencimentos = salarioBase + totalEventosVencimentos;

const valorLiquido = totalVencimentos - totalDescontos;

    const holerite = await prisma.holeriteRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
        criadoPorId: user.id,
        competenciaMes,
        competenciaAno,
        salarioBase,
        totalVencimentos,
        totalDescontos,
        valorLiquido,
        baseInss: body.baseInss || null,
        baseFgts: body.baseFgts || null,
        fgtsMes: body.fgtsMes || null,
        baseIrrf: body.baseIrrf || null,
        status: "GERADO",
        eventos: {
          create: eventos.map((e: any) => ({
            codigo: e.codigo || null,
            descricao: e.descricao,
            referencia: e.referencia || null,
            tipo: e.tipo,
            valor: toDecimalNumber(e.valor),
          })),
        },
      },
      include: {
        funcionario: true,
        eventos: true,
      },
    });

    return NextResponse.json(holerite);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar holerite." },
      { status: 500 }
    );
  }
}