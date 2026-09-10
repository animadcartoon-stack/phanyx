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

export async function POST(
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

    const concluida =
      Boolean(
        body?.concluida
      );

    const motivosPermitidos =
      new Set([
        "PAUSA",
        "FIM_VIDEO",
        "TROCA_AULA",
        "SAIDA_PAGINA",
        "PERDA_FOCO",
        "CONCLUSAO_AULA",
      ]);

    const motivoRecebido =
      String(
        body?.motivo || ""
      ).toUpperCase();

    const motivo =
      motivosPermitidos.has(
        motivoRecebido
      )
        ? motivoRecebido
        : "OUTRO";

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
          concluida: true,
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

    if (!sessao.encerradoEm) {
      const agora =
        new Date();

      await prisma.sessaoVideoAluno.update({
        where: {
          id: sessao.id,
        },
        data: {
          ultimoRegistroEm:
            agora,
          encerradoEm:
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
          concluida:
            sessao.concluida ||
            concluida,
          motivoEncerramento:
            motivo,
        },
      });
    }

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
      encerrada: true,
    });
  } catch (error) {
    console.error(
      "ERRO AO ENCERRAR SESSAO DE VIDEO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Nao foi possivel encerrar o rastreamento do video.",
      },
      {
        status: 500,
      }
    );
  }
}
