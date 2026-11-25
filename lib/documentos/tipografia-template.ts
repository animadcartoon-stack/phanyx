export const FONTE_PADRAO_TEMPLATE = "Arial, Helvetica, sans-serif";

export function tamanhoTemplateEmPontos(valor: string | null | undefined) {
  const medida = valor?.trim().match(/^(\d+(?:\.\d+)?|\.\d+)(pt|px)$/i);
  if (!medida) return "";
  const pontos = Number(medida[1]) * (medida[2].toLowerCase() === "px" ? 0.75 : 1);
  return Number.isFinite(pontos) && pontos > 0 ? String(Math.round(pontos * 100) / 100) : "";
}

export function cssTitulosTemplate(raiz: string) {
  return `
    ${raiz} h1, ${raiz} h2, ${raiz} h3,
    ${raiz} h4, ${raiz} h5, ${raiz} h6 {
      margin-block: 0;
      font-size: inherit;
      font-weight: inherit;
    }
  `;
}
