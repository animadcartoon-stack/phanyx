import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function numeroInteiroPositivo(
  valor: unknown
): number | null {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      user.role !== "ADMIN" ||
      !user.instituicaoId
    ) {
      return NextResponse.json(
        {
          success: false,
          codigo: "SEM_PERMISSAO",
          error: "Sem permissao.",
        },
        {
          status: 403,
        }
      );
    }

    const matriculaId =
      numeroInteiroPositivo(
        params.id
      );

    if (!matriculaId) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "MATRICULA_INVALIDA",
          error:
            "Matricula invalida.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * A matrícula consultada precisa
     * pertencer ao tenant autenticado.
     */
    const matricula =
      await prisma.matricula.findFirst(
        {
          where: {
            id: matriculaId,
            instituicaoId:
              user.instituicaoId,
          },

          select: {
            id: true,
            instituicaoId: true,
          },
        }
      );

    if (!matricula) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "MATRICULA_NAO_ENCONTRADA",
          error:
            "Matricula nao encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Catálogo mínimo permitido entre
     * tenants PHANYX.
     *
     * Não expõe alunos, polos, cursos,
     * turmas, usuários ou informações
     * financeiras da instituição destino.
     */
    const instituicoes =
      await prisma.instituicao.findMany(
        {
          where: {
            ativo: true,

            nome: {
              not: "",
            },

            slug: {
              not: "",
            },

            id: {
              not:
                user.instituicaoId,
            },
          },

          select: {
            id: true,
            nome: true,
            slug: true,
          },

          orderBy: {
            nome: "asc",
          },
        }
      );

    return NextResponse.json({
      success: true,
      matriculaId:
        matricula.id,
      instituicoes,
    });
  } catch (error) {
    console.error(
      "Erro ao listar instituicoes PHANYX para transferencia:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        codigo:
          "ERRO_LISTAR_INSTITUICOES",
        error:
          "Nao foi possivel carregar as instituicoes de destino.",
      },
      {
        status: 500,
      }
    );
  }
}