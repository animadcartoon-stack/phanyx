import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const registros = await prisma.ouvidoria.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        criadoEm: "desc",
      },
      take: 20,
    });

    const reclamacoesAbertas = registros.filter(
      (item) => item.tipo === "Reclamação" && item.status !== "RESOLVIDO"
    ).length;

    const criticos = registros.filter(
      (item) => item.sentimento === "CRITICO" && item.status !== "RESOLVIDO"
    ).length;

    const elogios = registros.filter(
      (item) => item.tipo === "Elogio" || item.sentimento === "POSITIVO"
    ).length;

    const sugestoes = registros.filter(
      (item) => item.tipo === "Sugestão"
    ).length;

    const resolvidos = registros.filter(
      (item) => item.status === "RESOLVIDO"
    ).length;

    let score = 80;

score += elogios * 3;
score += sugestoes * 1;
score += resolvidos * 2;

score -= reclamacoesAbertas * 5;
score -= criticos * 3;

score = Math.max(0, Math.min(100, score));

    return NextResponse.json({
      score,
      total: registros.length,
      reclamacoesAbertas,
      criticos,
      elogios,
      sugestoes,
      resolvidos,
      ultimos: registros.slice(0, 5),
    });
  } catch (error) {
    console.error("Erro ao gerar resumo reputacional:", error);

    return NextResponse.json(
      { error: "Erro ao gerar resumo reputacional" },
      { status: 500 }
    );
  }
}