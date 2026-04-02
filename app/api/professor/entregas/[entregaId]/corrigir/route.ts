import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { corrigirEntregaSchema } from "@/lib/validators/atividade";

export async function PATCH(
  req: NextRequest,
  ctx: { params: { entregaId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const entregaId = Number(ctx.params.entregaId);

    const entrega: any = await prisma.entregaAtividade.findFirst({
      where: {
        id: entregaId,
        atividade: {
          instituicaoId: auth.instituicaoId,
          disciplina: {
            professorId: auth.professorId!,
          },
        },
      },
      include: {
        atividade: true,
      },
    });

    if (!entrega) {
      return NextResponse.json(
        { error: "Entrega não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const parsed = corrigirEntregaSchema.safeParse({
      nota:
        body.nota !== undefined && body.nota !== null && body.nota !== ""
          ? Number(body.nota)
          : undefined,
      feedback: body.feedback ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.nota > Number(entrega.atividade?.notaMaxima || 10)) {
      return NextResponse.json(
        { error: "Nota não pode ser maior que a nota máxima da atividade" },
        { status: 400 }
      );
    }

    const updated = await prisma.entregaAtividade.update({
      where: {
        id: entregaId,
      },
      data: {
        nota: parsed.data.nota,
        feedback: parsed.data.feedback || null,
        corrigidaEm: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao corrigir entrega" },
      { status: 401 }
    );
  }
}