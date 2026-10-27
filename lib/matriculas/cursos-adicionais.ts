import { ErroModalidades, idsPositivos } from "./combos";

export type ConfiguracaoAdicionais = {
  permiteCursosAdicionais?: boolean; disponivelComoAdicional?: boolean;
  organizacaoCurricular?: string; regrasPrecoDisciplinas?: unknown; regrasSelecaoDisciplinas?: unknown;
};
export function camposCursosAdicionais(body: Record<string, unknown>, atual: ConfiguracaoAdicionais = {}) {
  const dados: { permiteCursosAdicionais?: boolean; disponivelComoAdicional?: boolean } = {};
  for (const campo of ["permiteCursosAdicionais", "disponivelComoAdicional"] as const) {
    if (body[campo] !== undefined) {
      if (typeof body[campo] !== "boolean") throw new ErroModalidades("ADICIONAIS_CONFIGURACAO_INVALIDA");
      dados[campo] = body[campo] as boolean;
    }
  }
  const final = { ...atual, ...body, ...dados };
  if ((final.permiteCursosAdicionais || final.disponivelComoAdicional) &&
    (final.organizacaoCurricular === "LIVRE" || final.regrasPrecoDisciplinas || final.regrasSelecaoDisciplinas))
    throw new ErroModalidades("ADICIONAIS_MODO_INCOMPATIVEL");
  return dados;
}
export function idCursoPrincipal(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return null;
  return idsPositivos([valor])[0];
}
export function validarCursosAdicionais<T extends ConfiguracaoAdicionais & { id: number }>(cursos: T[], principalId: number | null) {
  if (principalId === null) return null; // Mantém o fluxo geral de combos já existente.
  const principal = cursos.find(c => c.id === principalId);
  if (!principal || !principal.permiteCursosAdicionais) throw new ErroModalidades("PRINCIPAL_NAO_PERMITE_ADICIONAIS", 409);
  if (cursos.some(c => c.id !== principalId && !c.disponivelComoAdicional)) throw new ErroModalidades("CURSO_NAO_DISPONIVEL_ADICIONAL", 409);
  return principal;
}
export function urlCursosAdicionais(cursoId: number, alunoId?: string | number | null) {
  const params = new URLSearchParams({ cursoPrincipalId: String(idsPositivos([cursoId])[0]) });
  if (alunoId !== undefined && alunoId !== null && alunoId !== "") params.set("alunoId", String(idsPositivos([alunoId])[0]));
  return `/admin/matriculas/modalidades?${params}`;
}
