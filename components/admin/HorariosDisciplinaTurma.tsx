"use client";

import { useLocale, useTranslations } from "next-intl";

type Horario = { diaSemana: string; horaInicio: string; horaFim: string };
type Props = { nome: string; horarios: Horario[]; onChange: (horarios: Horario[]) => void; disabled?: boolean };

const textos = {
  "pt-BR": { title: "Dias e horários da turma (opcional)", day: "Dia da semana", slot: "horário", empty: "Sem horário específico. A turma pode continuar organizada apenas pelo turno e período letivo.", hint: "Para verificar conflitos na matrícula, informe o dia, o início e o fim da aula.", incomplete: "Complete o início e o fim deste horário para permitir a verificação de conflitos." },
  "pt-PT": { title: "Dias e horários da turma (opcional)", day: "Dia da semana", slot: "horário", empty: "Sem horário específico. A turma pode continuar organizada apenas pelo turno e período letivo.", hint: "Para verificar conflitos na matrícula, indique o dia, o início e o fim da aula.", incomplete: "Complete o início e o fim deste horário para permitir a verificação de conflitos." },
  "en-US": { title: "Class days and times (optional)", day: "Day of the week", slot: "time slot", empty: "No specific times. The class can remain organized by shift and academic period only.", hint: "To check enrollment conflicts, enter the day, start time and end time.", incomplete: "Complete the start and end times to enable conflict checking." },
  "es-ES": { title: "Días y horarios del grupo (opcional)", day: "Día de la semana", slot: "horario", empty: "Sin horario específico. El grupo puede seguir organizado solo por turno y período lectivo.", hint: "Para comprobar conflictos de matrícula, indique el día, la hora de inicio y la de fin.", incomplete: "Complete el inicio y el fin de este horario para comprobar los conflictos." },
  "fr-FR": { title: "Jours et horaires de la classe (facultatif)", day: "Jour de la semaine", slot: "créneau", empty: "Aucun horaire précis. La classe peut rester organisée uniquement par période de la journée et période scolaire.", hint: "Pour vérifier les conflits d’inscription, indiquez le jour, l’heure de début et l’heure de fin.", incomplete: "Complétez les heures de début et de fin pour vérifier les conflits." },
} as const;
const dias = [[1, "classesMon"], [2, "classesTue"], [3, "classesWed"], [4, "classesThu"], [5, "classesFri"], [6, "classesSat"], [0, "classesSun"]] as const;
const campo = "h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

export default function HorariosDisciplinaTurma({ nome, horarios, onChange, disabled = false }: Props) {
  const t = useTranslations("AdminOperations");
  const locale = useLocale();
  const copy = textos[locale as keyof typeof textos] || textos["en-US"];
  function alterar(index: number, chave: keyof Horario, valor: string) {
    onChange(horarios.map((h, i) => i === index ? { ...h, [chave]: valor } : h));
  }
  return <fieldset disabled={disabled} className="phanyx-turma-horarios-card min-w-0 rounded-xl border p-3">
    <legend className="phanyx-turma-horarios-titulo px-1 text-sm font-bold">{copy.title} — {nome}</legend>
    <p className="phanyx-turma-horarios-texto mb-3 text-xs">{copy.hint}</p>
    {horarios.length === 0 && <p className="phanyx-turma-horarios-texto mb-3 text-sm">{copy.empty}</p>}
    <div className="space-y-3">
      {horarios.map((h, index) => <div key={index} className="space-y-1">
        <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_120px_120px_auto]">
          <label className="phanyx-turma-horarios-texto min-w-0 text-xs">{copy.day}
            <select value={h.diaSemana} onChange={e => alterar(index, "diaSemana", e.target.value)} className={campo + " mt-1"}>
              {dias.map(([dia, chave]) => <option key={dia} value={dia}>{t(chave)}</option>)}
            </select>
          </label>
          <label className="phanyx-turma-horarios-texto text-xs">{t("commonStartTime")}
            <input type="time" value={h.horaInicio} onChange={e => alterar(index, "horaInicio", e.target.value)} className={campo + " mt-1"}/>
          </label>
          <label className="phanyx-turma-horarios-texto text-xs">{t("commonEndTime")}
            <input type="time" value={h.horaFim} onChange={e => alterar(index, "horaFim", e.target.value)} className={campo + " mt-1"}/>
          </label>
          <button type="button" aria-label={`${t("commonRemove")} ${copy.slot} ${index + 1}`} onClick={() => onChange(horarios.filter((_, i) => i !== index))}
            className="h-10 rounded-lg bg-red-700 px-3 text-xs font-bold text-white hover:bg-red-800">{t("commonRemove")}</button>
        </div>
        {(!h.horaInicio || !h.horaFim) && <p role="status" className="phanyx-turma-horarios-texto text-xs">{copy.incomplete}</p>}
      </div>)}
    </div>
    <button type="button" onClick={() => onChange([...horarios, { diaSemana: "1", horaInicio: "", horaFim: "" }])}
      className="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800">{t("classesAddSchedule")}</button>
  </fieldset>;
}
