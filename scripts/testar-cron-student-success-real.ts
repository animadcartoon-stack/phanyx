import {
  OrigemAnaliseStudentSuccess,
  StatusAtividade,
} from "@prisma/client";

import {
  prisma,
} from "../lib/prisma";

const instituicaoId =
  1;

const turmaId =
  7;

const tituloTeste =
  "TESTE TEMPORARIO CRON REAL STUDENT SUCCESS";

async function executar() {
  let atividadeTesteId:
    number | null =
    null;

  const inicioTeste =
    new Date();

  try {
    const atividade =
      await prisma.atividade.create({
        data: {
          instituicaoId,

          turmaId,

          disciplinaId:
            null,

          titulo:
            tituloTeste,

          descricao:
            "Atividade temporária para validar a execução real do cron do Student Success.",

          prazo:
            new Date(
              Date.now() -
                60 *
                  60 *
                  1000
            ),

          status:
            StatusAtividade.PUBLICADA,

          publicadaAt:
            new Date(),
        },

        select: {
          id:
            true,

          instituicaoId:
            true,

          turmaId:
            true,

          status:
            true,

          prazo:
            true,
        },
      });

    atividadeTesteId =
      atividade.id;

    console.log(
      "\n=== ATIVIDADE TEMPORÁRIA CRIADA ==="
    );

    console.log(
      atividade
    );

    console.log(
      "\n=== INÍCIO DO TESTE ==="
    );

    console.log(
      inicioTeste
    );

    console.log(
      "\nAgora execute o cron REAL no outro terminal."
    );

    console.log(
      "\nDepois volte aqui e pressione ENTER para inspecionar e limpar."
    );

    await new Promise<void>(
      (
        resolve
      ) => {
        process.stdin.once(
          "data",
          () =>
            resolve()
        );
      }
    );

    /*
     * Localizamos somente fotografias
     * AUTOMATICAS criadas depois do início
     * deste teste e pertencentes à instituição.
     */
    const analisesCriadas =
      await prisma.studentSuccessAnaliseHistorico.findMany({
        where: {
          instituicaoId,

          origem:
            OrigemAnaliseStudentSuccess.AUTOMATICA,

          analisadoEm: {
            gte:
              inicioTeste,
          },
        },

        select: {
          id:
            true,

          alunoId:
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

        orderBy: {
          id:
            "asc",
        },
      });

    console.log(
      "\n=== FOTOGRAFIAS AUTOMÁTICAS CRIADAS ==="
    );

    console.log(
      analisesCriadas
    );

    if (
      analisesCriadas.length >
      0
    ) {
      const ids =
        analisesCriadas.map(
          (
            item
          ) =>
            item.id
        );

      const limpezaAnalises =
        await prisma.studentSuccessAnaliseHistorico.deleteMany({
          where: {
            instituicaoId,

            id: {
              in:
                ids,
            },
          },
        });

      console.log(
        "\nFotografias automáticas de teste removidas:",
        limpezaAnalises.count
      );
    }
    else {
      console.log(
        "\nFotografias automáticas de teste removidas:",
        0
      );
    }
  }
  finally {
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