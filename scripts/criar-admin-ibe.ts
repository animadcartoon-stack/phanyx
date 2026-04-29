import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "ibe.polosj@gmail.com";
  const senha = "123456"; // depois troque no primeiro acesso

  const instituicao = await prisma.instituicao.upsert({
    where: {
      slug: "ibe",
    },
    update: {
      nome: "Instituto Batista de Educação",
      plano: "ENTERPRISE",
    },
    create: {
      nome: "Instituto Batista de Educação",
      slug: "ibe",
      plano: "ENTERPRISE",
      updatedAt: new Date(),
    },
  });

  const senhaHash = await bcrypt.hash(senha, 10);

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      nome: "Administrador IBE",
      role: "ADMIN",
      instituicaoId: instituicao.id,
      senha: senhaHash,
      precisaTrocarSenha: true,
    },
    create: {
      nome: "Administrador IBE",
      email,
      senha: senhaHash,
      role: "ADMIN",
      instituicaoId: instituicao.id,
      precisaTrocarSenha: true,
    },
  });

  console.log("✅ Acesso IBE criado/atualizado:");
  console.log({
    instituicaoId: instituicao.id,
    userId: user.id,
    email,
    senhaTemporaria: senha,
  });
}

main()
  .catch((error) => {
    console.error("❌ Erro ao criar admin IBE:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });