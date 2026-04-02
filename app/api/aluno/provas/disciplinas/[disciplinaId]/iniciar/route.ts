import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(_req: Request, { params }: { params: { disciplinaId: string } }) {
  const user = getUserFromToken();
  if (!user || user.role !== "aluno") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const disciplinaId = Number(params.disciplinaId);
  if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
    return NextResponse.json({ error: "disciplinaId inválido" }, { status: 400 });
  }

  const aluno = await prisma.aluno.findFirst({
    where: { userId: user.id, instituicaoId: user.instituicaoId },
    select: { id: true },
  });
  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  // matrícula obrigatória
  const matriculado = await prisma.matricula.findFirst({
    where: {
      alunoId: aluno.id,
      turma: { disciplinaId, instituicaoId: user.instituicaoId },
    },
    select: { id: true },
  });
  if (!matriculado) {
    return NextResponse.json({ error: "Aluno não matriculado na disciplina" }, { status: 403 });
  }

  // pega a prova ativa da disciplina
  const prova = await prisma.prova.findFirst({
    where: {
      disciplinaId,
      ativa: true,
      disciplina: { instituicaoId: user.instituicaoId },
    },
    include: {
      questoes: {
        include: {
          alternativas: true,
        },
      },
    },
  });

  if (!prova) {
    return NextResponse.json({ error: "Prova ainda não disponível" }, { status: 404 });
  }

  const tentativa = await prisma.tentativaProva.create({
    data: { alunoId: aluno.id, provaId: prova.id },
  });

  return NextResponse.json({ tentativaId: tentativa.id, prova });
}