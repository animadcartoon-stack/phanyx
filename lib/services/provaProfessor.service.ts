import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  obterParesTurmaDisciplinaProfessor,
} from "@/lib/professor-escopo-academico";

export async function montarFiltroProvasProfessor(params: {
  professorId: number;
  instituicaoId: number;
}): Promise<Prisma.ProvaWhereInput> {
  const {
    professorId,
    instituicaoId,
  } = params;

  const pares =
    await obterParesTurmaDisciplinaProfessor({
      professorId,
      instituicaoId,
    });

  const filtrosPares: Prisma.ProvaWhereInput[] =
    pares.map((par) => ({
      turmaId: par.turmaId,
      disciplinaId: par.disciplinaId,
    }));

  return {
    instituicaoId,

    OR: [
      /*
       * Compatibilidade para provas antigas sem disciplina.
       * Nesse caso, somente o professor atual da turma.
       */
      {
        disciplinaId: null,

        turma: {
          professorId,
        },
      },

      /*
       * Regra academica canonica:
       * turma + disciplina atualmente acessiveis
       * pelo professor, incluindo substituicoes ativas.
       */
      ...filtrosPares,
    ],
  };
}

export async function provaPertenceAoProfessor(params: {
  provaId: number;
  professorId: number;
  instituicaoId: number;
}) {
  const {
    provaId,
    professorId,
    instituicaoId,
  } = params;

  const filtro =
    await montarFiltroProvasProfessor({
      professorId,
      instituicaoId,
    });

  const prova =
    await prisma.prova.findFirst({
      where: {
        id: provaId,
        ...filtro,
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

        questoes: true,
        tentativas: true,
        notas: true,
      },
    });

  if (!prova) {
    throw new Error(
      "PROVA_NAO_ENCONTRADA_OU_SEM_PERMISSAO"
    );
  }

  return prova as any;
}
