import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function isProfessorRole(role: unknown) {
  return String(role || "").trim().toUpperCase() === "PROFESSOR";
}

export async function GET(_req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !isProfessorRole(user.role)) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const atividades = await prisma.atividade.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        turma: {
  instituicaoId: user.instituicaoId,
  OR: [
    { professorId: professor.id },
    {
      disciplinas: {
        some: {
          disciplina: {
            professorId: professor.id,
          },
        },
      },
    },
  ],
},
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
        anexos: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      atividades.map((atividade) => ({
        ...atividade,
        disciplina: atividade.turma?.disciplinas?.[0]?.disciplina || null,
disciplinas: atividade.turma?.disciplinas?.map((item) => item.disciplina) || [],
      }))
    );
  } catch (e: any) {
    console.error("ERRO GET ATIVIDADES PROFESSOR:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar atividades" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !isProfessorRole(user.role)) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const titulo = String(body?.titulo || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const prazo =
      body?.prazo && String(body.prazo).trim()
        ? new Date(body.prazo)
        : null;
    const notaMaxima =
      body?.notaMaxima !== undefined && body?.notaMaxima !== ""
        ? Number(body.notaMaxima)
        : 10;
    const turmaId =
      body?.turmaId !== undefined && body?.turmaId !== ""
        ? Number(body.turmaId)
        : null;

    if (!titulo) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    if (!turmaId || !Number.isFinite(turmaId) || turmaId <= 0) {
      return NextResponse.json(
        { error: "Turma é obrigatória" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(notaMaxima) || notaMaxima <= 0) {
      return NextResponse.json(
        { error: "Nota máxima inválida" },
        { status: 400 }
      );
    }

    const turma = await prisma.turma.findFirst({
  where: {
    id: turmaId,
    instituicaoId: user.instituicaoId,
    OR: [
      { professorId: professor.id },
      {
        disciplinas: {
          some: {
            disciplina: {
              professorId: professor.id,
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
        { error: "Turma inválida" },
        { status: 403 }
      );
    }

    const anexo = body?.anexo ?? null;

    const atividade = await prisma.atividade.create({
      data: {
        titulo,
        descricao,
        prazo,
        notaMaxima,
        turmaId: turma.id,
        instituicaoId: user.instituicaoId,
        status: "RASCUNHO",
        publicadaAt: null,
        anexos: anexo
          ? {
              create: {
                titulo: anexo.nomeOriginal || "Anexo da atividade",
                url: anexo.url,
                arquivoNome: anexo.nomeOriginal || "arquivo",
                mimeType: anexo.mimeType || null,
                tamanho:
                  anexo.tamanho !== undefined && anexo.tamanho !== null
                    ? Number(anexo.tamanho)
                    : null,
                instituicaoId: user.instituicaoId,
              },
            }
          : undefined,
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
        anexos: true,
      },
    });

    return NextResponse.json(
      {
        ...atividade,
        disciplina: atividade.turma?.disciplinas?.[0]?.disciplina || null,
disciplinas: atividade.turma?.disciplinas?.map((item) => item.disciplina) || [],
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("ERRO POST ATIVIDADES PROFESSOR:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao criar atividade" },
      { status: 500 }
    );
  }
}