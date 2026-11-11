export const modelosPapelPdf = {
  branco: { cor: "#ffffff", faixa: "#ffffff", texto: "#111827" },
  classico: { cor: "#ffffff", faixa: "#eaf1fc", texto: "#173968" },
  central: { cor: "#fffdf7", faixa: "#f3e8cb", texto: "#614412" },
  faixa: { cor: "#ffffff", faixa: "#183b54", texto: "#ffffff" },
  discreto: { cor: "#ffffff", faixa: "#f3f4f6", texto: "#334155" },
  marca: { cor: "#ffffff", faixa: "#ecf5ef", texto: "#24523c" },
} as const;

export type ModeloPapelPdf = keyof typeof modelosPapelPdf;
export type InstituicaoPapelPdf = { nome: string; logoUrl: string | null };
export type MargensPapelPdf = { superior: number; direita: number; inferior: number; esquerda: number };
export type PapelTextoPdf = {
  modelo: ModeloPapelPdf;
  primeira: ModeloPapelPdf | "igual";
  margens: MargensPapelPdf;
  fundo: string;
};
export const papelPadrao: PapelTextoPdf = {
  modelo: "branco", primeira: "igual", margens: { superior: 1.8, direita: 1.8, inferior: 1.8, esquerda: 1.8 }, fundo: "",
};

export function logoPapelPdf(logo: string | null, origem: string) {
  if (!logo) return null;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/]+={0,2}$/i.test(logo)) return logo;
  try {
    const url = new URL(logo, origem);
    return (url.protocol === "https:" || url.origin === origem) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function textoCss(valor: string) {
  return '"' + valor.replace(/[\x00-\x1f\x7f"\\<>]/g, c => `\\${c.codePointAt(0)?.toString(16)} `) + '"';
}

export function cssImpressaoPapelPdf(papel: PapelTextoPdf, marca: InstituicaoPapelPdf | null) {
  const { margens, modelo, primeira, fundo } = papel;
  const nome = textoCss(marca?.nome ?? "");
  const logo = marca?.logoUrl ? `url(${textoCss(marca.logoUrl)})` : "none";
  function cssPagina(tipo: ModeloPapelPdf) {
    const estilo = modelosPapelPdf[tipo];
    const colorido = /^#[0-9a-f]{6}$/i.test(fundo) ? fundo : estilo.cor;
    const timbrado = tipo !== "branco";
    const topo = timbrado ? Math.max(3.3, margens.superior) : margens.superior;
    const marcaDagua = tipo === "marca" && logo !== "none"
      ? `background-image:linear-gradient(${colorido}e8,${colorido}e8),${logo};background-repeat:no-repeat;background-position:center;background-size:cover,85mm auto;`
      : "background-image:none;";
    const faixa = timbrado ? estilo.faixa : "transparent";
    const central = tipo === "central";
    const discreto = tipo === "discreto";
    const logoEsquerda = timbrado && !central && !discreto ? logo : "none";
    const logoDireita = discreto ? logo : "none";
    const logoCentro = timbrado && central ? logo : "none";
    return `
      size:A4;
      margin:${topo}cm ${margens.direita}cm ${margens.inferior}cm ${margens.esquerda}cm;
      background-color:${colorido};${marcaDagua}
      @top-left {content:${timbrado && !central ? '" "' : "none"};background:${logoEsquerda} center center/75% auto no-repeat ${faixa};width:26mm;}
      @top-center {content:${timbrado ? nome : "none"};background:${logoCentro} center 3mm/auto 12mm no-repeat ${faixa};color:${estilo.texto};font:bold 10pt Arial;text-align:${tipo === "faixa" || discreto ? "left" : "center"};vertical-align:${central ? "bottom" : "middle"};padding-bottom:${central ? "4mm" : "0"};}
      @top-right {content:${timbrado && !central ? '" "' : "none"};background:${logoDireita} center center/75% auto no-repeat ${faixa};width:26mm;}
      @bottom-right {content:${timbrado ? "counter(page)" : "none"};font:9pt Arial;color:#475569;}
    `;
  }
  const cssPrimeira = primeira === "igual" ? "" : `@page :first {${cssPagina(primeira)}}`;
  return `@page {${cssPagina(modelo)}}${cssPrimeira}
    html { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    body { margin:0; }
  `;
}
