import {
  StatusAtividade,
} from "@prisma/client";

import {
  prisma,
} from "../lib/prisma";

import {
  solicitarReanalisePorAlteracaoAcademica,
} from "../lib/student-success/solicitar-reanalise-por-alteracao-academica";

const instituicaoId =
  1;

const turmaId =
  7;

const tituloTeste =
  "TESTE TEMPORARIO STUDENT SUCCESS - ATIVIDADE VENCIDA";

async function executar() {
  let atividadeTesteId:
    number | null =
    null;

  const analiseTesteIds:
    number[] =
    [];

  /*
   * O teste usa uma atividade SEM disciplina
   * específica.
   *
   * Assim, ela se aplica aos alunos vinculados
   * à turma, seguindo a mesma regra atual
   * do Student Success.
   */

  try {
    /*
     * Primeiro criamos a atividade como
     * RASCUNHO.
     *
     * Neste estado ela ainda NÃO pode
     * influenciar o Student Success.
     */
    const atividadeRascunho =
      await prisma.atividade.create({
        data: {
          instituicaoId,

          turmaId,

          disciplinaId:
            null,

          titulo:
            tituloTeste,

          descricao:
            "Atividade temporária criada exclusivamente para teste controlado do Student Success.",

          prazo:
            new Date(
              Date.now() -
                60 *
                  60 *
                  1000
            ),

          status:
            StatusAtividade.RASCUNHO,
        },

        select: {
          id:
            true,

          titulo:
            true,

          status:
            true,

          prazo:
            true,

          turmaId:
            true,

          disciplinaId:
            true,
        },
      });

    atividadeTesteId =
      atividadeRascunho.id;

    console.log(
      "\n=== ATIVIDADE TEMPORÁRIA EM RASCUNHO ==="
    );

    console.log(
      atividadeRascunho
    );

    /*
     * Agora reproduzimos a alteração central
     * feita pelo PUT da API:
     *
     * RASCUNHO -> PUBLICADA
     */
    const publicada =
      await prisma.atividade.update({
        where: {
          id:
            atividadeRascunho.id,
        },

        data: {
          status:
            StatusAtividade.PUBLICADA,

          publicadaAt:
            new Date(),
        },

        select: {
          id:
            true,

          status:
            true,

          prazo:
            true,

          turmaId:
            true,

          disciplinaId:
            true,
        },
      });

    console.log(
      "\n=== ATIVIDADE PUBLICADA ==="
    );

    console.log(
      publicada
    );

    /*
     * Confirmamos a mesma condição existente
     * no PUT real:
     *
     * somente publicação com prazo já vencido
     * provoca reanálise imediata.
     */
    if (
      !publicada.prazo ||
      publicada.prazo >=
        new Date()
    ) {
      throw new Error(
        "A atividade temporária não ficou com prazo vencido. Teste interrompido."
      );
    }

    /*
     * Esta é a mesma seleção de alunos
     * que colocamos na API de publicação.
     */
    const itensAfetados =
      await prisma.itemMatricula.findMany({
        where: {
  instituicaoId,

  turmaId:
    publicada.turmaId,

  status: {
    in: [
      "A_CURSAR",
      "EM_CURSO",
    ],
  },

  matricula: {
    status:
      "ATIVA",

    aluno: {
      ativo:
        true,
    },
  },

  ...(publicada.disciplinaId !==
  null
    ? {
        disciplinaId:
          publicada.disciplinaId,
      }
    : {}),
},

        select: {
          matricula: {
            select: {
              alunoId:
                true,
            },
          },
        },
      });

  const alunoIds:
  number[] =
  Array.from(
    new Set<number>(
      itensAfetados
        .map(
          (
            item: {
              matricula: {
                alunoId:
                  unknown;
              };
            }
          ) =>
            Number(
              item.matricula
                .alunoId
            )
        )
        .filter(
          (
            alunoId:
              number
          ) =>
            Number.isInteger(
              alunoId
            ) &&
            alunoId >
              0
        )
    )
  );

    console.log(
      "\n=== ALUNOS LOCALIZADOS PARA REANÁLISE ==="
    );

    console.log({
      quantidade:
        alunoIds.length,

      alunoIds,
    });

    if (
      alunoIds.length ===
      0
    ) {
      throw new Error(
        `Nenhum aluno encontrado na turma ${turmaId}. Teste interrompido.`
      );
    }

    /*
     * Executamos a mesma função central
     * chamada pela API.
     *
     * Não associamos a fotografia a um
     * usuário real neste script.
     */
    const resultado =
      await solicitarReanalisePorAlteracaoAcademica({
        instituicaoId,

        alunoIds,

        executadoPorId:
          null,
      });

    console.log(
      "\n=== RESULTADO DA REANÁLISE ==="
    );

    console.log(
      JSON.stringify(
        resultado,
        null,
        2
      )
    );

    /*
     * Guardamos SOMENTE os IDs das fotografias
     * realmente criadas por esta execução.
     *
     * Fotografias deduplicadas ou anteriores
     * jamais serão removidas.
     */
    for (
      const item
      of resultado.resultados
    ) {
      if (
        item.gravou &&
        typeof item.analiseId ===
          "number"
      ) {
        analiseTesteIds.push(
          item.analiseId
        );
      }
    }

    console.log(
      "\n=== FOTOGRAFIAS CRIADAS PELO TESTE ==="
    );

    console.log(
      analiseTesteIds
    );
  }
  finally {
    /*
     * LIMPEZA GARANTIDA
     *
     * Primeiro apagamos somente as
     * fotografias criadas neste teste.
     */
    try {
      if (
        analiseTesteIds.length >
        0
      ) {
        const limpezaAnalises =
          await prisma
            .studentSuccessAnaliseHistorico
            .deleteMany({
              where: {
                instituicaoId,

                id: {
                  in:
                    analiseTesteIds,
                },
              },
            });

        console.log(
          "\nFotografias de teste removidas:",
          limpezaAnalises.count
        );
      }
      else {
        console.log(
          "\nFotografias de teste removidas:",
          0
        );
      }
    }
    finally {
      /*
       * Depois removemos somente a atividade
       * temporária criada pelo script.
       */
      if (
        atividadeTesteId !==
        null
      ) {
        const limpezaAtividade =
          await prisma.atividade.deleteMany({
            where: {
              id:
                atividadeTesteId,

              instituicaoId,

              titulo:
                tituloTeste,
            },
          });

        console.log(
          "Atividades de teste removidas:",
          limpezaAtividade.count
        );
      }
    }

    console.log(
      "\n=== TESTE FINALIZADO E LIMPO ==="
    );
  }
}

async function iniciar() {
  try {
    await executar();
  }
  finally {
    await prisma.$disconnect();
  }
}

void iniciar();