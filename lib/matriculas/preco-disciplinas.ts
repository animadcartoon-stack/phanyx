import { mensalidadeComDesconto, percentualDescontoCurso } from "./desconto-curso";
export type FaixaPrecoDisciplinas = { quantidade: number; descontoPercentual: number };
export type RegrasPrecoDisciplinas = { versao: 1; faixas: FaixaPrecoDisciplinas[] };
export class ErroPrecoDisciplinas extends Error {
  constructor(public codigo: string, public status = 400) { super(codigo); }
}
export function normalizarRegrasDisciplinas(valor: unknown): RegrasPrecoDisciplinas | null {
  if (valor == null) return null;
  if (typeof valor !== "object" || Array.isArray(valor) || !("versao" in valor) || valor.versao !== 1 || !("faixas" in valor) || !Array.isArray(valor.faixas) || !valor.faixas.length || valor.faixas.length > 100) throw new ErroPrecoDisciplinas("REGRAS_DISCIPLINAS_INVALIDAS");
  const usados = new Set<number>();
  const faixas = valor.faixas.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item) || !["string", "number"].includes(typeof item.quantidade) || !/^\d+$/.test(String(item.quantidade))) throw new ErroPrecoDisciplinas("REGRAS_DISCIPLINAS_INVALIDAS");
    const quantidade = Number(item.quantidade);
    let descontoPercentual: number;
    try { descontoPercentual = percentualDescontoCurso(item.descontoPercentual) ?? 0; } catch { throw new ErroPrecoDisciplinas("REGRAS_DISCIPLINAS_INVALIDAS"); }
    if (quantidade < 1 || quantidade > 100 || usados.has(quantidade)) throw new ErroPrecoDisciplinas("REGRAS_DISCIPLINAS_INVALIDAS");
    usados.add(quantidade); return { quantidade, descontoPercentual };
  }).sort((a, b) => a.quantidade - b.quantidade);
  return { versao: 1, faixas };
}
export function calcularPrecoDisciplinas(valorUnitario: unknown, configuracao: unknown, ids: unknown) {
  const regras = normalizarRegrasDisciplinas(configuracao);
  if (!regras || !Array.isArray(ids) || !ids.length || ids.some(id => !["string", "number"].includes(typeof id) || !/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) || new Set(ids.map(Number)).size !== ids.length) throw new ErroPrecoDisciplinas("SELECIONE_DISCIPLINAS");
  const disciplinaIds: number[] = ids.map(Number).sort((a, b) => a - b);
  const faixa = regras.faixas.find(f => f.quantidade === disciplinaIds.length);
  if (!faixa) throw new ErroPrecoDisciplinas("QUANTIDADE_DISCIPLINAS_NAO_CONFIGURADA");
  if (valorUnitario == null || valorUnitario === "" || !["string", "number"].includes(typeof valorUnitario) || !Number.isFinite(Number(valorUnitario)) || Number(valorUnitario) <= 0 || Number(valorUnitario) > 99999999.99) throw new ErroPrecoDisciplinas("PRECO_DISCIPLINA_INVALIDO");
  const unitarioCentavos = Math.round(Number(valorUnitario) * 100), subtotal = unitarioCentavos * disciplinaIds.length / 100;
  const total = mensalidadeComDesconto(subtotal, faixa.descontoPercentual)!;
  if (total > 99999999.99) throw new ErroPrecoDisciplinas("PRECO_DISCIPLINA_INVALIDO");
  return { disciplinaIds, quantidade: disciplinaIds.length, valorUnitario: unitarioCentavos / 100, subtotal,
    descontoPercentual: faixa.descontoPercentual, descontoValor: Math.round((subtotal - total) * 100) / 100, total };
}
export type ContratacaoDisciplinas = ReturnType<typeof calcularPrecoDisciplinas> & { versao: 1; cursoId: number;
  regras: RegrasPrecoDisciplinas; auditoria?: unknown; criadaEm: string; criadaPorId: number; revisoes?: unknown[] };
export function lerContratacaoDisciplinas(valor: unknown): ContratacaoDisciplinas | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor) || !("versao" in valor) || valor.versao !== 1 || !("regras" in valor) || !("disciplinaIds" in valor)) return null;
  return valor as ContratacaoDisciplinas;
}
