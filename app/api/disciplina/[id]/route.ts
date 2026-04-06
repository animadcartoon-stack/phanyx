import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const disciplina = await prisma.disciplina.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
        turmas: {
          include: {
            professor: true,
            _count: {
              select: {
                aulas: true,
                matriculas: true,
              },
            },
          },
        },
      },
    });

    if (!disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(disciplina);
  } catch (error: any) {
    console.error("ERRO API DISCIPLINA GET:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar disciplina" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    const disciplinaExistente = await prisma.disciplina.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!disciplinaExistente) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }

    let cursoIdFinal: number | null = null;

    if (body.cursoId) {
      const curso = await prisma.curso.findFirst({
        where: {
          id: Number(body.cursoId),
          instituicaoId: user.instituicaoId,
        },
      });

      if (!curso) {
        return NextResponse.json(
          { error: "Curso inválido para esta instituição" },
          { status: 400 }
        );
      }

      cursoIdFinal = curso.id;
    }

    const disciplinaAtualizada = await prisma.disciplina.update({
      where: { id },
      data: {
        nome: String(body.nome ?? disciplinaExistente.nome).trim(),
        codigo: body.codigo ?? null,
        descricao: body.descricao ?? null,
        cargaHoraria:
          body.cargaHoraria !== null && body.cargaHoraria !== undefined
            ? Number(body.cargaHoraria)
            : null,
        semestre:
          body.semestre !== null && body.semestre !== undefined
            ? Number(body.semestre)
            : null,
        cursoId: cursoIdFinal,
      },
      include: {
        curso: true,
      },
    });

    return NextResponse.json(disciplinaAtualizada);
  } catch (error: any) {
    console.error("ERRO API DISCIPLINA PUT:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar disciplina" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const disciplina = await prisma.disciplina.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        turmas: {
          select: { id: true },
        },
      },
    });

    if (!disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }

    if (disciplina.turmas.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir a disciplina porque ela possui turmas vinculadas.",
        },
        { status: 400 }
      );
    }

    await prisma.disciplina.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("ERRO API DISCIPLINA DELETE:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir disciplina" },
      { status: 500 }
    );
  }
}