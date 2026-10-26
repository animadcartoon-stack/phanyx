"use client";
import { useTranslations } from "next-intl";
export type FaixaDisciplinasFormulario = { quantidade: string; descontoPercentual: string };
export default function CamposPrecoDisciplinas({ ativo, faixas, onChange }: { ativo: boolean; faixas: FaixaDisciplinasFormulario[]; onChange: (dados: { ativo?: boolean; faixas?: FaixaDisciplinasFormulario[] }) => void }) {
  const t = useTranslations("SubjectPricing");
  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white";
  return <details open={ativo || undefined} className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-white md:col-span-2">
    <summary className="cursor-pointer font-semibold">{t("settingsTitle")}</summary>
    <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={ativo} onChange={e => onChange({ ativo: e.target.checked })} />{t("enable")}</label>
    {ativo && <><p className="my-3 text-sm">{t("settingsHelp")}</p><div className="space-y-3">{faixas.map((f, i) => <div key={i} className="grid gap-3 rounded-lg border border-blue-200 p-3 sm:grid-cols-[1fr_1fr_auto]">
      <label>{t("quantity")}<input className={input} type="number" min="1" max="100" step="1" value={f.quantidade} onChange={e => onChange({ faixas: faixas.map((a, j) => j === i ? { ...a, quantidade: e.target.value } : a) })} /></label>
      <label>{t("discount")}<input className={input} type="number" min="0" max="100" step="0.01" value={f.descontoPercentual} onChange={e => onChange({ faixas: faixas.map((a, j) => j === i ? { ...a, descontoPercentual: e.target.value } : a) })} /></label>
      <button type="button" onClick={() => onChange({ faixas: faixas.filter((_, j) => j !== i) })}>{t("remove")}</button>
    </div>)}</div><button className="mt-3 rounded-lg border border-blue-400 px-3 py-2" type="button" disabled={faixas.length >= 100} onClick={() => onChange({ faixas: [...faixas, { quantidade: "", descontoPercentual: "0" }] })}>{t("add")}</button></>}
  </details>;
}
