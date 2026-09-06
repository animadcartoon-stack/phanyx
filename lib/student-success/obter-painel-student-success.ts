import { prisma } from "@/lib/prisma";

import { calcularRiscoAcademico } from "@/lib/student-success/calcular-risco-academico";

type AlunoMonitorado = {
  alunoId: number;

  nome: string;

  matricula: string | null;

  contato: {
    telefone: string | null;

    paisTelefone: string | null;

    email: string | null;

    responsavel: {
      nome: string | null;

      parentesco: string | null;

      telefone: string | null;

      paisTelefone: string | null;

      email: string | null;
    };
  };

  turmaIds: Set<number>;

  paresTurmaDisciplina: Set<string>;
};

function chaveTurmaDisciplina(
  turmaId: number,

  disciplinaId: number,
) {
  return `${turmaId}:${disciplinaId}`;
}

function limitarPercentual(valor: number) {
  return Math.max(0, Math.min(100, valor));
}

function media(valores: number[]) {
  if (valores.length === 0) {
    return null;
  }

  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

export async function obterPainelStudentSuccess(instituicaoId: number) {
  /*
   * =====================================================
   * 1. MATRÍCULAS E COMPONENTES CURRICULARES ATUAIS
   * =====================================================
   */

  const matriculas = await prisma.matricula.findMany({
    where: {
      instituicaoId,

      status: "ATIVA",

      aluno: {
        ativo: true,
      },
    },

    select: {
      id: true,

      alunoId: true,

      numeroMatricula: true,

      turmaPrincipalId: true,

      aluno: {
        select: {
          id: true,

          nome: true,

          matricula: true,

          telefone: true,

          paisTelefone: true,

          nomeResponsavel: true,

          parentescoResponsavel: true,

          telefoneResponsavel: true,

          paisTelefoneResponsavel: true,

          emailResponsavel: true,

          user: {
            select: {
              email: true,
            },
          },
        },
      },

      itens: {
        where: {
          status: {
            in: ["A_CURSAR", "EM_CURSO"],
          },
        },

        select: {
          turmaId: true,

          disciplinaId: true,

          status: true,
        },
      },
    },
  });

  /*
   * Um aluno pode possuir mais de
   * uma matrícula ativa.
   *
   * Consolidamos por aluno para evitar
   * duplicidade no Student Success.
   */

  const alunosMap = new Map<number, AlunoMonitorado>();

  for (const matricula of matriculas) {
    let aluno = alunosMap.get(matricula.alunoId);

    if (!aluno) {
      aluno = {
        alunoId: matricula.aluno.id,

        nome: matricula.aluno.nome,

        matricula:
          matricula.numeroMatricula ?? matricula.aluno.matricula ?? null,

        contato: {
          telefone: matricula.aluno.telefone,

          paisTelefone: matricula.aluno.paisTelefone,

          email: matricula.aluno.user.email ?? null,

          responsavel: {
            nome: matricula.aluno.nomeResponsavel,

            parentesco: matricula.aluno.parentescoResponsavel,

            telefone: matricula.aluno.telefoneResponsavel,

            paisTelefone: matricula.aluno.paisTelefoneResponsavel,

            email: matricula.aluno.emailResponsavel,
          },
        },

        turmaIds: new Set<number>(),

        paresTurmaDisciplina: new Set<string>(),
      };

      alunosMap.set(matricula.alunoId, aluno);
    }

    if (matricula.turmaPrincipalId) {
      aluno.turmaIds.add(matricula.turmaPrincipalId);
    }

    for (const item of matricula.itens) {
      aluno.turmaIds.add(item.turmaId);

      aluno.paresTurmaDisciplina.add(
        chaveTurmaDisciplina(item.turmaId, item.disciplinaId),
      );
    }
  }

  const alunos = Array.from(alunosMap.values());

  const alunoIds = alunos.map((item) => item.alunoId);

  const turmaIds = Array.from(
    new Set(alunos.flatMap((item) => Array.from(item.turmaIds))),
  );

  if (alunoIds.length === 0) {
    return {
      ok: true as const,

      geradoEm: new Date().toISOString(),

      diagnostico: {
        matriculasCarregadas: matriculas.length,

        alunosConsolidados: alunos.length,

        turmasEncontradas: turmaIds.length,

        presencasCarregadas: 0,

        notasCarregadas: 0,

        atividadesVencidasCarregadas: 0,
      },

      resumo: {
        monitorados: 0,

        critico: 0,

        risco: 0,

        atencao: 0,

        normal: 0,

        dadosInsuficientes: 0,

        alunosComSinais: 0,
      },

      alunos: [],
    };
  }

  /*
   * =====================================================
   * 2. PRESENÇAS
   * =====================================================
   */

  const presencas =
    turmaIds.length > 0
      ? await prisma.presencaAula.findMany({
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
                turmaId: true,

                disciplinaId: true,
              },
            },
          },
        })
      : [];

  /*
   * =====================================================
   * 3. NOTAS
   * =====================================================
   */

  const notas =
    turmaIds.length > 0
      ? await prisma.nota.findMany({
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
            createdAt: "asc",
          },

          select: {
            alunoId: true,

            turmaId: true,

            atividadeId: true,

            provaId: true,

            valor: true,

            tipo: true,

            createdAt: true,

            atividade: {
              select: {
                turmaId: true,

                disciplinaId: true,

                notaMaxima: true,
              },
            },

            prova: {
              select: {
                turmaId: true,

                notaMaxima: true,
              },
            },
          },
        })
      : [];

  /*
   * =====================================================
   * 3.1. NOTAS MODERNAS DE ATIVIDADES
   * =====================================================
   *
   * O fluxo moderno de correção de atividades
   * grava a nota diretamente em EntregaAtividade.
   *
   * Por isso essas avaliações precisam ser
   * carregadas separadamente do model Nota.
   */
  const entregasAvaliadas =
    alunoIds.length > 0 && turmaIds.length > 0
      ? await prisma.entregaAtividade.findMany({
          where: {
            instituicaoId,

            alunoId: {
              in: alunoIds,
            },

            nota: {
              not: null,
            },

            atividade: {
              turmaId: {
                in: turmaIds,
              },
            },
          },

          select: {
            alunoId: true,

            atividadeId: true,

            nota: true,

            corrigidaEm: true,

            updatedAt: true,

            atividade: {
              select: {
                turmaId: true,

                disciplinaId: true,

                notaMaxima: true,
              },
            },
          },
        })
      : [];

  /*
   * =====================================================
   * 4. ATIVIDADES VENCIDAS
   * =====================================================
   */

  const agora = new Date();

  const atividades =
    turmaIds.length > 0
      ? await prisma.atividade.findMany({
          where: {
            instituicaoId,

            turmaId: {
              in: turmaIds,
            },

            status: {
              in: ["PUBLICADA", "ENCERRADA"],
            },

            prazo: {
              lt: agora,
            },
          },

          select: {
            id: true,

            turmaId: true,

            disciplinaId: true,

            prazo: true,

            entregas: {
              where: {
                alunoId: {
                  in: alunoIds,
                },
              },

              select: {
                alunoId: true,
              },
            },
          },
        })
      : [];

  /*
   * =====================================================
   * 5. ÍNDICES AUXILIARES
   * =====================================================
   */

  const presencasPorAluno = new Map<number, typeof presencas>();

  for (const presenca of presencas) {
    const lista = presencasPorAluno.get(presenca.alunoId) ?? [];

    lista.push(presenca);

    presencasPorAluno.set(presenca.alunoId, lista);
  }

  const notasPorAluno = new Map<number, typeof notas>();

  for (const nota of notas) {
    const lista = notasPorAluno.get(nota.alunoId) ?? [];

    lista.push(nota);

    notasPorAluno.set(nota.alunoId, lista);
  }

  const entregasAvaliadasPorAluno = new Map<number, typeof entregasAvaliadas>();

  for (const entrega of entregasAvaliadas) {
    const lista = entregasAvaliadasPorAluno.get(entrega.alunoId) ?? [];

    lista.push(entrega);

    entregasAvaliadasPorAluno.set(entrega.alunoId, lista);
  }

  const atividadesPorTurma = new Map<number, typeof atividades>();

  for (const atividade of atividades) {
    const lista = atividadesPorTurma.get(atividade.turmaId) ?? [];

    lista.push(atividade);

    atividadesPorTurma.set(atividade.turmaId, lista);
  }

  /*
   * =====================================================
   * 6. ANÁLISE DE CADA ALUNO
   * =====================================================
   */

  const resultados = alunos.map((aluno) => {
    /*
     * -----------------------
     * FREQUÊNCIA
     * -----------------------
     */

    const registrosPresenca = (
      presencasPorAluno.get(aluno.alunoId) ?? []
    ).filter((registro) => {
      if (!aluno.turmaIds.has(registro.aula.turmaId)) {
        return false;
      }

      if (registro.aula.disciplinaId === null) {
        return true;
      }

      return aluno.paresTurmaDisciplina.has(
        chaveTurmaDisciplina(
          registro.aula.turmaId,

          registro.aula.disciplinaId,
        ),
      );
    });

    const quantidadeAulas = registrosPresenca.length;

    const faltas = registrosPresenca.filter(
      (registro) => registro.status === "FALTA",
    ).length;

    /*
     * PRESENTE, JUSTIFICADA e ATESTADO
     * não geram penalização no motor.
     */

    const frequenciaPercentual =
      quantidadeAulas > 0
        ? limitarPercentual(
            ((quantidadeAulas - faltas) / quantidadeAulas) * 100,
          )
        : null;

    /*
     * -----------------------
     * DESEMPENHO
     * -----------------------
     */

    const entregasNota = (
      entregasAvaliadasPorAluno.get(aluno.alunoId) ?? []
    ).filter((entrega) => {
      if (!aluno.turmaIds.has(entrega.atividade.turmaId)) {
        return false;
      }

      const disciplinaId = entrega.atividade.disciplinaId;

      if (disciplinaId === null || disciplinaId === undefined) {
        return true;
      }

      return aluno.paresTurmaDisciplina.has(
        chaveTurmaDisciplina(
          entrega.atividade.turmaId,

          disciplinaId,
        ),
      );
    });

    /*
     * Se existir uma EntregaAtividade
     * avaliada para uma atividade,
     * ela é a fonte principal.
     *
     * Eventual registro legado em Nota
     * para a mesma atividade não pode
     * ser contado novamente.
     */
    const atividadeIdsComEntregaAvaliada = new Set(
      entregasNota.map((entrega) => entrega.atividadeId),
    );

    const registrosNota = (notasPorAluno.get(aluno.alunoId) ?? []).filter(
      (nota) => {
        if (!aluno.turmaIds.has(nota.turmaId)) {
          return false;
        }

        if (
          nota.atividadeId !== null &&
          atividadeIdsComEntregaAvaliada.has(nota.atividadeId)
        ) {
          return false;
        }

        const disciplinaId = nota.atividade?.disciplinaId;

        if (disciplinaId === null || disciplinaId === undefined) {
          return true;
        }

        return aluno.paresTurmaDisciplina.has(
          chaveTurmaDisciplina(nota.turmaId, disciplinaId),
        );
      },
    );

    const notasNormalizadas = [
      ...registrosNota.map((nota) => {
        const notaMaxima =
          nota.atividade?.notaMaxima ?? nota.prova?.notaMaxima ?? null;

        if (!notaMaxima || notaMaxima <= 0) {
          return null;
        }

        return {
          valor: limitarPercentual((nota.valor / notaMaxima) * 100),

          data: nota.createdAt,
        };
      }),

      ...entregasNota.map((entrega) => {
        const notaMaxima = entrega.atividade.notaMaxima;

        if (!notaMaxima || notaMaxima <= 0 || entrega.nota === null) {
          return null;
        }

        return {
          valor: limitarPercentual((entrega.nota / notaMaxima) * 100),

          data: entrega.corrigidaEm ?? entrega.updatedAt,
        };
      }),
    ]
      .filter(
        (
          item,
        ): item is {
          valor: number;

          data: Date;
        } => item !== null,
      )
      .sort((a, b) => a.data.getTime() - b.data.getTime());

    const valoresNotas = notasNormalizadas.map((item) => item.valor);

    const mediaPercentual = media(valoresNotas);

    const quantidadeAvaliacoes = valoresNotas.length;

    let mediaRecentePercentual: number | null = null;

    let mediaAnteriorPercentual: number | null = null;

    /*
     * Tendência:
     * 4 avaliações recentes contra
     * as 4 anteriores.
     */

    if (notasNormalizadas.length >= 8) {
      const ultimasOito = notasNormalizadas.slice(-8);

      const anteriores = ultimasOito.slice(0, 4).map((item) => item.valor);

      const recentes = ultimasOito.slice(4).map((item) => item.valor);

      mediaAnteriorPercentual = media(anteriores);

      mediaRecentePercentual = media(recentes);
    }

    /*
     * -----------------------
     * ATIVIDADES PENDENTES
     * -----------------------
     */

    let atividadesVencidas = 0;

    let totalAtividadesConsideradas = 0;

    for (const turmaId of aluno.turmaIds) {
      const lista = atividadesPorTurma.get(turmaId) ?? [];

      for (const atividade of lista) {
        if (
          atividade.disciplinaId !== null &&
          !aluno.paresTurmaDisciplina.has(
            chaveTurmaDisciplina(
              atividade.turmaId,

              atividade.disciplinaId,
            ),
          )
        ) {
          continue;
        }

        totalAtividadesConsideradas += 1;

        const entregou = atividade.entregas.some(
          (entrega) => entrega.alunoId === aluno.alunoId,
        );

        if (!entregou) {
          atividadesVencidas += 1;
        }
      }
    }

    /*
     * -----------------------
     * MOTOR STUDENT SUCCESS
     * -----------------------
     */

    const analise = calcularRiscoAcademico({
      frequenciaPercentual,

      quantidadeAulas,

      mediaPercentual,

      quantidadeAvaliacoes,

      atividadesVencidas,

      totalAtividadesConsideradas,

      mediaRecentePercentual,

      mediaAnteriorPercentual,

      participacaoPercentual: null,
    });

    const quedaDesempenhoPercentual =
      mediaAnteriorPercentual !== null && mediaRecentePercentual !== null
        ? mediaAnteriorPercentual - mediaRecentePercentual
        : null;

    return {
      alunoId: aluno.alunoId,

      nome: aluno.nome,

      matricula: aluno.matricula,

      contato: aluno.contato,

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
  });

  /*
   * Alunos de maior risco primeiro.
   */

  const prioridade = {
    CRITICO: 5,

    RISCO: 4,

    ATENCAO: 3,

    DADOS_INSUFICIENTES: 2,

    NORMAL: 1,
  } as const;

  resultados.sort((a, b) => {
    const prioridadeA = prioridade[a.analise.nivel];

    const prioridadeB = prioridade[b.analise.nivel];

    if (prioridadeA !== prioridadeB) {
      return prioridadeB - prioridadeA;
    }

    return b.analise.pontuacao - a.analise.pontuacao;
  });

  /*
   * =====================================================
   * 7. RESUMO DO DASHBOARD
   * =====================================================
   */

  const critico = resultados.filter(
    (item) => item.analise.nivel === "CRITICO",
  ).length;

  const risco = resultados.filter(
    (item) => item.analise.nivel === "RISCO",
  ).length;

  const atencao = resultados.filter(
    (item) => item.analise.nivel === "ATENCAO",
  ).length;

  const normal = resultados.filter(
    (item) => item.analise.nivel === "NORMAL",
  ).length;

  const dadosInsuficientes = resultados.filter(
    (item) => item.analise.nivel === "DADOS_INSUFICIENTES",
  ).length;

  return {
    ok: true as const,

    geradoEm: new Date().toISOString(),

    diagnostico: {
      matriculasCarregadas: matriculas.length,

      alunosConsolidados: alunos.length,

      turmasEncontradas: turmaIds.length,

      presencasCarregadas: presencas.length,

      notasCarregadas: notas.length,

      atividadesVencidasCarregadas: atividades.length,
    },

    resumo: {
      monitorados: resultados.length,

      critico,

      risco,

      atencao,

      normal,

      dadosInsuficientes,

      alunosComSinais: critico + risco + atencao,
    },

    alunos: resultados,
  };
}

export type PainelStudentSuccess = Awaited<
  ReturnType<typeof obterPainelStudentSuccess>
>;
