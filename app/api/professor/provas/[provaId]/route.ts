import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  { params }: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "PROFESSOR" && user.role !== "professor")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const provaId = Number(params.provaId);

    if (!Number.isFinite(provaId) || provaId <= 0) {
      return NextResponse.json({ error: "Prova inválida" }, { status: 400 });
    }

    const prova = await prisma.prova.findFirst({
      where: {
        id: provaId,
        instituicaoId: user.instituicaoId,
        turma: {
          professorId: professor.id,
        },
      },
      include: {
        turma: {
          include: {
            disciplina: true,
          },
        },
        questoes: {
          orderBy: { ordem: "asc" },
          include: {
            alternativas: {
              orderBy: { ordem: "asc" },
            },
          },
        },
      },
    });

    if (!prova) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(prova);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao buscar prova" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "PROFESSOR" && user.role !== "professor")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const provaId = Number(params.provaId);

    if (!Number.isFinite(provaId) || provaId <= 0) {
      return NextResponse.json({ error: "Prova inválida" }, { status: 400 });
    }

    const body = await req.json();

    const provaExistente = await prisma.prova.findFirst({
      where: {
        id: provaId,
        instituicaoId: user.instituicaoId,
        turma: {
          professorId: professor.id,
        },
      },
    });

    if (!provaExistente) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    let turmaIdFinal = provaExistente.turmaId;

    if (body.turmaId !== undefined) {
      if (!body.turmaId) {
        return NextResponse.json(
          { error: "A prova precisa continuar vinculada a uma turma" },
          { status: 400 }
        );
      }

      const turmaValida = await prisma.turma.findFirst({
        where: {
          id: Number(body.turmaId),
          instituicaoId: user.instituicaoId,
          professorId: professor.id,
        },
      });

      if (!turmaValida) {
        return NextResponse.json(
          { error: "Turma inválida para este professor" },
          { status: 403 }
        );
      }

      turmaIdFinal = Number(body.turmaId);
    }

    const provaAtualizada = await prisma.prova.update({
      where: { id: provaId },
      data: {
        titulo: body.titulo ?? provaExistente.titulo,
        descricao:
          body.descricao !== undefined
            ? body.descricao || null
            : provaExistente.descricao,
        notaMaxima:
          body.notaMaxima !== undefined
            ? Number(body.notaMaxima)
            : provaExistente.notaMaxima,
        tempoMin:
          body.tempoMin !== undefined
            ? body.tempoMin
              ? Number(body.tempoMin)
              : null
            : provaExistente.tempoMin,
        tentativasMax:
          body.tentativasMax !== undefined
            ? Number(body.tentativasMax)
            : provaExistente.tentativasMax,
        disponivelEm:
          body.disponivelEm !== undefined
            ? body.disponivelEm
              ? new Date(body.disponivelEm)
              : null
            : provaExistente.disponivelEm,
        expiraEm:
          body.expiraEm !== undefined
            ? body.expiraEm
              ? new Date(body.expiraEm)
              : null
            : provaExistente.expiraEm,
        turmaId: turmaIdFinal,
      },
      include: {
        turma: {
          include: {
            disciplina: true,
          },
        },
        questoes: {
          orderBy: { ordem: "asc" },
          include: {
            alternativas: {
              orderBy: { ordem: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(provaAtualizada);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao atualizar prova" },
      { status: 500 }
    );
  }
}