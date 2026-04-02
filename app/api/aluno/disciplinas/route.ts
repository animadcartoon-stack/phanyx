import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: { userId: user.id },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const matriculas = await prisma.matricula.findMany({
      where: { alunoId: aluno.id },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(matriculas);
  } catch (error: any) {
    console.error("Erro ao buscar disciplinas do aluno:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao buscar disciplinas do aluno" },
      { status: 500 }
    );
  }
}