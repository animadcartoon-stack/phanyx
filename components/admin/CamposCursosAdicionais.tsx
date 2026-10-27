"use client";
import { useTranslations } from "next-intl";
export default function CamposCursosAdicionais({ permite, disponivel, incompativel, disabled, onChange }: {
  permite: boolean; disponivel: boolean; incompativel: boolean; disabled?: boolean;
  onChange: (valor: { permiteCursosAdicionais?: boolean; disponivelComoAdicional?: boolean }) => void;
}) {
  const t = useTranslations("AdditionalCourses");
  return <fieldset disabled={disabled} className="space-y-3 rounded-xl border border-blue-300 bg-blue-50 p-4 text-slate-900 dark:border-blue-700 dark:bg-slate-900 dark:text-slate-100 md:col-span-2">
    <legend className="px-1 font-semibold">{t("title")}</legend>
    <label className="flex items-start gap-2"><input type="checkbox" checked={permite} onChange={e => onChange({ permiteCursosAdicionais: e.target.checked })} /><span>{t("allow")}</span></label>
    <label className="flex items-start gap-2"><input type="checkbox" checked={disponivel} onChange={e => onChange({ disponivelComoAdicional: e.target.checked })} /><span>{t("available")}</span></label>
    <p className="text-sm">{t("settingsHelp")}</p>
    {incompativel && (permite || disponivel) && <p role="alert" className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-amber-950 dark:bg-amber-950 dark:text-amber-100">{t("incompatible")}</p>}
  </fieldset>;
}
