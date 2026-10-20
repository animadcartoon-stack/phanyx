import type { CSSProperties } from "react";

// A abreviacao e apenas de exibicao; o nome cadastrado permanece completo.
const PARTICULAS = new Set(["da", "das", "de", "do", "dos", "e", "del", "della", "di", "du", "la", "le", "van", "von"]);
const SUFIXOS = new Set(["filho", "filha", "neto", "neta", "junior", "júnior", "sobrinho", "sobrinha"]);

export function nomeAlunoParaCertificado(nome: string, abreviar = false): string {
  const partes = String(nome ?? "").trim().split(/\s+/u).filter(Boolean);
  if (!abreviar || partes.length < 3) return partes.join(" ");
  const ultimo = partes.length - 1;
  const inicioSobrenome = SUFIXOS.has(partes[ultimo].toLocaleLowerCase()) ? ultimo - 1 : ultimo;
  return partes.map((parte, indice) => {
    if (indice === 0 || indice >= inicioSobrenome || PARTICULAS.has(parte.toLocaleLowerCase())) return parte;
    return parte.split("-").map(p => Array.from(p)[0] + ".").join("-");
  }).join(" ");
}

export function caixaNomeAlunoCertificado(campo: {
  largura?: number | null; altura?: number | null; tamanho?: number | null;
  fonte?: string | null; lineHeight?: number | null;
}): CSSProperties {
  return {
    width: Number(campo.largura || 220), height: Number(campo.altura || 40),
    fontSize: Number(campo.tamanho || 18), fontFamily: campo.fonte || "Arial",
    lineHeight: campo.lineHeight || 1.3, padding: "0 4px", border: "none",
    boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
  };
}
