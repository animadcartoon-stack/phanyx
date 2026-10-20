import type { CSSProperties } from "react";
import type { TextoCertificado } from "./textoCertificado";

type CaixaTexto = TextoCertificado & { x?: number | null; y?: number | null };

/** A caixa e os recuos sao os mesmos na edicao, na previa e no PDF. */
export function caixaTextoLivreCertificado(campo: CaixaTexto): CSSProperties {
  return {
    position: "absolute", left: Number(campo.x || 0), top: Number(campo.y || 0),
    width: Number(campo.largura || 320), height: Number(campo.altura || 120),
    boxSizing: "border-box", display: "block", padding: 0, border: 0, overflow: "visible",
  };
}

export function conteudoTextoLivreCertificado(campo: TextoCertificado): CSSProperties {
  return {
    width: "100%", height: "100%", boxSizing: "border-box", display: "block",
    padding: "4px 8px", border: "1px solid transparent", overflow: "hidden",
    fontFamily: campo.fonte || "Arial", fontSize: Number(campo.tamanho || 18),
    color: campo.cor || "#1e3a8a", fontWeight: campo.negrito ? "bold" : "normal",
    fontStyle: campo.italico ? "italic" : "normal", textDecoration: campo.sublinhado ? "underline" : "none",
    textAlign: (campo.alinhamento as "left" | "center" | "right") || "left",
    lineHeight: campo.lineHeight || 1.3, letterSpacing: campo.letterSpacing ?? 0,
    wordSpacing: campo.wordSpacing ?? 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
    direction: "ltr", unicodeBidi: "isolate", writingMode: "horizontal-tb",
  };
}
