/**
 * Marcadores exclusivos de documentos docentes.
 * Compatibilidade: {{campo:Objetivos}} continua representando uma linha em branco.
 * Opcional: {{campo:Objetivos|linhas:5}} reserva cinco linhas somente quando vazio
 * ou ao gerar o formulario em branco para impressao.
 * Nenhum atributo de altura limita o texto preenchido digitalmente.
 */
const MARCADOR_DOCENTE = /\{\{\s*campo:([^{}|]{1,80}?)(?:\s*\|\s*linhas\s*:\s*(\d{1,3}))?\s*\}\}/giu;
const NOME_VALIDO = /^[\p{L}\p{N}][\p{L}\p{N} _-]{0,79}$/u;
export const MAX_LINHAS_CAMPO_DOCENTE = 999;

export function nomeCampoDocenteValido(nome: string): boolean {
  return NOME_VALIDO.test(nome.trim());
}

export function camposModeloDocente(html: string): string[] {
  const nomes = new Set<string>();
  for (const resultado of String(html || "").matchAll(MARCADOR_DOCENTE)) {
    const nome = resultado[1].trim();
    if (nomeCampoDocenteValido(nome)) nomes.add(nome);
  }
  return Array.from(nomes);
}

export function marcadorCampoDocente(nome: string, linhas: number): string {
  const limpo = nome.trim();
  if (!nomeCampoDocenteValido(limpo) || !Number.isSafeInteger(linhas) || linhas < 0 || linhas > MAX_LINHAS_CAMPO_DOCENTE) {
    throw new Error("Nome do campo ou quantidade de linhas inválidos.");
  }
  return linhas === 1 ? `{{campo:${limpo}}}` : `{{campo:${limpo}|linhas:${linhas}}}`;
}

export function atualizarLinhasCampoDocente(html: string, nome: string, linhas: number): { html: string; quantidade: number } {
  const marcador = marcadorCampoDocente(nome, linhas);
  let quantidade = 0;
  const alterado = String(html || "").replace(MARCADOR_DOCENTE, (texto, campo: string) => {
    if (campo.trim() !== nome.trim()) return texto;
    quantidade += 1;
    return marcador;
  });
  return { html: alterado, quantidade };
}

function htmlSeguro(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function linhasVazias(quantidade: number): string {
  const linhas = Number.isSafeInteger(quantidade) && quantidade >= 0 && quantidade <= MAX_LINHAS_CAMPO_DOCENTE ? quantidade : 1;
  if (linhas === 0) return "";
  const linha = '<span aria-hidden="true" style="display:block;width:100%;height:24px;min-height:24px;box-sizing:border-box;border-bottom:1px solid #64748b"></span>';
  // Acima de 12 linhas, permitir a quebra natural entre paginas da impressao.
  const quebra = linhas > 12 ? "auto" : "avoid";
  return `<span class="phanyx-campo-docente-em-branco" style="display:block;width:100%;max-width:100%;break-inside:${quebra};margin:2px 0 8px">${linha.repeat(linhas)}</span>`;
}

/** Transforma os marcadores em linhas para impressao ou texto real com fluxo livre. */
export function renderizarCamposDocentes(html: string, valores: Record<string, unknown>, forcarBranco = false): string {
  return String(html || "").replace(MARCADOR_DOCENTE, (marcador, nomeBruto: string, linhasBrutas: string | undefined) => {
    const nome = nomeBruto.trim();
    if (!nomeCampoDocenteValido(nome)) return marcador;
    const valor = valores?.[nome];
    if (!forcarBranco && typeof valor === "string" && valor.trim()) {
      return `<span class="phanyx-campo-docente-preenchido" style="white-space:normal;overflow-wrap:anywhere">${htmlSeguro(valor).replace(/\r\n?|\n/g, "<br />")}</span>`;
    }
    const linhas = linhasBrutas !== undefined ? Number(linhasBrutas) : 1;
    return linhasVazias(linhas);
  });
}
