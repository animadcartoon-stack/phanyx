import {
  PrismaClient,
} from "@prisma/client";

const prisma =
  new PrismaClient();

async function main() {
  const intervencao =
    await prisma
      .studentSuccessIntervencao
      .findFirst({
        where: {
          alunoId: 2097,
        },

        orderBy: {
          criadoEm:
            "desc",
        },

        include: {
          aluno: {
            select: {
              id:
                true,

              nome:
                true,

              matricula:
                true,
            },
          },

          criadoPor: {
            select: {
              id:
                true,

              nome:
                true,
            },
          },
        },
      });

  console.log(
    JSON.stringify(
      intervencao,
      null,
      2
    )
  );
}

main()
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