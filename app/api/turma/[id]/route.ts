import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    const turma = await prisma.turma.findUnique({
      where: { id: Number(id) },
      include: {
        disciplina: true,
        professor: true,
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

    return NextResponse.json(turma);
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

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = context.params;
    const body = await request.json();

    const turmaExistente = await prisma.turma.findUnique({
      where: { id: Number(id) },
    });

    if (!turmaExistente) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    const turmaAtualizada = await prisma.turma.update({
      where: { id: Number(id) },
      data: {
        nome: body.nome,
        codigo: body.codigo || null,
        semestre: body.semestre,
        periodoLetivo: body.periodoLetivo || null,
        ativa: Boolean(body.ativa),
        capacidadeMaxima:
          body.capacidadeMaxima !== undefined &&
          body.capacidadeMaxima !== null &&
          String(body.capacidadeMaxima).trim() !== ""
            ? Number(body.capacidadeMaxima)
            : null,
        disciplinaId: Number(body.disciplinaId),
        professorId: Number(body.professorId),
      },
      include: {
        disciplina: true,
        professor: true,
        _count: {
          select: {
            itensMatricula: true,
          },
        },
      },
    });

    return NextResponse.json(turmaAtualizada);
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

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = context.params;

    const turmaExistente = await prisma.turma.findUnique({
      where: { id: Number(id) },
    });

    if (!turmaExistente) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    await prisma.turma.delete({
      where: { id: Number(id) },
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