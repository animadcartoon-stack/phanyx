import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const matricula = await prisma.matricula.findFirst({
      where: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
        itens: {
          include: {
            disciplina: true,
            turma: true,
          },
        },
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
    console.error("Erro ao buscar matrícula do aluno:", error);

    return NextResponse.json(
      { error: "Erro ao buscar matrícula" },
      { status: 500 }
    );
  }
}