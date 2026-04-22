import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { isAdminLike } from "@/lib/server-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const turmas = await prisma.turma.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        disciplina: {
          include: {
            curso: true,
          },
        },
        professor: true,
        _count: {
          select: {
            itensMatricula: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(turmas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar turmas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();

    if (!body.nome || !body.semestre || !body.disciplinaId || !body.professorId) {
      return NextResponse.json(
        { error: "Nome, semestre, disciplina e professor são obrigatórios" },
        { status: 400 }
      );
    }

    const turmaExistente = await prisma.turma.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        nome: body.nome,
        semestre: body.semestre,
        disciplinaId: Number(body.disciplinaId),
      },
    });

    if (turmaExistente) {
      return NextResponse.json(
        { error: "Já existe uma turma com esse nome, semestre e disciplina" },
        { status: 400 }
      );
    }

    const novaTurma = await prisma.turma.create({
      data: {
        nome: body.nome,
        codigo: body.codigo || null,
        semestre: body.semestre,
        periodoLetivo: body.periodoLetivo || null,
        ativa: body.ativa !== undefined ? Boolean(body.ativa) : true,
        statusTurma: body.statusTurma || "AGUARDANDO",
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
        instituicaoId: user.instituicaoId,
        disciplinaId: Number(body.disciplinaId),
        professorId: Number(body.professorId),
      },
      include: {
        disciplina: {
          include: {
            curso: true,
          },
        },
        professor: true,
        _count: {
          select: {
            itensMatricula: true,
          },
        },
      },
    });

    return NextResponse.json(novaTurma);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar turma" }, { status: 500 });
  }
}