"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { desenharViradaFolha, DURACAO_VIRADA_FOLHA, type SentidoViradaFolha } from "@/lib/biblioteca-virada-folha";
import { criarFolha3d } from "@/lib/biblioteca-folha-3d";
import styles from "./BibliotecaLeitor.module.css";

export default function FolhaFlexivelBiblioteca({ origem, verso, apoio, largura, altura, sentido, dupla, animar, onConcluir }: {
  origem: HTMLCanvasElement | null; verso: HTMLCanvasElement | null; apoio: HTMLCanvasElement | null;
  largura: number; altura: number; sentido: SentidoViradaFolha; dupla: boolean; animar: boolean; onConcluir: () => void;
}) {
  const base = useRef<HTMLCanvasElement>(null), canvas = useRef<HTMLCanvasElement>(null), alternativo = useRef<HTMLCanvasElement>(null);
  const sombra = useRef<HTMLDivElement>(null);
  const motor = useRef<ReturnType<typeof criarFolha3d>>(null);
  useEffect(() => {
    const elemento = canvas.current;
    return () => { queueMicrotask(() => {
      if (elemento && !elemento.isConnected) elemento.getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext();
    }); };
  }, []);
  useLayoutEffect(() => {
    if (!base.current || !canvas.current || !alternativo.current || !origem || largura <= 0 || altura <= 0) return;
    const width = largura * (dupla ? 2 : 1), height = altura;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1200000 / ((width + largura * .44) * height * 1.3)));
    base.current.width = Math.ceil(width * ratio); base.current.height = Math.ceil(height * ratio);
    const ctx = base.current.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      if (dupla) {
        const x = sentido === "next" ? 0 : largura;
        ctx.fillStyle = "#fffdf6"; ctx.fillRect(x, 0, largura, altura);
        if (apoio) ctx.drawImage(apoio, x, 0, largura, altura);
      }
    }
    canvas.current.width = Math.ceil((width + largura * .44) * ratio); canvas.current.height = Math.ceil(height * 1.3 * ratio);
    alternativo.current.width = Math.ceil(largura * ratio); alternativo.current.height = Math.ceil(altura * ratio);
    const fallback = alternativo.current.getContext("2d"); fallback?.setTransform(ratio, 0, 0, ratio, 0, 0);
    motor.current = criarFolha3d(canvas.current, origem, verso || origem, largura, altura, sentido, dupla);
    canvas.current.style.visibility = motor.current ? "visible" : "hidden";
    alternativo.current.style.visibility = motor.current ? "hidden" : "visible";
    canvas.current.dataset.readerTurnRenderer = motor.current ? "webgl" : "canvas";
    if (motor.current) motor.current.desenhar(0); else if (fallback) desenharViradaFolha(fallback, origem, largura, altura, 0, sentido);
    return () => { motor.current?.destruir(); motor.current = null; };
  }, [origem, verso, apoio, largura, altura, sentido, dupla]);
  useEffect(() => {
    if (!animar || !origem) return;
    const destino = canvas.current, fallback = alternativo.current?.getContext("2d");
    if (!destino || largura <= 0 || altura <= 0) { onConcluir(); return; }
    const preferencia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, inicio: number | null = null, terminou = false;
    function concluir() { if (!terminou) { terminou = true; window.cancelAnimationFrame(frame); onConcluir(); } }
    function desenhar(tempo: number) {
      if (terminou) return;
      if (inicio === null) inicio = tempo;
      const andamento = Math.min(1, Math.max(0, (tempo - inicio) / DURACAO_VIRADA_FOLHA));
      const p = (1 - Math.cos(Math.PI * andamento)) / 2;
      const desenhado = motor.current?.desenhar(p);
      if (!desenhado && fallback && alternativo.current) {
        destino!.style.visibility = "hidden"; alternativo.current.style.visibility = "visible";
        destino!.dataset.readerTurnRenderer = "canvas";
        desenharViradaFolha(fallback, origem!, largura, altura, p, sentido);
      }
      if (sombra.current) {
        const centro = (dupla || sentido === "previous" ? largura : 0) + (sentido === "next" ? 1 : -1) * largura * Math.cos(Math.PI * p) * .4;
        const w = largura * (.05 + .36 * Math.sin(Math.PI * p));
        sombra.current.style.left = `${centro - w / 2}px`; sombra.current.style.width = `${w}px`;
        sombra.current.style.opacity = String(Math.sin(Math.PI * p) * .26);
      }
      destino!.dataset.readerTurnProgress = String(p);
      if (andamento === 1) concluir(); else frame = window.requestAnimationFrame(desenhar);
    }
    function mudou() { if (preferencia.matches) concluir(); }
    preferencia.addEventListener("change", mudou);
    if (preferencia.matches) concluir(); else frame = window.requestAnimationFrame(desenhar);
    return () => { terminou = true; window.cancelAnimationFrame(frame); preferencia.removeEventListener("change", mudou); };
  }, [animar, origem, largura, altura, sentido, dupla, onConcluir]);
  const width = largura * (dupla ? 2 : 1);
  return <div className={styles.turnSheet} aria-hidden="true">
    <canvas ref={base} style={{ width, height: altura }} />
    <div ref={sombra} className={styles.foldShadow} />
    <canvas ref={canvas} className={styles.paperMesh} style={{ left: -largura * .22, top: -altura * .15, width: width + largura * .44, height: altura * 1.3 }} />
    <canvas ref={alternativo} className={styles.paperFallback} style={{ left: dupla && sentido === "next" ? largura : 0, width: largura, height: altura }} />
  </div>;
}
