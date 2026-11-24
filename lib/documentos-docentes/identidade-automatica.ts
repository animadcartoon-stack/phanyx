// Marcadores explicitos: nao reinterpretar campos manuais nem modelos anteriores.
const MARCADOR_IDENTIDADE = /\{\{\s*docente:(teacherName|nomeProfessor|institutionName|nomeInstituicao)\s*\}\}/g;

function escaparValor(valor: string): string {
  return valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
    .replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}

/** Resolve exclusivamente os marcadores de identidade no texto do snapshot novo. */
export function preencherIdentidadeDocente(html: string, dados: { professor: string; instituicao: string }): string {
  // Nao substituir marcadores dentro de atributos ou comentarios HTML.
  return String(html || "").split(/(<!--[\s\S]*?-->|<(?:(?:"[^"]*"|'[^']*')|[^'">])*>)/g)
    .map((parte, i) => i % 2 ? parte : parte.replace(MARCADOR_IDENTIDADE, (_tag, chave: string) =>
      escaparValor(chave === "teacherName" || chave === "nomeProfessor" ? dados.professor : dados.instituicao)))
    .join("");
}