"use client";
import { useTranslations } from "next-intl";

export function OrganizacaoCursoSelect({ value, onChange, disabled = false }: {
  value: string; onChange: (valor: string) => void; disabled?: boolean;
}) {
  const t = useTranslations("AcademicStructure");
  return <label className="block text-sm text-slate-700 dark:text-slate-200">
    <span className="mb-1 block font-medium">{t("organization")}</span>
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <option value="SEMESTRAL">{t("SEMESTRAL")}</option>
      <option value="ANUAL">{t("ANUAL")}</option>
      <option value="LIVRE">{t("LIVRE")}</option>
    </select>
    <span className="mt-1 block text-xs">{t("organizationHelp")}</span>
  </label>;
}
