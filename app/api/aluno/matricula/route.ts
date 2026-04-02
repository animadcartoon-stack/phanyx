import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 1. pega aluno
    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // 2. pega matrícula + curso
    const matricula = await prisma.matricula.findFirst({
      where: {
        alunoId: aluno.id,
      },
      include: {
        curso: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      aluno,
      matricula,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar matrícula" },
      { status: 500 }
    );
  }
}