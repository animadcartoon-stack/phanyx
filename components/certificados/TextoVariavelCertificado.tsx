"use client";
import { memo, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { TextoCertificado } from "@/lib/certificados/textoCertificado";
import { modoTextoCertificado } from "@/lib/certificados/textoCertificado";
import { textoDaVariavelCertificado, alinhamentoVariavelCertificado, type AmostrasVariaveisCertificado } from "@/lib/certificados/variaveisTextoCertificado";
import TextoFormatadoCertificado from "./TextoFormatadoCertificado";

export function useAmostraVariavelCertificado(amostras: AmostrasVariaveisCertificado | undefined, id: string | number = "") {
  const subscribe = useCallback((fn: () => void) => amostras?.subscribe(id, fn) ?? (() => {}), [amostras, id]);
  const snapshot = useCallback(() => amostras?.get(id) || "", [amostras, id]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

function TextoVariavelCertificado({ campo, texto, amostras }: {
  campo: TextoCertificado; texto: string; amostras?: AmostrasVariaveisCertificado;
}) {
  const amostra = useAmostraVariavelCertificado(amostras, campo.id);
  const conteudo = textoDaVariavelCertificado(campo, amostra.trim() || texto);
  const modo = modoTextoCertificado(campo);
  const caixaRef = useRef<HTMLDivElement>(null), textoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const caixa = caixaRef.current, textoEl = textoRef.current, pai = caixa?.parentElement;
    if (modo !== "NORMAL" || !caixa || !textoEl || !pai) return;
    let ativo = true, frame: number | null = null, chaveAnterior = "", revisaoFonte = 0;
    const ajustar = () => {
      if (!ativo) return;
      const largura = caixa.clientWidth, altura = caixa.clientHeight;
      if (largura <= 0 || altura <= 0) return;
      const estilo = getComputedStyle(pai);
      const maximo = Math.max(0.1, parseFloat(estilo.fontSize) || 18);
      const entrelinhas = parseFloat(estilo.lineHeight);
      const lineHeight = Number.isFinite(entrelinhas) ? Math.max(1.2, entrelinhas / maximo) : 1.3;
      const letras = parseFloat(estilo.letterSpacing) || 0, palavras = parseFloat(estilo.wordSpacing) || 0;
      const chave = [largura, altura, maximo, lineHeight, letras, palavras, estilo.fontFamily, estilo.fontWeight, estilo.fontStyle, revisaoFonte].join("|");
      // Arrastar, selecionar ou mudar a cor nao exige recalcular as linhas.
      if (chave === chaveAnterior) { caixa.dataset.ajusteNomeCertificado = "pronto"; return; }
      const aplicar = (tamanho: number) => {
        textoEl.style.fontSize = tamanho + "px";
        textoEl.style.lineHeight = String(lineHeight);
        textoEl.style.letterSpacing = letras * tamanho / maximo + "px";
        textoEl.style.wordSpacing = palavras * tamanho / maximo + "px";
      };
      const cabe = () => textoEl.offsetHeight <= altura && textoEl.scrollWidth <= largura;
      aplicar(maximo);
      if (!cabe()) {
        let minimo = 0.1, limite = maximo;
        // Precisao de 0,25px; evita 14 recalculos de layout em toda alteracao.
        while (limite - minimo > 0.25) {
          const meio = (minimo + limite) / 2;
          aplicar(meio);
          if (cabe()) minimo = meio; else limite = meio;
        }
        aplicar(Math.floor(minimo * 100) / 100);
      }
      chaveAnterior = chave;
      caixa.dataset.ajusteNomeCertificado = "pronto";
    };
    const agendar = () => {
      if (!ativo) return;
      caixa.dataset.ajusteNomeCertificado = "pendente";
      if (frame !== null) return;
      frame = requestAnimationFrame(() => { frame = null; ajustar(); });
    };
    ajustar();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(agendar);
    resize?.observe(caixa);
    const observer = new MutationObserver(agendar);
    observer.observe(pai, { attributes: true, attributeFilter: ["style", "class"] });
    const fontes = document.fonts;
    const carregando = () => { caixa.dataset.ajusteNomeCertificado = "pendente"; };
    const fontesMudaram = () => { revisaoFonte++; agendar(); };
    fontes?.addEventListener("loading", carregando);
    fontes?.addEventListener("loadingdone", fontesMudaram);
    fontes?.addEventListener("loadingerror", fontesMudaram);
    if (fontes && fontes.status !== "loaded") void fontes.ready.then(fontesMudaram);
    window.addEventListener("resize", agendar);
    return () => {
      ativo = false; if (frame !== null) cancelAnimationFrame(frame);
      resize?.disconnect(); observer.disconnect();
      fontes?.removeEventListener("loading", carregando);
      fontes?.removeEventListener("loadingdone", fontesMudaram);
      fontes?.removeEventListener("loadingerror", fontesMudaram);
      window.removeEventListener("resize", agendar);
    };
  }, [conteudo, modo]);
  if (modo !== "NORMAL") return <TextoFormatadoCertificado campo={campo} texto={conteudo} />;
  return <div ref={caixaRef} data-ajuste-nome-certificado="pendente" data-texto-variavel={campo.tipo} aria-label={amostra.trim() || texto}
    style={{ contain: "layout style", width: "100%", height: "100%", minWidth: 0, flex: "1 1 0%", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div ref={textoRef} style={{ width: "100%", flexShrink: 0, boxSizing: "border-box", padding: "0.15em 0.2em",
      whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "normal", textAlign: alinhamentoVariavelCertificado(campo) }}>{conteudo}</div>
  </div>;
}
export default memo(TextoVariavelCertificado);
