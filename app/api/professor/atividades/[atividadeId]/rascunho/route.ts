import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { atividadePertenceAoProfessor } from "@/lib/services/atividadeProfessor.service";

export async function POST(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    await atividadePertenceAoProfessor({
      atividadeId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    const atividadeAtual = await prisma.atividade.findUnique({
      where: { id: atividadeId },
      include: {
        entregas: true,
      },
    });

    if (!atividadeAtual) {
      return NextResponse.json(
        { error: "Atividade não encontrada" },
        { status: 404 }
      );
    }

    if (atividadeAtual.entregas && atividadeAtual.entregas.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível voltar para rascunho porque já existem entregas de alunos.",
        },
        { status: 400 }
      );
    }

    const atividade = await prisma.atividade.update({
      where: { id: atividadeId },
      data: {
        status: "RASCUNHO",
      } as any,
    });

    return NextResponse.json(atividade);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao voltar atividade para rascunho" },
      { status: 401 }
    );
  }
}