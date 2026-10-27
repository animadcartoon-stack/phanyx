export type GrupoSelecao = { id: string; nome: string; minimo: number; maximo: number; disciplinaIds: number[] };
export type RegrasSelecaoDisciplinas = {
  versao: 1;
  horariosPendentesPermitidos: boolean;
  disciplinaIdsObrigatorias: number[];
  grupos: GrupoSelecao[];
};

export class ErroSelecaoDisciplinas extends Error {
  constructor(public codigo: string, public detalhes?: Record<string, unknown>, public status = 400) {
    super(codigo);
    this.name = "ErroSelecaoDisciplinas";
  }
}

function ids(valor: unknown): number[] {
  if (!Array.isArray(valor) || valor.length > 200 || valor.some(id => typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) || new Set(valor).size !== valor.length)
    throw new ErroSelecaoDisciplinas("REGRAS_SELECAO_INVALIDAS");
  return [...valor].sort((a, b) => a - b);
}

export function normalizarSelecaoDisciplinas(valor: unknown): RegrasSelecaoDisciplinas | null {
  if (valor == null) return null;
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) throw new ErroSelecaoDisciplinas("REGRAS_SELECAO_INVALIDAS");
  const v = valor as Record<string, unknown>;
  if (v.versao !== 1 || typeof v.horariosPendentesPermitidos !== "boolean" || !Array.isArray(v.grupos) || !v.grupos.length || v.grupos.length > 30)
    throw new ErroSelecaoDisciplinas("REGRAS_SELECAO_INVALIDAS");
  const obrigatorias = ids(v.disciplinaIdsObrigatorias);
  const usados = new Set(obrigatorias), gruposIds = new Set<string>();
  const grupos = v.grupos.map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new ErroSelecaoDisciplinas("REGRAS_SELECAO_INVALIDAS");
    const g = item as Record<string, unknown>;
    if (typeof g.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(g.id) || gruposIds.has(g.id) || typeof g.nome !== "string" || !g.nome.trim() || g.nome.trim().length > 100 || !Number.isInteger(g.minimo) || !Number.isInteger(g.maximo))
      throw new ErroSelecaoDisciplinas("REGRAS_SELECAO_INVALIDAS");
    const disciplinaIds = ids(g.disciplinaIds), minimo = g.minimo as number, maximo = g.maximo as number;
    if (minimo < 0 || maximo < 1 || minimo > maximo || maximo > disciplinaIds.length)
      throw new ErroSelecaoDisciplinas("REGRAS_SELECAO_INVALIDAS");
    gruposIds.add(g.id);
    for (const id of disciplinaIds) {
      if (usados.has(id)) throw new ErroSelecaoDisciplinas("DISCIPLINA_EM_MAIS_DE_UM_GRUPO");
      usados.add(id);
    }
    return { id: g.id, nome: g.nome.trim(), minimo, maximo, disciplinaIds };
  });
  if (usados.size > 200 || !obrigatorias.length && grupos.every(g => g.minimo === 0))
    throw new ErroSelecaoDisciplinas("REGRAS_SELECAO_INVALIDAS");
  return { versao: 1, horariosPendentesPermitidos: v.horariosPendentesPermitidos, disciplinaIdsObrigatorias: obrigatorias, grupos };
}

export function validarSelecaoDisciplinas(valor: unknown, selecionadas: number[], gradeIds?: number[]) {
  const regras = normalizarSelecaoDisciplinas(valor);
  if (!regras) return null;
  const escolhidas = ids(selecionadas), selecao = new Set(escolhidas);
  const permitidas = new Set([...regras.disciplinaIdsObrigatorias, ...regras.grupos.flatMap(g => g.disciplinaIds)]);
  if (gradeIds && [...permitidas].some(id => !gradeIds.includes(id))) throw new ErroSelecaoDisciplinas("GRADE_SELECAO_ALTERADA", undefined, 409);
  if (escolhidas.some(id => !permitidas.has(id))) throw new ErroSelecaoDisciplinas("DISCIPLINA_FORA_DA_SELECAO");
  if (regras.disciplinaIdsObrigatorias.some(id => !selecao.has(id))) throw new ErroSelecaoDisciplinas("SELECAO_OBRIGATORIA_AUSENTE");
  for (const g of regras.grupos) {
    const quantidade = g.disciplinaIds.filter(id => selecao.has(id)).length;
    if (quantidade < g.minimo || quantidade > g.maximo)
      throw new ErroSelecaoDisciplinas("LIMITE_GRUPO_SELECAO", { nome: g.nome, minimo: g.minimo, maximo: g.maximo, quantidade });
  }
  return regras;
}

export function validarModoSelecao(curso: { organizacaoCurricular?: string; regrasPrecoDisciplinas?: unknown; participaCombo?: boolean; permiteCursosAdicionais?: boolean; disponivelComoAdicional?: boolean }) {
  if (curso.organizacaoCurricular === "LIVRE" || curso.regrasPrecoDisciplinas || curso.participaCombo || curso.permiteCursosAdicionais || curso.disponivelComoAdicional)
    throw new ErroSelecaoDisciplinas("SELECAO_EXIGE_PRECO_FIXO");
}

export function idsDaSelecao(regras: RegrasSelecaoDisciplinas) {
  return [...regras.disciplinaIdsObrigatorias, ...regras.grupos.flatMap(g => g.disciplinaIds)];
}

export type PeriodoDisciplinaIncluida = { disciplinaId: number; incluida: boolean; inicio: string | null; fim: string | null };
export function temDisciplinaIncluidaDuplicada(novas: PeriodoDisciplinaIncluida[], existentes: PeriodoDisciplinaIncluida[]) {
  return novas.some(n => existentes.some(e => n.disciplinaId === e.disciplinaId && (n.incluida || e.incluida) &&
    (!n.fim || !e.inicio || n.fim >= e.inicio) && (!e.fim || !n.inicio || e.fim >= n.inicio)));
}
