"use client";
import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";

export default function useEdicaoTextoFluida() {
  const pendente = useRef<{ id: number; confirmar: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmar = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    const atual = pendente.current;pendente.current = null;
    atual?.confirmar();
  }, []);
  const agendar = useCallback((id: number, publicar: () => void) => {
    if (pendente.current && pendente.current.id !== id) confirmar();
    pendente.current = { id, confirmar: publicar };
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(confirmar, 180);
  }, [confirmar]);
  const temPendente = useCallback(() => Boolean(pendente.current), []);
  useEffect(() => {
    const terminar = () => { if (pendente.current) flushSync(confirmar); };
    const teclado = (evento: KeyboardEvent) => {
      if (["Enter", "Tab", "Escape"].includes(evento.key) || (evento.ctrlKey || evento.metaKey) && ["z", "s"].includes(evento.key.toLowerCase())) terminar();
    };
    for (const nome of ["pointerup", "mouseup", "pointerdown", "mousedown", "blur", "keyup"]) window.addEventListener(nome, terminar, true);
    window.addEventListener("keydown", teclado, true);
    return () => {
      for (const nome of ["pointerup", "mouseup", "pointerdown", "mousedown", "blur", "keyup"]) window.removeEventListener(nome, terminar, true);
      window.removeEventListener("keydown", teclado, true);confirmar();
    };
  }, [confirmar]);
  return { agendar, confirmar, temPendente };
}
