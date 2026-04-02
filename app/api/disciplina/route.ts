import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

// LISTAR DISCIPLINAS
export async function GET() {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "PROFESSOR") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const disciplinas = await prisma.disciplina.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(disciplinas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao listar disciplinas" },
      { status: 500 }
    );
  }
}

// CRIAR DISCIPLINA
export async function POST(request: Request) {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.nome || String(body.nome).trim() === "") {
      return NextResponse.json(
        { error: "Nome da disciplina é obrigatório" },
        { status: 400 }
      );
    }

    let cursoIdFinal: number | null = null;

    if (body.cursoId) {
      const cursoId = Number(body.cursoId);

      const curso = await prisma.curso.findFirst({
        where: {
          id: cursoId,
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

    const novaDisciplina = await prisma.disciplina.create({
      data: {
        nome: String(body.nome).trim(),
        cursoId: cursoIdFinal,
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
      },
    });

    return NextResponse.json(novaDisciplina, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar disciplina" },
      { status: 500 }
    );
  }
}