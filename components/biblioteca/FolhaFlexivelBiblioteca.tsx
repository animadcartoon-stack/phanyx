"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { desenharViradaFolha, DURACAO_VIRADA_FOLHA, type SentidoViradaFolha } from "@/lib/biblioteca-virada-folha";
import styles from "./BibliotecaLeitor.module.css";

export default function FolhaFlexivelBiblioteca({ origem, largura, altura, sentido, animar, onConcluir }: {
  origem: HTMLCanvasElement | null; largura: number; altura: number; sentido: SentidoViradaFolha;
  animar: boolean; onConcluir: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const destino = canvas.current; if (!destino || !origem || largura <= 0 || altura <= 0) return;
    // O canvas transitório tem orçamento próprio; o PDF mantém a resolução de leitura.
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1200000 / (largura * altura)));
    destino.width = Math.max(1, Math.ceil(largura * ratio)); destino.height = Math.max(1, Math.ceil(altura * ratio));
    const ctx = destino.getContext("2d"); if (!ctx) return;
    ctx.setTransform(destino.width / largura, 0, 0, destino.height / altura, 0, 0);
    desenharViradaFolha(ctx, origem, largura, altura, 0, sentido);
  }, [origem, largura, altura, sentido]);
  useEffect(() => {
    if (!animar || !origem) return;
    const destino = canvas.current; const ctx = destino?.getContext("2d");
    if (!destino || !ctx || largura <= 0 || altura <= 0) { onConcluir(); return; }
    const preferencia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0; let inicio: number | null = null; let terminou = false;
    function concluir() { if (!terminou) { terminou = true; window.cancelAnimationFrame(frame); onConcluir(); } }
    function desenhar(tempo: number) {
      if (terminou) return;
      if (inicio === null) inicio = tempo;
      const tempoNormalizado = Math.min(1, Math.max(0, (tempo - inicio) / DURACAO_VIRADA_FOLHA));
      const progresso = (1 - Math.cos(Math.PI * tempoNormalizado)) / 2;
      desenharViradaFolha(ctx!, origem!, largura, altura, progresso, sentido);
      destino!.dataset.readerTurnProgress = String(progresso);
      if (tempoNormalizado === 1) concluir(); else frame = window.requestAnimationFrame(desenhar);
    }
    function mudou() { if (preferencia.matches) concluir(); }
    preferencia.addEventListener("change", mudou);
    if (preferencia.matches) concluir(); else frame = window.requestAnimationFrame(desenhar);
    return () => { terminou = true; window.cancelAnimationFrame(frame); preferencia.removeEventListener("change", mudou); };
  }, [animar, origem, largura, altura, sentido, onConcluir]);
  return <div className={styles.turnSheet} aria-hidden="true"><canvas ref={canvas} /></div>;
}
