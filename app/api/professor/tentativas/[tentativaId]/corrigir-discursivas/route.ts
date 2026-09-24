import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  getAuth,
  assertProfessor,
} from "@/lib/auth/getAuth";

import {
  corrigirDiscursivasSchema,
} from "@/lib/validators/prova";

import {
  provaPertenceAoProfessor,
} from "@/lib/services/provaProfessor.service";

import {
  solicitarReanalisePorAlteracaoAcademica,
} from "@/lib/student-success/solicitar-reanalise-por-alteracao-academica";

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: {
      tentativaId: string;
    };
  }
) {
  try {
    const auth =
      getAuth(req);

    assertProfessor(auth);

    const tentativaId =
      Number(
        ctx.params.tentativaId
      );

    if (
      !Number.isFinite(tentativaId) ||
      tentativaId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tentativa inv\u00e1lida",
        },
        {
          status: 400,
        }
      );
    }

    const tentativa: any =
      await prisma.tentativaProva.findFirst({
        where: {
          id: tentativaId,
          instituicaoId:
            auth.instituicaoId,
        },

        include: {
          prova: {
            include: {
              questoes: true,
            },
          },

          respostas: {
            include: {
              questao: true,
              alternativa: true,
            },
          },
        },
      });

    if (!tentativa) {
      return NextResponse.json(
        {
          error:
            "Tentativa n\u00e3o encontrada ou sem permiss\u00e3o",
        },
        {
          status: 404,
        }
      );
    }

    try {
      await provaPertenceAoProfessor({
        provaId:
          tentativa.provaId,

        professorId:
          auth.professorId!,

        instituicaoId:
          auth.instituicaoId,
      });
    }
    catch {
      return NextResponse.json(
        {
          error:
            "Tentativa n\u00e3o encontrada ou sem permiss\u00e3o",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await req.json();

    const parsed =
      corrigirDiscursivasSchema.safeParse({
        respostas:
          Array.isArray(
            body.respostas
          )
            ? body.respostas.map(
                (r: any) => ({
                  respostaId:
                    Number(
                      r.respostaId
                    ),

                  nota:
                    Number(
                      r.nota
                    ),

                  feedback:
                    r.feedback ??
                    "",
                })
              )
            : [],
      });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Dados inv\u00e1lidos",

          details:
            parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const ids =
      parsed.data.respostas.map(
        (item) =>
          item.respostaId
      );

    if (
      new Set(ids).size !==
      ids.length
    ) {
      return NextResponse.json(
        {
          error:
            "A mesma resposta foi enviada mais de uma vez",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Valida TODAS as respostas antes de
     * escrever qualquer alteracao no banco.
     */
    for (
      const item
      of parsed.data.respostas
    ) {
      const resposta: any =
        tentativa.respostas.find(
          (r: any) =>
            r.id ===
            item.respostaId
        );

      if (!resposta) {
        return NextResponse.json(
          {
            error:
              `Resposta ${item.respostaId} n\u00e3o pertence \u00e0 tentativa`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        resposta.questao.tipo !==
        "discursiva"
      ) {
        return NextResponse.json(
          {
            error:
              `Resposta ${item.respostaId} n\u00e3o \u00e9 discursiva`,
          },
          {
            status: 400,
          }
        );
      }

      const valorQuestao =
        Math.max(
          0,
          Number(
            resposta.questao
              .valor || 0
          )
        );

      if (
        item.nota >
        valorQuestao
      ) {
        return NextResponse.json(
          {
            error:
              `A nota da resposta ${item.respostaId} n\u00e3o pode ultrapassar o valor da quest\u00e3o (${valorQuestao})`,
          },
          {
            status: 400,
          }
        );
      }
    }

    const agora =
      new Date();

    const notaTotal =
      await prisma.$transaction(
        async (tx) => {
          for (
            const item
            of parsed.data.respostas
          ) {
            await tx
              .respostaProva
              .update({
                where: {
                  id:
                    item.respostaId,
                },

                data: {
                  nota:
                    item.nota,

                  feedback:
                    item.feedback ??
                    "",

                  corrigidaManual:
                    true,

                  corrigidaEm:
                    agora,
                } as any,
              });
          }

          const respostasAtualizadas:
            any[] =
            await tx
              .respostaProva
              .findMany({
                where: {
                  tentativaId,

                  instituicaoId:
                    auth.instituicaoId,
                },

                include: {
                  questao: true,
                  alternativa: true,
                },
              });

          let total = 0;

          for (
            const resposta
            of respostasAtualizadas
          ) {
            if (
              resposta.questao.tipo ===
              "multipla_escolha"
            ) {
              if (
                resposta
                  .alternativa
                  ?.correta
              ) {
                total +=
                  Number(
                    resposta
                      .questao
                      .valor || 0
                  );
              }
            }

            if (
              resposta.questao.tipo ===
              "discursiva"
            ) {
              total +=
                Number(
                  resposta.nota ||
                  0
                );
            }
          }

          await tx
            .tentativaProva
            .update({
              where: {
                id:
                  tentativaId,
              },

              data: {
                notaFinal:
                  total,

                status:
                  "CORRIGIDA",

                corrigidaEm:
                  agora,
              },
            });

          return total;
        }
      );

    /*
     * A correcao definitiva altera
     * o desempenho academico.
     * Falha da reanalise nao bloqueia
     * a correcao da tentativa.
     */
    try {
      await solicitarReanalisePorAlteracaoAcademica({
        instituicaoId:
          auth.instituicaoId,

        alunoIds: [
          tentativa.alunoId,
        ],

        executadoPorId:
          auth.userId,
      });
    }
    catch (error) {
      console.error(
        "[STUDENT_SUCCESS_CORRECAO_PROVA_REANALISE]",
        error
      );
    }

    return NextResponse.json({
      success: true,
      nota:
        notaTotal,
    });
  }
  catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao corrigir tentativa",
      },
      {
        status: 401,
      }
    );
  }
}
