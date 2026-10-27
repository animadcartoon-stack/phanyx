export type TradutorRequisitos = (chave: string, valores?: Record<string, string | number>) => string;
export function faltantesRequisitos(detalhes: unknown): { cursoNome: string; obrigatorioNome: string }[] {
  if (!detalhes || typeof detalhes !== "object" || !("faltantes" in detalhes) || !Array.isArray(detalhes.faltantes)) return [];
  return detalhes.faltantes.filter((v): v is { cursoNome: string; obrigatorioNome: string } =>
    v && typeof v === "object" && typeof v.cursoNome === "string" && typeof v.obrigatorioNome === "string");
}
export function mensagemRequisitoCurso(t: TradutorRequisitos, data: { codigo?: unknown; detalhes?: unknown }) {
  if (data.codigo === "CURSO_CONJUNTO_PENDENTE") {
    const cursos = faltantesRequisitos(data.detalhes).map(f => t("dependency", { course: f.cursoNome, required: f.obrigatorioNome })).join("; ");
    return cursos ? t("missing", { courses: cursos }) : t("errors.CURSO_CONJUNTO_PENDENTE");
  }
  return null;
}
