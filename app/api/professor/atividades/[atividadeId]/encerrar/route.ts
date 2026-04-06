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

    if (atividade.status === "ENCERRADA") {
      return NextResponse.json(
        { error: "Atividade já está encerrada" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Endpoint de encerrar atividade preparado",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao encerrar atividade" },
      { status: 401 }
    );
  }
}