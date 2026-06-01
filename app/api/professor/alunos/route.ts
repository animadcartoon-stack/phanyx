import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function isProfessorRole(role: unknown) {
  return String(role || "").trim().toUpperCase() === "PROFESSOR";
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const turmaIdParam = String(searchParams.get("turmaId") || "").trim();
    const turmaId = turmaIdParam ? Number(turmaIdParam) : null;

    const filtroProfessorNaTurma = {
      instituicaoId: user.instituicaoId,
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
    };

    const itens = await prisma.itemMatricula.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        ...(turmaId && Number.isFinite(turmaId) ? { turmaId } : {}),
        turma: filtroProfessorNaTurma,
      },
      include: {
        turma: {
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
                disciplina: true,
              },
            },
          },
        },
        matricula: {
          include: {
            aluno: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const turmaIds = Array.from(
      new Set(
        itens
          .map((item) => item.turma?.id)
          .filter((id): id is number => Number.isFinite(id))
      )
    );

    const alunoIds = Array.from(
      new Set(
        itens
          .map((item) => item.matricula?.aluno?.id)
          .filter((id): id is number => Number.isFinite(id))
      )
    );

    const presencas = alunoIds.length
      ? await prisma.presencaAula.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            alunoId: { in: alunoIds },
            aula: {
              turmaId: { in: turmaIds },
            },
          },
        })
      : [];

    const notas = alunoIds.length
      ? await prisma.nota.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            alunoId: { in: alunoIds },
            turmaId: { in: turmaIds },
          },
        })
      : [];

    const presencasPorAluno = new Map<number, any>();

    for (const p of presencas) {
      const atual = presencasPorAluno.get(p.alunoId) || {
        total: 0,
        presente: 0,
        falta: 0,
        justificada: 0,
        atestado: 0,
      };

      atual.total += 1;
      if (p.status === "PRESENTE") atual.presente += 1;
      if (p.status === "FALTA") atual.falta += 1;
      if (p.status === "JUSTIFICADA") atual.justificada += 1;
      if (p.status === "ATESTADO") atual.atestado += 1;

      presencasPorAluno.set(p.alunoId, atual);
    }

    const notasPorAlunoTurma = new Map<string, number[]>();

    for (const nota of notas) {
      const chave = `${nota.alunoId}-${nota.turmaId}`;
      const atual = notasPorAlunoTurma.get(chave) || [];
      atual.push(Number((nota as any).valor ?? (nota as any).nota ?? 0));
      notasPorAlunoTurma.set(chave, atual);
    }

    const alunos = itens
      .map((item) => {
        const aluno = item.matricula?.aluno;
        const turma = item.turma;
        const turmaDisciplina = turma?.disciplinas?.[0];
        const disciplina = turmaDisciplina?.disciplina;

        if (!aluno || !turma) return null;

        const chaveNota = `${aluno.id}-${turma.id}`;
        const notasAluno = notasPorAlunoTurma.get(chaveNota) || [];

        const media =
          notasAluno.length > 0
            ? Number(
                (
                  notasAluno.reduce((acc, n) => acc + n, 0) / notasAluno.length
                ).toFixed(2)
              )
            : null;

        const freq = presencasPorAluno.get(aluno.id) || {
          total: 0,
          presente: 0,
          falta: 0,
          justificada: 0,
          atestado: 0,
        };

        return {
          itemMatriculaId: item.id,
          alunoId: aluno.id,
          nome: aluno.nome,
          email: aluno.user?.email || null,
          matricula: aluno.matricula || null,
          statusAluno: (aluno as any).statusAluno || null,
          statusDisciplina: item.status || null,
          turma: {
            id: turma.id,
            nome: turma.nome,
            semestre: turma.semestre || null,
          },
          disciplina: {
            id: disciplina?.id || null,
            nome: disciplina?.nome || null,
          },
          notas: notasAluno,
          media,
          frequencia: {
            ...freq,
            percentual:
              freq.total > 0
                ? Number(((freq.presente / freq.total) * 100).toFixed(1))
                : null,
          },
        };
      })
      .filter(Boolean);

    const turmasProfessor = await prisma.turma.findMany({
      where: filtroProfessorNaTurma,
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
            disciplina: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json({
      alunos,
      turmas: turmasProfessor.map((turma) => ({
        id: turma.id,
        nome: turma.nome,
        disciplinaNome: turma.disciplinas?.[0]?.disciplina?.nome || null,
      })),
    });
  } catch (e: any) {
    console.error("ERRO API PROFESSOR ALUNOS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar alunos do professor" },
      { status: 500 }
    );
  }
}