/** Uma proposta não altera a matrícula nem transfere pagamentos. */
export class ErroSolicitacaoReatribuicao extends Error {
  constructor(public codigo: string, public status = 400, mensagem?: string) {
    super(mensagem || codigo);
  }
}

export const STATUS_PENDENTES_REATRIBUICAO = [
  "PENDENTE", "AGUARDANDO_ACEITE_DESTINO", "ACEITA_DESTINO",
] as const;

export type PropostaReatribuicao = {
  alunoDestinoId: number;
  motivo: string;
  observacoes: string | null;
  dataTransferencia: Date;
};

export function validarPropostaReatribuicao(entrada: unknown): PropostaReatribuicao {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    throw new ErroSolicitacaoReatribuicao("CORPO_INVALIDO", 400, "Dados da solicitação inválidos.");
  }
  const campos = entrada as Record<string, unknown>;
  const alunoDestinoId = campos.alunoDestinoId;
  if (typeof alunoDestinoId !== "number" || !Number.isSafeInteger(alunoDestinoId) || alunoDestinoId <= 0) {
    throw new ErroSolicitacaoReatribuicao("ALUNO_DESTINO_INVALIDO", 400, "Escolha um aluno de destino válido.");
  }
  const motivo = typeof campos.motivo === "string" ? campos.motivo.trim() : "";
  if (motivo.length < 10 || motivo.length > 1000) {
    throw new ErroSolicitacaoReatribuicao("MOTIVO_INVALIDO", 400, "Informe um motivo de 10 a 1.000 caracteres.");
  }
  const observacoes = campos.observacoes === null || campos.observacoes === undefined
    ? "" : typeof campos.observacoes === "string" ? campos.observacoes.trim() : null;
  if (observacoes === null || observacoes.length > 2000) {
    throw new ErroSolicitacaoReatribuicao("OBSERVACOES_INVALIDAS", 400, "Observações devem ter até 2.000 caracteres.");
  }
  const dataTexto = campos.dataTransferencia;
  if (typeof dataTexto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dataTexto)) {
    throw new ErroSolicitacaoReatribuicao("DATA_INVALIDA", 400, "Informe uma data no formato AAAA-MM-DD.");
  }
  const dataTransferencia = new Date(`${dataTexto}T12:00:00.000Z`);
  if (Number.isNaN(dataTransferencia.getTime()) || dataTransferencia.toISOString().slice(0, 10) !== dataTexto) {
    throw new ErroSolicitacaoReatribuicao("DATA_INVALIDA", 400, "Informe uma data real de transferência.");
  }
  return { alunoDestinoId, motivo, observacoes: observacoes || null, dataTransferencia };
}
