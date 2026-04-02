import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tentativaId: string }> }
) {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { tentativaId: tentativaIdParam } = await params;
    const tentativaId = Number(tentativaIdParam);

    if (!Number.isFinite(tentativaId) || tentativaId <= 0) {
      return NextResponse.json({ error: "tentativaId inválido" }, { status: 400 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const tentativa = await prisma.tentativaProva.findFirst({
      where: {
        id: tentativaId,
        alunoId: aluno.id,
        prova: {
          disciplina: {
            instituicaoId: user.instituicaoId,
          },
        },
      },
      select: {
        id: true,
        finalizada: true,
        provaId: true,
      },
    });

    if (!tentativa) {
      return NextResponse.json({ error: "Tentativa não encontrada" }, { status: 404 });
    }

    if (tentativa.finalizada) {
      return NextResponse.json({ error: "Tentativa já finalizada" }, { status: 400 });
    }

    const prova = await prisma.prova.findUnique({
      where: { id: tentativa.provaId },
      select: {
        id: true,
        notaMaxima: true,
        questoes: {
          select: {
            id: true,
            tipo: true,
            valor: true,
            alternativas: {
              select: {
                id: true,
                correta: true,
              },
            },
          },
        },
      },
    });

    if (!prova) {
      return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
    }

    const respostas = await prisma.respostaProva.findMany({
      where: { tentativaId },
      select: {
        id: true,
        questaoId: true,
        alternativaId: true,
        respostaTexto: true,
      },
    });

    let notaAuto = 0;
    const discursivasPendentes: number[] = [];

    for (const q of prova.questoes) {
      const r = respostas.find((x) => x.questaoId === q.id);

      if (q.tipo === "multipla_escolha") {
        const corretaId = q.alternativas.find((a) => a.correta)?.id ?? null;
        const acertou =
          r?.alternativaId != null &&
          corretaId != null &&
          r.alternativaId === corretaId;

        const pontos = acertou ? q.valor : 0;
        notaAuto += pontos;

        if (r) {
          await prisma.respostaProva.update({
            where: { id: r.id },
            data: {
              nota: pontos,
              corrigidaManual: true,
            },
          });
        }
      } else {
        if (r) {
          await prisma.respostaProva.update({
            where: { id: r.id },
            data: {
              corrigidaManual: false,
            },
          });
        }

        discursivasPendentes.push(q.id);
      }
    }

    await prisma.tentativaProva.update({
      where: { id: tentativaId },
      data: {
        finalizada: true,
        notaFinal: notaAuto,
        status: "FINALIZADA",
        finishedAt: new Date(),
      },
    });

    const notaMaxima = Number(prova.notaMaxima ?? 0);
    const aprovado = discursivasPendentes.length === 0
      ? notaAuto >= 7
      : false;

    return NextResponse.json({
      ok: true,
      mensagem:
        discursivasPendentes.length > 0
          ? "Prova finalizada. Questões discursivas aguardando correção."
          : "Prova finalizada e corrigida automaticamente.",
      nota: notaAuto,
      notaFinal: notaAuto,
      notaParcial: notaAuto,
      notaMaxima,
      aprovado,
      discursivasPendentes,
    });
  } catch (e: any) {
    console.error("ERRO AO FINALIZAR PROVA:", e);

    return NextResponse.json(
      { error: e?.message || "Erro ao finalizar prova" },
      { status: 500 }
    );
  }
}