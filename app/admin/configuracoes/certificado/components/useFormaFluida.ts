"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export default function useFormaFluida<T extends { id: number }>(salvo: T, onChange: (campo: T) => void, ativo: boolean) {
  const [previa, setPrevia] = useState<{ base: T; campo: T } | null>(null);
  const pendente = useRef<{ base: T; campo: T } | null>(null);
  const quadro = useRef<number | null>(null);
  const ponteiro = useRef(false);
  const publicar = useRef(onChange);publicar.current = onChange;
  const confirmar = useCallback(() => {
    if (quadro.current !== null) cancelAnimationFrame(quadro.current);
    quadro.current = null;
    const atual = pendente.current;pendente.current = null;
    if (atual) { setPrevia(null);publicar.current(atual.campo); }
  }, []);
  const atualizar = (campo: T) => {
    // Acoes de clique continuam imediatas; apenas o arraste usa previa local.
    if (!ponteiro.current) { confirmar();onChange(campo);return; }
    pendente.current = { base: salvo, campo };
    if (quadro.current === null) quadro.current = requestAnimationFrame(() => { quadro.current=null;setPrevia(pendente.current); });
  };
  useEffect(() => {
    if (!ativo) return;
    const iniciar=()=>{ confirmar();ponteiro.current=true; };
    const terminar=()=>{ confirmar();ponteiro.current=false; };
    const teclado=(e:KeyboardEvent)=>{if(e.key==="Escape" || (e.ctrlKey||e.metaKey)&&["z","s"].includes(e.key.toLowerCase()))terminar();};
    window.addEventListener("mousedown",iniciar,true);window.addEventListener("mouseup",terminar,true);window.addEventListener("blur",terminar);window.addEventListener("keydown",teclado,true);
    return()=>{window.removeEventListener("mousedown",iniciar,true);window.removeEventListener("mouseup",terminar,true);window.removeEventListener("blur",terminar);window.removeEventListener("keydown",teclado,true);if(quadro.current!==null)cancelAnimationFrame(quadro.current);pendente.current=null;};
  },[confirmar,ativo]);
  return { campo: previa?.base === salvo ? previa.campo : salvo, atualizar, confirmar };
}
