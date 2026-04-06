import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  const user = await getUserFromToken();

  if (!user || user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const professor = await prisma.professor.findUnique({
    where: { userId: user.id },
  });

  if (!professor) {
    return NextResponse.json(
      { error: "Professor não encontrado" },
      { status: 404 }
    );
  }

  const disciplinas = await prisma.disciplina.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      professorId: professor.id,
    },
    orderBy: {
      nome: "asc",
    },
    select: {
      id: true,
      nome: true,
      descricao: true,
    },
  });

  return NextResponse.json(disciplinas);
}