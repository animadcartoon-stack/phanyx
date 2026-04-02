import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const matricula = await prisma.matricula.findFirst({
      where: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      alunoId: aluno.id,
      status: matricula?.status ?? null,
      acessoAulasLiberado: matricula?.status === "ATIVA",
    });
  } catch (error) {
    console.error("Erro ao buscar status da matrícula:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status da matrícula" },
      { status: 500 }
    );
  }
}