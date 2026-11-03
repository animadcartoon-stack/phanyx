/**
 * PHANYX - planos de pagamento opcionais.
 * Fonte de preco por curso, isolada por instituicao pela consulta do Curso.
 * Nao gera cobrancas: o cronograma precisa ser congelado em Matricula antes de ativar recebimentos.
 */
export type ParcelaAjustada = { numero: number; valor: string };
export type PlanoPagamentoCurso = {
  id: string;
  nome: string;
  quantidadeParcelas: number;
  valorParcela: string;
  ajustes: ParcelaAjustada[];
  valorAntecipacao: string;
  precoIncluiPontualidade: boolean;
  ativo: boolean;
};
export type ConfiguracaoPlanosPagamento = { versao: 1; planos: PlanoPagamentoCurso[] };

export class ErroPlanosPagamento extends Error {
  constructor(mensagem: string) { super(mensagem); this.name = 'ErroPlanosPagamento'; }
}

/** Mantem cents como inteiro e proibe expressao numerica ou valores com >2 decimais. */
export function dinheiroEmCentavos(valor: unknown, permiteZero = false): number {
  const texto = typeof valor === 'number' && Number.isFinite(valor)
    ? String(valor) : typeof valor === 'string' ? valor.trim() : '';
  if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) throw new ErroPlanosPagamento('Valor monetário inválido. Utilize até duas casas decimais.');
  const [integral, decimal = ''] = texto.split('.');
  const centavos = Number(integral) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(centavos) || centavos > 9999999999 || (permiteZero ? centavos < 0 : centavos <= 0)) {
    throw new ErroPlanosPagamento('Valor fora do limite permitido.');
  }
  return centavos;
}
export function dinheiroTexto(centavos: number): string {
  if (!Number.isSafeInteger(centavos) || centavos < 0) throw new ErroPlanosPagamento('Valor inválido.');
  return (centavos / 100).toFixed(2);
}
const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function normalizarPlanosPagamento(valor: unknown): ConfiguracaoPlanosPagamento | null {
  if (valor == null) return null;
  if (!objeto(valor) || valor.versao !== 1 || !Array.isArray(valor.planos) || valor.planos.length > 40) {
    throw new ErroPlanosPagamento('Configuração de planos inválida (versão ou quantidade de opções).');
  }
  if (!valor.planos.length) return null;
  const ids = new Set<string>();
  const planos: PlanoPagamentoCurso[] = valor.planos.map((bruto: unknown) => {
    if (!objeto(bruto)) throw new ErroPlanosPagamento('Plano de pagamento inválido.');
    const id = String(bruto.id ?? '').trim();
    const nome = String(bruto.nome ?? '').trim();
    const quantidadeParcelas = Number(bruto.quantidadeParcelas);
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || ids.has(id)) throw new ErroPlanosPagamento('Identificador de plano inválido ou repetido.');
    ids.add(id);
    if (!nome || nome.length > 120 || /[<>]/.test(nome)) throw new ErroPlanosPagamento('Nome do plano inválido.');
    if (!Number.isInteger(quantidadeParcelas) || quantidadeParcelas < 1 || quantidadeParcelas > 120) {
      throw new ErroPlanosPagamento('Número de parcelas deve estar entre 1 e 120.');
    }
    const valorParcela = dinheiroEmCentavos(bruto.valorParcela);
    const ajustesBrutos = bruto.ajustes ?? [];
    if (!Array.isArray(ajustesBrutos) || ajustesBrutos.length > quantidadeParcelas) throw new ErroPlanosPagamento('Ajustes de parcelas inválidos.');
    const numeros = new Set<number>();
    const ajustes: ParcelaAjustada[] = ajustesBrutos.map(item => {
      if (!objeto(item)) throw new ErroPlanosPagamento('Ajuste de parcela inválido.');
      const numero = Number(item.numero);
      if (!Number.isInteger(numero) || numero < 1 || numero > quantidadeParcelas || numeros.has(numero)) {
        throw new ErroPlanosPagamento('Número de parcela ajustada inválido ou repetido.');
      }
      numeros.add(numero);
      return { numero, valor: dinheiroTexto(dinheiroEmCentavos(item.valor)) };
    }).sort((a, b) => a.numero - b.numero);
    const valorAntecipacao = dinheiroEmCentavos(bruto.valorAntecipacao ?? '0', true);
    const primeira = ajustes.find(item => item.numero === 1);
    const primeiraEmCentavos = primeira ? dinheiroEmCentavos(primeira.valor) : valorParcela;
    if (valorAntecipacao >= primeiraEmCentavos && valorAntecipacao > 0) {
      throw new ErroPlanosPagamento('A antecipação deve ser menor do que a primeira parcela.');
    }
    if (typeof bruto.precoIncluiPontualidade !== 'boolean' || typeof bruto.ativo !== 'boolean') {
      throw new ErroPlanosPagamento('Defina se o preço inclui pontualidade e se o plano está ativo.');
    }
    return {
      id, nome, quantidadeParcelas, valorParcela: dinheiroTexto(valorParcela), ajustes,
      valorAntecipacao: dinheiroTexto(valorAntecipacao),
      precoIncluiPontualidade: bruto.precoIncluiPontualidade,
      ativo: bruto.ativo,
    };
  });
  return { versao: 1, planos };
}

export function cotarPlanoPagamento(plano: PlanoPagamentoCurso) {
  const valorPadrao = dinheiroEmCentavos(plano.valorParcela);
  const parcelasCentavos = Array.from({ length: plano.quantidadeParcelas }, () => valorPadrao);
  for (const ajuste of plano.ajustes) parcelasCentavos[ajuste.numero - 1] = dinheiroEmCentavos(ajuste.valor);
  const totalCentavos = parcelasCentavos.reduce((acc, v) => acc + v, 0);
  if (!Number.isSafeInteger(totalCentavos)) throw new ErroPlanosPagamento('Total excede o limite permitido.');
  const antecipacaoCentavos = dinheiroEmCentavos(plano.valorAntecipacao, true);
  if (antecipacaoCentavos > parcelasCentavos[0]) throw new ErroPlanosPagamento('Antecipação maior que a primeira parcela.');
  // A antecipacao NAO e um adicional. Quando recebida, reduz o valor devido na primeira parcela.
  const restantePrimeiraParcelaCentavos = parcelasCentavos[0] - antecipacaoCentavos;
  return {
    totalCentavos,
    parcelasCentavos,
    antecipacaoCentavos,
    restantePrimeiraParcelaCentavos,
    quantidadeParcelas: plano.quantidadeParcelas,
  };
}
