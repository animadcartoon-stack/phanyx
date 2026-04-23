import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const senhaHash = await bcrypt.hash("123456", 10);

  // =========================
  // INSTITUIÇÃO
  // =========================
  const instituicao =
    (await prisma.instituicao.findFirst({
      where: { nome: "IBE" },
    })) ??
    (await prisma.instituicao.create({
      data: {
        nome: "IBE",
        slug: "ibe",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));

  const instituicaoId = instituicao.id;

  // =========================
  // ADMIN
  // =========================
  const admin =
    (await prisma.user.findUnique({
      where: { email: "admin@ibe.com" },
    })) ??
    (await prisma.user.create({
      data: {
        nome: "Administrador",
        email: "admin@ibe.com",
        senha: senhaHash,
        role: "ADMIN",
        instituicaoId,
      },
    }));

  // evita warning de variável não usada
  void admin;

  // =========================
  // PROFESSOR (User + Professor)
  // =========================
  const professorUser =
    (await prisma.user.findUnique({
      where: { email: "prof@ibe.com" },
    })) ??
    (await prisma.user.create({
      data: {
        nome: "Professor Marcos",
        email: "prof@ibe.com",
        senha: senhaHash,
        role: "PROFESSOR",
        instituicaoId,
      },
    }));

  const professor =
    (await prisma.professor.findUnique({
      where: { userId: professorUser.id },
    })) ??
    (await prisma.professor.create({
      data: {
        nome: "Professor Marcos",
        instituicaoId,
        userId: professorUser.id,
      },
    }));

  // =========================
  // ALUNO (User + Aluno)
  // =========================
  const alunoUser =
    (await prisma.user.findUnique({
      where: { email: "aluno@ibe.com" },
    })) ??
    (await prisma.user.create({
      data: {
        nome: "Aluno Teste",
        email: "aluno@ibe.com",
        senha: senhaHash,
        role: "ALUNO",
        instituicaoId,
      },
    }));

  const aluno =
    (await prisma.aluno.findUnique({
      where: { userId: alunoUser.id },
    })) ??
    (await prisma.aluno.create({
      data: {
        nome: "Aluno Teste",
        instituicaoId,
        userId: alunoUser.id,
      },
    }));

  // =========================
  // CURSO
  // =========================
  const curso =
    (await prisma.curso.findFirst({
      where: {
        nome: "Bacharel Livre em Teologia",
        instituicaoId,
      },
    })) ??
    (await prisma.curso.create({
      data: {
        nome: "Bacharel Livre em Teologia",
        instituicaoId,
        ativo: true,
      },
    }));

  // =========================
  // DISCIPLINA
  // =========================
  const disciplina =
    (await prisma.disciplina.findFirst({
      where: {
        nome: "Direito Constitucional",
        instituicaoId,
      },
    })) ??
    (await prisma.disciplina.create({
      data: {
        nome: "Direito Constitucional",
        instituicaoId,
        cursoId: curso.id,
      },
    }));

  // =========================
  // TURMA
  // =========================
  const turma =
    (await prisma.turma.findFirst({
      where: {
        instituicaoId,
        professorId: professor.id,
        nome: "Turma A",
        semestre: "2025.1",
      },
    })) ??
    (await prisma.turma.create({
      data: {
        nome: "Turma A",
        semestre: "2025.1",
        professorId: professor.id,
        instituicaoId,
      },
    }));

  // =========================
  // VÍNCULO TURMA <-> DISCIPLINA
  // =========================
  const turmaDisciplinaExistente = await prisma.turmaDisciplina.findFirst({
    where: {
      turmaId: turma.id,
      disciplinaId: disciplina.id,
    },
  });

  if (!turmaDisciplinaExistente) {
    await prisma.turmaDisciplina.create({
      data: {
        turmaId: turma.id,
        disciplinaId: disciplina.id,
        instituicaoId,
      },
    });

    console.log("✅ Vínculo turma-disciplina criado.");
  } else {
    console.log("ℹ️ Vínculo turma-disciplina já existe.");
  }

  // =========================
  // MATRÍCULA (por cursoId)
  // =========================
  const matriculaExistente = await prisma.matricula.findFirst({
    where: {
      alunoId: aluno.id,
      cursoId: curso.id,
    },
  });

  if (!matriculaExistente) {
    await prisma.matricula.create({
      data: {
        instituicaoId,
        alunoId: aluno.id,
        cursoId: curso.id,
      },
    });

    console.log("✅ Matrícula criada.");
  } else {
    console.log("ℹ️ Matrícula já existe.");
  }

  console.log("🎉 Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });