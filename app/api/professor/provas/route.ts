import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import {
  montarFiltroProvasProfessor,
} from "@/lib/services/provaProfessor.service";

import {
  obterParesTurmaDisciplinaProfessor,
} from "@/lib/professor-escopo-academico";

export async function GET() {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      String(user.role).toUpperCase() !==
        "PROFESSOR"
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permiss\u00e3o",
        },
        {
          status: 403,
        }
      );
    }

    const professor =
      await prisma.professor.findFirst({
        where: {
          userId:
            user.id,

          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!professor) {
      return NextResponse.json(
        {
          error:
            "Professor n\u00e3o encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const filtro =
      await montarFiltroProvasProfessor({
        professorId:
          professor.id,

        instituicaoId:
          user.instituicaoId,
      });

    const provas =
      await prisma.prova.findMany({
        where:
          filtro,

        orderBy: {
          createdAt:
            "desc",
        },

        include: {
          turma: {
            include: {
              disciplinas: {
                include: {
                  disciplina:
                    true,
                },
              },
            },
          },

          disciplina:
            true,

          questoes: {
            select: {
              id: true,
            },
          },
        },
      });

    return NextResponse.json(
      provas.map(
        (prova) => ({
          ...prova,

          totalQuestoes:
            prova.questoes.length,
        })
      )
    );
  }
  catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao buscar provas",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: Request
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      String(user.role).toUpperCase() !==
        "PROFESSOR"
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permiss\u00e3o",
        },
        {
          status: 403,
        }
      );
    }

    const professor =
      await prisma.professor.findFirst({
        where: {
          userId:
            user.id,

          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!professor) {
      return NextResponse.json(
        {
          error:
            "Professor n\u00e3o encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await req.json();

    const {
      titulo,
      descricao,
      notaMaxima,
      tempoMin,
      tentativasMax,
      disponivelEm,
      expiraEm,
      notaDisponivelEm,
      mostrarNotaAoFinal,
      turmaId,
      disciplinaId,
      tipoPublico,
      exigirAulasConcluidas,
      alunosIds,
    } = body;

    const turmaIdNumero =
      Number(turmaId);

    const disciplinaIdNumero =
      Number(disciplinaId);

    if (
      !String(titulo || "").trim() ||
      !Number.isFinite(
        turmaIdNumero
      ) ||
      turmaIdNumero <= 0 ||
      !Number.isFinite(
        disciplinaIdNumero
      ) ||
      disciplinaIdNumero <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Campos obrigat\u00f3rios: titulo, turmaId e disciplinaId",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * A mesma fonte de verdade usada
     * pelas demais areas do Professor.
     *
     * Inclui professor responsavel,
     * vinculos academicos permitidos
     * e substituicoes docentes ativas.
     */
    const paresPermitidos =
      await obterParesTurmaDisciplinaProfessor({
        instituicaoId:
          user.instituicaoId,

        professorId:
          professor.id,
      });

    const parPermitido =
      paresPermitidos.some(
        (par) =>
          par.turmaId ===
            turmaIdNumero &&
          par.disciplinaId ===
            disciplinaIdNumero
      );

    if (!parPermitido) {
      return NextResponse.json(
        {
          error:
            "Turma e disciplina n\u00e3o est\u00e3o dispon\u00edveis para este professor",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Confirma tambem que os dois registros
     * pertencem a esta instituicao e que
     * a disciplina realmente integra a turma.
     */
    const turma =
      await prisma.turma.findFirst({
        where: {
          id:
            turmaIdNumero,

          instituicaoId:
            user.instituicaoId,

          disciplinas: {
            some: {
              disciplinaId:
                disciplinaIdNumero,
            },
          },
        },

        include: {
          disciplinas: {
            where: {
              disciplinaId:
                disciplinaIdNumero,
            },

            include: {
              disciplina:
                true,
            },
          },
        },
      });

    if (!turma) {
      return NextResponse.json(
        {
          error:
            "Turma ou disciplina inv\u00e1lida",
        },
        {
          status: 403,
        }
      );
    }

    const prova =
      await prisma.prova.create({
        data: {
          titulo:
            String(
              titulo
            ).trim(),

          descricao:
            descricao ||
            null,

          notaMaxima:
            notaMaxima
              ? Number(
                  notaMaxima
                )
              : 10,

          tempoMin:
            tempoMin
              ? Number(
                  tempoMin
                )
              : null,

          tentativasMax:
            tentativasMax
              ? Number(
                  tentativasMax
                )
              : 1,

          disponivelEm:
            disponivelEm
              ? new Date(
                  disponivelEm
                )
              : null,

          expiraEm:
            expiraEm
              ? new Date(
                  expiraEm
                )
              : null,

          notaDisponivelEm:
            notaDisponivelEm
              ? new Date(
                  notaDisponivelEm
                )
              : null,

          mostrarNotaAoFinal:
            Boolean(
              mostrarNotaAoFinal
            ),

          tipoPublico:
            tipoPublico ===
            "ALUNOS_SELECIONADOS"
              ? "ALUNOS_SELECIONADOS"
              : "TURMA",

          exigirAulasConcluidas:
            Boolean(
              exigirAulasConcluidas
            ),

          alunosLiberados:
            tipoPublico ===
              "ALUNOS_SELECIONADOS" &&
            Array.isArray(
              alunosIds
            ) &&
            alunosIds.length > 0
              ? {
                  create:
                    alunosIds.map(
                      (
                        alunoId:
                          number
                      ) => ({
                        alunoId:
                          Number(
                            alunoId
                          ),

                        instituicaoId:
                          user.instituicaoId,
                      })
                    ),
                }
              : undefined,

          turmaId:
            turmaIdNumero,

          /*
           * Campo que estava faltando.
           */
          disciplinaId:
            disciplinaIdNumero,

          instituicaoId:
            user.instituicaoId,

          ativa:
            false,
        },

        include: {
          turma: {
            include: {
              disciplinas: {
                include: {
                  disciplina:
                    true,
                },
              },
            },
          },

          disciplina:
            true,
        },
      });

    return NextResponse.json(
      prova,
      {
        status: 201,
      }
    );
  }
  catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao criar prova",
      },
      {
        status: 500,
      }
    );
  }
}
