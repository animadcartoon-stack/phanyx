"use client";

import { useMemo, useState } from "react";
import { FONTES_CERTIFICADO, GRUPOS_FONTES_CERTIFICADO } from "@/lib/certificados/fontesCertificado";

export default function SeletorFonteCertificado({ value, onChange, labels }: {
  value: string;
  onChange: (fonte: string) => void;
  labels: { search: string; hint: string; system: string; calligraphy: string; handwriting: string; serif: string; sans: string; display: string };
}) {
  const [busca, setBusca] = useState("");
  const grupos = useMemo(() => Object.entries(GRUPOS_FONTES_CERTIFICADO).map(([chave, fontes]) => ({ chave: chave as keyof typeof GRUPOS_FONTES_CERTIFICADO, fontes: fontes.filter(fonte => fonte.toLowerCase().includes(busca.toLowerCase().trim())) })), [busca]);
  return <div className="space-y-2">
    <input type="search" value={busca} onChange={evento => setBusca(evento.target.value)} placeholder={labels.search} aria-label={labels.search}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800" />
    <select value={value} onChange={evento => onChange(evento.target.value)} aria-label={labels.search}
      className="w-full rounded-xl border border-slate-300 px-3 py-2" style={{ fontFamily: value }}>
      {(!FONTES_CERTIFICADO.includes(value as any) || busca && !value.toLowerCase().includes(busca.toLowerCase().trim())) && <option value={value}>{value}</option>}
      {grupos.filter(grupo => grupo.fontes.length).map(grupo => <optgroup key={grupo.chave} label={labels[grupo.chave]}>
        {grupo.fontes.map(fonte => <option key={fonte} value={fonte}>{fonte}</option>)}
      </optgroup>)}
    </select>
    <p className="text-xs leading-relaxed text-slate-500">{labels.hint}</p>
  </div>;
}
