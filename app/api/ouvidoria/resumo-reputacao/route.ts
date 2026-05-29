import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function diferencaHoras(inicio: Date, fim: Date) {
  return Math.max(0, Math.round((fim.getTime() - inicio.getTime()) / 1000 / 60 / 60));
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const registros = await prisma.ouvidoria.findMany({
      where: { instituicaoId: user.instituicaoId },
      orderBy: { criadoEm: "desc" },
    });

    const total = registros.length;

    const abertos = registros.filter((item) => item.status !== "RESOLVIDO").length;

    const resolvidos = registros.filter((item) => item.status === "RESOLVIDO").length;

    const reclamacoesAbertas = registros.filter(
      (item) => item.tipo === "Reclamação" && item.status !== "RESOLVIDO"
    ).length;

    const criticos = registros.filter(
      (item) => item.sentimento === "CRITICO" && item.status !== "RESOLVIDO"
    ).length;

    const elogios = registros.filter(
      (item) => item.tipo === "Elogio" || item.sentimento === "POSITIVO"
    ).length;

    const sugestoes = registros.filter((item) => item.tipo === "Sugestão").length;

    const positivos = registros.filter(
      (item) => item.tipo === "Elogio" || item.sentimento === "POSITIVO"
    ).length;

    const percentualPositivo =
      total > 0 ? Math.round((positivos / total) * 100) : 0;

    const indiceResposta =
      total > 0 ? Math.round((resolvidos / total) * 100) : 0;

    const respondidosComData = registros.filter(
      (item) => item.respondidoEm && item.criadoEm
    );

    const tempoMedioHoras =
      respondidosComData.length > 0
        ? Math.round(
            respondidosComData.reduce((acc, item) => {
              return acc + diferencaHoras(item.criadoEm, item.respondidoEm!);
            }, 0) / respondidosComData.length
          )
        : null;

    let score = 80;
    score += elogios * 3;
    score += sugestoes * 1;
    score += resolvidos * 2;
    score -= reclamacoesAbertas * 5;
    score -= criticos * 3;
    score = Math.max(0, Math.min(100, score));

    const hoje = new Date();

    const evolucao7Dias = Array.from({ length: 7 }).map((_, index) => {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - (6 - index));

      const inicio = new Date(data);
      inicio.setHours(0, 0, 0, 0);

      const fim = new Date(data);
      fim.setHours(23, 59, 59, 999);

      const registrosDoDia = registros.filter(
        (item) => item.criadoEm >= inicio && item.criadoEm <= fim
      );

      return {
        dia: data.toLocaleDateString("pt-BR", { weekday: "short" }),
        total: registrosDoDia.length,
        resolvidos: registrosDoDia.filter((item) => item.status === "RESOLVIDO").length,
        criticos: registrosDoDia.filter((item) => item.sentimento === "CRITICO").length,
      };
    });

    return NextResponse.json({
      score,
      total,
      abertos,
      resolvidos,
      reclamacoesAbertas,
      criticos,
      elogios,
      sugestoes,
      percentualPositivo,
      indiceResposta,
      tempoMedioHoras,
      evolucao7Dias,
      ultimos: registros.slice(0, 10),
    });
  } catch (error) {
    console.error("Erro ao gerar resumo reputacional:", error);

    return NextResponse.json(
      { error: "Erro ao gerar resumo reputacional" },
      { status: 500 }
    );
  }
}