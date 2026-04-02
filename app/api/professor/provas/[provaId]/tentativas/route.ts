import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";

export async function GET(
  req: NextRequest,
  ctx: { params: { provaId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const provaId = Number(ctx.params.provaId);

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    const tentativas = await prisma.tentativaProva.findMany({
      where: {
        provaId: prova.id,
      },
      orderBy: {
  startedAt: "desc",
} as any,
      include: {
        aluno: true,
      },
    });

    return NextResponse.json(tentativas);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}