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
  obterContextoAulaAluno,
} from "@/lib/aluno-rastreamento-aprendizagem";

export async function POST(
  req: NextRequest
) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const body =
      await req.json();

    const aulaId =
      Number(body?.aulaId);

    if (
      !Number.isFinite(aulaId) ||
      aulaId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Aula invalida.",
        },
        {
          status: 400,
        }
      );
    }

    const posicaoSegundos =
      normalizarSegundos(
        body?.posicaoSegundos
      );

    const tempoMinimoSegundos =
      normalizarSegundos(
        body?.tempoMinimoSegundos
      );

    const contexto =
      await obterContextoAulaAluno({
        instituicaoId:
          auth.instituicaoId,
        userId: auth.userId,
        aulaId,
      });

    const vinculoOperacional =
      await prisma.itemMatricula.findFirst({
        where: {
          instituicaoId:
            auth.instituicaoId,

          turmaId:
            contexto.turmaId,

          disciplinaId:
            contexto.disciplinaId,

          matricula: {
            alunoId:
              contexto.alunoId,

            instituicaoId:
              auth.instituicaoId,

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
            "Sem acesso a esta aula.",
        },
        {
          status: 403,
        }
      );
    }

    if (!contexto.videoUrl) {
      return NextResponse.json(
        {
          error:
            "Aula sem video.",
        },
        {
          status: 400,
        }
      );
    }

    const agora = new Date();

    /*
     * Fecha sessoes que por algum
     * motivo ficaram abertas.
     */
    await prisma.sessaoVideoAluno.updateMany({
      where: {
        instituicaoId:
          auth.instituicaoId,
        alunoId:
          contexto.alunoId,
        encerradoEm: null,
      },
      data: {
        encerradoEm: agora,
        ultimoRegistroEm:
          agora,
        motivoEncerramento:
          "NOVA_SESSAO",
      },
    });

    const sessao =
      await prisma.sessaoVideoAluno.create({
        data: {
          instituicaoId:
            auth.instituicaoId,
          alunoId:
            contexto.alunoId,
          aulaId:
            contexto.aulaId,
          turmaId:
            contexto.turmaId,
          disciplinaId:
            contexto.disciplinaId,
          iniciadoEm: agora,
          ultimoRegistroEm:
            agora,
          posicaoInicialSegundos:
            posicaoSegundos,
          posicaoFinalSegundos:
            posicaoSegundos,
          maiorPosicaoSegundos:
            posicaoSegundos,
          tempoReproducaoSegundos:
            0,
        },
        select: {
          id: true,
          iniciadoEm: true,
        },
      });

    await atualizarProgressoAulaCheckpoint({
      instituicaoId:
        auth.instituicaoId,
      alunoId:
        contexto.alunoId,
      aulaId:
        contexto.aulaId,
      posicaoSegundos,
      tempoMinimoSegundos,
    });

    return NextResponse.json({
      ok: true,
      sessaoId: sessao.id,
      iniciadoEm:
        sessao.iniciadoEm,
    });
  } catch (error: any) {
    console.error(
      "ERRO AO INICIAR SESSAO DE VIDEO:",
      error
    );

    const codigo =
      String(
        error?.message || ""
      );

    if (
      [
        "ALUNO_NAO_ENCONTRADO",
        "AULA_NAO_ENCONTRADA",
        "AULA_SEM_DISCIPLINA",
        "ALUNO_SEM_ACESSO_A_AULA",
      ].includes(codigo)
    ) {
      return NextResponse.json(
        {
          error:
            "Sem acesso a esta aula.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Nao foi possivel iniciar o rastreamento do video.",
      },
      {
        status: 500,
      }
    );
  }
}
