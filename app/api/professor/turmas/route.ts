import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import {
  montarFiltroTurmaDisciplinaProfessor,
  obterSubstituicoesAtivasProfessor,
} from "@/lib/professor-escopo-academico";

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

    const substituicoes =
      await obterSubstituicoesAtivasProfessor({
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
      });

    const filtroTurmaDisciplina =
      montarFiltroTurmaDisciplinaProfessor({
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
        substituicoes,
      });

    const turmas = await prisma.turma.findMany({
      where: {
        instituicaoId: user.instituicaoId,

        disciplinas: {
          some: filtroTurmaDisciplina,
        },
      },

      include: {
        disciplinas: {
          where: filtroTurmaDisciplina,

          include: {
            horarios: {
              where: {
                ativo: true,
              },

              orderBy: [
                {
                  diaSemana: "asc",
                },
                {
                  horaInicio: "asc",
                },
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

      orderBy: {
        id: "desc",
      },
    });


    /*
     * Quantidade de aulas PUBLICADAS por
     * combinacao turma + disciplina.
     *
     * O vinculo docente e TurmaDisciplina.
     * Nao dependemos de Disciplina.professorId.
     */
    const mapaParesTurmaDisciplina =
      new Map<
        string,
        {
          turmaId: number;
          disciplinaId: number;
        }
      >();

    for (const turma of turmas) {
      for (const item of turma.disciplinas) {
        if (
          typeof item.disciplinaId !==
            "number" ||
          !Number.isFinite(
            item.disciplinaId
          )
        ) {
          continue;
        }

        mapaParesTurmaDisciplina.set(
          `${turma.id}:${item.disciplinaId}`,
          {
            turmaId: turma.id,
            disciplinaId:
              item.disciplinaId,
          }
        );
      }
    }

    const paresTurmaDisciplina =
      Array.from(
        mapaParesTurmaDisciplina.values()
      );

    const contagensAulas =
      paresTurmaDisciplina.length > 0
        ? await prisma.aula.groupBy({
            by: [
              "turmaId",
              "disciplinaId",
            ],

            where: {
              instituicaoId:
                user.instituicaoId,

              publicada: true,

              OR:
                paresTurmaDisciplina.map(
                  (par) => ({
                    turmaId: par.turmaId,
                    disciplinaId:
                      par.disciplinaId,
                  })
                ),
            },

            _count: {
              _all: true,
            },
          })
        : [];

    const contagemAulasPorPar =
      new Map<string, number>();

    for (const item of contagensAulas) {
      if (
        typeof item.turmaId !== "number" ||
        typeof item.disciplinaId !== "number"
      ) {
        continue;
      }

      contagemAulasPorPar.set(
        `${item.turmaId}:${item.disciplinaId}`,
        item._count._all
      );
    }

    return NextResponse.json(
      turmas.flatMap((t) =>
        t.disciplinas
  .map((item) => ({
    id: t.id,
    turmaDisciplinaId: item.id,
    nome: t.nome,
    semestre: t.semestre,
    periodoLetivo: t.periodoLetivo,
    turno: t.turno,
    modalidade: t.modalidade,
    statusTurma: t.statusTurma,
    alunos: new Set(
      t.itensMatricula
        .filter(
          (item) => item.status !== "CANCELADO"
        )
        .map((item) => item.matriculaId)
        .filter(
          (matriculaId): matriculaId is number =>
            typeof matriculaId === "number" &&
            Number.isFinite(matriculaId)
        )
    ).size,

    curso: item.disciplina?.curso ?? null,

    disciplinaId: item.disciplinaId,
    disciplina: item.disciplina,

    quantidadeAulas:
      contagemAulasPorPar.get(
        `${t.id}:${item.disciplinaId}`
      ) ?? 0,

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