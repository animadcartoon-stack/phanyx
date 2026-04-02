import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // aluno
    const aluno = await prisma.aluno.findFirst({
      where: { userId: user.id },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // matrícula + disciplinas
    const matricula = await prisma.matricula.findFirst({
      where: { alunoId: aluno.id },
      include: {
        curso: {
          include: {
            disciplinas: true, // usa seu relacionamento existente
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      curso: matricula?.curso,
      disciplinas: matricula?.curso?.disciplinas || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar aulas" },
      { status: 500 }
    );
  }
}