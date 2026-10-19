import { FONTES_CERTIFICADO } from "./fontesCertificado";
import { trechosTextoCertificado } from "./textoCertificado";

export function nomeFonteCertificado(familia: string | null | undefined) {
  const nome = String(familia || "Helvetica").split(",")[0].trim().replace(/^['"]|['"]$/g, "");
  return FONTES_CERTIFICADO.find(item => item.toLowerCase() === nome.toLowerCase()) || nome;
}

export function fonteUnicaTextoCertificado(campo: { tipo?: string; fonte?: string | null; textoHtml?: string | null; dadosJson?: { textoHtml?: string | null } | null }) {
  const padrao = nomeFonteCertificado(campo.fonte || (campo.tipo === "TEXTO_LIVRE" ? "Arial" : "Helvetica"));
  const html = campo.textoHtml ?? campo.dadosJson?.textoHtml;
  if (!html) return padrao;
  const fontes = new Set(trechosTextoCertificado(html).filter(trecho => trecho.texto.trim()).map(trecho => nomeFonteCertificado(trecho.estilo.fontFamily || padrao)));
  return fontes.size > 1 ? null : fontes.values().next().value || padrao;
}

export function fonteDaSelecaoCertificado(editor: HTMLElement, range: Range, padrao?: string | null): string | null {
  if (!editor.contains(range.commonAncestorContainer)) return nomeFonteCertificado(padrao);
  const antes = editor.ownerDocument.createRange();
  antes.selectNodeContents(editor);
  antes.setEnd(range.startContainer, range.startOffset);
  const inicio = antes.toString().length;
  antes.setEnd(range.endContainer, range.endOffset);
  const fim = antes.toString().length;
  const walker = editor.ownerDocument.createTreeWalker(editor, 4);
  const fontes = new Set<string>();
  let posicao = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const texto = node.textContent || "";
    if (posicao < fim && posicao + texto.length > inicio && texto.slice(Math.max(0, inicio - posicao), Math.min(texto.length, fim - posicao)).trim()) {
      let el = node.parentElement;
      let familia = "";
      while (el && !familia) {
        familia = editor.ownerDocument.defaultView?.getComputedStyle(el).fontFamily || el.style.fontFamily;
        if (el === editor) break;
        el = el.parentElement;
      }
      fontes.add(nomeFonteCertificado(familia || padrao));
      if (fontes.size > 1) return null;
    }
    posicao += texto.length;
  }
  return fontes.values().next().value || nomeFonteCertificado(padrao);
}
