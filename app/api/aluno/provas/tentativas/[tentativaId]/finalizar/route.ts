import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarProvas } from "@/lib/permissoesPlano";

export async function POST(
  _req: Request,
  { params }: { params: { tentativaId: string } }
) {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "ALUNO") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (!podeUsarProvas(user.plano || "ESSENCIAL")) {
    return NextResponse.json(
      { error: "Recurso disponível apenas nos planos Profissional e Enterprise" },
      { status: 403 }
    );
  }

  const aluno = await prisma.aluno.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
    select: {
      id: true,
    },
  });

  if (!aluno) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  const tentativaId = Number(params.tentativaId);

  if (!Number.isFinite(tentativaId) || tentativaId <= 0) {
    return NextResponse.json({ error: "tentativaId inválido" }, { status: 400 });
  }

  const tentativa = await prisma.tentativaProva.findFirst({
    where: {
      id: tentativaId,
      alunoId: aluno.id,
      prova: {
        instituicaoId: user.instituicaoId,
      },
    },
    include: {
      prova: {
        include: {
          questoes: {
            orderBy: { id: "asc" },
            include: {
              alternativas: {
                orderBy: { id: "asc" },
              },
            },
          },
        },
      },
      respostas: true,
    },
  });

  if (!tentativa) {
    return NextResponse.json(
      { error: "Tentativa não encontrada" },
      { status: 404 }
    );
  }

  const vinculoOperacional =
    await prisma.itemMatricula.findFirst({
      where: {
        instituicaoId:
          user.instituicaoId,

        turmaId:
          tentativa.prova.turmaId,

        matricula: {
          alunoId:
            aluno.id,

          instituicaoId:
            user.instituicaoId,

          status: {
            not:
              "CANCELADA",
          },

          excluidaEm:
            null,
        },
      },

      select: {
        id: true,
      },
    });

  if (!vinculoOperacional) {
    return NextResponse.json(
      {
        error:
          "Esta tentativa n?o est? mais dispon?vel para esta matr?cula.",
      },
      {
        status: 403,
      }
    );
  }

  if (tentativa.finalizada) {
    return NextResponse.json(
      { error: "Tentativa já finalizada" },
      { status: 400 }
    );
  }

  let notaCalculada = 0;

  const correcoesObjetivas: Array<{
    respostaId: number;
    correta: boolean;
    nota: number;
  }> = [];

  for (const q of tentativa.prova.questoes) {
    if (
      String(q.tipo).toUpperCase() !==
      "MULTIPLA_ESCOLHA"
    ) {
      continue;
    }

    const alternativaCorreta =
      q.alternativas.find(
        (alternativa) => alternativa.correta
      );

    if (!alternativaCorreta) {
      continue;
    }

    const respostaAluno =
      tentativa.respostas.find(
        (resposta) =>
          resposta.questaoId === q.id
      );

    if (!respostaAluno) {
      continue;
    }

    const acertou =
      respostaAluno.alternativaId !== null &&
      respostaAluno.alternativaId ===
        alternativaCorreta.id;

    const pontos = acertou
      ? Number(q.valor ?? 1)
      : 0;

    notaCalculada += pontos;

    correcoesObjetivas.push({
      respostaId: respostaAluno.id,
      correta: acertou,
      nota: pontos,
    });
  }

  const notaMax =
    tentativa.prova.notaMaxima || 10;

  const notaObjetiva = Math.max(
    0,
    Math.min(
      notaMax,
      Number(notaCalculada.toFixed(2))
    )
  );

  const notaFinal = notaObjetiva;
  const agoraFinalizacao = new Date();

  const updated = await prisma.$transaction(
    async (tx) => {
      for (
        const correcao of correcoesObjetivas
      ) {
        await tx.respostaProva.update({
          where: {
            id: correcao.respostaId,
          },
          data: {
            correta: correcao.correta,
            nota: correcao.nota,
            corrigidaManual: false,
            corrigidaEm: agoraFinalizacao,
          },
        });
      }

      return tx.tentativaProva.update({
        where: {
          id: tentativa.id,
        },
        data: {
          notaObjetiva,
          notaFinal,
          finalizada: true,
          status: "FINALIZADA",
          finishedAt: agoraFinalizacao,
        },
        select: {
          id: true,
          notaObjetiva: true,
          notaFinal: true,
          finalizada: true,
        },
      });
    }
  );

  return NextResponse.json(updated);
}