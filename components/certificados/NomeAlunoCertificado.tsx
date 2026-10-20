"use client";

import { memo, useEffect, useRef } from "react";
import { nomeAlunoParaCertificado } from "@/lib/certificados/nomeAlunoCertificado";

type Props = { nome: string; abreviar?: boolean };

function NomeAlunoCertificado({ nome, abreviar = false }: Props) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const textoRef = useRef<HTMLDivElement>(null);
  const texto = nomeAlunoParaCertificado(nome, abreviar);

  useEffect(() => {
    const caixa = caixaRef.current;
    const conteudo = textoRef.current;
    const pai = caixa?.parentElement;
    if (!caixa || !conteudo || !pai) return;
    let ativo = true;
    let frame: number | null = null;
    const ajustar = () => {
      if (!ativo) return;
      const largura = caixa.clientWidth;
      const altura = caixa.clientHeight;
      // clientWidth/Height nao mudam com o zoom ou a rotacao da cena.
      if (largura <= 0 || altura <= 0) return;
      const estilo = getComputedStyle(pai);
      const maximo = Math.max(0.1, parseFloat(estilo.fontSize) || 18);
      const entrelinhas = parseFloat(estilo.lineHeight);
      const lineHeight = Number.isFinite(entrelinhas) ? Math.max(1.2, entrelinhas / maximo) : 1.3;
      const letras = parseFloat(estilo.letterSpacing) || 0;
      const palavras = parseFloat(estilo.wordSpacing) || 0;
      const aplicar = (tamanho: number) => {
        conteudo.style.fontSize = tamanho + "px";
        conteudo.style.lineHeight = String(lineHeight);
        conteudo.style.letterSpacing = letras * tamanho / maximo + "px";
        conteudo.style.wordSpacing = palavras * tamanho / maximo + "px";
      };
      const cabe = () => conteudo.offsetHeight <= altura && conteudo.scrollWidth <= largura;
      aplicar(maximo);
      if (!cabe()) {
        let minimo = 0.1;
        let limite = maximo;
        for (let i = 0; i < 14; i++) {
          const meio = (minimo + limite) / 2;
          aplicar(meio);
          if (cabe()) minimo = meio;
          else limite = meio;
        }
        aplicar(Math.floor(minimo * 100) / 100);
      }
      caixa.dataset.ajusteNomeCertificado = "pronto";
    };
    const agendar = () => {
      if (!ativo) return;
      caixa.dataset.ajusteNomeCertificado = "pendente";
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = null; ajustar(); });
    };
    ajustar();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(agendar);
    resize?.observe(caixa);
    // Os controles fluidos alteram o estilo do pai antes de confirmar no React.
    const observer = new MutationObserver(agendar);
    observer.observe(pai, { attributes: true, attributeFilter: ["style", "class"] });
    const fontes = document.fonts;
    const carregando = () => { caixa.dataset.ajusteNomeCertificado = "pendente"; };
    fontes?.addEventListener("loading", carregando);
    fontes?.addEventListener("loadingdone", agendar);
    fontes?.addEventListener("loadingerror", agendar);
    void fontes?.ready.then(agendar);
    window.addEventListener("resize", agendar);
    return () => {
      ativo = false;
      if (frame !== null) cancelAnimationFrame(frame);
      resize?.disconnect();
      observer.disconnect();
      fontes?.removeEventListener("loading", carregando);
      fontes?.removeEventListener("loadingdone", agendar);
      fontes?.removeEventListener("loadingerror", agendar);
      window.removeEventListener("resize", agendar);
    };
  }, [texto]);

  return <div ref={caixaRef} data-ajuste-nome-certificado="pendente" aria-label={nome}
    style={{ width: "100%", height: "100%", minWidth: 0, flex: "1 1 0%", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div ref={textoRef} style={{ width: "100%", flexShrink: 0, boxSizing: "border-box", padding: "0.15em 0.2em",
      whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "normal", textAlign: "center" }}>{texto}</div>
  </div>;
}

export default memo(NomeAlunoCertificado);
