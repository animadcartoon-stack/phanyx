const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@formax.com";
  const senhaHash = await bcrypt.hash("123456", 10);

  const existente = await prisma.user.findUnique({
    where: { email },
  });

  if (existente) {
    await prisma.user.update({
      where: { email },
      data: {
        nome: "Admin FORMAX",
        senha: senhaHash,
        role: "ADMIN",
        instituicaoId: 1,
        ativo: true,
      },
    });

    console.log("Admin atualizado com sucesso.");
  } else {
    await prisma.user.create({
      data: {
        nome: "Admin FORMAX",
        email,
        senha: senhaHash,
        role: "ADMIN",
        instituicaoId: 1,
        ativo: true,
      },
    });

    console.log("Admin criado com sucesso.");
  }
}

main()
  .catch((e) => {
    console.error("Erro ao resetar admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });