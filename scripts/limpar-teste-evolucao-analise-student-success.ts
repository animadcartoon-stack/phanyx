import {
  prisma,
} from "../lib/prisma";

async function executar() {
  const resultado =
    await prisma
      .studentSuccessAnaliseHistorico
      .deleteMany({
        where: {
          alunoId:
            2097,

          assinaturaEstado: {
            startsWith:
              "teste-evolucao-analise-",
          },
        },
      });

  console.log(
    "\n=== LIMPEZA CONCLUÍDA ==="
  );

  console.log(
    `Registros removidos: ${resultado.count}`
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