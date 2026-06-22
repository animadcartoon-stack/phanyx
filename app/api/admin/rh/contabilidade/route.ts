import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const mes = Number(searchParams.get("mes")) || new Date().getMonth() + 1;
    const ano = Number(searchParams.get("ano")) || new Date().getFullYear();

    const holerites = await prisma.holeriteRH.findMany({
      where: {
        mes,
        ano,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const totais = holerites.reduce(
      (acc, item) => {
        acc.salarios += Number(item.salarioBase || 0);
        acc.vencimentos += Number(item.totalVencimentos || 0);
        acc.descontos += Number(item.totalDescontos || 0);
        acc.liquido += Number(item.valorLiquido || 0);
        return acc;
      },
      {
        salarios: 0,
        vencimentos: 0,
        descontos: 0,
        liquido: 0,
      }
    );

    return NextResponse.json({
      mes,
      ano,
      totais,
      encargosEstimados: {
        inssPatronal: totais.salarios * 0.2,
        fgts: totais.salarios * 0.08,
        provisaoFerias: totais.salarios / 12,
        provisaoDecimo: totais.salarios / 12,
      },
      holerites,
    });
  } catch (error) {
    console.error("Erro ao carregar contabilidade RH:", error);

    return NextResponse.json(
      { error: "Erro ao carregar dados da contabilidade RH." },
      { status: 500 }
    );
  }
}