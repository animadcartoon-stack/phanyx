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

    const atividade: any = await atividadePertenceAoProfessor({
      atividadeId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    if (atividade.status !== "PUBLICADA") {
      return NextResponse.json(
        { error: "Só é permitido voltar para rascunho atividade PUBLICADA" },
        { status: 400 }
      );
    }

    const atualizada = await prisma.atividade.update({
      where: { id: atividadeId },
      data: {
        status: "RASCUNHO",
        publicadaAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Atividade voltou para rascunho com sucesso",
      atividade: atualizada,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao voltar atividade para rascunho" },
      { status: 401 }
    );
  }
}