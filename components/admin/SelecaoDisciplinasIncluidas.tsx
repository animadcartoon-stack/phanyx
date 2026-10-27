"use client";
import { useLocale } from "next-intl";
import { copySelecao } from "@/lib/matriculas/selecao-disciplinas-copy";
import type { RegrasSelecaoDisciplinas } from "@/lib/matriculas/selecao-disciplinas";

export default function SelecaoDisciplinasIncluidas({ regras, disciplinas, selecionadas, onChange }: {
  regras: RegrasSelecaoDisciplinas; disciplinas: { id: number; nome: string }[];
  selecionadas: number[]; onChange: (ids: number[]) => void;
}) {
  const t = copySelecao(useLocale());
  const nomes = new Map(disciplinas.map(d => [d.id, d.nome]));
  return <section className="my-5 space-y-4 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-slate-950 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100">
    <h3 className="font-bold">{t.title}</h3><p className="text-sm">{t.included} {t.selectHelp}</p>
    {regras.horariosPendentesPermitidos && <p className="text-sm">{t.pending}</p>}
    {regras.disciplinaIdsObrigatorias.length > 0 && <div><p className="font-semibold">{t.required}</p><ul className="list-inside list-disc text-sm">{regras.disciplinaIdsObrigatorias.map(id => <li key={id}>{nomes.get(id) || `${t.unavailable} (#${id})`}</li>)}</ul></div>}
    {regras.grupos.map(g => {
      const count = g.disciplinaIds.filter(id => selecionadas.includes(id)).length;
      return <fieldset key={g.id} className="rounded-xl border border-slate-300 p-3 dark:border-slate-600">
        <legend className="px-1 font-semibold">{g.nome} — {count}/{g.maximo}</legend>
        <p className="mb-2 text-xs">{t.min}: {g.minimo} · {t.max}: {g.maximo}</p>
        <div className="grid gap-2 sm:grid-cols-2">{g.disciplinaIds.map(id => {
          const checked = selecionadas.includes(id);
          return <label key={id} className="flex items-center gap-2 rounded-lg bg-white p-2 dark:bg-slate-950"><input type="checkbox" checked={checked} disabled={!checked && (count >= g.maximo || !nomes.has(id))} onChange={() => onChange(checked ? selecionadas.filter(x => x !== id) : [...selecionadas, id])} /><span className="text-sm">{nomes.get(id) || `${t.unavailable} (#${id})`}</span></label>;
        })}</div>
      </fieldset>;
    })}
  </section>;
}
