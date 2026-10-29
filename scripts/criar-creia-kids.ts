import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--executar") {
    console.log("Modo seguro: nenhuma alteracao realizada.");
    console.log("O provisionamento exige --executar e configuracao explicita.");
    return;
  }

  const email = process.env.CREIA_KIDS_ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.CREIA_KIDS_ADMIN_PASSWORD;

  if (process.env.CREIA_KIDS_CONFIRMAR !== "CRIAR_ADMIN_CREIA_KIDS") {
    throw new Error("Provisionamento nao autorizado.");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Informe CREIA_KIDS_ADMIN_EMAIL valido.");
  }

  if (!senha || senha.length < 16) {
    throw new Error("CREIA_KIDS_ADMIN_PASSWORD deve ter ao menos 16 caracteres.");
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  const resultado = await prisma.$transaction(async (tx) => {
    const existente = await tx.instituicao.findUnique({
      where: { slug: "creia-kids" },
      select: { id: true, nome: true },
    });

    const usuarioExistente = await tx.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (usuarioExistente) {
      throw new Error(
        "O email informado ja possui uma conta. Nenhuma senha foi alterada."
      );
    }

    if (existente) {
      const administrador = await tx.user.findFirst({
        where: {
          instituicaoId: existente.id,
          role: Role.ADMIN,
        },
        select: { id: true },
      });

      if (administrador) {
        throw new Error(
          "CREIA Kids ja possui administrador. Nenhuma conta foi criada."
        );
      }
    }

    const instituicao = existente ?? await tx.instituicao.create({
      data: {
        nome: "Creia Kids",
        slug: "creia-kids",
        ativo: true,
        plano: "PREMIUM",
        statusAssinatura: "ATIVA",
        isentaPagamento: true,
        motivoIsencao:
          "Instituicao parceira autorizada a usar o PHANYX sem cobranca.",
        updatedAt: new Date(),
      },
    });

    await tx.user.create({
      data: {
        nome: "Administrador Creia Kids",
        email,
        senha: senhaHash,
        role: Role.ADMIN,
        ativo: true,
        instituicaoId: instituicao.id,
        precisaTrocarSenha: true,
      },
    });

    return { instituicaoId: instituicao.id };
  });

  console.log("Provisionamento concluido.");
  console.log("Instituicao ID:", resultado.instituicaoId);
  console.log("O administrador devera trocar a senha no primeiro acesso.");
  // A senha nunca deve ser impressa em logs.
}

main()
  .catch((error) => {
    console.error("Provisionamento interrompido:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
