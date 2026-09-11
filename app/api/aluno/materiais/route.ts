import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "N?o autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const aulaId =
      Number(
        searchParams.get(
          "aulaId"
        )
      );

    if (
      !Number.isFinite(aulaId) ||
      aulaId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "aulaId ? obrigat?rio",
        },
        {
          status: 400,
        }
      );
    }

    const aluno =
      await prisma.aluno.findFirst({
        where: {
          userId:
            user.id,

          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!aluno) {
      return NextResponse.json(
        {
          error:
            "Aluno n?o encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const aula =
      await prisma.aula.findFirst({
        where: {
          id:
            aulaId,

          instituicaoId:
            user.instituicaoId,

          publicada:
            true,
        },

        select: {
          id: true,
          turmaId: true,
          disciplinaId: true,
        },
      });

    if (!aula) {
      return NextResponse.json(
        {
          error:
            "Aula n?o encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const vinculo =
      await prisma.itemMatricula.findFirst({
        where: {
          instituicaoId:
            user.instituicaoId,

          turmaId:
            aula.turmaId,

          ...(aula.disciplinaId !== null
            ? {
                disciplinaId:
                  aula.disciplinaId,
              }
            : {}),

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

    if (!vinculo) {
      return NextResponse.json(
        {
          error:
            "Conte?do indispon?vel para esta matr?cula.",
        },
        {
          status: 403,
        }
      );
    }

    const materiais =
      await prisma.materialAula.findMany({
        where: {
          aulaId:
            aula.id,

          instituicaoId:
            user.instituicaoId,
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    return NextResponse.json(
      materiais
    );

  } catch (error) {

    console.error(
      "Erro ao buscar materiais:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao buscar materiais",
      },
      {
        status: 500,
      }
    );
  }
}
