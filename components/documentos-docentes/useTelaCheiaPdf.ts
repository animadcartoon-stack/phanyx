"use client";

import { useEffect, useRef, useState } from "react";

export function useTelaCheiaPdf() {
  const principal = useRef<HTMLElement>(null);
  const [nativa, setNativa] = useState(false);
  const [expandida, setExpandida] = useState(false);

  useEffect(() => {
    function sincronizar() { setNativa(document.fullscreenElement === principal.current); }
    document.addEventListener("fullscreenchange", sincronizar);
    return () => document.removeEventListener("fullscreenchange", sincronizar);
  }, []);

  useEffect(() => {
    if (!expandida) return;
    function sair(evento: KeyboardEvent) { if (evento.key === "Escape") setExpandida(false); }
    document.addEventListener("keydown", sair);
    return () => document.removeEventListener("keydown", sair);
  }, [expandida]);

  async function fechar() {
    setExpandida(false);
    if (principal.current && document.fullscreenElement === principal.current) await document.exitFullscreen().catch(() => {});
  }

  async function alternar() {
    if (nativa || expandida) {
      await fechar();
      return;
    }
    try { await principal.current?.requestFullscreen(); }
    catch { setExpandida(true); }
  }

  return { principal, telaCheia: nativa || expandida, alternar, fechar };
}
