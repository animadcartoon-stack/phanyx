import {
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";

import {
  verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

/*
 * Status que representam uma intervenção
 * ainda em andamento.
 */
const STATUS_ABERTOS = [
  "REGISTRADA",
  "AGUARDANDO_RETORNO",
  "EM_ACOMPANHAMENTO",
] as const;

export async function GET() {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const acesso =
      await verificarAcessoStudentSuccess(
        user,
        "VER"
      );

    if (
      acesso.permitido ===
      false
    ) {
      return NextResponse.json(
        {
          error:
            acesso.motivo,
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId =
      acesso.instituicaoId;

    const intervencoes =
      await prisma
        .studentSuccessIntervencao
        .findMany({
          where: {
            instituicaoId,

            status: {
              in:
                STATUS_ABERTOS,
            },
          },

          orderBy: [
            {
              retornoEm:
                "asc",
            },
            {
              criadoEm:
                "asc",
            },
          ],

          select: {
            id:
              true,

            alunoId:
              true,

            tipo:
              true,

            canal:
              true,

            status:
              true,

            observacao:
              true,

            retornoEm:
              true,

            criadoEm:
              true,

            atualizadoEm:
              true,

            aluno: {
              select: {
                id:
                  true,

                nome:
                  true,

                matricula:
                  true,
              },
            },

            criadoPor: {
              select: {
                id:
                  true,

                nome:
                  true,

                email:
                  true,
              },
            },
          },
        });

    /*
     * Não classificamos "hoje", "atrasado"
     * ou "próximos 7 dias" no servidor.
     *
     * Essa classificação será feita na
     * interface usando a data local do
     * usuário, evitando problemas de fuso
     * horário para instituições de países
     * diferentes.
     */

    const comRetorno =
      intervencoes.filter(
        (
          item
        ) =>
          item.retornoEm !==
          null
      );

    const semRetorno =
      intervencoes.filter(
        (
          item
        ) =>
          item.retornoEm ===
          null
      );

    return NextResponse.json({
      ok:
        true,

      resumo: {
        abertas:
          intervencoes.length,

        comRetorno:
          comRetorno.length,

        semRetorno:
          semRetorno.length,
      },

      intervencoes:
        intervencoes.map(
          (
            item
          ) => ({
            ...item,

            retornoEm:
              item.retornoEm
                ?.toISOString() ??
              null,

            criadoEm:
              item.criadoEm
                .toISOString(),

            atualizadoEm:
              item.atualizadoEm
                .toISOString(),
          })
        ),
    });
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_RETORNOS_GET]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar retornos do Student Success",
      },
      {
        status: 500,
      }
    );
  }
}