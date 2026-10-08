type Valor = number | { toString(): string } | null;

export type CobrancaConferencia = {
  instituicaoId: number;
  alunoId: number;
  matriculaId: number | null;
  lancamentoFinanceiroId: number;
  statusBancario: string;
  statusOperacional: string;
  valorCobrado: Valor;
  valorCompensado: Valor;
  baixadoEm?: Date | null;
  movimentoCaixaId?: number | null;
  metadata?: unknown;
};

export type ParcelaConferencia = {
  id: number;
  instituicaoId: number;
  alunoId: number;
  matriculaId: number | null;
  tipo: string;
  status: string;
  valorOriginal: number;
  valorFinal: number | null;
  valorPago: number | null;
  descontoValor: number | null;
  jurosValor: number | null;
  multaValor: number | null;
  updatedAt: Date;
  pagamentos: Array<{ valorPago: number }>;
  matricula?: { realizadaPeloAluno: boolean; status: string } | null;
};

export function centavos(valor: number) {
  return Math.round(Number(valor) * 100);
}

export function objetoJson(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

export function calcularSaldoParcela(parcela: ParcelaConferencia) {
  const valorFinal = Number((Number(parcela.valorFinal || 0) > 0
    ? Number(parcela.valorFinal)
    : Number(parcela.valorOriginal || 0) - Number(parcela.descontoValor || 0)
      + Number(parcela.jurosValor || 0) + Number(parcela.multaValor || 0)).toFixed(2));
  const totalPagoAnterior = Math.max(
    Number(parcela.pagamentos.reduce((total, item) => total + Number(item.valorPago || 0), 0).toFixed(2)),
    Number(parcela.valorPago || 0)
  );
  const saldoAtual = Number(Math.max(0, valorFinal - totalPagoAnterior).toFixed(2));
  return { valorFinal, totalPagoAnterior, saldoAtual };
}

export function analisarDivergencia(
  cobranca: CobrancaConferencia,
  parcela: ParcelaConferencia,
  permitirPagamentoParcial = true
) {
  const valores = calcularSaldoParcela(parcela);
  const valorCobrado = Number(cobranca.valorCobrado);
  const recebido = cobranca.valorCompensado === null ? NaN : Number(cobranca.valorCompensado);
  const valorCompensado = Number.isFinite(recebido) ? recebido : null;
  const bloqueios: string[] = [];
  const divergenciasValores: string[] = [];
  if (cobranca.statusBancario !== "COMPENSADO") bloqueios.push("BANCO_NAO_COMPENSADO");
  if (cobranca.baixadoEm || cobranca.movimentoCaixaId || cobranca.statusOperacional === "BAIXADO") bloqueios.push("COBRANCA_JA_BAIXADA");
  if (cobranca.instituicaoId !== parcela.instituicaoId) bloqueios.push("INSTITUICAO_DIFERENTE");
  if (cobranca.alunoId !== parcela.alunoId) bloqueios.push("ALUNO_DIFERENTE");
  if (parcela.tipo !== "MENSALIDADE") bloqueios.push("TIPO_PARCELA_INVALIDO");
  if (parcela.status === "CANCELADO" || parcela.matricula?.status === "CANCELADA") bloqueios.push("LANCAMENTO_CANCELADO");
  if (parcela.matricula?.realizadaPeloAluno) bloqueios.push("MATRICULA_ONLINE");
  if (!Number.isFinite(valores.saldoAtual) || valores.saldoAtual <= 0 || parcela.status === "PAGO") bloqueios.push("LANCAMENTO_SEM_SALDO");
  if (valorCompensado === null || valorCompensado <= 0) bloqueios.push("VALOR_COMPENSADO_INVALIDO");
  if (valorCompensado !== null && centavos(valorCompensado) > centavos(valores.saldoAtual)) bloqueios.push("VALOR_EXCEDE_SALDO");
  const parcial = valorCompensado !== null && valorCompensado > 0 && centavos(valorCompensado) < centavos(valores.saldoAtual);
  if (parcial && !permitirPagamentoParcial) bloqueios.push("PAGAMENTO_PARCIAL_DESABILITADO");
  if (valorCompensado !== null && centavos(valorCompensado) !== centavos(valorCobrado)) divergenciasValores.push("VALOR_COMPENSADO_DIFERE_DO_BOLETO");
  if (valorCompensado !== null && centavos(valorCompensado) !== centavos(valores.saldoAtual)) divergenciasValores.push("VALOR_COMPENSADO_DIFERE_DO_SALDO");
  if (cobranca.lancamentoFinanceiroId === parcela.id && cobranca.matriculaId !== parcela.matriculaId) bloqueios.push("MATRICULA_DIFERENTE");
  return {
    ...valores, valorCobrado, valorCompensado, parcial,
    saldoAposBaixa: valorCompensado === null ? valores.saldoAtual
      : Number(Math.max(0, valores.saldoAtual - valorCompensado).toFixed(2)),
    bloqueios, divergenciasValores,
    motivos: [...bloqueios, ...divergenciasValores],
    podeResolver: bloqueios.length === 0,
  };
}

export function resolucaoAindaValida(cobranca: CobrancaConferencia, parcela: ParcelaConferencia) {
  const resolucao = objetoJson(objetoJson(cobranca.metadata).resolucaoDivergencia);
  const valores = calcularSaldoParcela(parcela);
  return resolucao.estado === "RESOLVIDA"
    && resolucao.instituicaoId === cobranca.instituicaoId
    && resolucao.alunoId === cobranca.alunoId
    && resolucao.lancamentoFinanceiroId === parcela.id
    && resolucao.matriculaId === parcela.matriculaId
    && resolucao.versaoLancamento === parcela.updatedAt.toISOString()
    && cobranca.valorCompensado !== null
    && centavos(Number(resolucao.valorCompensado)) === centavos(Number(cobranca.valorCompensado))
    && centavos(Number(resolucao.valorCobrado)) === centavos(Number(cobranca.valorCobrado))
    && centavos(Number(resolucao.saldoAtual)) === centavos(valores.saldoAtual)
    && centavos(Number(resolucao.valorFinal)) === centavos(valores.valorFinal)
    && centavos(Number(resolucao.totalPagoAnterior)) === centavos(valores.totalPagoAnterior)
    && (!analisarDivergencia(cobranca, parcela).parcial || resolucao.confirmarPagamentoParcial === true);
}
