const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const masters = await prisma.user.findMany({
    where: {
      isMasterAdmin: true,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      isMasterAdmin: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log("\n=== USUÁRIOS MASTER ===");
  console.table(masters);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
