// Contratacao sem disciplinas requer opt-in explicito e exclusividade com a grade legada.
// A validacao ocorre na mesma transacao da edicao do curso.
import type { Prisma } from "@prisma/client";

export class ErroCursoAvulsoSemGrade extends Error {
  constructor(public codigo: string, mensagem: string, public status = 409) {
    super(mensagem);
    this.name = "ErroCursoAvulsoSemGrade";
  }
}

export function opcaoMatriculaDireta(valor: unknown, atual: boolean): boolean {
  if (valor === undefined) return atual;
  if (typeof valor !== "boolean") {
    throw new ErroCursoAvulsoSemGrade("OPCAO_AVULSO_INVALIDA", "A opção de matrícula direta deve ser verdadeira ou falsa.", 400);
  }
  return valor;
}

type DadosAtuais = {
  instituicaoId: number;
  cursoId: number;
  atual: boolean;
  destino: boolean;
  organizacaoCurricular: string;
  regrasPrecoDisciplinas: unknown;
  regrasSelecaoDisciplinas: unknown;
  cursoRecebidoDaRede: boolean;
};

export async function prepararConfiguracaoCursoAvulso(
  tx: Prisma.TransactionClient, dados: DadosAtuais,
): Promise<{matriculaDiretaTurma: boolean}> {
  const { instituicaoId, cursoId, atual, destino } = dados;
  if (!Number.isSafeInteger(instituicaoId) || instituicaoId <= 0 ||
      !Number.isSafeInteger(cursoId) || cursoId <= 0) {
    throw new ErroCursoAvulsoSemGrade("CURSO_INVALIDO", "Identificação do curso inválida.", 400);
  }
  if (dados.cursoRecebidoDaRede && destino !== atual) {
    throw new ErroCursoAvulsoSemGrade("CURSO_RECEBIDO_DA_REDE", "A configuração de matrícula direta não pode ser alterada em um curso recebido da rede.");
  }
  if (destino) {
    if (!["ANUAL", "SEMESTRAL"].includes(dados.organizacaoCurricular) ||
        dados.regrasPrecoDisciplinas || dados.regrasSelecaoDisciplinas) {
      throw new ErroCursoAvulsoSemGrade("MODO_AVULSO_INCOMPATIVEL", "Matrícula direta exige curso anual ou semestral, com preço fixo e sem seleção de disciplinas.");
    }
    if (!atual) {
      // Bloqueia conversão silenciosa de históricos ou turmas com disciplinas.
      const [grade, disciplinas, turmasDisciplina, matriculas] = await Promise.all([
        tx.cursoSemestreDisciplina.count({where:{instituicaoId,cursoSemestre:{cursoId,instituicaoId}}}),
        tx.disciplina.count({where:{instituicaoId,cursoId}}),
        tx.turmaDisciplina.count({where:{instituicaoId,turma:{cursoId,instituicaoId}}}),
        tx.matricula.count({where:{instituicaoId,cursoId}}),
      ]);
      if (grade || disciplinas || turmasDisciplina || matriculas) {
        throw new ErroCursoAvulsoSemGrade(
          "CURSO_COM_GRADE_OU_HISTORICO",
          "O curso ainda possui disciplinas, vínculos de turma ou matrículas anteriores. Revise os registros antes de habilitar matrícula direta; nenhuma informação será apagada.",
        );
      }
    }
  } else if (atual) {
    // Não desligar o modo se os horários já estão preparados ou há histórico.
    const [horarios, matriculas] = await Promise.all([
      tx.turmaHorarioAvulso.count({where:{instituicaoId,turma:{cursoId,instituicaoId}}}),
      tx.matriculaTurmaAvulsa.count({where:{instituicaoId,cursoId}}),
    ]);
    if (horarios || matriculas) {
      throw new ErroCursoAvulsoSemGrade(
        "CURSO_AVULSO_COM_VINCULOS",
        "Não é possível desativar o modo sem grade: há horários ou matrículas diretas vinculados ao curso.",
      );
    }
  }
  return {matriculaDiretaTurma: destino};
}
