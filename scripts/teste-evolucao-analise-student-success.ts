import {
  OrigemAnaliseStudentSuccess,
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "../lib/prisma";

function clonarJson(
  valor: unknown
): any {
  return JSON.parse(
    JSON.stringify(
      valor
    )
  );
}

async function executar() {
  const alunoId =
    2097;

  const ultima =
    await prisma
      .studentSuccessAnaliseHistorico
      .findFirst({
        where: {
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
      });

  if (!ultima) {
    throw new Error(
      "Nenhuma análise acadêmica encontrada para o aluno 2097."
    );
  }

  /*
   * Remove somente eventual sobra
   * deste teste específico.
   */
  await prisma
    .studentSuccessAnaliseHistorico
    .deleteMany({
      where: {
        alunoId,

        assinaturaEstado: {
          startsWith:
            "teste-evolucao-analise-",
        },
      },
    });

  const indicadores =
    clonarJson(
      ultima.indicadores
    );

  indicadores.atividadesVencidas =
    2;

  const componentes =
    clonarJson(
      ultima.componentes
    );

  if (
    Array.isArray(
      componentes
    )
  ) {
    const pendencias =
      componentes.find(
        (
          item:
            any
        ) =>
          item?.codigo ===
          "PENDENCIAS"
      );

    if (pendencias) {
      pendencias.pontos =
        10;

      pendencias.detalhe =
        "2 atividades vencidas sem entrega.";
    }
  }

  const fatoresPrincipais =
    clonarJson(
      ultima.fatoresPrincipais
    );

  if (
    Array.isArray(
      fatoresPrincipais
    )
  ) {
    const pendencias =
      fatoresPrincipais.find(
        (
          item:
            any
        ) =>
          item?.codigo ===
          "PENDENCIAS"
      );

    if (pendencias) {
      pendencias.pontos =
        10;

      pendencias.detalhe =
        "2 atividades vencidas sem entrega.";
    }
  }

  const criada =
    await prisma
      .studentSuccessAnaliseHistorico
      .create({
        data: {
          instituicaoId:
            ultima.instituicaoId,

          alunoId:
            ultima.alunoId,

          origem:
            OrigemAnaliseStudentSuccess.MANUAL,

          executadoPorId:
            ultima.executadoPorId,

          versaoMotor:
            ultima.versaoMotor,

          nivelRisco:
            ultima.nivelRisco,

          pontuacaoRisco:
            ultima.pontuacaoRisco,

          pontuacaoBruta:
            10,

          maximoDisponivel:
            ultima.maximoDisponivel,

          coberturaPercentual:
            ultima.coberturaPercentual,

          confiabilidade:
            ultima.confiabilidade,

          componentes:
            componentes ??
            Prisma.JsonNull,

          fatoresPrincipais:
            fatoresPrincipais ??
            Prisma.JsonNull,

          indicadores:
            indicadores ??
            Prisma.JsonNull,

          assinaturaEstado:
            `teste-evolucao-analise-${Date.now()}`,

          analisadoEm:
            new Date(),
        },
      });

  console.log(
    "\n=== FOTOGRAFIA TEMPORÁRIA CRIADA ==="
  );

  console.log(
    `ID: ${criada.id}`
  );

  console.log(
    `Aluno: ${criada.alunoId}`
  );

  console.log(
    "Atividades vencidas: 2"
  );

  console.log(
    "\nNão execute reanálise pela interface ainda."
  );
}

executar()
  .catch(
    (
      error
    ) => {
      console.error(
        error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );