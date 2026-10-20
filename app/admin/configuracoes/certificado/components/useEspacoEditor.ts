"use client";

import { useEffect, useRef } from "react";

/** Ajusta a area de trabalho sem redesenhar a cena quando a janela muda. */
export default function useEspacoEditor(pronto: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const area = ref.current;
    if (!pronto || !area) return;
    let quadro: number | null = null;
    const medir = () => {
      quadro = null;
      if (window.innerWidth < 1024) { area.style.removeProperty("--cert-editor-height"); return; }
      const topo = Math.max(0, area.getBoundingClientRect().top);
      const altura = `${Math.max(360, Math.floor(window.innerHeight - topo - 16))}px`;
      if (area.style.getPropertyValue("--cert-editor-height") !== altura) area.style.setProperty("--cert-editor-height", altura);
    };
    const agendar = () => { if (quadro === null) quadro = requestAnimationFrame(medir); };
    medir();
    window.addEventListener("resize", agendar);
    window.addEventListener("scroll", agendar, true);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(agendar) : null;
    if (area.parentElement) observer?.observe(area.parentElement);
    return () => {
      if (quadro !== null) cancelAnimationFrame(quadro);
      window.removeEventListener("resize", agendar);
      window.removeEventListener("scroll", agendar, true);
      observer?.disconnect();
    };
  }, [pronto]);
  return ref;
}
