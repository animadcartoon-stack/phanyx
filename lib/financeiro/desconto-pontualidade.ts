export type DescontoPontualidade = {
  percentual: number;
  diasAntecedencia: number;
};

export function lerDescontoPontualidade(valor: unknown): DescontoPontualidade | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const { percentual, diasAntecedencia } = valor as Partial<DescontoPontualidade>;
  if (typeof percentual !== "number" || !Number.isFinite(percentual) ||
      percentual <= 0 || percentual >= 100 ||
      Number(percentual.toFixed(2)) !== percentual ||
      typeof diasAntecedencia !== "number" || !Number.isInteger(diasAntecedencia) ||
      diasAntecedencia < 0 || diasAntecedencia > 365) return null;
  return { percentual, diasAntecedencia };
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

// Vencimentos e datas bancárias sem horário são datas civis, gravadas em UTC.
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

export function cotarDescontoPontualidade(
  parcela: { tipo: string; status: string; vencimento: Date | null; valorPago?: number | null;
    pagamentos: Array<{ valorPago: number }>; matricula?: { descontoPontualidade?: unknown } | null },
  valorBase: number,
  diaPagamento: string,
) {
  const regra = lerDescontoPontualidade(parcela.matricula?.descontoPontualidade);
  if (!regra || parcela.tipo !== "MENSALIDADE" || !parcela.vencimento ||
      !["PENDENTE", "ATRASADO"].includes(parcela.status) ||
      Number(parcela.valorPago) > 0 || parcela.pagamentos.some(p => p.valorPago > 0)) return null;
  const limite = limiteDescontoPontualidade(parcela.vencimento, regra.diasAntecedencia);
  if (diaPagamento > limite) return null;
  const desconto = descontoPontualidadeEmReais(valorBase, regra.percentual);
  if (desconto <= 0) return null;
  return { ...regra, limite, desconto, valorComDesconto: Math.round((valorBase - desconto) * 100) / 100 };
}
