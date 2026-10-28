import {
  ErroCadastroTurmaAvulsa,
  validarCapacidadeTurmaAvulsa,
  validarHorariosTurmaAvulsa,
  type HorarioAvulso,
} from "@/lib/academico/validar-turma-avulsa";

/** Verificacao pura; a API ainda valida existencia e permissoes no banco. */
export function validarProntidaoAtivacaoTurmaAvulsa(dados: {
  curso: {
    organizacaoCurricular: unknown;
    regrasPrecoDisciplinas: unknown;
    regrasSelecaoDisciplinas: unknown;
    valorMensalidade: unknown;
    valorMatricula: unknown;
    quantidadeParcelas: unknown;
  };
  professorId: number | null;
  capacidadeMaxima: unknown;
  periodoLetivo: unknown;
  turno: unknown;
  horarios: HorarioAvulso[];
}) {
  if (!["ANUAL", "SEMESTRAL"].includes(String(dados.curso.organizacaoCurricular)) ||
      dados.curso.regrasPrecoDisciplinas != null ||
      dados.curso.regrasSelecaoDisciplinas != null) {
    throw new ErroCadastroTurmaAvulsa("CURSO_COM_GRADE", "Este curso utiliza disciplinas ou possui configuracao curricular incompatível.");
  }
  if (!Number.isSafeInteger(dados.professorId) || !(dados.professorId! > 0)) {
    throw new ErroCadastroTurmaAvulsa("PROFESSOR_OBRIGATORIO", "Defina um professor para liberar a chamada da turma.");
  }
  validarCapacidadeTurmaAvulsa(dados.capacidadeMaxima);
  if (!/^\d{4}$/.test(String(dados.periodoLetivo ?? "")) ||
      !["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL", "FLEXIVEL"].includes(String(dados.turno ?? ""))) {
    throw new ErroCadastroTurmaAvulsa("PERIODO_INVALIDO", "Informe ano letivo e turno antes da ativacao.");
  }
  const mensalidade = dados.curso.valorMensalidade;
  const matricula = dados.curso.valorMatricula;
  if (mensalidade === null || mensalidade === undefined || !Number.isFinite(Number(mensalidade)) || Number(mensalidade) < 0 ||
      (matricula != null && (!Number.isFinite(Number(matricula)) || Number(matricula) < 0))) {
    throw new ErroCadastroTurmaAvulsa("PRECO_INCOMPLETO", "Revise o valor da mensalidade e da taxa de matricula do curso.");
  }
  const parcelas = Number(dados.curso.quantidadeParcelas);
  if (dados.curso.quantidadeParcelas == null || !Number.isInteger(parcelas) || parcelas < 1 || parcelas > 120) {
    throw new ErroCadastroTurmaAvulsa("PARCELAS_INVALIDAS", "Informe entre 1 e 120 mensalidades para o curso.");
  }
  return validarHorariosTurmaAvulsa(dados.horarios);
}
