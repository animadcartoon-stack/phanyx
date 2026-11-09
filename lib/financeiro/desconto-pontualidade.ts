/**
 * Regra legada: uma faixa { percentual, diasAntecedencia }.
 * Regra nova: faixas independentes { antecipado, vencimento }.
 * A leitura de ambas preserva matriculas/contratos ja existentes.
 */
export type FaixaDescontoPontualidade = {
  percentual: number;
  diasAntecedencia: number;
};

export type FaixasDescontoPontualidade = {
  antecipado: FaixaDescontoPontualidade | null;
  vencimento: FaixaDescontoPontualidade | null;
};

export type DescontoPontualidade = FaixaDescontoPontualidade | {
  antecipado?: FaixaDescontoPontualidade | null;
  vencimento?: FaixaDescontoPontualidade | null;
};

export function lerFaixaDescontoPontualidade(valor: unknown): FaixaDescontoPontualidade | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const { percentual, diasAntecedencia } = valor as Partial<FaixaDescontoPontualidade>;
  if (typeof percentual !== "number" || !Number.isFinite(percentual) ||
      percentual <= 0 || percentual >= 100 ||
      Number(percentual.toFixed(2)) !== percentual ||
      typeof diasAntecedencia !== "number" || !Number.isInteger(diasAntecedencia) ||
      diasAntecedencia < 0 || diasAntecedencia > 365) return null;
  return { percentual, diasAntecedencia };
}

export function lerDescontoPontualidade(valor: unknown): DescontoPontualidade | null {
  const unica = lerFaixaDescontoPontualidade(valor);
  if (unica) return unica;
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const objeto = valor as Record<string, unknown>;
  const antecipadoInformado = objeto.antecipado != null;
  const vencimentoInformado = objeto.vencimento != null;
  if (!antecipadoInformado && !vencimentoInformado) return null;
  const antecipado = antecipadoInformado ? lerFaixaDescontoPontualidade(objeto.antecipado) : null;
  const vencimento = vencimentoInformado ? lerFaixaDescontoPontualidade(objeto.vencimento) : null;
  if ((antecipadoInformado && (!antecipado || antecipado.diasAntecedencia < 1)) ||
      (vencimentoInformado && (!vencimento || vencimento.diasAntecedencia !== 0))) return null;
  return { antecipado, vencimento };
}

export function faixasDescontoPontualidade(valor: unknown): FaixasDescontoPontualidade {
  const regra = lerDescontoPontualidade(valor);
  if (!regra) return { antecipado: null, vencimento: null };
  if ("percentual" in regra) {
    return regra.diasAntecedencia === 0
      ? { antecipado: null, vencimento: regra }
      : { antecipado: regra, vencimento: null };
  }
  return { antecipado: regra.antecipado ?? null, vencimento: regra.vencimento ?? null };
}

/** Somente para formularios: preserva a digitacao parcial (inclusive 0 temporario). */
export function faixasParaEdicaoPontualidade(regra: DescontoPontualidade | null): FaixasDescontoPontualidade {
  if (!regra) return { antecipado: null, vencimento: null };
  if ("percentual" in regra) {
    return regra.diasAntecedencia > 0
      ? { antecipado: regra, vencimento: null }
      : { antecipado: null, vencimento: regra };
  }
  return { antecipado: regra.antecipado ?? null, vencimento: regra.vencimento ?? null };
}

const calendarioFinanceiro = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function diaFinanceiro(data: Date) {
  return calendarioFinanceiro.format(data);
}

// Vencimentos e datas bancarias sem horario sao datas civis, gravadas em UTC.
export function limiteDescontoPontualidade(vencimento: Date, diasAntecedencia: number) {
  const limite = new Date(vencimento);
  limite.setUTCDate(limite.getUTCDate() - diasAntecedencia);
  return limite.toISOString().slice(0, 10);
}

export function descontoPontualidadeEmReais(base: number, percentual: number) {
  const centavos = Math.round(base * 100);
  const desconto = Math.round(centavos * Math.round(percentual * 100) / 10000);
  return desconto > 0 && desconto < centavos ? desconto / 100 : 0;
}

export function descontoPontualidadeAposCredito(saldo: number, percentual: number, credito = 0) {
  const base = (Math.round(saldo * 100) + Math.round(credito * 100)) / 100;
  const desconto = descontoPontualidadeEmReais(base, percentual);
  return desconto < saldo ? desconto : 0;
}

/** Apenas uma faixa por pagamento, sempre com prioridade para antecipacao. */
export function faixaAplicavelPontualidade(valor: unknown, vencimento: Date, diaPagamento: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(diaPagamento)) return null;
  const faixas = faixasDescontoPontualidade(valor);
  if (faixas.antecipado) {
    const limite = limiteDescontoPontualidade(vencimento, faixas.antecipado.diasAntecedencia);
    if (diaPagamento <= limite) return { ...faixas.antecipado, limite, tipo: "ANTECIPADO" as const };
  }
  if (faixas.vencimento) {
    const limite = limiteDescontoPontualidade(vencimento, 0);
    if (diaPagamento <= limite) return { ...faixas.vencimento, limite, tipo: "VENCIMENTO" as const };
  }
  return null;
}

export function cotarDescontoPontualidade(
  parcela: { tipo: string; status: string; vencimento: Date | null; valorPago?: number | null; valorAntecipacaoAbatida?: number;
    pagamentos: Array<{ valorPago: number }>; matricula?: { descontoPontualidade?: unknown } | null },
  valorBase: number,
  diaPagamento: string,
) {
  if (parcela.tipo !== "MENSALIDADE" || !parcela.vencimento ||
      !["PENDENTE", "ATRASADO"].includes(parcela.status) ||
      Number(parcela.valorPago) > 0 || parcela.pagamentos.some(p => p.valorPago > 0)) return null;
  const regra = faixaAplicavelPontualidade(parcela.matricula?.descontoPontualidade, parcela.vencimento, diaPagamento);
  if (!regra) return null;
  const credito = parcela.valorAntecipacaoAbatida ?? 0;
  const desconto = descontoPontualidadeAposCredito(valorBase, regra.percentual, credito);
  if (desconto <= 0) return null;
  return { ...regra, desconto, ...(credito > 0 ? { descontoFixo: desconto } : {}),
    valorComDesconto: Math.round((valorBase - desconto) * 100) / 100 };
}
