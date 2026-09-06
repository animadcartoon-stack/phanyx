const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const configs =
    await prisma.configuracaoInstituicao.findMany({
      where: {
        paisCodigo: {
          not: null,
        },
      },
      select: {
        instituicaoId: true,
        paisCodigo: true,
        fusoHorario: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
      orderBy: {
        instituicaoId: "asc",
      },
    });

  console.log(
    JSON.stringify(
      configs,
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
