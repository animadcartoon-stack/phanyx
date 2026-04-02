import { NextRequest, NextResponse } from "next/server";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";

export async function POST(
  req: NextRequest,
  ctx: { params: { provaId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const provaId = Number(ctx.params.provaId);

    await provaPertenceAoProfessor({
      provaId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    return NextResponse.json(
      { error: "Reordenação de questões ainda não suportada no schema atual" },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao reordenar questões" },
      { status: 401 }
    );
  }
}