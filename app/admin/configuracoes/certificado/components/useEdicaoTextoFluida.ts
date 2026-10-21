"use client";
import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";

type OpcoesPrevia = { aguardarFim?: boolean; cancelar?: () => void };
export default function useEdicaoTextoFluida() {
  const pendente = useRef<{ id: number; confirmar: () => void; cancelar?: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmar = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    const atual = pendente.current; pendente.current = null;
    atual?.confirmar();
  }, []);
  const cancelar = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    const atual = pendente.current; pendente.current = null;
    if (atual?.cancelar) atual.cancelar(); else atual?.confirmar();
  }, []);
  const agendar = useCallback((id: number, publicar: () => void, opcoes: OpcoesPrevia = {}) => {
    if (pendente.current && pendente.current.id !== id) confirmar();
    pendente.current = { id, confirmar: publicar, cancelar: opcoes.cancelar };
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = opcoes.aguardarFim ? null : setTimeout(confirmar, 180);
  }, [confirmar]);
  const temPendente = useCallback(() => Boolean(pendente.current), []);
  useEffect(() => {
    const terminar = (evento?: Event) => {
      if (evento?.type === "blur" && evento.target !== window) return;
      const ativo = document.activeElement;
      if (evento && ["pointerdown", "mousedown"].includes(evento.type) && ativo instanceof HTMLInputElement && ativo.matches("[data-numero-editavel]") && evento.target !== ativo) flushSync(() => ativo.blur());
      if (pendente.current) flushSync(confirmar);
    };
    const teclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") { if (pendente.current) flushSync(cancelar); return; }
      if (["Enter", "Tab"].includes(evento.key)) {
        const ativo = document.activeElement;
        if (ativo instanceof HTMLInputElement && ativo.matches("[data-numero-editavel]")) flushSync(() => ativo.blur());
      }
      if (["Enter", "Tab"].includes(evento.key) || (evento.ctrlKey || evento.metaKey) && ["z", "s"].includes(evento.key.toLowerCase())) terminar();
    };
    const terminarRange = (evento: KeyboardEvent) => {
      if (evento.target instanceof HTMLInputElement && evento.target.type === "range") terminar();
    };
    for (const nome of ["pointerup", "mouseup", "pointerdown", "mousedown", "blur"]) window.addEventListener(nome, terminar, true);
    window.addEventListener("keydown", teclado, true);
    window.addEventListener("keyup", terminarRange, true);
    return () => {
      for (const nome of ["pointerup", "mouseup", "pointerdown", "mousedown", "blur"]) window.removeEventListener(nome, terminar, true);
      window.removeEventListener("keydown", teclado, true);
      window.removeEventListener("keyup", terminarRange, true);
      confirmar();
    };
  }, [confirmar, cancelar]);
  return { agendar, confirmar, cancelar, temPendente };
}
