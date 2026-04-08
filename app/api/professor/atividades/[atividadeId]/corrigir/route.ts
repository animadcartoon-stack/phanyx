import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";

export async function POST(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    const body = await req.json();

    const { alunoId, nota, feedback } = body;

    if (!alunoId) {
      return NextResponse.json(
        { error: "Aluno não informado" },
        { status: 400 }
      );
    }

    const entrega = await prisma.entregaAtividade.findFirst({
      where: {
        atividadeId,
        alunoId,
        instituicaoId: auth.instituicaoId,
      },
    });

    if (!entrega) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      );
    }

    const atualizada = await prisma.entregaAtividade.update({
      where: {
        id: entrega.id,
      },
      data: {
        nota: nota ?? null,
        feedback: feedback ?? null,
        corrigidaEm: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      entrega: atualizada,
    });
  } catch (e: any) {
    console.error("ERRO AO CORRIGIR:", e);

    return NextResponse.json(
      { error: e.message || "Erro ao corrigir" },
      { status: 500 }
    );
  }
}