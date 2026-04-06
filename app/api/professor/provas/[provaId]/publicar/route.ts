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

    const professor = await prisma.professor.findUnique({
      where: { userId: user.id },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const provaId = Number(ctx.params.provaId);

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: professor.id,
      instituicaoId: user.instituicaoId,
    });

    if (prova.ativa === true) {
      return NextResponse.json(
        { error: "A prova já está publicada" },
        { status: 400 }
      );
    }

    const qtdQuestoes = await prisma.questao.count({
      where: { provaId },
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
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao publicar prova" },
      { status: 500 }
    );
  }
}