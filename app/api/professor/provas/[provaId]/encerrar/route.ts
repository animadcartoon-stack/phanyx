import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";

export async function POST(req: NextRequest, ctx: { params: { provaId: string } }) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const provaId = Number(ctx.params.provaId);
    const prova = await provaPertenceAoProfessor({
      provaId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    if (prova.ativa === false) {
  return NextResponse.json(
    { error: "A prova já está encerrada/inativa" },
    { status: 400 }
  );
}

    const updated = await prisma.prova.update({
  where: { id: provaId },
  data: {
    ativa: false,
  },
});

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}