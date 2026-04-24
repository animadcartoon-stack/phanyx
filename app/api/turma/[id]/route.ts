import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { isAdminLike } from "@/lib/server-auth";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const turmaId = Number(context.params.id);

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        polo: true,
        disciplinas: {
          include: {
            disciplina: {
              include: {
                curso: true,
              },
            },
          },
        },
        _count: {
          select: {
            itensMatricula: true,
          },
        },
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...turma,
      disciplinas: turma.disciplinas.map((item) => item.disciplina),
      curso:
        turma.disciplinas.length > 0
          ? turma.disciplinas[0].disciplina.curso ?? null
          : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar turma" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const turmaId = Number(context.params.id);
    const body = await request.json();

    const turmaExistente = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!turmaExistente) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    const poloId =
      body?.poloId !== undefined &&
      body?.poloId !== null &&
      String(body.poloId).trim() !== ""
        ? Number(body.poloId)
        : null;

    if (poloId !== null) {
      const polo = await prisma.polo.findFirst({
        where: {
          id: poloId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!polo) {
        return NextResponse.json(
          { error: "Polo inválido para esta instituição." },
          { status: 400 }
        );
      }
    }

    const turmaAtualizada = await prisma.turma.update({
      where: { id: turmaId },
      data: {
        nome: body.nome,
        codigo: body.codigo || null,
        semestre: body.semestre,
        periodoLetivo: body.periodoLetivo || null,
        ativa: Boolean(body.ativa),
        statusTurma: body.statusTurma || "AGUARDANDO",
        poloId,
        capacidadeMinima:
          body.capacidadeMinima !== undefined &&
          body.capacidadeMinima !== null &&
          String(body.capacidadeMinima).trim() !== ""
            ? Number(body.capacidadeMinima)
            : null,
        capacidadeMaxima:
          body.capacidadeMaxima !== undefined &&
          body.capacidadeMaxima !== null &&
          String(body.capacidadeMaxima).trim() !== ""
            ? Number(body.capacidadeMaxima)
            : null,
      },
      include: {
        polo: true,
        disciplinas: {
          include: {
            disciplina: {
              include: {
                curso: true,
              },
            },
          },
        },
        _count: {
          select: {
            itensMatricula: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...turmaAtualizada,
      disciplinas: turmaAtualizada.disciplinas.map((item) => item.disciplina),
      curso:
        turmaAtualizada.disciplinas.length > 0
          ? turmaAtualizada.disciplinas[0].disciplina.curso ?? null
          : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar turma" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const turmaId = Number(context.params.id);

    const turmaExistente = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!turmaExistente) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    await prisma.turmaDisciplina.deleteMany({
      where: {
        turmaId,
        instituicaoId: user.instituicaoId,
      },
    });

    await prisma.turma.delete({
      where: { id: turmaId },
    });

    return NextResponse.json({ message: "Turma excluída com sucesso" });
  } catch (error: any) {
    console.error(error);

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir esta turma porque ela já possui vínculos acadêmicos.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao excluir turma" },
      { status: 500 }
    );
  }
}