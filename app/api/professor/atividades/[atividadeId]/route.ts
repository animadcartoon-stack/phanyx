import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { updateAtividadeSchema } from "@/lib/validators/atividade";
import { atividadePertenceAoProfessor } from "@/lib/services/atividadeProfessor.service";

export async function GET(
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

    const atividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
      },
      include: {
        disciplina: true,
        turma: true,
        entregas: {
          include: {
            aluno: true,
          },
          orderBy: {
            entregueEm: "desc",
          } as any,
        },
      },
    });

    if (!atividade) {
      return NextResponse.json(
        { error: "Atividade não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(atividade);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao buscar atividade" },
      { status: 401 }
    );
  }
}

export async function PATCH(
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
        { error: "Só é permitido editar atividade em RASCUNHO" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const parsed = updateAtividadeSchema.safeParse({
      ...body,
      turmaId:
        body.turmaId === null
          ? null
          : body.turmaId !== undefined && body.turmaId !== ""
          ? Number(body.turmaId)
          : undefined,
      notaMaxima:
        body.notaMaxima !== undefined && body.notaMaxima !== ""
          ? Number(body.notaMaxima)
          : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.atividade.update({
      where: { id: atividadeId },
      data: {
        titulo:
          parsed.data.titulo !== undefined
            ? parsed.data.titulo
            : atividade.titulo,
        descricao:
          parsed.data.descricao !== undefined
            ? parsed.data.descricao || null
            : atividade.descricao,
        prazo:
          parsed.data.prazo !== undefined
            ? parsed.data.prazo
              ? new Date(parsed.data.prazo)
              : null
            : atividade.prazo,
        notaMaxima:
          parsed.data.notaMaxima !== undefined
            ? parsed.data.notaMaxima
            : atividade.notaMaxima,
        turmaId:
          parsed.data.turmaId !== undefined
            ? parsed.data.turmaId
            : atividade.turmaId,
      } as any,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao atualizar atividade" },
      { status: 401 }
    );
  }
}

export async function DELETE(
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
        { error: "Só é permitido excluir atividade em RASCUNHO" },
        { status: 400 }
      );
    }

    await prisma.atividade.delete({
      where: { id: atividadeId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao excluir atividade" },
      { status: 401 }
    );
  }
}