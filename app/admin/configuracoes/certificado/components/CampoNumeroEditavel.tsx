"use client";

import { useEffect, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { flushSync } from "react-dom";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "defaultValue"> & {
  value: number | string | null | undefined;
  onValueChange: (value: number) => void;
  onPreview?: (value: number) => void;
  onCancel?: () => void;
};

/** Mantem o texto livre ate confirmar, sem aplicar limites a cada tecla. */
export default function CampoNumeroEditavel({ value, onValueChange, onPreview, onCancel, min, max, step = "any",
  onBlur, onKeyDown, ...props }: Props) {
  const valorAtual = value == null ? "" : String(value);
  const [texto, setTexto] = useState(valorAtual);
  const inputRef = useRef<HTMLInputElement>(null);
  const rascunhoRef = useRef(valorAtual);
  const alteradoRef = useRef(false);
  const atualRef = useRef({ valorAtual, onValueChange, onPreview, onCancel, min, max });
  atualRef.current = { valorAtual, onValueChange, onPreview, onCancel, min, max };

  useLayoutEffect(() => {
    rascunhoRef.current = valorAtual;
    alteradoRef.current = false;
    setTexto(valorAtual);
  }, [valorAtual]);

  function confirmar() {
    if (!alteradoRef.current) return;
    alteradoRef.current = false;
    const atual = atualRef.current;
    const digitado = rascunhoRef.current.trim();
    let numero = digitado === "" ? NaN : Number(digitado);
    if (Number.isFinite(numero)) {
      if (atual.min != null && Number.isFinite(Number(atual.min))) numero = Math.max(Number(atual.min), numero);
      if (atual.max != null && Number.isFinite(Number(atual.max))) numero = Math.min(Number(atual.max), numero);
    }
    const novoTexto = Number.isFinite(numero) ? String(numero) : atual.valorAtual;
    rascunhoRef.current = novoTexto;
    setTexto(novoTexto);
    if (Number.isFinite(numero) && (atual.valorAtual === "" || numero !== Number(atual.valorAtual))) {
      atual.onPreview?.(numero); atual.onValueChange(numero);
    } else if (atual.onPreview) atual.onCancel?.();
  }
  const confirmarRef = useRef(confirmar);
  confirmarRef.current = confirmar;

  useEffect(() => {
    function confirmarAntesDoClique(evento: Event) {
      const input = inputRef.current;
      if (input && document.activeElement === input && evento.target !== input) {
        // Aplica antes de trocar a selecao ou de um botao ler os valores.
        flushSync(() => input.blur());
      }
    }
    function confirmarAoSairDaJanela() { confirmarRef.current(); }
    window.addEventListener("pointerdown", confirmarAntesDoClique, true);
    window.addEventListener("mousedown", confirmarAntesDoClique, true);
    window.addEventListener("blur", confirmarAoSairDaJanela);
    return () => {
      window.removeEventListener("pointerdown", confirmarAntesDoClique, true);
      window.removeEventListener("mousedown", confirmarAntesDoClique, true);
      window.removeEventListener("blur", confirmarAoSairDaJanela);
    };
  }, []);

  return <input {...props} ref={inputRef} type="number" data-numero-editavel="true"
    inputMode={props.inputMode ?? "decimal"} min={min} max={max} step={step} value={texto}
    onChange={(evento) => {
      rascunhoRef.current = evento.target.value;
      alteradoRef.current = true;
      setTexto(evento.target.value);
      const numero = Number(evento.target.value);
      if (evento.target.value.trim() && Number.isFinite(numero) &&
          (min == null || numero >= Number(min)) && (max == null || numero <= Number(max))) onPreview?.(numero);
    }}
    onBlur={(evento) => { confirmar(); onBlur?.(evento); }}
    onKeyDown={(evento) => {
      onKeyDown?.(evento);
      if (evento.defaultPrevented) return;
      if (evento.key === "Enter") {
        evento.preventDefault();
        evento.stopPropagation();
        confirmar();
        evento.currentTarget.blur();
      } else if (evento.key === "Escape") {
        evento.preventDefault();
        evento.stopPropagation();
        atualRef.current.onCancel?.();
        alteradoRef.current = false;
        rascunhoRef.current = atualRef.current.valorAtual;
        setTexto(atualRef.current.valorAtual);
        evento.currentTarget.blur();
      }
    }} />;
}
