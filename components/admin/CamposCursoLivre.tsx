"use client";
import { useTranslations } from "next-intl";
export default function CamposCursoLivre({ valorSemanal, onChange, valorMensal, onChangeMensal }: { valorSemanal: string; onChange: (valor: string) => void; valorMensal: string; onChangeMensal: (valor: string) => void }) {
  const t = useTranslations("CoursePeriods");
  return <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-white md:col-span-2">
    <p className="text-sm">{t("courseHelp")}</p>
    <label className="mt-2 block text-sm font-semibold">{t("weeklyPrice")}<input type="number" min="0.01" max="99999999.99" step="0.01" value={valorSemanal} onChange={e => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" /></label>
    <label className="mt-2 block text-sm font-semibold">{t("monthlyPrice")}<input type="number" min="0.01" max="99999999.99" step="0.01" value={valorMensal} onChange={e => onChangeMensal(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" /></label>
  </div>;
}
