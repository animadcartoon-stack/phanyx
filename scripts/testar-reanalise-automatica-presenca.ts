import {
  StatusPresencaAula,
} from "@prisma/client";

import {
  prisma,
} from "../lib/prisma";

import {
  solicitarReanalisePorAlteracaoAcademica,
} from "../lib/student-success/solicitar-reanalise-por-alteracao-academica";

const instituicaoId =
  1;

const alunoId =
  2097;

const aulaId =
  18;

async function executar() {
  let presencaTesteId:
    number | null =
    null;

  let analiseTesteId:
    number | null =
    null;

  /*
   * Não sobrescrevemos nenhum dado real.
   */
  const presencaExistente =
    await prisma.presencaAula.findUnique({
      where: {
        aulaId_alunoId: {
          aulaId,
          alunoId,
        },
      },

      select: {
        id:
          true,

        status:
          true,

        observacao:
          true,
      },
    });

  if (
    presencaExistente
  ) {
    throw new Error(
      `A aula ${aulaId} já possui presença para o aluno ${alunoId}. Teste cancelado para não alterar dado real.`
    );
  }

  const analiseAntes =
    await prisma
      .studentSuccessAnaliseHistorico
      .findFirst({
        where: {
          instituicaoId,
          alunoId,
        },

        orderBy: [
          {
            analisadoEm:
              "desc",
          },

          {
            id:
              "desc",
          },
        ],

        select: {
          id:
            true,

          origem:
            true,

          nivelRisco:
            true,

          pontuacaoRisco:
            true,

          coberturaPercentual:
            true,

          analisadoEm:
            true,
        },
      });

  console.log(
    "\n=== ESTADO ANTES ==="
  );

  console.log(
    analiseAntes
  );

  try {
    /*
     * Criamos uma falta temporária.
     *
     * É uma alteração suficiente para
     * o motor perceber mudança acadêmica.
     */
    const presencaTeste =
      await prisma.presencaAula.create({
        data: {
          instituicaoId,

          aulaId,

          alunoId,

          status:
            StatusPresencaAula.FALTA,

          observacao:
            "TESTE TEMPORARIO STUDENT SUCCESS",
        },

        select: {
          id:
            true,

          status:
            true,
        },
      });

    presencaTesteId =
      presencaTeste.id;

    console.log(
      "\n=== PRESENÇA TEMPORÁRIA ==="
    );

    console.log(
      presencaTeste
    );

    /*
     * Esta é exatamente a mesma função
     * que a API moderna de presenças
     * chama depois de salvar a chamada.
     */
    const resultado =
      await solicitarReanalisePorAlteracaoAcademica({
        instituicaoId,

        alunoIds: [
          alunoId,
        ],

        /*
         * Neste script não atribuímos
         * a fotografia a um usuário real.
         */
        executadoPorId:
          null,
      });

    console.log(
      "\n=== RESULTADO DA REANÁLISE AUTOMÁTICA ==="
    );

    console.log(
      JSON.stringify(
        resultado,
        null,
        2
      )
    );

    const resultadoAluno =
      resultado.resultados.find(
        (
          item
        ) =>
          item.alunoId ===
          alunoId
      );

    /*
     * Só guardamos o ID para limpeza
     * se ESTE teste realmente criou
     * uma nova fotografia.
     *
     * Se houve deduplicação, jamais
     * apagamos uma fotografia anterior.
     */
    if (
      resultadoAluno?.gravou
    ) {
      analiseTesteId =
        resultadoAluno
          .analiseId;
    }

    const analiseDepois =
      await prisma
        .studentSuccessAnaliseHistorico
        .findFirst({
          where: {
            instituicaoId,
            alunoId,
          },

          orderBy: [
            {
              analisadoEm:
                "desc",
            },

            {
              id:
                "desc",
            },
          ],

          select: {
            id:
              true,

            origem:
              true,

            nivelRisco:
              true,

            pontuacaoRisco:
              true,

            pontuacaoBruta:
              true,

            maximoDisponivel:
              true,

            coberturaPercentual:
              true,

            confiabilidade:
              true,

            indicadores:
              true,

            analisadoEm:
              true,
          },
        });

    console.log(
      "\n=== ESTADO DURANTE O TESTE ==="
    );

    console.log(
      analiseDepois
    );
  }
  finally {
    /*
     * LIMPEZA GARANTIDA
     *
     * Primeiro removemos somente a
     * fotografia criada neste teste.
     */
    try {
      if (
        analiseTesteId !==
        null
      ) {
        const limpezaAnalise =
          await prisma
            .studentSuccessAnaliseHistorico
            .deleteMany({
              where: {
                id:
                  analiseTesteId,

                instituicaoId,

                alunoId,
              },
            });

        console.log(
          "\nFotografias de teste removidas:",
          limpezaAnalise.count
        );
      }
    }
    finally {
      /*
       * E removemos somente a presença
       * temporária criada por este script.
       */
      if (
        presencaTesteId !==
        null
      ) {
        const limpezaPresenca =
          await prisma.presencaAula.deleteMany({
            where: {
              id:
                presencaTesteId,

              instituicaoId,

              alunoId,

              aulaId,
            },
          });

        console.log(
          "Presenças de teste removidas:",
          limpezaPresenca.count
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