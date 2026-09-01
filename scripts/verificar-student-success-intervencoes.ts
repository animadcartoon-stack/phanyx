import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows =
    await prisma.studentSuccessIntervencao.findMany({
      orderBy: {
        criadoEm: "desc",
      },

      take: 10,

      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            matricula: true,
          },
        },

        criadoPor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

  console.log(
    JSON.stringify(
      rows,
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
