/**
 * Solicitação de proposta acadêmica para reatribuição.
 * NÃO altera matrícula nem reservas de vagas. Os campos são revalidados no servidor
 * no momento de consultar e de salvar o plano.
 */
export class ErroPropostaReatribuicao extends Error {
  constructor(public codigo: string, public status = 400, mensagem?: string) {
    super(mensagem || codigo);
  }
}

export type EntradaPropostaReatribuicao = {
  acao: "PREVIA" | "SALVAR";
  transferenciaId: number;
  turmaIds: number[];
  optativaSessaoIds: number[];
  cursoPrincipalId: number | null;
  dataInicioCurso: string;
  versao: string | null;
};

function listaIds(valor: unknown, campo: string, maximo: number): number[] {
  if (!Array.isArray(valor) || valor.length > maximo ||
    valor.some(id => typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0)) {
    throw new ErroPropostaReatribuicao("SELECAO_INVALIDA", 400, `Confira o campo ${campo}.`);
  }
  if (new Set(valor).size !== valor.length) {
    throw new ErroPropostaReatribuicao("SELECAO_DUPLICADA", 400, `${campo} contém escolhas repetidas.`);
  }
  return [...valor].sort((a: number, b: number) => a - b);
}

export function validarEntradaProposta(entrada: unknown): EntradaPropostaReatribuicao {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    throw new ErroPropostaReatribuicao("CORPO_INVALIDO", 400, "Dados inválidos para a proposta.");
  }
  const body = entrada as Record<string, unknown>;
  const acao = body.acao;
  if (acao !== "PREVIA" && acao !== "SALVAR") {
    throw new ErroPropostaReatribuicao("ACAO_INVALIDA", 400, "Ação de proposta inválida.");
  }
  if (typeof body.transferenciaId !== "number" || !Number.isSafeInteger(body.transferenciaId) || body.transferenciaId <= 0) {
    throw new ErroPropostaReatribuicao("SOLICITACAO_INVALIDA", 400, "Solicitação inválida.");
  }
  const turmaIds = listaIds(body.turmaIds, "turmas", 12);
  const optativaSessaoIds = listaIds(body.optativaSessaoIds ?? [], "optativas", 36);
  if (turmaIds.length === 0) {
    throw new ErroPropostaReatribuicao("TURMAS_OBRIGATORIAS", 400, "Selecione pelo menos uma turma.");
  }
  const cursoPrincipalId = body.cursoPrincipalId === undefined || body.cursoPrincipalId === null
    ? null : body.cursoPrincipalId;
  if (cursoPrincipalId !== null &&
    (typeof cursoPrincipalId !== "number" || !Number.isSafeInteger(cursoPrincipalId) || cursoPrincipalId <= 0)) {
    throw new ErroPropostaReatribuicao("CURSO_PRINCIPAL_INVALIDO", 400, "Curso principal inválido.");
  }
  const dataInicioCurso = body.dataInicioCurso;
  if (typeof dataInicioCurso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dataInicioCurso)) {
    throw new ErroPropostaReatribuicao("DATA_INVALIDA", 400, "Informe a data de início do novo aluno.");
  }
  const data = new Date(`${dataInicioCurso}T12:00:00.000Z`);
  if (Number.isNaN(data.valueOf()) || data.toISOString().slice(0, 10) !== dataInicioCurso) {
    throw new ErroPropostaReatribuicao("DATA_INVALIDA", 400, "A data informada não existe.");
  }
  const versao = body.versao === undefined || body.versao === null ? null : body.versao;
  if (acao === "SALVAR" && (typeof versao !== "string" || !/^[a-f0-9]{64}$/i.test(versao))) {
    throw new ErroPropostaReatribuicao("PREVIA_OBRIGATORIA", 409, "Gere uma nova prévia antes de salvar.");
  }
  if (versao !== null && (typeof versao !== "string" || !/^[a-f0-9]{64}$/i.test(versao))) {
    throw new ErroPropostaReatribuicao("VERSAO_INVALIDA", 400, "Versão da prévia inválida.");
  }
  return {
    acao, transferenciaId: body.transferenciaId as number,
    turmaIds, optativaSessaoIds, cursoPrincipalId: cursoPrincipalId as number | null, dataInicioCurso,
    versao: versao as string | null,
  };
}

/** Verifica vínculo e que a solicitação não ficou obsoleta após alterações cadastrais. */
export function conferirOrigemProposta(
  transferencia: {
    tipo: string; status: string; alunoOrigemId: number | null;
    alunoDestinoId: number | null; dataTransferencia: Date; snapshotAnterior: unknown;
  },
  matricula: { alunoId: number; status: string; canceladaEm: Date | null; updatedAt: Date },
  dataInicioCurso: string,
): number {
  if (transferencia.tipo !== "REATRIBUICAO_ALUNO" || transferencia.status !== "PENDENTE") {
    throw new ErroPropostaReatribuicao("SOLICITACAO_NAO_PENDENTE", 409, "Esta solicitação não está pendente de reatribuição.");
  }
  if (!transferencia.alunoDestinoId || transferencia.alunoOrigemId !== matricula.alunoId ||
    transferencia.alunoDestinoId === matricula.alunoId) {
    throw new ErroPropostaReatribuicao("ALUNOS_DIVERGENTES", 409, "Os alunos vinculados à solicitação foram alterados.");
  }
  if (matricula.canceladaEm || !["ATIVA", "A_INICIAR", "AGUARDANDO"].includes(matricula.status)) {
    throw new ErroPropostaReatribuicao("MATRICULA_BLOQUEADA", 409, "A matrícula não permite esta operação.");
  }
  if (dataInicioCurso < transferencia.dataTransferencia.toISOString().slice(0, 10)) {
    throw new ErroPropostaReatribuicao("INICIO_ANTERIOR_TRANSFERENCIA", 409,
      "A data de início do novo aluno não pode anteceder a data prevista da transferência.");
  }
  const anterior = transferencia.snapshotAnterior;
  if (!anterior || typeof anterior !== "object" || Array.isArray(anterior) ||
    (anterior as Record<string, unknown>).finalidade !== "SOLICITACAO_SEM_EXECUCAO" ||
    (anterior as Record<string, unknown>).alunoId !== matricula.alunoId ||
    (anterior as Record<string, unknown>).atualizadoEm !== matricula.updatedAt.toISOString()) {
    throw new ErroPropostaReatribuicao("MATRICULA_ALTERADA", 409,
      "A matrícula foi alterada após a solicitação. Cancele a solicitação e faça uma nova análise.");
  }
  return transferencia.alunoDestinoId;
}
