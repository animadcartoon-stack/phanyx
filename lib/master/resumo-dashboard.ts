export type OperacaoMaster = { id: string; tipo: string; status: string; valor: number; instituicaoId: number | null; asaasId: string | null };
type InstituicaoMaster = { id: number; ativo: boolean; isentaPagamento: boolean };
const status = (valor: string) => valor.trim().toUpperCase();
const pago = (valor: string) => ["PAGO", "PAID", "RECEIVED", "CONFIRMED", "CONFIRMADO", "APROVADO"].includes(status(valor));
const pendente = (valor: string) => ["PENDING", "PENDENTE", "AGUARDANDO_PAGAMENTO", "AGUARDANDO PAGAMENTO"].includes(status(valor));

// Estes são estados do cadastro. As tabelas legadas não identificam teste/produção.
export function resumirDashboardMaster(instituicoes: InstituicaoMaster[], operacoes: OperacaoMaster[]) {
  const ids = new Set(instituicoes.map(i => i.id));
  const isentas = new Set(instituicoes.filter(i => i.isentaPagamento).map(i => i.id));
  const adesoes = operacoes.filter(o => o.tipo === "ADESAO_INSTITUICAO");
  const somar = (itens: OperacaoMaster[], excluirIsentas = false) => {
    const cobrancas = new Set<string>();
    let centavos = 0;
    for (const item of itens) {
      if (excluirIsentas && item.instituicaoId !== null && isentas.has(item.instituicaoId)) continue;
      const chave = item.asaasId ? `${item.tipo}:${item.asaasId}` : `${item.tipo}:cadastro:${item.id}`;
      if (cobrancas.has(chave)) continue;
      cobrancas.add(chave);
      if (Number.isFinite(item.valor) && item.valor >= 0) centavos += Math.round(item.valor * 100);
    }
    return centavos / 100;
  };
  return {
    totalInstituicoes: instituicoes.length,
    totalInstituicoesAtivas: instituicoes.filter(i => i.ativo).length,
    totalInstituicoesIsentas: isentas.size,
    totalAdesoes: adesoes.length,
    totalPagas: adesoes.filter(o => pago(o.status)).length,
    totalPendentes: adesoes.filter(o => pendente(o.status)).length,
    totalComInstituicaoCriada: adesoes.filter(o => o.instituicaoId !== null && ids.has(o.instituicaoId)).length,
    faturamentoPago: somar(adesoes.filter(o => pago(o.status)), true),
    faturamentoPrevisto: somar(adesoes.filter(o => pendente(o.status)), true),
    totalOperacoes: operacoes.length,
    porOrigem: ["ADESAO_INSTITUICAO", "MATRICULA_IBE", "CHECKOUT_PHANYX"].map(tipo => {
      const itens = operacoes.filter(o => o.tipo === tipo);
      return { tipo, registros: itens.length, pagos: itens.filter(o => pago(o.status)).length,
        valorMarcadoPago: somar(itens.filter(o => pago(o.status)), tipo === "ADESAO_INSTITUICAO") };
    }),
  };
}
