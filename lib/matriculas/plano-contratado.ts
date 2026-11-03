/**
 * Planos opcionais na matricula: valida oferta do curso e congela o cronograma.
 * Isolamento da instituicao e conferido pela consulta ao Curso no servidor.
 * Este modulo nao altera financeiro, banco nem cobra automaticamente.
 */
import {
  cotarPlanoPagamento,
  normalizarPlanosPagamento,
  ErroPlanosPagamento,
  type PlanoPagamentoCurso,
} from "./planos-pagamento";

export type CotacaoPlanoContratado = {
  plano: PlanoPagamentoCurso;
  cotacao: ReturnType<typeof cotarPlanoPagamento>;
};

/** Um plano so e usado por escolha expressa. Ausencia de escolha preserva fluxo legado. */
export function selecionarPlanoContratado(configuracao: unknown, idInformado: unknown): CotacaoPlanoContratado | null {
  const id = typeof idInformado === "string" ? idInformado.trim() : "";
  if (!id) {
    if (idInformado != null && idInformado !== "")
      throw new ErroPlanosPagamento("Identificador de plano invalido.");
    return null;
  }
  const planos = normalizarPlanosPagamento(configuracao)?.planos ?? [];
  const plano = planos.find(p => p.id === id && p.ativo);
  if (!plano) throw new ErroPlanosPagamento("Plano de pagamento inexistente ou inativo neste curso.");
  return { plano, cotacao: cotarPlanoPagamento(plano) };
}

/** O credito de entrada e outro lancamento; as parcelas exigiveis ja o descontam. */
export function parcelasExigiveis(cotacao: ReturnType<typeof cotarPlanoPagamento>) {
  const mensais = [...cotacao.parcelasCentavos];
  if (!mensais.length || cotacao.antecipacaoCentavos >= mensais[0])
    throw new ErroPlanosPagamento("Antecipacao invalida para a primeira parcela.");
  mensais[0] -= cotacao.antecipacaoCentavos;
  if (mensais.reduce((s, v) => s + v, cotacao.antecipacaoCentavos) !== cotacao.totalCentavos)
    throw new ErroPlanosPagamento("O cronograma nao fecha com o valor total do plano.");
  return mensais;
}

export function validarValoresRecebidosDoPlano(
  escolhido: CotacaoPlanoContratado,
  informados: { valorMatricula?: unknown; valorMensalidade?: unknown; quantidadeParcelas?: unknown; bolsaPercentual?: unknown; valorInformadoNoAto?: unknown },
) {
  const { plano, cotacao } = escolhido;
  const compararDinheiro = (recebido: unknown, centavos: number, nome: string) => {
    if (recebido == null || recebido === "") return;
    if (typeof recebido !== "string" && typeof recebido !== "number")
      throw new ErroPlanosPagamento("Valor invalido para " + nome);
    const normalizado = String(recebido).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizado) || Math.round(Number(normalizado) * 100) !== centavos)
      throw new ErroPlanosPagamento("Valor de " + nome + " diverge do plano selecionado. Recarregue os dados.");
  };
  compararDinheiro(informados.valorMatricula, cotacao.antecipacaoCentavos, "antecipacao");
  compararDinheiro(informados.valorMensalidade, Math.round(Number(plano.valorParcela) * 100), "mensalidade");
  if (informados.quantidadeParcelas != null && informados.quantidadeParcelas !== "" &&
      Number(informados.quantidadeParcelas) !== cotacao.quantidadeParcelas)
    throw new ErroPlanosPagamento("Quantidade de parcelas diverge do plano selecionado.");
  if (Number(informados.bolsaPercentual ?? 0) !== 0)
    throw new ErroPlanosPagamento("Bolsa adicional em planos personalizados requer homologacao. Utilize o financeiro tradicional por enquanto.");
  const recebido = Number(informados.valorInformadoNoAto ?? 0);
  if (!Number.isFinite(recebido) || recebido < 0 ||
      (recebido > 0 && Math.round(recebido * 100) !== cotacao.antecipacaoCentavos))
    throw new ErroPlanosPagamento("O valor informado no ato deve ser zero ou a antecipacao contratada. A baixa ocorrera no Caixa.");
}

export function congelarPlanoContratado(
  escolhido: CotacaoPlanoContratado,
  cursoId: number,
  primeiroVencimento: Date,
) {
  if (!Number.isInteger(cursoId) || cursoId < 1 || !Number.isFinite(primeiroVencimento.getTime()))
    throw new ErroPlanosPagamento("Curso ou vencimento invalido para o plano contratado.");
  const { plano, cotacao } = escolhido;
  return {
    versao: 1 as const,
    id: plano.id,
    nome: plano.nome,
    cursoId,
    quantidadeParcelas: cotacao.quantidadeParcelas,
    valorParcela: plano.valorParcela,
    parcelasCentavos: [...cotacao.parcelasCentavos],
    parcelasExigiveisCentavos: parcelasExigiveis(cotacao),
    antecipacaoCentavos: cotacao.antecipacaoCentavos,
    totalCentavos: cotacao.totalCentavos,
    precoIncluiPontualidade: plano.precoIncluiPontualidade,
    primeiroVencimento: primeiroVencimento.toISOString().slice(0, 10),
    contratadoEm: new Date().toISOString(),
  };
}
