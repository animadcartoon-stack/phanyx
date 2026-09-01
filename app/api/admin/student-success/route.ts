import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import {
  calcularRiscoAcademico,
} from "@/lib/student-success/calcular-risco-academico";

type AlunoMonitorado = {
  alunoId: number;
  nome: string;
  matricula: string | null;

  turmaIds: Set<number>;
  paresTurmaDisciplina: Set<string>;
};

function chaveTurmaDisciplina(
  turmaId: number,
  disciplinaId: number
) {
  return `${turmaId}:${disciplinaId}`;
}

function limitarPercentual(
  valor: number
) {
  return Math.max(
    0,
    Math.min(
      100,
      valor
    )
  );
}

function media(
  valores: number[]
) {
  if (
    valores.length === 0
  ) {
    return null;
  }

  return (
    valores.reduce(
      (total, valor) =>
        total + valor,
      0
    ) / valores.length
  );
}

export async function GET() {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "UNAUTHORIZED",
        },
        {
          status: 401,
        }
      );
    }

    const instituicaoId =
      Number(
        user.instituicaoId
      );

    if (
      !Number.isInteger(
        instituicaoId
      ) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "INSTITUTION_NOT_AVAILABLE",
        },
        {
          status: 403,
        }
      );
    }

    const role =
      String(
        user.role ?? ""
      ).toUpperCase();

    /*
     * ADMIN, SUPER_ADMIN e GERENCIA
     * possuem acesso administrativo
     * direto.
     *
     * Os demais perfis precisam ter
     * permissão explícita.
     */
    const adminGeral =
      role === "ADMIN" ||
      role === "SUPER_ADMIN" ||
      role === "GERENCIA" ||
      (user as any)
        ?.isMasterAdmin ===
        true;

    if (!adminGeral) {
      const permissoes =
        await prisma.departamentoPermissao.findMany(
          {
            where: {
              departamento: {
                funcionarios: {
                  some: {
                    userId:
                      user.id,

                    instituicaoId,
                  },
                },
              },

              chave: {
                in: [
                  "*",
                  "academico.studentSuccess.ver",
                  "academico.studentSuccess.gerenciar",
                ],
              },

              ativo: true,
            },

            select: {
              chave: true,
            },
          }
        );

      const temAcesso =
        permissoes.some(
          (item) =>
            item.chave ===
            "*"
        ) ||
        permissoes.some(
          (item) =>
            item.chave ===
            "academico.studentSuccess.ver"
        ) ||
        permissoes.some(
          (item) =>
            item.chave ===
            "academico.studentSuccess.gerenciar"
        );

      if (!temAcesso) {
        return NextResponse.json(
          {
            error:
              "FORBIDDEN",
          },
          {
            status: 403,
          }
        );
      }
    }

    /*
     * =====================================================
     * 1. MATRÍCULAS E COMPONENTES CURRICULARES ATUAIS
     * =====================================================
     */

    const matriculas =
      await prisma.matricula.findMany(
        {
          where: {
            instituicaoId,

            status:
              "ATIVA",

            aluno: {
              ativo: true,
            },
          },

          select: {
            id: true,

            alunoId: true,

            numeroMatricula:
              true,

            turmaPrincipalId:
              true,

            aluno: {
              select: {
                id: true,
                nome: true,
                matricula: true,
              },
            },

            itens: {
              where: {
                status: {
                  in: [
                    "A_CURSAR",
                    "EM_CURSO",
                  ],
                },
              },

              select: {
                turmaId: true,
                disciplinaId:
                  true,
                status: true,
              },
            },
          },
        }
      );

    /*
     * Um aluno pode possuir mais de
     * uma matrícula ativa.
     *
     * Consolidamos tudo por aluno para
     * não duplicá-lo no dashboard.
     */

    const alunosMap =
      new Map<
        number,
        AlunoMonitorado
      >();

    for (
      const matricula of
      matriculas
    ) {
      let aluno =
        alunosMap.get(
          matricula.alunoId
        );

      if (!aluno) {
        aluno = {
          alunoId:
            matricula.aluno.id,

          nome:
            matricula.aluno.nome,

          matricula:
            matricula.numeroMatricula ??
            matricula.aluno
              .matricula ??
            null,

          turmaIds:
            new Set<number>(),

          paresTurmaDisciplina:
            new Set<string>(),
        };

        alunosMap.set(
          matricula.alunoId,
          aluno
        );
      }

      if (
        matricula.turmaPrincipalId
      ) {
        aluno.turmaIds.add(
          matricula.turmaPrincipalId
        );
      }

      for (
        const item of
        matricula.itens
      ) {
        aluno.turmaIds.add(
          item.turmaId
        );

        aluno.paresTurmaDisciplina.add(
          chaveTurmaDisciplina(
            item.turmaId,
            item.disciplinaId
          )
        );
      }
    }

    const alunos =
      Array.from(
        alunosMap.values()
      );

    const alunoIds =
      alunos.map(
        (item) =>
          item.alunoId
      );

    const turmaIds =
      Array.from(
        new Set(
          alunos.flatMap(
            (item) =>
              Array.from(
                item.turmaIds
              )
          )
        )
      );

    /*
     * Se ainda não existem alunos
     * acadêmicos elegíveis, podemos
     * devolver o dashboard vazio.
     */
    if (
      alunoIds.length === 0
    ) {
      return NextResponse.json(
        {
          ok: true,

          geradoEm:
            new Date().toISOString(),

          resumo: {
            monitorados: 0,

            critico: 0,
            risco: 0,
            atencao: 0,
            normal: 0,

            dadosInsuficientes:
              0,

            alunosComSinais:
              0,
          },

          alunos: [],
        }
      );
    }

    /*
     * =====================================================
     * 2. PRESENÇAS
     * =====================================================
     */

    const presencas =
      turmaIds.length > 0
        ? await prisma.presencaAula.findMany(
            {
              where: {
                instituicaoId,

                alunoId: {
                  in: alunoIds,
                },

                aula: {
                  turmaId: {
                    in: turmaIds,
                  },

                  publicada: true,
                },
              },

              select: {
                alunoId: true,
                status: true,

                aula: {
                  select: {
                    turmaId:
                      true,

                    disciplinaId:
                      true,
                  },
                },
              },
            }
          )
        : [];

    /*
     * =====================================================
     * 3. NOTAS
     * =====================================================
     */

    const notas =
      turmaIds.length > 0
        ? await prisma.nota.findMany(
            {
              where: {
                instituicaoId,

                alunoId: {
                  in: alunoIds,
                },

                turmaId: {
                  in: turmaIds,
                },
              },

              orderBy: {
                createdAt:
                  "asc",
              },

              select: {
                alunoId: true,

                turmaId: true,

                valor: true,

                tipo: true,

                createdAt:
                  true,

                atividade: {
                  select: {
                    turmaId:
                      true,

                    disciplinaId:
                      true,

                    notaMaxima:
                      true,
                  },
                },

                prova: {
                  select: {
                    turmaId:
                      true,

                    notaMaxima:
                      true,
                  },
                },
              },
            }
          )
        : [];

    /*
     * =====================================================
     * 4. ATIVIDADES VENCIDAS
     * =====================================================
     */

    const agora =
      new Date();

    const atividades =
      turmaIds.length > 0
        ? await prisma.atividade.findMany(
            {
              where: {
                instituicaoId,

                turmaId: {
                  in: turmaIds,
                },

                status: {
                  in: [
                    "PUBLICADA",
                    "ENCERRADA",
                  ],
                },

                prazo: {
                  lt: agora,
                },
              },

              select: {
                id: true,

                turmaId: true,

                disciplinaId:
                  true,

                prazo: true,

                entregas: {
                  where: {
                    alunoId: {
                      in: alunoIds,
                    },
                  },

                  select: {
                    alunoId:
                      true,
                  },
                },
              },
            }
          )
        : [];

    /*
     * =====================================================
     * 5. ÍNDICES AUXILIARES
     * =====================================================
     */

    const presencasPorAluno =
      new Map<
        number,
        typeof presencas
      >();

    for (
      const presenca of
      presencas
    ) {
      const lista =
        presencasPorAluno.get(
          presenca.alunoId
        ) ?? [];

      lista.push(
        presenca
      );

      presencasPorAluno.set(
        presenca.alunoId,
        lista
      );
    }

    const notasPorAluno =
      new Map<
        number,
        typeof notas
      >();

    for (
      const nota of
      notas
    ) {
      const lista =
        notasPorAluno.get(
          nota.alunoId
        ) ?? [];

      lista.push(
        nota
      );

      notasPorAluno.set(
        nota.alunoId,
        lista
      );
    }

    const atividadesPorTurma =
      new Map<
        number,
        typeof atividades
      >();

    for (
      const atividade of
      atividades
    ) {
      const lista =
        atividadesPorTurma.get(
          atividade.turmaId
        ) ?? [];

      lista.push(
        atividade
      );

      atividadesPorTurma.set(
        atividade.turmaId,
        lista
      );
    }

    /*
     * =====================================================
     * 6. ANÁLISE DE CADA ALUNO
     * =====================================================
     */

    const resultados =
      alunos.map(
        (aluno) => {
          /*
           * -----------------------
           * FREQUÊNCIA
           * -----------------------
           */

          const registrosPresenca =
            (
              presencasPorAluno.get(
                aluno.alunoId
              ) ?? []
            ).filter(
              (registro) => {
                if (
                  !aluno.turmaIds.has(
                    registro.aula
                      .turmaId
                  )
                ) {
                  return false;
                }

                if (
                  registro.aula
                    .disciplinaId ===
                  null
                ) {
                  return true;
                }

                return aluno.paresTurmaDisciplina.has(
                  chaveTurmaDisciplina(
                    registro.aula
                      .turmaId,

                    registro.aula
                      .disciplinaId
                  )
                );
              }
            );

          const quantidadeAulas =
            registrosPresenca.length;

          const faltas =
            registrosPresenca.filter(
              (registro) =>
                registro.status ===
                "FALTA"
            ).length;

          /*
           * Para o índice Student Success,
           * PRESENTE, JUSTIFICADA e ATESTADO
           * não geram penalização.
           *
           * Isso não altera a regra oficial
           * de frequência acadêmica.
           */
          const frequenciaPercentual =
            quantidadeAulas > 0
              ? limitarPercentual(
                  (
                    (quantidadeAulas -
                      faltas) /
                    quantidadeAulas
                  ) *
                    100
                )
              : null;

          /*
           * -----------------------
           * DESEMPENHO
           * -----------------------
           */

          const registrosNota =
            (
              notasPorAluno.get(
                aluno.alunoId
              ) ?? []
            ).filter(
              (nota) => {
                if (
                  !aluno.turmaIds.has(
                    nota.turmaId
                  )
                ) {
                  return false;
                }

                const disciplinaId =
                  nota.atividade
                    ?.disciplinaId;

                if (
                  disciplinaId ===
                    null ||
                  disciplinaId ===
                    undefined
                ) {
                  return true;
                }

                return aluno.paresTurmaDisciplina.has(
                  chaveTurmaDisciplina(
                    nota.turmaId,
                    disciplinaId
                  )
                );
              }
            );

          const notasNormalizadas =
            registrosNota
              .map(
                (nota) => {
                  const notaMaxima =
                    nota.atividade
                      ?.notaMaxima ??
                    nota.prova
                      ?.notaMaxima ??
                    null;

                  if (
                    !notaMaxima ||
                    notaMaxima <= 0
                  ) {
                    return null;
                  }

                  return {
                    valor:
                      limitarPercentual(
                        (
                          nota.valor /
                          notaMaxima
                        ) *
                          100
                      ),

                    data:
                      nota.createdAt,
                  };
                }
              )
              .filter(
                (
                  item
                ): item is {
                  valor: number;
                  data: Date;
                } =>
                  item !== null
              );

          const valoresNotas =
            notasNormalizadas.map(
              (item) =>
                item.valor
            );

          const mediaPercentual =
            media(
              valoresNotas
            );

          const quantidadeAvaliacoes =
            valoresNotas.length;

          /*
           * Para tendência, usamos as
           * últimas 4 avaliações contra
           * as 4 anteriores.
           *
           * Só calculamos quando existem
           * pelo menos 8 avaliações.
           */
          let mediaRecentePercentual:
            | number
            | null = null;

          let mediaAnteriorPercentual:
            | number
            | null = null;

          if (
            notasNormalizadas.length >=
            8
          ) {
            const ultimasOito =
              notasNormalizadas.slice(
                -8
              );

            const anteriores =
              ultimasOito
                .slice(
                  0,
                  4
                )
                .map(
                  (item) =>
                    item.valor
                );

            const recentes =
              ultimasOito
                .slice(
                  4
                )
                .map(
                  (item) =>
                    item.valor
                );

            mediaAnteriorPercentual =
              media(
                anteriores
              );

            mediaRecentePercentual =
              media(
                recentes
              );
          }

          /*
           * -----------------------
           * ATIVIDADES PENDENTES
           * -----------------------
           */

          let atividadesVencidas =
            0;

          let totalAtividadesConsideradas =
            0;

          for (
            const turmaId of
            aluno.turmaIds
          ) {
            const lista =
              atividadesPorTurma.get(
                turmaId
              ) ?? [];

            for (
              const atividade of
              lista
            ) {
              if (
                atividade.disciplinaId !==
                  null &&
                !aluno.paresTurmaDisciplina.has(
                  chaveTurmaDisciplina(
                    atividade.turmaId,
                    atividade.disciplinaId
                  )
                )
              ) {
                continue;
              }

              totalAtividadesConsideradas +=
                1;

              const entregou =
                atividade.entregas.some(
                  (entrega) =>
                    entrega.alunoId ===
                    aluno.alunoId
                );

              if (!entregou) {
                atividadesVencidas +=
                  1;
              }
            }
          }

          /*
           * -----------------------
           * MOTOR STUDENT SUCCESS
           * -----------------------
           */

          const analise =
            calcularRiscoAcademico(
              {
                frequenciaPercentual,

                quantidadeAulas,

                mediaPercentual,

                quantidadeAvaliacoes,

                atividadesVencidas,

                totalAtividadesConsideradas,

                mediaRecentePercentual,

                mediaAnteriorPercentual,

                /*
                 * Participação ficará
                 * desligada até definirmos
                 * uma métrica confiável.
                 */
                participacaoPercentual:
                  null,
              }
            );

          const quedaDesempenhoPercentual =
            mediaAnteriorPercentual !==
              null &&
            mediaRecentePercentual !==
              null
              ? mediaAnteriorPercentual -
                mediaRecentePercentual
              : null;

          return {
            alunoId:
              aluno.alunoId,

            nome:
              aluno.nome,

            matricula:
              aluno.matricula,

            indicadores: {
              frequenciaPercentual,

              quantidadeAulas,

              mediaPercentual,

              quantidadeAvaliacoes,

              atividadesVencidas,

              totalAtividadesConsideradas,

              mediaAnteriorPercentual,

              mediaRecentePercentual,

              quedaDesempenhoPercentual,
            },

            analise,
          };
        }
      );

    /*
     * Alunos de maior risco aparecem
     * primeiro.
     */

    const prioridade = {
      CRITICO: 5,
      RISCO: 4,
      ATENCAO: 3,
      DADOS_INSUFICIENTES: 2,
      NORMAL: 1,
    } as const;

    resultados.sort(
      (
        a,
        b
      ) => {
        const prioridadeA =
          prioridade[
            a.analise.nivel
          ];

        const prioridadeB =
          prioridade[
            b.analise.nivel
          ];

        if (
          prioridadeA !==
          prioridadeB
        ) {
          return (
            prioridadeB -
            prioridadeA
          );
        }

        return (
          b.analise.pontuacao -
          a.analise.pontuacao
        );
      }
    );

    /*
     * =====================================================
     * 7. RESUMO DO DASHBOARD
     * =====================================================
     */

    const critico =
      resultados.filter(
        (item) =>
          item.analise.nivel ===
          "CRITICO"
      ).length;

    const risco =
      resultados.filter(
        (item) =>
          item.analise.nivel ===
          "RISCO"
      ).length;

    const atencao =
      resultados.filter(
        (item) =>
          item.analise.nivel ===
          "ATENCAO"
      ).length;

    const normal =
      resultados.filter(
        (item) =>
          item.analise.nivel ===
          "NORMAL"
      ).length;

    const dadosInsuficientes =
      resultados.filter(
        (item) =>
          item.analise.nivel ===
          "DADOS_INSUFICIENTES"
      ).length;

    return NextResponse.json(
      {
        ok: true,

        geradoEm:
          new Date().toISOString(),

        resumo: {
          monitorados:
            resultados.length,

          critico,
          risco,
          atencao,
          normal,

          dadosInsuficientes,

          alunosComSinais:
            critico +
            risco +
            atencao,
        },

        alunos:
          resultados,
      }
    );
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_GET]",
      error
    );

    return NextResponse.json(
      {
        error:
          "STUDENT_SUCCESS_LOAD_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}