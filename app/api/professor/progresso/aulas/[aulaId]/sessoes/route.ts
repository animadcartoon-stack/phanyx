import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { obterParesTurmaDisciplinaProfessor } from "@/lib/professor-escopo-academico";

export const dynamic =
  "force-dynamic";

function isProfessorRole(
  role: unknown
) {
  return (
    String(role || "")
      .trim()
      .toUpperCase() ===
    "PROFESSOR"
  );
}

function inteiroPositivo(
  valor:
    | string
    | null
    | undefined
) {
  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero > 0
    ? numero
    : null;
}

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      aulaId: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      !isProfessorRole(user.role)
    ) {
      return NextResponse.json(
        {
          error:
            "NAO_AUTORIZADO",
        },
        {
          status: 401,
        }
      );
    }

    const professor =
      await prisma.professor.findFirst({
        where: {
          userId: user.id,
          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!professor) {
      return NextResponse.json(
        {
          error:
            "PROFESSOR_NAO_ENCONTRADO",
        },
        {
          status: 404,
        }
      );
    }

    const aulaId =
      inteiroPositivo(
        params.aulaId
      );

    const { searchParams } =
      new URL(req.url);

    const alunoId =
      inteiroPositivo(
        searchParams.get(
          "alunoId"
        )
      );

    const turmaId =
      inteiroPositivo(
        searchParams.get(
          "turmaId"
        )
      );

    const disciplinaId =
      inteiroPositivo(
        searchParams.get(
          "disciplinaId"
        )
      );

    if (
      !aulaId ||
      !alunoId ||
      !turmaId ||
      !disciplinaId
    ) {
      return NextResponse.json(
        {
          error:
            "PARAMETROS_INVALIDOS",
        },
        {
          status: 400,
        }
      );
    }

    const paresPermitidos =
      await obterParesTurmaDisciplinaProfessor(
        {
          instituicaoId:
            user.instituicaoId,
          professorId:
            professor.id,
        }
      );

    const parPermitido =
      paresPermitidos.some(
        (par) =>
          par.turmaId ===
            turmaId &&
          par.disciplinaId ===
            disciplinaId
      );

    if (!parPermitido) {
      return NextResponse.json(
        {
          error:
            "DISCIPLINA_FORA_DO_ESCOPO",
        },
        {
          status: 403,
        }
      );
    }

    const [
      aula,
      itemMatricula,
    ] = await Promise.all([
      prisma.aula.findFirst({
        where: {
          id: aulaId,
          instituicaoId:
            user.instituicaoId,
          turmaId,
          disciplinaId,
        },

        select: {
          id: true,
        },
      }),

      prisma.itemMatricula.findFirst({
        where: {
          instituicaoId:
            user.instituicaoId,
          turmaId,
          disciplinaId,

          matricula: {
            alunoId,
          },
        },

        select: {
          id: true,
        },
      }),
    ]);

    if (!aula) {
      return NextResponse.json(
        {
          error:
            "AULA_FORA_DO_ESCOPO",
        },
        {
          status: 404,
        }
      );
    }

    if (!itemMatricula) {
      return NextResponse.json(
        {
          error:
            "ALUNO_FORA_DO_ESCOPO",
        },
        {
          status: 404,
        }
      );
    }

    const sessoes =
      await prisma.sessaoVideoAluno.findMany(
        {
          where: {
            instituicaoId:
              user.instituicaoId,
            alunoId,
            aulaId,
            turmaId,
            disciplinaId,
          },

          select: {
            id: true,
            iniciadoEm: true,
            ultimoRegistroEm:
              true,
            encerradoEm: true,

            posicaoInicialSegundos:
              true,
            posicaoFinalSegundos:
              true,
            maiorPosicaoSegundos:
              true,
            tempoReproducaoSegundos:
              true,

            motivoEncerramento:
              true,
          },

          orderBy: [
            {
              iniciadoEm: "desc",
            },
            {
              id: "desc",
            },
          ],
        }
      );

    return NextResponse.json({
      aulaId,
      alunoId,
      turmaId,
      disciplinaId,
      total: sessoes.length,
      sessoes,
    });
  } catch (e: any) {
    console.error(
      "ERRO HISTORICO VIDEO PROFESSOR:",
      e
    );

    return NextResponse.json(
      {
        error:
          e?.message ||
          "ERRO_AO_CARREGAR_HISTORICO",
      },
      {
        status: 500,
      }
    );
  }
}
