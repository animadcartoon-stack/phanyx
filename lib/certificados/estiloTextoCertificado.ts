import type { CSSProperties } from "react";

export function campoTemTextoCertificado(campo: { tipo?: string } | null | undefined) {
  return Boolean(campo?.tipo && !["FORMA", "IMAGEM", "ASSINATURA", "LOGO_INSTITUICAO", "QR_CODE"].includes(campo.tipo));
}

/** Remove somente os estilos substituidos, preservando os demais trechos. */
export function limparEstiloTextoCertificado(html: string, estilo: CSSProperties): string {
  const documento = new DOMParser().parseFromString(html, "text/html");
  const nomes = Object.keys(estilo).map(nome => nome.replace(/[A-Z]/g, letra => "-" + letra.toLowerCase()));
  if (estilo.color != null) nomes.push("-webkit-text-fill-color");
  documento.body.querySelectorAll<HTMLElement>("*").forEach(elemento => {
    nomes.forEach(nome => elemento.style.removeProperty(nome));
    if (elemento.tagName === "FONT") {
      if (estilo.color != null) elemento.removeAttribute("color");
      if (estilo.fontFamily != null) elemento.removeAttribute("face");
      if (estilo.fontSize != null) elemento.removeAttribute("size");
    }
    if (elemento.getAttribute("style") === "") elemento.removeAttribute("style");
  });
  return documento.body.innerHTML;
}

export function atualizarEstiloIntegralTexto<T extends { tipo?: string; textoHtml?: string | null; dadosJson?: any }>(campo: T, alteracoes: Partial<T>, estilo: CSSProperties): T {
  const html = campo.textoHtml ?? campo.dadosJson?.textoHtml;
  const extras = campo.tipo === "TEXTO_LIVRE" && html ? { textoHtml: limparEstiloTextoCertificado(html, estilo) } : {};
  const novos = { ...alteracoes, ...extras };
  return { ...campo, ...novos, dadosJson: { ...(campo.dadosJson || {}), ...novos } };
}

export function corInicialTextoCertificado(fundo: string) {
  const hex = /^#([a-f\d]{6})$/i.exec(fundo)?.[1];
  if (!hex) return "#1e3a8a";
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 140 ? "#ffffff" : "#1e3a8a";
}
