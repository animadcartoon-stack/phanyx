"use client";

import type { ReactNode } from "react";
import {
  modelosPapelPdf, type InstituicaoPapelPdf, type MargensPapelPdf, type ModeloPapelPdf, type PapelTextoPdf,
} from "@/lib/documentos-docentes/papel-texto-pdf";
import { textosPapelTextoPdf } from "@/lib/documentos-docentes/i18n-papel-texto-pdf";
import { botaoLeitorPdf } from "./LeitorPdfDocumento";

const modelos = Object.keys(modelosPapelPdf) as ModeloPapelPdf[];
const seletor = "rounded-md border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900";

export function ConfiguracaoPapelTextoPdf({ papel, locale, onChange }: {
  papel: PapelTextoPdf; locale: string; onChange: (papel: PapelTextoPdf) => void;
}) {
  const t = textosPapelTextoPdf(locale);
  return <details className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
    <summary className="cursor-pointer text-sm font-semibold">{t.pagina}</summary>
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs font-semibold">{t.modelo}
        <select className={seletor} value={papel.modelo} onChange={e => onChange({ ...papel, modelo: e.target.value as ModeloPapelPdf })}>
          {modelos.map(modelo => <option key={modelo} value={modelo}>{t[modelo]}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold">{t.primeira}
        <select className={seletor} value={papel.primeira} onChange={e => onChange({ ...papel, primeira: e.target.value as PapelTextoPdf["primeira"] })}>
          <option value="igual">{t.igual}</option>
          {modelos.map(modelo => <option key={modelo} value={modelo}>{t[modelo]}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold">{t.fundo}
        <input type="color" className="h-8 w-12 rounded border border-slate-300"
          value={papel.fundo || modelosPapelPdf[papel.modelo].cor} onChange={e => onChange({ ...papel, fundo: e.target.value })} />
      </label>
      <button type="button" className={botaoLeitorPdf} disabled={!papel.fundo} onClick={() => onChange({ ...papel, fundo: "" })}>{t.padrao}</button>
      <fieldset className="flex flex-wrap items-end gap-2">
        <legend className="text-xs font-semibold">{t.margens}</legend>
        {(Object.keys(papel.margens) as (keyof MargensPapelPdf)[]).map(lado => (
          <label key={lado} className="grid gap-1 text-xs">{t[lado]}
            <input type="number" min="1" max="5" step="0.1" key={papel.margens[lado]} defaultValue={papel.margens[lado]}
              className={`w-20 ${seletor}`} onBlur={e => {
                const valor = Number(e.target.value);
                if (valor >= 1 && valor <= 5) onChange({ ...papel, margens: { ...papel.margens, [lado]: valor } });
                else e.target.value = String(papel.margens[lado]);
              }} />
          </label>
        ))}
      </fieldset>
    </div>
  </details>;
}

function Regua({ vertical = false }: { vertical?: boolean }) {
  const total = vertical ? 29 : 21;
  const ticks = vertical
    ? "repeating-linear-gradient(to bottom,#94a3b8 0 1px,transparent 1px .5cm)"
    : "repeating-linear-gradient(to right,#94a3b8 0 1px,transparent 1px .5cm)";
  return <div aria-hidden className={`relative overflow-hidden bg-slate-100 text-[9px] text-slate-700 dark:bg-slate-700 dark:text-slate-100 ${vertical ? "w-6 border-r" : "h-5 w-[210mm] border-b"} border-slate-300`}
    style={{ backgroundImage: ticks, backgroundSize: vertical ? "6px 100%" : "100% 6px", backgroundRepeat: "no-repeat", backgroundPosition: "right bottom" }}>
    {Array.from({ length: total }, (_, i) => <span key={i} className="absolute" style={vertical ? { top: `${i}cm`, left: 2 } : { left: `${i}cm`, top: 0 }}>
      {i}
    </span>)}
  </div>;
}

export function PreviaPapelTextoPdf({ papel, zoom, marca, locale, children }: {
  papel: PapelTextoPdf; zoom: number; marca: InstituicaoPapelPdf | null; locale: string; children: ReactNode;
}) {
  const t = textosPapelTextoPdf(locale);
  const modelo = papel.primeira === "igual" ? papel.modelo : papel.primeira;
  const estilo = modelosPapelPdf[modelo];
  const timbrado = modelo !== "branco";
  const { margens } = papel;
  return <div className="overflow-auto rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
    <section aria-label={t.reguas} className="mx-auto grid w-fit grid-cols-[1.5rem_210mm_1.5rem] grid-rows-[1.25rem_auto] shadow" style={{ zoom: zoom / 100 }}>
      <div className="bg-slate-200 dark:bg-slate-700" />
      <Regua />
      <div className="bg-slate-200 dark:bg-slate-700" />
      <Regua vertical />
      <article className="relative min-h-[297mm] w-[210mm] text-slate-950" style={{
        background: papel.fundo || estilo.cor,
        padding: `${timbrado ? Math.max(3.3, margens.superior) : margens.superior}cm ${margens.direita}cm ${margens.inferior}cm ${margens.esquerda}cm`,
      }}>
        {timbrado && <header className={`absolute top-0 flex min-h-[26mm] items-center gap-3 px-3 text-sm font-bold ${modelo === "central" ? "flex-col justify-center gap-1" : modelo === "discreto" ? "flex-row-reverse justify-between" : modelo === "faixa" ? "justify-start" : "justify-center"}`}
          style={{ background: estilo.faixa, color: estilo.texto, left: `${margens.esquerda}cm`, right: `${margens.direita}cm` }}>
          {marca?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={marca.logoUrl} alt="" referrerPolicy="no-referrer" className="max-h-11 max-w-20 object-contain" />
          )}
          {marca?.nome}
        </header>}
        {modelo === "marca" && marca?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={marca.logoUrl} alt="" referrerPolicy="no-referrer" className="pointer-events-none absolute left-1/2 top-[148mm] w-[85mm] -translate-x-1/2 -translate-y-1/2 opacity-10" />
        )}
        <div className="relative">{children}</div>
      </article>
      <Regua vertical />
    </section>
  </div>;
}
