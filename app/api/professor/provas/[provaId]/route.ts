import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import {
  provaPertenceAoProfessor,
} from "@/lib/services/provaProfessor.service";

import {
  obterParesTurmaDisciplinaProfessor,
} from "@/lib/professor-escopo-academico";

async function obterProfessor(
  userId: number,
  instituicaoId: number
) {
  return prisma.professor.findFirst({
    where: {
      userId,
      instituicaoId,
    },

    select: {
      id: true,
    },
  });
}

function provaIdValido(
  valor: string
) {
  const id = Number(valor);

  return Number.isFinite(id) &&
    id > 0
    ? id
    : null;
}

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: {
      provaId: string;
    };
  }
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
      await obterProfessor(
        user.id,
        user.instituicaoId
      );

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

    const provaId =
      provaIdValido(
        params.provaId
      );

    if (!provaId) {
      return NextResponse.json(
        {
          error:
            "Prova inv\u00e1lida",
        },
        {
          status: 400,
        }
      );
    }

    try {
      await provaPertenceAoProfessor({
        provaId,
        professorId:
          professor.id,
        instituicaoId:
          user.instituicaoId,
      });
    }
    catch {
      return NextResponse.json(
        {
          error:
            "Prova n\u00e3o encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const prova =
      await prisma.prova.findFirst({
        where: {
          id: provaId,
          instituicaoId:
            user.instituicaoId,
        },

        include: {
          disciplina:
            true,

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

          questoes: {
            orderBy: {
              ordem:
                "asc",
            },

            include: {
              alternativas: {
                orderBy: {
                  ordem:
                    "asc",
                },
              },
            },
          },
        },
      });

    if (!prova) {
      return NextResponse.json(
        {
          error:
            "Prova n\u00e3o encontrada",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      prova
    );
  }
  catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao buscar prova",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      provaId: string;
    };
  }
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
      await obterProfessor(
        user.id,
        user.instituicaoId
      );

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

    const provaId =
      provaIdValido(
        params.provaId
      );

    if (!provaId) {
      return NextResponse.json(
        {
          error:
            "Prova inv\u00e1lida",
        },
        {
          status: 400,
        }
      );
    }

    let provaExistente: any;

    try {
      provaExistente =
        await provaPertenceAoProfessor({
          provaId,
          professorId:
            professor.id,
          instituicaoId:
            user.instituicaoId,
        });
    }
    catch {
      return NextResponse.json(
        {
          error:
            "Prova n\u00e3o encontrada",
        },
        {
          status: 404,
        }
      );
    }

    if (
      provaExistente.status !==
      "RASCUNHO"
    ) {
      return NextResponse.json(
        {
          error:
            "Os dados da prova s\u00f3 podem ser alterados enquanto ela estiver em rascunho",
        },
        {
          status: 400,
        }
      );
    }


    const body =
      await req.json();

    const turmaIdFinal =
      body.turmaId !== undefined
        ? Number(
            body.turmaId
          )
        : Number(
            provaExistente.turmaId
          );

    const disciplinaIdFinal =
      body.disciplinaId !== undefined
        ? Number(
            body.disciplinaId
          )
        : Number(
            provaExistente.disciplinaId
          );

    if (
      !Number.isFinite(
        turmaIdFinal
      ) ||
      turmaIdFinal <= 0 ||
      !Number.isFinite(
        disciplinaIdFinal
      ) ||
      disciplinaIdFinal <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A prova precisa permanecer vinculada a uma turma e disciplina v\u00e1lidas",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Se turma ou disciplina forem alteradas,
     * o novo par precisa continuar dentro
     * do escopo academico do professor.
     */
    if (
      turmaIdFinal !==
        provaExistente.turmaId ||
      disciplinaIdFinal !==
        provaExistente.disciplinaId
    ) {
      const paresPermitidos =
        await obterParesTurmaDisciplinaProfessor({
          instituicaoId:
            user.instituicaoId,

          professorId:
            professor.id,
        });

      const permitido =
        paresPermitidos.some(
          (par) =>
            par.turmaId ===
              turmaIdFinal &&
            par.disciplinaId ===
              disciplinaIdFinal
        );

      if (!permitido) {
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
    }

    const provaAtualizada =
      await prisma.prova.update({
        where: {
          id: provaId,
        },

        data: {
          titulo:
            body.titulo ??
            provaExistente.titulo,

          descricao:
            body.descricao !==
            undefined
              ? body.descricao ||
                null
              : provaExistente.descricao,

          notaMaxima:
            body.notaMaxima !==
            undefined
              ? Number(
                  body.notaMaxima
                )
              : provaExistente.notaMaxima,

          tempoMin:
            body.tempoMin !==
            undefined
              ? body.tempoMin
                ? Number(
                    body.tempoMin
                  )
                : null
              : provaExistente.tempoMin,

          tentativasMax:
            body.tentativasMax !==
            undefined
              ? Number(
                  body.tentativasMax
                )
              : provaExistente.tentativasMax,

          disponivelEm:
            body.disponivelEm !==
            undefined
              ? body.disponivelEm
                ? new Date(
                    body.disponivelEm
                  )
                : null
              : provaExistente.disponivelEm,

          expiraEm:
            body.expiraEm !==
            undefined
              ? body.expiraEm
                ? new Date(
                    body.expiraEm
                  )
                : null
              : provaExistente.expiraEm,

          turmaId:
            turmaIdFinal,

          disciplinaId:
            disciplinaIdFinal,
        },

        include: {
          disciplina:
            true,

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

          questoes: {
            orderBy: {
              ordem:
                "asc",
            },

            include: {
              alternativas: {
                orderBy: {
                  ordem:
                    "asc",
                },
              },
            },
          },
        },
      });

    return NextResponse.json(
      provaAtualizada
    );
  }
  catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao atualizar prova",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: {
      provaId: string;
    };
  }
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
      await obterProfessor(
        user.id,
        user.instituicaoId
      );

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

    const provaId =
      provaIdValido(
        params.provaId
      );

    if (!provaId) {
      return NextResponse.json(
        {
          error:
            "Prova inv\u00e1lida",
        },
        {
          status: 400,
        }
      );
    }

    let prova: any;

    try {
      prova =
        await provaPertenceAoProfessor({
          provaId,
          professorId:
            professor.id,
          instituicaoId:
            user.instituicaoId,
        });
    }
    catch {
      return NextResponse.json(
        {
          error:
            "Prova n\u00e3o encontrada",
        },
        {
          status: 404,
        }
      );
    }

    if (
      prova.status !==
      "RASCUNHO"
    ) {
      return NextResponse.json(
        {
          error:
            "S\u00f3 \u00e9 permitido excluir provas em rascunho.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.respostaProva.deleteMany({
          where: {
            questao: {
              provaId,
            },

            instituicaoId:
              user.instituicaoId,
          },
        });

        await tx.tentativaProva.deleteMany({
          where: {
            provaId,

            instituicaoId:
              user.instituicaoId,
          },
        });

        await tx.alternativa.deleteMany({
          where: {
            questao: {
              provaId,
            },

            instituicaoId:
              user.instituicaoId,
          },
        });

        await tx.questao.deleteMany({
          where: {
            provaId,

            instituicaoId:
              user.instituicaoId,
          },
        });

        await tx.prova.delete({
          where: {
            id: provaId,
          },
        });
      }
    );

    return NextResponse.json({
      ok: true,

      message:
        "Prova exclu\u00edda com sucesso.",
    });
  }
  catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao excluir prova",
      },
      {
        status: 500,
      }
    );
  }
}
