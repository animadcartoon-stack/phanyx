import { NextRequest, NextResponse } from "next/server";
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

    if (atividade.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só é permitido publicar atividade em RASCUNHO" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Endpoint de publicar atividade preparado",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao publicar atividade" },
      { status: 401 }
    );
  }
}