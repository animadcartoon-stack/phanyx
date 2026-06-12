import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function isProfessorRole(role: unknown) {
  return String(role || "").trim().toUpperCase() === "PROFESSOR";
}

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

    const turmaId = searchParams.get("turmaId")
      ? Number(searchParams.get("turmaId"))
      : null;

    const cursoId = searchParams.get("cursoId")
      ? Number(searchParams.get("cursoId"))
      : null;

    const disciplinaId = searchParams.get("disciplinaId")
      ? Number(searchParams.get("disciplinaId"))
      : null;

    const busca = normalizarTexto(searchParams.get("busca") || "");

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
        ...(disciplinaId && Number.isFinite(disciplinaId)
          ? { disciplinaId }
          : {}),

        turma: {
          ...filtroProfessorNaTurma,
          ...(cursoId && Number.isFinite(cursoId) ? { cursoId } : {}),
        },
      },
      include: {
        turma: {
          include: {
            curso: true,
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
            curso: true,
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
        const disciplina =
          item.turma?.disciplinas?.find(
            (td) => td.disciplinaId === item.disciplinaId
          )?.disciplina || item.turma?.disciplinas?.[0]?.disciplina;

        if (!aluno || !turma) return null;

        const textoBusca = normalizarTexto(
          [
            aluno.nome,
            aluno.user?.email,
            aluno.matricula,
            turma.nome,
            disciplina?.nome,
            item.matricula?.curso?.nome,
            turma.curso?.nome,
          ]
            .filter(Boolean)
            .join(" ")
        );

        if (busca && !textoBusca.includes(busca)) {
          return null;
        }

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

          curso: {
            id: item.matricula?.curso?.id || turma.curso?.id || null,
            nome: item.matricula?.curso?.nome || turma.curso?.nome || null,
          },

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
      .filter(Boolean) as any[];

    const prioridadeStatus = (status?: string | null) => {
      if (status === "EM_CURSO") return 3;
      if (status === "A_CURSAR") return 2;
      if (status === "CONCLUIDO") return 1;
      return 0;
    };

    const alunosSemDuplicarMap = new Map<string, any>();

    for (const aluno of alunos) {
      const chave = `${aluno.alunoId}-${aluno.turma?.id || "sem-turma"}-${
        aluno.disciplina?.id || "sem-disciplina"
      }`;

      const existente = alunosSemDuplicarMap.get(chave);

      if (
        !existente ||
        prioridadeStatus(aluno.statusDisciplina) >
          prioridadeStatus(existente.statusDisciplina)
      ) {
        alunosSemDuplicarMap.set(chave, aluno);
      }
    }

    const alunosSemDuplicar = Array.from(alunosSemDuplicarMap.values()).sort(
      (a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
    );

    const turmasProfessor = await prisma.turma.findMany({
      where: filtroProfessorNaTurma,
      include: {
        curso: true,
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
      alunos: alunosSemDuplicar,
      turmas: turmasProfessor.map((turma) => ({
        id: turma.id,
        nome: turma.nome,
        cursoId: turma.cursoId || null,
        cursoNome: turma.curso?.nome || null,
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