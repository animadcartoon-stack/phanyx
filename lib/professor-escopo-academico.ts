import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ParTurmaDisciplinaProfessor = {
  turmaId: number;
  disciplinaId: number;
};

type ParametrosEscopoProfessor = {
  instituicaoId: number;
  professorId: number;
  referencia?: Date;
};

const STATUS_SUBSTITUICAO_INATIVOS = [
  "CANCELADA",
  "ENCERRADA",
  "SUSPENSA",
];

export async function obterSubstituicoesAtivasProfessor({
  instituicaoId,
  professorId,
  referencia = new Date(),
}: ParametrosEscopoProfessor): Promise<ParTurmaDisciplinaProfessor[]> {
  const hoje = new Date(referencia);
  hoje.setHours(0, 0, 0, 0);

  return prisma.substituicaoDocente.findMany({
    where: {
      instituicaoId,
      professorSubstitutoId: professorId,
      status: {
        notIn: STATUS_SUBSTITUICAO_INATIVOS,
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
}

export function montarFiltroTurmaDisciplinaProfessor({
  instituicaoId,
  professorId,
  substituicoes = [],
}: {
  instituicaoId: number;
  professorId: number;
  substituicoes?: ParTurmaDisciplinaProfessor[];
}): Prisma.TurmaDisciplinaWhereInput {
  return {
    instituicaoId,

    OR: [
      /*
       * Regra principal:
       * professor atribuido especificamente a esta disciplina
       * dentro desta turma.
       */
      {
        professorId,
      },

      /*
       * Se a oferta nao possui professor especifico,
       * o professor da turma funciona como padrao.
       */
      {
        professorId: null,
        turma: {
          professorId,
        },
      },

      /*
       * Compatibilidade com estrutura antiga:
       * somente quando nem a oferta nem a turma possuem
       * professor definido.
       */
      {
        professorId: null,
        turma: {
          professorId: null,
        },
        disciplina: {
          professorId,
        },
      },

      /*
       * A substituicao ativa concede acesso somente ao
       * par turma + disciplina correspondente.
       */
      ...substituicoes.map((substituicao) => ({
        turmaId: substituicao.turmaId,
        disciplinaId: substituicao.disciplinaId,
      })),
    ],
  };
}

export async function obterParesTurmaDisciplinaProfessor(
  parametros: ParametrosEscopoProfessor
): Promise<ParTurmaDisciplinaProfessor[]> {
  const substituicoes =
    await obterSubstituicoesAtivasProfessor(parametros);

  const filtro =
    montarFiltroTurmaDisciplinaProfessor({
      instituicaoId: parametros.instituicaoId,
      professorId: parametros.professorId,
      substituicoes,
    });

  const itens = await prisma.turmaDisciplina.findMany({
    where: filtro,
    select: {
      turmaId: true,
      disciplinaId: true,
    },
  });

  const pares = new Map<string, ParTurmaDisciplinaProfessor>();

  for (const item of itens) {
    pares.set(
      `${item.turmaId}:${item.disciplinaId}`,
      item
    );
  }

  return Array.from(pares.values());
}

export function criarFiltroParesTurmaDisciplina(
  pares: ParTurmaDisciplinaProfessor[]
): Prisma.TurmaDisciplinaWhereInput[] {
  return pares.map((par) => ({
    turmaId: par.turmaId,
    disciplinaId: par.disciplinaId,
  }));
}
