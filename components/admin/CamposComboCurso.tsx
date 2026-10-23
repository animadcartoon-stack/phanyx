"use client";
import { useTranslations } from "next-intl";

export type FaixaComboFormulario = {
  quantidadeAtividades: string;
  valorMensalidade: string;
};

export default function CamposComboCurso({
  participaCombo,
  valorMensalidadeCombo,
  precosComboPorQuantidade,
  onChange,
}: {
  participaCombo: boolean;
  valorMensalidadeCombo: string;
  precosComboPorQuantidade: FaixaComboFormulario[];
  onChange: (dados: {
    participaCombo?: boolean;
    valorMensalidadeCombo?: string;
    precosComboPorQuantidade?: FaixaComboFormulario[];
  }) => void;
}) {
  const t = useTranslations("EnrollmentCombos");
  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-white";
  const alterar = (indice: number, dados: Partial<FaixaComboFormulario>) =>
    onChange({ precosComboPorQuantidade: precosComboPorQuantidade.map((faixa, i) => i === indice ? { ...faixa, ...dados } : faixa) });
  return (
    <details className="group rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100 md:col-span-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span>{t("courseSettings")} <span className="text-sm font-normal">({t("optional")})</span></span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={participaCombo} onChange={e => onChange({ participaCombo: e.target.checked })} />
          {t("participates")}
        </label>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("quantityCourseHelp")}</p>
        <fieldset disabled={!participaCombo} className="min-w-0 space-y-3 disabled:opacity-60">
          <legend className="mb-2 text-sm font-semibold">{t("quantityPrices")}</legend>
          {precosComboPorQuantidade.map((faixa, indice) => (
            <div key={indice} className="grid gap-3 rounded-lg border border-blue-200 p-3 dark:border-slate-700 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-sm">{t("activityCount")}
                <input type="number" min="2" max="100" step="1" value={faixa.quantidadeAtividades}
                  onChange={e => alterar(indice, { quantidadeAtividades: e.target.value })} className={input} />
              </label>
              <label className="text-sm">{t("courseMonthlyInCombo")}
                <input type="number" min="0" step="0.01" value={faixa.valorMensalidade}
                  onChange={e => alterar(indice, { valorMensalidade: e.target.value })} className={input} />
              </label>
              <button type="button" aria-label={t("removeQuantityPrice", { count: indice + 1 })}
                onClick={() => onChange({ precosComboPorQuantidade: precosComboPorQuantidade.filter((_, i) => i !== indice) })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">{t("removePrice")}</button>
            </div>
          ))}
          <button type="button" disabled={precosComboPorQuantidade.length >= 99}
            onClick={() => onChange({ precosComboPorQuantidade: [...precosComboPorQuantidade, { quantidadeAtividades: "", valorMensalidade: "" }] })}
            className="rounded-lg border border-blue-400 px-3 py-2 text-sm font-semibold disabled:opacity-50">{t("addQuantityPrice")}</button>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("quantityFeeHelp")}</p>
          <details className="rounded-lg border border-slate-300 p-3 dark:border-slate-700">
            <summary className="cursor-pointer text-sm">{t("existingPackagePrice")}</summary>
            <label className="mt-3 block text-sm">{t("comboMonthly")}
              <input type="number" min="0" step="0.01" value={valorMensalidadeCombo}
                onChange={e => onChange({ valorMensalidadeCombo: e.target.value })} className={input} />
            </label>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("courseHelp")}</p>
          </details>
        </fieldset>
      </div>
    </details>
  );
}
