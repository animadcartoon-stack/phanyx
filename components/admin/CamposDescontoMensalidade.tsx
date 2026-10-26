"use client";
import { useLocale, useTranslations } from "next-intl";
import { mensalidadeComDesconto } from "@/lib/matriculas/desconto-curso";
export default function CamposDescontoMensalidade({ valorMensalidade, percentual, onChange }: { valorMensalidade: string; percentual: string; onChange: (valor: string) => void }) {
  const t = useTranslations("CourseMonthlyDiscount"), locale = useLocale();
  let final: number | null = null;
  try { final = mensalidadeComDesconto(valorMensalidade, percentual); } catch { /* O campo mantém o valor digitado para correção. */ }
  const moeda = (valor: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(valor);
  return <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white md:col-span-2">
    <label className="block text-sm font-semibold">{t("label")}<input type="number" min="0" max="100" step="0.01" value={percentual} onChange={e => onChange(e.target.value)} placeholder={t("placeholder")} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" /></label>
    <p className="mt-1 text-xs">{t("help")}</p>
    {final != null && <p className="mt-2 text-sm font-semibold">{t("preview", { value: moeda(final) })}</p>}
  </div>;
}

export function ResumoDescontoMensalidade({ valorMensalidade, percentual }: { valorMensalidade: unknown; percentual: unknown }) {
  const t = useTranslations("CourseMonthlyDiscount"), locale = useLocale();
  if (percentual == null || Number(percentual) <= 0 || valorMensalidade == null) return null;
  const final = mensalidadeComDesconto(valorMensalidade, percentual);
  if (final == null) return null;
  return <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{t("summary", { percent: Number(percentual), value: new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(final) })}</p>;
}
