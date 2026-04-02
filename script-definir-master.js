const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@formax.com";

  const resultado = await prisma.user.updateMany({
    where: { email },
    data: {
      isMasterAdmin: true,
      precisaTrocarSenha: false,
      ativo: true,
    },
  });

  console.log("Usuários atualizados:", resultado.count);
}

main()
  .catch((error) => {
    console.error("ERRO AO DEFINIR MASTER:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });