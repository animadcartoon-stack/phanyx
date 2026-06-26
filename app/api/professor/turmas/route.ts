import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role || "").toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
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

    const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const substituicoes = await prisma.substituicaoDocente.findMany({
  where: {
    instituicaoId: user.instituicaoId,
    professorSubstitutoId: professor.id,
    status: {
      notIn: ["CANCELADA", "ENCERRADA", "SUSPENSA"],
    },
    dataInicio: {
      lte: hoje,
    },
    OR: [
      {
        dataFim: null,
      },
      {
        dataFim: {
          gte: hoje,
        },
      },
    ],
  },
  select: {
    turmaId: true,
    disciplinaId: true,
  },
});

const filtrosSubstituicao = substituicoes.map((s) => ({
  id: s.turmaId,
}));

    const turmas = await prisma.turma.findMany({
      where: {
  instituicaoId: user.instituicaoId,

  OR: [
    {
      disciplinas: {
        some: {
          disciplina: {
            OR: [
              {
                professorId: professor.id,
              },
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

    ...filtrosSubstituicao,
  ],
},
      include: {
        disciplinas: {
          where: {
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
          include: {
  horarios: {
    where: {
      ativo: true,
    },
    orderBy: [
      { diaSemana: "asc" },
      { horaInicio: "asc" },
    ],
  },
  disciplina: {
    include: {
      curso: true,
    },
  },
},
        },
        itensMatricula: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(
      turmas.flatMap((t) =>
        t.disciplinas
  .filter((item) => {
    const professorDaDisciplina =
      item.disciplina?.professorId === professor.id;

    const habilitado =
      item.disciplina?.professoresHabilitados?.some(
        (p) => p.professorId === professor.id
      );

    const substituicao = substituicoes.some(
      (s) => s.turmaId === t.id && s.disciplinaId === item.disciplinaId
    );

    return professorDaDisciplina || habilitado || substituicao;
  })
  .map((item) => ({
    id: t.id,
    turmaDisciplinaId: item.id,
    nome: t.nome,
    semestre: t.semestre,
    periodoLetivo: t.periodoLetivo,
    statusTurma: t.statusTurma,
    alunos: t.itensMatricula.length,

    curso: item.disciplina?.curso ?? null,

    disciplinaId: item.disciplinaId,
    disciplina: item.disciplina,

    statusDisciplina: item.status,
    dataInicio: item.dataInicio,
    dataFim: item.dataFim,
    horarios: item.horarios || [],
  }))
      )
    );
  } catch (e: any) {
    console.error("ERRO API PROFESSOR TURMAS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar turmas" },
      { status: 500 }
    );
  }
}