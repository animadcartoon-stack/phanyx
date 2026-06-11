import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "ministerioinfantilcreia@gmail.com";
  const senhaPadrao = "creia123";

  const senhaHash = await bcrypt.hash(senhaPadrao, 10);

  const instituicao = await prisma.instituicao.upsert({
    where: {
      slug: "creia-kids",
    },
    update: {
      nome: "Creia Kids",
      ativo: true,
      plano: "PREMIUM",
      statusAssinatura: "ATIVA",
      isentaPagamento: true,
      motivoIsencao: "Instituição parceira autorizada a usar o PHANYX sem cobrança.",
      updatedAt: new Date(),
    },
    create: {
      nome: "Creia Kids",
      slug: "creia-kids",
      ativo: true,
      plano: "PREMIUM",
      statusAssinatura: "ATIVA",
      isentaPagamento: true,
      motivoIsencao: "Instituição parceira autorizada a usar o PHANYX sem cobrança.",
      updatedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      nome: "Administrador Creia Kids",
      senha: senhaHash,
      role: Role.ADMIN,
      ativo: true,
      instituicaoId: instituicao.id,
      precisaTrocarSenha: true,
    },
    create: {
      nome: "Administrador Creia Kids",
      email,
      senha: senhaHash,
      role: Role.ADMIN,
      ativo: true,
      instituicaoId: instituicao.id,
      precisaTrocarSenha: true,
    },
  });

  console.log("✅ Instituição Creia Kids criada/atualizada com sucesso.");
  console.log("🏫 Instituição:", instituicao.nome);
  console.log("🆔 ID:", instituicao.id);
  console.log("📧 Login:", email);
  console.log("🔑 Senha provisória:", senhaPadrao);
}

main()
  .catch((error) => {
    console.error("❌ Erro ao criar Creia Kids:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });