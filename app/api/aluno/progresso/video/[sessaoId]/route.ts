import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  assertAluno,
  getAuth,
} from "@/lib/auth/getAuth";

import { prisma } from "@/lib/prisma";

import {
  atualizarProgressoAulaCheckpoint,
  normalizarSegundos,
} from "@/lib/aluno-rastreamento-aprendizagem";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      sessaoId: string;
    };
  }
) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const sessaoId =
      Number(params.sessaoId);

    if (
      !Number.isFinite(sessaoId) ||
      sessaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Sessao invalida.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req.json();

    const posicaoSegundos =
      normalizarSegundos(
        body?.posicaoSegundos
      );

    const tempoReproducaoSegundos =
      normalizarSegundos(
        body?.tempoReproducaoSegundos
      );

    const tempoMinimoSegundos =
      normalizarSegundos(
        body?.tempoMinimoSegundos
      );

    const aluno =
      await prisma.aluno.findFirst({
        where: {
          userId: auth.userId,
          instituicaoId:
            auth.instituicaoId,
        },
        select: {
          id: true,
        },
      });

    if (!aluno) {
      return NextResponse.json(
        {
          error:
            "Aluno nao encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const sessao =
      await prisma.sessaoVideoAluno.findFirst({
        where: {
          id: sessaoId,
          instituicaoId:
            auth.instituicaoId,
          alunoId: aluno.id,
        },
        select: {
          id: true,
          aulaId: true,
          encerradoEm: true,
          maiorPosicaoSegundos:
            true,
          tempoReproducaoSegundos:
            true,
        },
      });

    if (!sessao) {
      return NextResponse.json(
        {
          error:
            "Sessao nao encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Checkpoint atrasado apos
     * encerramento: resposta
     * idempotente, sem reabrir.
     */
    if (sessao.encerradoEm) {
      return NextResponse.json({
        ok: true,
        encerrada: true,
      });
    }

    const agora = new Date();

    await prisma.sessaoVideoAluno.update({
      where: {
        id: sessao.id,
      },
      data: {
        ultimoRegistroEm:
          agora,
        posicaoFinalSegundos:
          posicaoSegundos,
        maiorPosicaoSegundos:
          Math.max(
            sessao
              .maiorPosicaoSegundos,
            posicaoSegundos
          ),
        tempoReproducaoSegundos:
          Math.max(
            sessao
              .tempoReproducaoSegundos,
            tempoReproducaoSegundos
          ),
      },
    });

    await atualizarProgressoAulaCheckpoint({
      instituicaoId:
        auth.instituicaoId,
      alunoId: aluno.id,
      aulaId: sessao.aulaId,
      posicaoSegundos,
      tempoMinimoSegundos,
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "ERRO AO SALVAR CHECKPOINT DE VIDEO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Nao foi possivel salvar o progresso do video.",
      },
      {
        status: 500,
      }
    );
  }
}
