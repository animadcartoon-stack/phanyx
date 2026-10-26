// API e regras novas usam etapa. Os nomes CursoSemestre/TurmaSemestre são
// compatibilidade física com as relações e os IDs históricos do banco.
export type OrganizacaoAcademica = "SEMESTRAL" | "ANUAL" | "LIVRE";
export type ContextoEtapa = {
  organizacaoCurricular?: string | null;
  etapaNumero?: number | null;
  semestre?: unknown;
};
export function organizacaoAcademica(valor: unknown): OrganizacaoAcademica {
  return valor === "LIVRE" ? "LIVRE" : valor === "ANUAL" ? "ANUAL" : "SEMESTRAL";
}
export function numeroEtapa(valor: unknown): number | null {
  if (typeof valor !== "number" && typeof valor !== "string") return null;
  const texto = String(valor).trim();
  // Compatibilidade com valores semestrais antigos como “2º semestre”.
  if (!/^\d+(?:\s*[º°ª]?\s*(?:semestre|ano))?$/i.test(texto)) return null;
  const n = Number(texto.match(/^\d+/)?.[0]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
export function etapaDaOferta(contexto: ContextoEtapa): number | null {
  if (contexto.organizacaoCurricular === "LIVRE") return null;
  return numeroEtapa(contexto.etapaNumero) ??
    (organizacaoAcademica(contexto.organizacaoCurricular) === "SEMESTRAL" ? numeroEtapa(contexto.semestre) : null);
}

export function valoresEtapaDocumento(contexto: ContextoEtapa | null | undefined, locale = "pt-BR") {
  const numero = contexto ? etapaDaOferta(contexto) : null;
  const anual = contexto?.organizacaoCurricular === "ANUAL";
  const idioma = locale.slice(0, 2);
  const labels = idioma === "en" ? ["Annual", "Semester based", "Year", "Semester"]
    : idioma === "es" ? ["Anual", "Semestral", "Año", "Semestre"]
    : idioma === "fr" ? ["Annuelle", "Semestrielle", "Année", "Semestre"]
    : ["Anual", "Semestral", "Ano", "Semestre"];
  if (contexto?.organizacaoCurricular === "LIVRE") return { etapaAtual: "-", anoCurricular: "-", organizacaoCurricular: idioma === "en" ? "Open course" : idioma === "es" ? "Curso libre" : idioma === "fr" ? "Cours libre" : "Curso livre" };
  return { etapaAtual: numero ? `${labels[anual ? 2 : 3]} ${numero}` : "-",
    organizacaoCurricular: labels[anual ? 0 : 1],
    anoCurricular: anual && numero ? String(numero) : "-" };
}
