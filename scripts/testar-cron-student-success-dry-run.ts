import {
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
  "TESTE TEMPORARIO CRON STUDENT SUCCESS";

async function executar() {
  let atividadeTesteId:
    number | null =
    null;

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
            "Atividade temporária para testar detecção do cron do Student Success.",

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
      "\nAgora mantenha este terminal aberto e execute o dryRun do cron em outro terminal."
    );

    console.log(
      "\nDepois pressione ENTER aqui para limpar a atividade."
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
  }
  finally {
    if (
      atividadeTesteId !==
      null
    ) {
      const limpeza =
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
        "\nAtividades de teste removidas:",
        limpeza.count
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