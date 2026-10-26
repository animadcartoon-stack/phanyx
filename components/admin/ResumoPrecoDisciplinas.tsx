"use client";
import { useLocale, useTranslations } from "next-intl";
import { calcularPrecoDisciplinas, ErroPrecoDisciplinas } from "@/lib/matriculas/preco-disciplinas";
export default function ResumoPrecoDisciplinas({ valorUnitario, regras, ids }: { valorUnitario: unknown; regras: unknown; ids: number[] }) {
  const t = useTranslations("SubjectPricing"), locale = useLocale();
  let preco;
  try { preco = calcularPrecoDisciplinas(valorUnitario, regras, ids); } catch(e) { return <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-slate-900 dark:text-amber-200 md:col-span-4">{e instanceof ErroPrecoDisciplinas && t.has(`errors.${e.codigo}`) ? t(`errors.${e.codigo}`) : t("chooseHelp")}</p>; }
  const moeda = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(n);
  return <div role="status" data-resumo-preco-disciplinas className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 dark:bg-slate-900 dark:text-emerald-100 md:col-span-4">
    <p>{t("subtotal", { count: preco.quantidade, unit: moeda(preco.valorUnitario), value: moeda(preco.subtotal) })}</p>
    <p>{t("discountTotal", { percent: preco.descontoPercentual, value: moeda(preco.descontoValor) })}</p>
    <p className="mt-1 text-lg font-bold">{t("monthlyTotal", { value: moeda(preco.total) })}</p><p className="mt-1 text-xs">{t("feeHelp")}</p><p className="mt-1 text-xs">{t("dueDateHelp")}</p>
  </div>;
}
