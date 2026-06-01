import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUserFromToken();

  if (!user || user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const professor = await prisma.professor.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
    select: { id: true },
  });

  if (!professor) {
    return NextResponse.json({ turmas: [] });
  }

  const turmas = await prisma.turma.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      disciplinas: {
        some: {
          disciplina: {
            OR: [
              { professorId: professor.id },
              {
                professoresHabilitados: {
                  some: { professorId: professor.id },
                },
              },
            ],
          },
        },
      },
    },
    select: {
      id: true,
      nome: true,
      semestre: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return NextResponse.json({ turmas });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromToken();

  if (!user || user.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const turmaId = Number(body.turmaId);

  if (!turmaId) {
    return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
  }

  const professor = await prisma.professor.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
    select: { id: true },
  });

  if (!professor) {
    return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
  }

  const turma = await prisma.turma.findFirst({
    where: {
      id: turmaId,
      instituicaoId: user.instituicaoId,
      disciplinas: {
        some: {
          disciplina: {
            OR: [
              { professorId: professor.id },
              {
                professoresHabilitados: {
                  some: { professorId: professor.id },
                },
              },
            ],
          },
        },
      },
    },
    select: {
      id: true,
      nome: true,
      semestre: true,
    },
  });

  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  const itens = await prisma.itemMatricula.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      turmaId: turma.id,
      matricula: {
        aluno: {
          ativo: true,
        },
      },
    },
    select: {
      matricula: {
        select: {
          aluno: {
            select: {
              userId: true,
              nome: true,
              user: {
                select: {
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });

 type AlunoParticipante = {
  userId: number;
  nome: string;
};

const alunosMap = new Map<number, AlunoParticipante>();

for (const item of itens) {
  const aluno = item.matricula?.aluno;

  if (!aluno || typeof aluno.userId !== "number") continue;

  alunosMap.set(aluno.userId, {
    userId: aluno.userId,
    nome: aluno.nome,
  });
}

const alunos: AlunoParticipante[] = Array.from(alunosMap.values());

  const titulo = `Turma ${turma.nome}${turma.semestre ? ` - ${turma.semestre}` : ""}`;

  const conversa = await prisma.chatConversa.create({
    data: {
      instituicaoId: user.instituicaoId,
      titulo,
      tipo: "GRUPO",
      criadaPorId: user.id,
      participantes: {
        create: [
          {
            usuarioId: user.id,
            nomeExibicao: user.nome,
            papel: user.role,
          },
          ...alunos.map((aluno) => ({
            usuarioId: aluno.userId,
            nomeExibicao: aluno.nome,
            papel: "ALUNO",
          })),
        ],
      },
    },
    include: {
      participantes: true,
    },
  });

  return NextResponse.json({ conversa });
}