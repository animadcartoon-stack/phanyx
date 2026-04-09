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

    const atividade = await prisma.atividade.update({
      where: { id: atividadeId },
      data: {
        status: "ENCERRADA",
      } as any,
    });

    return NextResponse.json(atividade);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao encerrar atividade" },
      { status: 401 }
    );
  }
}