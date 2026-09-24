import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { obterParesTurmaDisciplinaProfessor } from "@/lib/professor-escopo-academico";

type ParametrosAtividadeProfessor = {
  professorId: number;
  instituicaoId: number;
};

export async function montarFiltroAtividadesProfessor(
  params: ParametrosAtividadeProfessor
): Promise<Prisma.AtividadeWhereInput> {
  const paresAutorizados =
    await obterParesTurmaDisciplinaProfessor({
      instituicaoId: params.instituicaoId,
      professorId: params.professorId,
    });

  return {
    instituicaoId: params.instituicaoId,

    OR: [
      /*
       * Professor explicitamente responsavel pela atividade.
       *
       * Quando a atividade nasceu durante uma substituicao,
       * esse atalho nao e utilizado, pois a autorizacao deve
       * continuar dependendo da substituicao estar ativa.
       */
      {
        professorResponsavelId: params.professorId,
        substituicaoDocenteId: null,
      },

      /*
       * Compatibilidade para atividade antiga sem disciplina:
       * o professor atual da turma pode acessa-la.
       */
      {
        disciplinaId: null,
        turma: {
          professorId: params.professorId,
        },
      },

      /*
       * Escopo academico oficial turma + disciplina.
       *
       * Inclui:
       * - professor da TurmaDisciplina;
       * - professor padrao da turma;
       * - estrutura legada valida;
       * - substituicao docente ativa.
       */
      ...paresAutorizados.map((par) => ({
        turmaId: par.turmaId,
        disciplinaId: par.disciplinaId,
      })),
    ],
  };
}

export async function atividadePertenceAoProfessor(params: {
  atividadeId: number;
  professorId: number;
  instituicaoId: number;
}) {
  const filtro =
    await montarFiltroAtividadesProfessor({
      professorId: params.professorId,
      instituicaoId: params.instituicaoId,
    });

  const atividade =
    await prisma.atividade.findFirst({
      where: {
        id: params.atividadeId,
        ...filtro,
      },
    });

  if (!atividade) {
    throw new Error(
      "ATIVIDADE_NAO_ENCONTRADA_OU_SEM_PERMISSAO"
    );
  }

  return atividade as any;
}
