/**
 * Inventário financeiro para a sucessão de titularidade. SOMENTE LEITURA.
 * Não há transferência de créditos, obrigações ou títulos por esta rotina.
 */
export type GrupoLancamentoReatribuicao =
  | "MOVIMENTADO_OU_PAGO" | "TITULO_EXISTENTE" | "CANCELADO" | "SEM_MOVIMENTACAO_IDENTIFICADA";

export type LinhaLancamentoReatribuicao = {
  id: number;
  alunoId: number;
  tipo: string;
  status: string;
  valorOriginal: number;
  valorPago: number | null;
  valorFinal: number | null;
  vencimento: Date | null;
  pagoEm: Date | null;
  pagamentosRegistrados: number;
  movimentosCaixaRegistrados: number;
};

export type LinhaCobrancaReatribuicao = {
  id: number;
  alunoId: number;
  lancamentoFinanceiroId: number;
  matriculaId: number | null;
  statusBancario: string;
  statusOperacional: string;
  cobrancaExternaId: string | null;
  clienteExternoId: string | null;
  pagoEm: Date | null;
  compensadoEm: Date | null;
  baixadoEm: Date | null;
};

function centavos(valor: number | null): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function classificarLancamentosReatribuicao(
  alunoOrigemId: number,
  lancamentos: LinhaLancamentoReatribuicao[],
  cobrancas: LinhaCobrancaReatribuicao[],
) {
  const porLancamento = new Map<number, LinhaCobrancaReatribuicao[]>();
  for (const cobranca of cobrancas) {
    const existentes = porLancamento.get(cobranca.lancamentoFinanceiroId) || [];
    existentes.push(cobranca);
    porLancamento.set(cobranca.lancamentoFinanceiroId, existentes);
  }
  const linhas = lancamentos.map(lancamento => {
    const titulos = porLancamento.get(lancamento.id) || [];
    const pagamentos = lancamento.pagamentosRegistrados > 0 || lancamento.movimentosCaixaRegistrados > 0 ||
      centavos(lancamento.valorPago) > 0 || lancamento.pagoEm !== null ||
      ["PAGO", "PARCIAL"].includes(lancamento.status);
    const grupo: GrupoLancamentoReatribuicao = pagamentos ? "MOVIMENTADO_OU_PAGO"
      : titulos.length ? "TITULO_EXISTENTE"
      : lancamento.status === "CANCELADO" ? "CANCELADO"
      : "SEM_MOVIMENTACAO_IDENTIFICADA";
    return {
      id: lancamento.id,
      alunoId: lancamento.alunoId,
      alunoConfere: lancamento.alunoId === alunoOrigemId,
      tipo: lancamento.tipo,
      status: lancamento.status,
      vencimento: lancamento.vencimento,
      valorOriginalCentavos: centavos(lancamento.valorOriginal),
      valorPagoCentavos: centavos(lancamento.valorPago),
      valorFinalCentavos: centavos(lancamento.valorFinal),
      pagamentosRegistrados: lancamento.pagamentosRegistrados,
      movimentosCaixaRegistrados: lancamento.movimentosCaixaRegistrados,
      cobrancasIds: titulos.map(t => t.id),
      grupo,
      alteracaoAutomaticaPermitida: false as const,
      acaoRecomendada: grupo === "MOVIMENTADO_OU_PAGO"
        ? "Preservar no aluno de origem. Conferir pagamento, crédito e caixa."
        : grupo === "TITULO_EXISTENTE"
        ? "Preservar título e conciliação. Tratar provedor externo antes de qualquer nova cobrança."
        : grupo === "CANCELADO"
        ? "Manter registro cancelado como histórico."
        : "Revisar obrigação e vencimento; não transferir nem cancelar automaticamente.",
    };
  });
  const grupos = ["MOVIMENTADO_OU_PAGO", "TITULO_EXISTENTE", "CANCELADO", "SEM_MOVIMENTACAO_IDENTIFICADA"] as const;
  const totais = Object.fromEntries(grupos.map(grupo => [grupo, linhas.filter(l => l.grupo === grupo).length])) as
    Record<GrupoLancamentoReatribuicao, number>;
  const cobrancasDetalhadas = cobrancas.map(cobranca => ({
    id: cobranca.id,
    alunoId: cobranca.alunoId,
    alunoConfere: cobranca.alunoId === alunoOrigemId,
    matriculaId: cobranca.matriculaId,
    lancamentoFinanceiroId: cobranca.lancamentoFinanceiroId,
    statusBancario: cobranca.statusBancario,
    statusOperacional: cobranca.statusOperacional,
    integradoProvedor: Boolean(cobranca.cobrancaExternaId || cobranca.clienteExternoId),
    temBaixaOuPagamento: Boolean(cobranca.pagoEm || cobranca.compensadoEm || cobranca.baixadoEm),
    alteracaoAutomaticaPermitida: false as const,
  }));
  return {
    linhas,
    cobrancas: cobrancasDetalhadas,
    totais,
    totalLancamentos: linhas.length,
    totalTitulos: cobrancasDetalhadas.length,
    totalTitulosExternos: cobrancasDetalhadas.filter(c => c.integradoProvedor).length,
    divergenciaAluno: linhas.some(l => !l.alunoConfere) || cobrancasDetalhadas.some(c => !c.alunoConfere),
    podeMigrarFinanceiroAutomaticamente: false as const,
  };
}

export function estrategiaIntegridadeReatribuicao(entrada: {
  numeroMatricula: string | null;
  origemAtualizadaEm: Date;
  snapshotAnterior: unknown;
  alunoOrigemId: number;
  matriculaId: number;
  quantidadeItens: number;
  quantidadeTurmasAvulsas: number;
  quantidadeContratos: number;
  quantidadeDocumentos: number;
  quantidadeLancamentos: number;
}) {
  const anterior = entrada.snapshotAnterior;
  const snapshot = anterior && typeof anterior === "object" && !Array.isArray(anterior)
    ? anterior as Record<string, unknown> : null;
  const origemInalterada = snapshot?.finalidade === "SOLICITACAO_SEM_EXECUCAO" &&
    snapshot.matriculaId === entrada.matriculaId &&
    snapshot.alunoId === entrada.alunoOrigemId &&
    snapshot.atualizadoEm === entrada.origemAtualizadaEm.toISOString();
  const possuiVinculos = entrada.quantidadeItens + entrada.quantidadeTurmasAvulsas +
    entrada.quantidadeContratos + entrada.quantidadeDocumentos + entrada.quantidadeLancamentos > 0;
  return {
    origemInalterada,
    possuiVinculos,
    numeroPublicoPreservavelEmSucessora: Boolean(entrada.numeroMatricula),
    estrategiaSugerida: "MATRICULA_SUCESSORA_COM_HISTORICO_SEPARADO" as const,
    explicacao: "A matrícula anterior deve preservar registros próprios. A sucessora poderá manter o número público mediante tratamento explícito da unicidade, sem reutilizar o ID interno. A regra definitiva dependerá do contrato, do financeiro e dos documentos.",
    transferenciaHabilitada: false as const,
  };
}
