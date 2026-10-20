"use client";

import { isValidElement, memo, useId, useMemo, type CSSProperties, type ReactNode } from "react";
import { conteudoTextoLivreCertificado } from "@/lib/certificados/layoutTextoLivreCertificado";
import { medidasArcoTexto, modoTextoCertificado, trechosTextoCertificado, type TextoCertificado } from "@/lib/certificados/textoCertificado";

function textoSimples(no: ReactNode): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textoSimples).join(" ");
  return isValidElement<{ children?: ReactNode }>(no) ? textoSimples(no.props.children) : "";
}

function TextoFormatadoCertificado({ campo, texto }: { campo: TextoCertificado; texto?: ReactNode }) {
  const identificador = useId().replace(/:/g, "");
  const modo = modoTextoCertificado(campo);
  const html = campo.tipo === "TEXTO_LIVRE" ? campo.textoHtml ?? campo.dadosJson?.textoHtml : null;
  const trechos = useMemo(() => html ? trechosTextoCertificado(html) : [{ texto: texto != null ? textoSimples(texto) : campo.texto ?? campo.dadosJson?.texto ?? "", estilo: {} }], [html, texto, campo.texto, campo.dadosJson?.texto]);
  const estilo: CSSProperties = {
    fontFamily: campo.fonte || "Arial", fontSize: Number(campo.tamanho || 18),
    fontWeight: campo.negrito ? "bold" : "normal", fontStyle: campo.italico ? "italic" : "normal",
    textDecoration: campo.sublinhado ? "underline" : "none", letterSpacing: campo.letterSpacing ?? 0,
  };
  if (modo === "NORMAL") return <div data-texto-formatado="NORMAL" style={campo.tipo === "TEXTO_LIVRE" ? conteudoTextoLivreCertificado(campo) : { ...estilo, width: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word", color: campo.cor || "#1e3a8a", lineHeight: campo.lineHeight || 1.3, wordSpacing: campo.wordSpacing ?? 0, textAlign: (campo.alinhamento as "left" | "center" | "right") || "left" }}>
    {trechos.map((t, i) => <span key={i} style={{ ...t.estilo, color: t.estilo.fill } as CSSProperties}>{t.texto}</span>)}
  </div>;
  if (modo === "VERTICAL") return <div data-texto-formatado="VERTICAL" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
    <div style={{ ...estilo, writingMode: "vertical-rl", textOrientation: "upright", color: campo.cor || "#1e3a8a", whiteSpace: "pre-wrap" }}>
      {trechos.map((t, i) => <span key={i} style={{ ...t.estilo, color: t.estilo.fill } as CSSProperties}>{t.texto}</span>)}
    </div>
  </div>;
  const medidas = medidasArcoTexto(campo);
  const pathId = `texto-arco-${identificador}`;
  return <svg data-texto-formatado="ARCO" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
    viewBox={`0 0 ${medidas.largura} ${medidas.altura}`} preserveAspectRatio="xMidYMid meet"
    style={{ display: "block", overflow: "visible" }} aria-label={trechos.map(t => t.texto).join("")}>
    <defs><path id={pathId} d={medidas.d} /></defs>
    <text fill={campo.cor || "#1e3a8a"} style={estilo} textAnchor="middle" xmlSpace="preserve">
      <textPath href={`#${pathId}`} startOffset="50%">
        {trechos.map((t, i) => <tspan key={i} style={t.estilo as CSSProperties}>{t.texto.replace(/\r?\n/g, " ")}</tspan>)}
      </textPath>
    </text>
  </svg>;
}

export default memo(TextoFormatadoCertificado);
