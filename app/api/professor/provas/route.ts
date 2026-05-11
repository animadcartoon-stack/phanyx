import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
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

    const provas = await prisma.prova.findMany({
      where: {
        instituicaoId: user.instituicaoId,
       turma: {
  OR: [
    {
      professorId: professor.id,
    },
    {
      disciplinas: {
        some: {
          disciplina: {
  OR: [
    { professorId: professor.id },
    {
      professoresHabilitados: {
        some: {
          professorId: professor.id,
        },
      },
    },
  ],
},
        },
      },
    },
  ],
},
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        turma: {
          include: {
            disciplinas: {
  include: {
    disciplina: true,
  },
},
          },
        },
        questoes: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(
      provas.map((prova) => ({
        ...prova,
        totalQuestoes: prova.questoes.length,
      }))
    );
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

    const body = await req.json();

    const {
      titulo,
      descricao,
      notaMaxima,
      tempoMin,
      tentativasMax,
      disponivelEm,
      expiraEm,
      turmaId,
    } = body;

    if (!titulo || !turmaId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: titulo, turmaId" },
        { status: 400 }
      );
    }

    const turma = await prisma.turma.findFirst({
  where: {
    id: Number(turmaId),
    instituicaoId: user.instituicaoId,
    OR: [
      {
        professorId: professor.id,
      },
      {
        disciplinas: {
          some: {
            disciplina: {
  OR: [
    { professorId: professor.id },
    {
      professoresHabilitados: {
        some: {
          professorId: professor.id,
        },
      },
    },
  ],
},
          },
        },
      },
    ],
  },
      include: {
        disciplinas: {
  include: {
    disciplina: true,
  },
},
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma inválida para este professor" },
        { status: 403 }
      );
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
        turmaId: Number(turmaId),
        instituicaoId: user.instituicaoId,
        ativa: false,
      },
      include: {
        turma: {
          include: {
            disciplinas: {
  include: {
    disciplina: true,
  },
},
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