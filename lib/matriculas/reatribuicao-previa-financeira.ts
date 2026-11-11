/**
 * Classificação conservadora para PRÉVIA, nunca autorização automática de transferência.
 * Somente registros sem pagamentos ou títulos vinculados são encaminhados à revisão.
 */
export type RiscoLancamento =
  | "PRESERVAR_PAGAMENTO"
  | "PRESERVAR_COBRANCA"
  | "PRESERVAR_HISTORICO"
  | "CONFERIR_VINCULO_ALUNO"
  | "REVISAR_SEM_MOVIMENTACAO";

export type LancamentoParaPrevia = {
  id: number;
  alunoId: number;
  status: string;
  valorPago: number | null;
  pagoEm: Date | null;
  pagamentosRegistrados: number;
  movimentosCaixaRegistrados: number;
};

export type CobrancaParaPrevia = {
  id: number;
  alunoId: number;
  lancamentoFinanceiroId: number;
};

export type AnaliseLancamento = {
  id: number;
  grupo: RiscoLancamento;
  motivo: string;
  alteracaoAutomaticaPermitida: false;
};

export function montarPreviaFinanceira(
  alunoOrigemId: number,
  lancamentos: readonly LancamentoParaPrevia[],
  cobrancas: readonly CobrancaParaPrevia[],
): { lancamentos: AnaliseLancamento[]; titulosPreservados: number; totalRevisar: number; totalPreservar: number } {
  const comCobranca = new Set(cobrancas.map(c => c.lancamentoFinanceiroId));
  const itens: AnaliseLancamento[] = lancamentos.map(l => {
    const base = { id: l.id, alteracaoAutomaticaPermitida: false as const };
    // A ordem é intencional: provas de pagamento têm prioridade sobre outros alertas.
    if (l.pagamentosRegistrados > 0 || l.movimentosCaixaRegistrados > 0 ||
        Number(l.valorPago ?? 0) > 0 || l.pagoEm !== null ||
        l.status === "PAGO" || l.status === "PARCIAL") {
      return { ...base, grupo: "PRESERVAR_PAGAMENTO" as const,
        motivo: "Há pagamento, baixa, movimento de caixa ou pagamento parcial. Preservar o titular histórico." };
    }
    if (comCobranca.has(l.id)) {
      return { ...base, grupo: "PRESERVAR_COBRANCA" as const,
        motivo: "Existe título/cobrança vinculada. Exige conciliação específica antes de qualquer alteração." };
    }
    if (l.status === "CANCELADO") {
      return { ...base, grupo: "PRESERVAR_HISTORICO" as const,
        motivo: "Lançamento cancelado deve permanecer como registro histórico." };
    }
    if (l.alunoId !== alunoOrigemId) {
      return { ...base, grupo: "CONFERIR_VINCULO_ALUNO" as const,
        motivo: "Lançamento já está vinculado a outro aluno. Conferir antes de propor qualquer mudança." };
    }
    return { ...base, grupo: "REVISAR_SEM_MOVIMENTACAO" as const,
      motivo: "Sem pagamentos nem cobranças encontrados. Elegibilidade depende de revisão contratual e financeira." };
  });
  return {
    lancamentos: itens,
    titulosPreservados: cobrancas.length,
    totalRevisar: itens.filter(i => i.grupo === "REVISAR_SEM_MOVIMENTACAO").length,
    totalPreservar: itens.filter(i => i.grupo !== "REVISAR_SEM_MOVIMENTACAO").length,
  };
}
