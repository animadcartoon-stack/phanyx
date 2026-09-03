import {
  OrigemAnaliseStudentSuccess,
} from "@prisma/client";

import {
  prisma,
} from "../lib/prisma";

import {
  registrarAnaliseHistorica,
} from "../lib/student-success/registrar-analise-historica";

const ALUNO_ID =
  2097;

const VERSAO_TESTE =
  "teste-mudanca-estado-v1";

async function main() {
  const aluno =
    await prisma.aluno.findUnique({
      where: {
        id:
          ALUNO_ID,
      },

      select: {
        id:
          true,

        nome:
          true,

        instituicaoId:
          true,
      },
    });

  if (!aluno) {
    throw new Error(
      `Aluno ${ALUNO_ID} não encontrado.`
    );
  }

  console.log(
    "\nAluno:",
    aluno.nome
  );

  console.log(
    "Instituição:",
    aluno.instituicaoId
  );

  await prisma
    .studentSuccessAnaliseHistorico
    .deleteMany({
      where: {
        alunoId:
          aluno.id,

        versaoMotor:
          VERSAO_TESTE,
      },
    });

  const estadoInicial = {
    instituicaoId:
      aluno.instituicaoId,

    alunoId:
      aluno.id,

    origem:
      OrigemAnaliseStudentSuccess.MANUAL,

    executadoPorId:
      null,

    versaoMotor:
      VERSAO_TESTE,

    analise: {
      nivel:
        "DADOS_INSUFICIENTES",

      pontuacao:
        25,

      pontuacaoBruta:
        5,

      maximoDisponivel:
        20,

      coberturaPercentual:
        20,

      confiabilidade:
        "BAIXA",

      componentes: [
        {
          codigo:
            "FREQUENCIA",

          pontos:
            0,

          maximo:
            30,

          disponivel:
            false,
        },

        {
          codigo:
            "DESEMPENHO",

          pontos:
            0,

          maximo:
            30,

          disponivel:
            false,
        },

        {
          codigo:
            "PENDENCIAS",

          pontos:
            5,

          maximo:
            20,

          disponivel:
            true,
        },

        {
          codigo:
            "QUEDA_DESEMPENHO",

          pontos:
            0,

          maximo:
            10,

          disponivel:
            false,
        },

        {
          codigo:
            "PARTICIPACAO",

          pontos:
            0,

          maximo:
            10,

          disponivel:
            false,
        },
      ],

      fatoresPrincipais: [
        {
          codigo:
            "PENDENCIAS",

          pontos:
            5,

          maximo:
            20,

          disponivel:
            true,
        },
      ],
    },

    indicadores: {
      frequenciaPercentual:
        null,

      quantidadeAulas:
        0,

      mediaPercentual:
        null,

      quantidadeAvaliacoes:
        0,

      atividadesVencidas:
        1,

      totalAtividadesConsideradas:
        1,

      mediaAnteriorPercentual:
        null,

      mediaRecentePercentual:
        null,

      quedaDesempenhoPercentual:
        null,
    },
  };

  /*
   * Simulamos uma mudança acadêmica real:
   *
   * 1 atividade vencida → 2
   *
   * Como consequência, o componente
   * PENDÊNCIAS passa de 5 para 10 pontos.
   */
  const estadoAlterado = {
    ...estadoInicial,

    analise: {
      ...estadoInicial.analise,

      pontuacao:
        50,

      pontuacaoBruta:
        10,

      componentes:
        estadoInicial
          .analise
          .componentes
          .map(
            (
              componente
            ) =>
              componente.codigo ===
              "PENDENCIAS"
                ? {
                  ...componente,

                  pontos:
                    10,
                }
                : componente
          ),

      fatoresPrincipais: [
        {
          codigo:
            "PENDENCIAS",

          pontos:
            10,

          maximo:
            20,

          disponivel:
            true,
        },
      ],
    },

    indicadores: {
      ...estadoInicial.indicadores,

      atividadesVencidas:
        2,

      totalAtividadesConsideradas:
        2,
    },
  };

  try {
    console.log(
      "\n--- 1ª EXECUÇÃO: ESTADO INICIAL ---"
    );

    const primeira =
      await registrarAnaliseHistorica(
        estadoInicial
      );

    console.log(
      primeira
    );

    console.log(
      "\n--- 2ª EXECUÇÃO: ESTADO INICIAL IDÊNTICO ---"
    );

    const segunda =
      await registrarAnaliseHistorica(
        estadoInicial
      );

    console.log(
      segunda
    );

    console.log(
      "\n--- 3ª EXECUÇÃO: ESTADO ACADÊMICO ALTERADO ---"
    );

    const terceira =
      await registrarAnaliseHistorica(
        estadoAlterado
      );

    console.log(
      terceira
    );

    console.log(
      "\n--- 4ª EXECUÇÃO: NOVO ESTADO IDÊNTICO ---"
    );

    const quarta =
      await registrarAnaliseHistorica(
        estadoAlterado
      );

    console.log(
      quarta
    );

    if (
      primeira.gravou !==
      true
    ) {
      throw new Error(
        "A primeira fotografia deveria ser gravada."
      );
    }

    if (
      segunda.gravou !==
        false ||
      segunda.motivo !==
        "ESTADO_SEM_ALTERACAO"
    ) {
      throw new Error(
        "A fotografia inicial duplicada deveria ser ignorada."
      );
    }

    if (
      terceira.gravou !==
      true
    ) {
      throw new Error(
        "O estado acadêmico alterado deveria gerar nova fotografia."
      );
    }

    if (
      quarta.gravou !==
        false ||
      quarta.motivo !==
        "ESTADO_SEM_ALTERACAO"
    ) {
      throw new Error(
        "A repetição do novo estado deveria ser ignorada."
      );
    }

    const registros =
      await prisma
        .studentSuccessAnaliseHistorico
        .findMany({
          where: {
            alunoId:
              aluno.id,

            versaoMotor:
              VERSAO_TESTE,
          },

          orderBy: {
            analisadoEm:
              "asc",
          },

          select: {
            id:
              true,

            nivelRisco:
              true,

            pontuacaoRisco:
              true,

            pontuacaoBruta:
              true,

            coberturaPercentual:
              true,

            indicadores:
              true,

            analisadoEm:
              true,
          },
        });

    console.log(
      "\n--- FOTOGRAFIAS REALMENTE GRAVADAS ---"
    );

    console.dir(
      registros,
      {
        depth:
          null,
      }
    );

    console.log(
      "\nQuantidade final:",
      registros.length
    );

    if (
      registros.length !==
      2
    ) {
      throw new Error(
        `Esperado 2 registros, encontrado ${registros.length}.`
      );
    }

    console.log(
      "\n✅ MUDANÇA DE ESTADO DETECTADA CORRETAMENTE."
    );

    console.log(
      "✅ DUPLICATAS CONSECUTIVAS IGNORADAS."
    );
  }
  finally {
    const limpeza =
      await prisma
        .studentSuccessAnaliseHistorico
        .deleteMany({
          where: {
            alunoId:
              aluno.id,

            versaoMotor:
              VERSAO_TESTE,
          },
        });

    console.log(
      "\nRegistros de teste removidos:",
      limpeza.count
    );
  }
}

async function executarTeste() {
  try {
    await main();
  }
  catch (error) {
    console.error(
      "\n❌ TESTE FALHOU"
    );

    console.error(
      error
    );

    throw error;
  }
  finally {
    await prisma.$disconnect();
  }
}

void executarTeste();