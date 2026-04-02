import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tentativaId: string }> }
) {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const tentativaId = Number((await params).tentativaId);

    if (!Number.isFinite(tentativaId) || tentativaId <= 0) {
      return NextResponse.json(
        { error: "tentativaId inválido" },
        { status: 400 }
      );
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const tentativa: any = await prisma.tentativaProva.findFirst({
      where: {
        id: tentativaId,
        prova: {
          disciplina: {
            professorId: professor.id,
            instituicaoId: user.instituicaoId,
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
        respostas: {
          include: {
            questao: true,
            alternativa: true,
          },
          orderBy: {
            questaoId: "asc",
          } as any,
        },
      },
    });

    if (!tentativa) {
      return NextResponse.json(
        { error: "Tentativa não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    return NextResponse.json(tentativa);
  } catch (e: any) {
    console.error("ERRO AO BUSCAR TENTATIVA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao buscar tentativa" },
      { status: 500 }
    );
  }
}