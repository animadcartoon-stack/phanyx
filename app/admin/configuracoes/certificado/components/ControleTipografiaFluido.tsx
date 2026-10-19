"use client";
import { useEffect, useState } from "react";
import CampoNumeroEditavel from "./CampoNumeroEditavel";

export default function ControleTipografiaFluido({ value, onPreview, onCommit, label, tamanho = false, min, max }: {
  value: number; onPreview: (valor: number) => void; onCommit: () => void; label: string; tamanho?: boolean; min: number; max: number;
}) {
  const [atual, setAtual] = useState(value);
  useEffect(() => setAtual(value), [value]);
  function alterar(valor: number) { const novo = Math.max(min, Math.min(max, valor));setAtual(novo);onPreview(novo); }
  return <div className="space-y-1" data-tipografia-fluida="true">
    {tamanho ? <div className="flex gap-2">
      <button type="button" aria-label={`${label} −`} onMouseDown={e=>e.preventDefault()} onClick={()=>{alterar(atual-2);onCommit();}} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold">A−</button>
      <CampoNumeroEditavel value={atual} min={min} max={max} aria-label={label} onValueChange={valor=>{alterar(valor);onCommit();}} className="min-w-0 w-full rounded-xl border border-slate-300 px-3 py-2"/>
      <button type="button" aria-label={`${label} +`} onMouseDown={e=>e.preventDefault()} onClick={()=>{alterar(atual+2);onCommit();}} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold">A+</button>
    </div> : <input type="range" aria-label={label} min={min} max={max} step={1} value={atual} onChange={e=>alterar(Number(e.target.value))} onBlur={onCommit} className="w-full"/>}
  </div>;
}
