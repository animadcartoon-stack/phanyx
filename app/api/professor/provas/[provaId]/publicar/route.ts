import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";

export async function POST(
  _req: NextRequest,
  ctx: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "PROFESSOR" && user.role !== "professor")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const provaId = Number(ctx.params.provaId);

    if (!Number.isFinite(provaId) || provaId <= 0) {
      return NextResponse.json({ error: "Prova inválida" }, { status: 400 });
    }

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: professor.id,
      instituicaoId: user.instituicaoId,
    });

    if (!prova) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    if (prova.ativa === true) {
      return NextResponse.json(
        { error: "A prova já está publicada" },
        { status: 400 }
      );
    }

    const qtdQuestoes = await prisma.questao.count({
      where: {
        provaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (qtdQuestoes === 0) {
      return NextResponse.json(
        { error: "Adicione ao menos 1 questão antes de publicar" },
        { status: 400 }
      );
    }

    const updated = await prisma.prova.update({
      where: { id: provaId },
      data: {
        ativa: true,
      },
      include: {
        turma: {
          include: {
            disciplina: true,
          },
        },
        questoes: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updated,
      totalQuestoes: updated.questoes.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao publicar prova" },
      { status: 500 }
    );
  }
}