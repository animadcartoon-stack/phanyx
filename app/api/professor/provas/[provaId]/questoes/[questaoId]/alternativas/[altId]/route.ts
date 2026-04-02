import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";
import { createAlternativaSchema } from "@/lib/validators/prova";

export async function PATCH(
  req: NextRequest,
  ctx: { params: { provaId: string; questaoId: string; altId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const provaId = Number(ctx.params.provaId);
    const questaoId = Number(ctx.params.questaoId);
    const altId = Number(ctx.params.altId);

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    if (prova.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só pode editar alternativas em RASCUNHO" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = createAlternativaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { texto, correta } = parsed.data;

    const alternativa = await prisma.alternativa.findFirst({
      where: {
        id: altId,
        questaoId,
      },
    });

    if (!alternativa) {
      return NextResponse.json(
        { error: "Alternativa não encontrada" },
        { status: 404 }
      );
    }

    if (correta === true) {
      await prisma.alternativa.updateMany({
        where: { questaoId },
        data: { correta: false },
      });
    }

    const updated = await prisma.alternativa.update({
      where: { id: altId },
      data: {
        texto,
        correta: correta ?? alternativa.correta,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { provaId: string; questaoId: string; altId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const provaId = Number(ctx.params.provaId);
    const questaoId = Number(ctx.params.questaoId);
    const altId = Number(ctx.params.altId);

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    if (prova.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só pode remover alternativas em RASCUNHO" },
        { status: 400 }
      );
    }

    const alternativa = await prisma.alternativa.findFirst({
      where: {
        id: altId,
        questaoId,
      },
    });

    if (!alternativa) {
      return NextResponse.json(
        { error: "Alternativa não encontrada" },
        { status: 404 }
      );
    }

    await prisma.alternativa.delete({
      where: { id: altId },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}