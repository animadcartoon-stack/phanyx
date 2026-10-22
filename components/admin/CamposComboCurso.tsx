"use client";
import { useTranslations } from "next-intl";

export default function CamposComboCurso({
  participaCombo,
  valorMensalidadeCombo,
  onChange,
}: {
  participaCombo: boolean;
  valorMensalidadeCombo: string;
  onChange: (dados: {
    participaCombo?: boolean;
    valorMensalidadeCombo?: string;
  }) => void;
}) {
  const t = useTranslations("EnrollmentCombos");
  return (
    <fieldset className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100 md:col-span-2">
      <legend className="px-1 font-semibold">{t("courseSettings")}</legend>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={participaCombo}
          onChange={(e) => onChange({ participaCombo: e.target.checked })}
        />
        {t("participates")}
      </label>
      <label className="block text-sm">
        {t("comboMonthly")}
        <input
          type="number"
          min="0"
          step="0.01"
          disabled={!participaCombo}
          value={valorMensalidadeCombo}
          onChange={(e) => onChange({ valorMensalidadeCombo: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        />
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t("courseHelp")}
      </p>
    </fieldset>
  );
}
