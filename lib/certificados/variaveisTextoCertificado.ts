import type { CSSProperties } from "react";
import type { TextoCertificado } from "./textoCertificado";
import { nomeAlunoParaCertificado } from "./nomeAlunoCertificado";

export function ehVariavelTextoCertificado(campo: TextoCertificado) {
  return Boolean(campo.tipo && !["FORMA", "IMAGEM", "TEXTO_LIVRE", "ASSINATURA", "LOGO_INSTITUICAO", "QR_CODE"].includes(campo.tipo));
}

export function ehVariavelSimplesCertificado(campo: TextoCertificado) {
  return ehVariavelTextoCertificado(campo) && campo.tipo !== "DISCIPLINAS_CONCLUIDAS";
}

export function abreviarVariavelCertificado(campo: TextoCertificado) {
  return campo.dadosJson?.abreviarVariavel ?? (campo.tipo === "NOME_ALUNO" && campo.dadosJson?.nomeAlunoAbreviado === true);
}

export function textoDaVariavelCertificado(campo: TextoCertificado, texto: string) {
  return nomeAlunoParaCertificado(texto, Boolean(abreviarVariavelCertificado(campo)));
}

export function alinhamentoVariavelCertificado(campo: TextoCertificado): "left" | "center" | "right" {
  const valor = campo.dadosJson?.alinhamentoVariavel ?? (campo.tipo === "NOME_ALUNO" ? "center" : campo.alinhamento);
  return valor === "center" || valor === "right" ? valor : "left";
}

export function caixaVariavelCertificado(campo: TextoCertificado): CSSProperties {
  return {
    width: Number(campo.largura || 220), height: Number(campo.altura || 40),
    fontSize: Number(campo.tamanho || 18), fontFamily: campo.fonte || "Arial",
    lineHeight: campo.lineHeight || 1.3, padding: "0 4px", border: "none",
    boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
    textAlign: alinhamentoVariavelCertificado(campo),
  };
}

// Somente a variavel alterada recebe a amostra; a pagina e as demais camadas nao renderizam.
export function criarAmostrasVariaveisCertificado() {
  const valores = new Map<string, string>();
  const ouvintes = new Map<string, Set<() => void>>();
  return {
    get(id: string | number) { return valores.get(String(id)) || ""; },
    set(id: string | number, texto: string) {
      const chave = String(id);
      if ((valores.get(chave) || "") === texto) return;
      valores.set(chave, texto);
      ouvintes.get(chave)?.forEach(fn => fn());
    },
    subscribe(id: string | number, fn: () => void) {
      const chave = String(id);
      const grupo = ouvintes.get(chave) || new Set<() => void>();
      grupo.add(fn); ouvintes.set(chave, grupo);
      return () => { grupo.delete(fn); if (!grupo.size) ouvintes.delete(chave); };
    },
  };
}
export type AmostrasVariaveisCertificado = ReturnType<typeof criarAmostrasVariaveisCertificado>;
