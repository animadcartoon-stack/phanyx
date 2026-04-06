import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const professor = await prisma.professor.findUnique({
      where: { userId: user.id },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const provas = await prisma.prova.findMany({
  where: {
    instituicaoId: user.instituicaoId,
    turma: {
      professorId: professor.id,
    },
  },
  orderBy: {
    createdAt: "desc",
  },
  include: {
    turma: {
      include: {
        disciplina: true,
      },
    },
  },
});

    return NextResponse.json(provas);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao buscar provas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const professor = await prisma.professor.findUnique({
      where: { userId: user.id },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const {
      titulo,
      descricao,
      notaMaxima,
      tempoMin,
      tentativasMax,
      disponivelEm,
      expiraEm,
      disciplinaId,
      turmaId,
    } = body;

    if (!titulo || !disciplinaId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: titulo, disciplinaId" },
        { status: 400 }
      );
    }

    const disciplina = await prisma.disciplina.findFirst({
  where: {
    id: Number(disciplinaId),
    instituicaoId: user.instituicaoId,
  },
});

    if (!disciplina) {
      return NextResponse.json(
        { error: "Disciplina inválida" },
        { status: 403 }
      );
    }

    if (turmaId) {
      const turma = await prisma.turma.findFirst({
        where: {
          id: Number(turmaId),
          instituicaoId: user.instituicaoId,
          professorId: professor.id,
          disciplinaId: Number(disciplinaId),
        },
      });

      if (!turma) {
        return NextResponse.json(
          { error: "Turma inválida para esta disciplina" },
          { status: 403 }
        );
      }
    }

    const prova = await prisma.prova.create({
      data: {
  titulo,
  descricao: descricao || null,
  notaMaxima: notaMaxima ? Number(notaMaxima) : 10,
  tempoMin: tempoMin ? Number(tempoMin) : null,
  tentativasMax: tentativasMax ? Number(tentativasMax) : 1,
  disponivelEm: disponivelEm ? new Date(disponivelEm) : null,
  expiraEm: expiraEm ? new Date(expiraEm) : null,
  turmaId: turmaId ? Number(turmaId) : null,
  instituicaoId: user.instituicaoId,
},
      include: {
  turma: {
    include: {
      disciplina: true,
    },
  },
},
    });

    return NextResponse.json(prova, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao criar prova" },
      { status: 500 }
    );
  }
}