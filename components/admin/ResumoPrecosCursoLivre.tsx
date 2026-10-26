"use client";
import { useLocale, useTranslations } from "next-intl";
export default function ResumoPrecosCursoLivre({ valorSemanal, valorMensal }: { valorSemanal?: number | string | null; valorMensal?: number | string | null }) {
  const t = useTranslations("CoursePeriods"), locale = useLocale();
  const moeda = (valor: number | string) => new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(Number(valor));
  return <div className="space-y-1" data-precos-curso-livre>
    <p className="font-semibold">{t("prepaidBilling")}</p>
    {valorSemanal != null && valorSemanal !== "" && <p>{t("weeklyOffer", { value: moeda(valorSemanal) })}</p>}
    {valorMensal != null && valorMensal !== "" && <p>{t("monthlyOffer", { value: moeda(valorMensal) })}</p>}
    <p className="text-xs text-slate-600 dark:text-slate-300">{t("noAutomaticRenewal")}</p>
  </div>;
}
