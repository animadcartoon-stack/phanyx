import {
  NextResponse,
} from "next/server";

import type {
  StatusIntervencaoStudentSuccess,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";

import {
  avaliarEvolucaoIntervencao,
} from "@/lib/student-success/avaliar-evolucao-intervencao";

import {
  verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

const STATUS_ABERTOS:
  StatusIntervencaoStudentSuccess[] =
  [
    "REGISTRADA",
    "AGUARDANDO_RETORNO",
    "EM_ACOMPANHAMENTO",
  ];

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

    /*
     * INTERVENÇÕES ABERTAS
     *
     * A classificação entre:
     *
     * - atrasada
     * - para hoje
     * - próxima
     *
     * será feita no navegador, usando
     * o dia local do usuário.
     */
    const abertas =
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
              atualizadoEm:
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
          },
        });

    /*
     * INTERVENÇÕES RESOLVIDAS
     *
     * Precisamos delas para localizar
     * casos em que houve piora acadêmica
     * entre o registro e o encerramento.
     */
    const resolvidas =
      await prisma
        .studentSuccessIntervencao
        .findMany({
          where: {
            instituicaoId,

            status:
              "RESOLVIDA",
          },

          orderBy: {
            concluidoEm:
              "desc",
          },

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

            resultado:
              true,

            criadoEm:
              true,

            concluidoEm:
              true,

            nivelRiscoNoRegistro:
              true,

            pontuacaoNoRegistro:
              true,

            indicadoresNoRegistro:
              true,

            nivelRiscoNoEncerramento:
              true,

            pontuacaoNoEncerramento:
              true,

            indicadoresNoEncerramento:
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
          },
        });

    const pioraAposIntervencao =
      resolvidas
        .map(
          (
            intervencao
          ) => {
            const evolucao =
              avaliarEvolucaoIntervencao({
                nivelRiscoNoRegistro:
                  intervencao
                    .nivelRiscoNoRegistro,

                pontuacaoNoRegistro:
                  intervencao
                    .pontuacaoNoRegistro,

                indicadoresNoRegistro:
                  intervencao
                    .indicadoresNoRegistro,

                nivelRiscoNoEncerramento:
                  intervencao
                    .nivelRiscoNoEncerramento,

                pontuacaoNoEncerramento:
                  intervencao
                    .pontuacaoNoEncerramento,

                indicadoresNoEncerramento:
                  intervencao
                    .indicadoresNoEncerramento,
              });

            if (
              evolucao
                .classificacao !==
              "NEGATIVA"
            ) {
              return null;
            }

            return {
              id:
                intervencao.id,

              alunoId:
                intervencao
                  .alunoId,

              aluno:
                intervencao
                  .aluno,

              tipo:
                intervencao
                  .tipo,

              canal:
                intervencao
                  .canal,

              status:
                intervencao
                  .status,

              observacao:
                intervencao
                  .observacao,

              resultado:
                intervencao
                  .resultado,

              criadoEm:
                intervencao
                  .criadoEm
                  .toISOString(),

              concluidoEm:
                intervencao
                  .concluidoEm
                  ?.toISOString() ??
                null,

              evolucao,
            };
          }
        )
        .filter(
          (
            item
          ): item is
            NonNullable<
              typeof item
            > =>
            item !==
            null
        );

    const comRetorno =
      abertas.filter(
        (
          item
        ) =>
          item.retornoEm !==
          null
      );

    const semRetorno =
      abertas
        .filter(
          (
            item
          ) =>
            item.retornoEm ===
            null
        )
        .sort(
          (
            a,
            b
          ) =>
            a.atualizadoEm.getTime() -
            b.atualizadoEm.getTime()
        );

    return NextResponse.json({
      ok:
        true,

      resumo: {
        abertas:
          abertas.length,

        comRetorno:
          comRetorno.length,

        semRetorno:
          semRetorno.length,

        pioraAposIntervencao:
          pioraAposIntervencao.length,
      },

      /*
       * O frontend classifica comRetorno
       * em "atrasados" e "hoje", pois
       * precisa respeitar o fuso local.
       */
      comRetorno:
        comRetorno.map(
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

      /*
       * O primeiro registro é o que está
       * há mais tempo sem atualização/
       * retorno programado.
       */
      semRetorno:
        semRetorno.map(
          (
            item
          ) => ({
            ...item,

            retornoEm:
              null,

            criadoEm:
              item.criadoEm
                .toISOString(),

            atualizadoEm:
              item.atualizadoEm
                .toISOString(),
          })
        ),

      pioraAposIntervencao,
    });
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_PRIORIDADES]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar prioridades do Student Success",
      },
      {
        status: 500,
      }
    );
  }
}