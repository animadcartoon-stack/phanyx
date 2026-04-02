import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  const user = getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const professor = await prisma.professor.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
  });

  if (!professor) {
    return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
  }

  const tentativas = await prisma.tentativaProva.findMany({
    where: {
      prova: {
        disciplina: {
          professorId: professor.id,
        },
      },
    },
    include: {
      aluno: {
        include: {
          user: true,
        },
      },
      prova: true,
    },
    orderBy: {
      finishedAt: "desc",
    },
  });

  const resultado = tentativas.map((t) => ({
  tentativaId: t.id,
  aluno: t.aluno.user.nome ?? t.aluno.user.email,
  prova: t.prova.titulo,
  nota: t.notaFinal,
  status:
    t.notaFinal == null
      ? "PENDENTE"
      : t.notaFinal >= 7
      ? "APROVADO"
      : "REPROVADO",
}));

  return NextResponse.json(resultado);
}