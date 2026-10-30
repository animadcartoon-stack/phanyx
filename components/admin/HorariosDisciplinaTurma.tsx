"use client";

import { useLocale, useTranslations } from "next-intl";

type Horario = { diaSemana: string; horaInicio: string; horaFim: string };
type Props = { nome: string; horarios: Horario[]; onChange: (horarios: Horario[]) => void; disabled?: boolean; geral?: boolean };

const textos = {
  "pt-BR": { title: "Dias e horários da turma (opcional)", day: "Dia da semana", slot: "horário", empty: "Sem horário específico. A turma pode continuar organizada apenas pelo turno e período letivo.", hint: "Para verificar conflitos na matrícula, informe o dia, o início e o fim da aula.", incomplete: "Complete o início e o fim deste horário para permitir a verificação de conflitos." },
  "pt-PT": { title: "Dias e horários da turma (opcional)", day: "Dia da semana", slot: "horário", empty: "Sem horário específico. A turma pode continuar organizada apenas pelo turno e período letivo.", hint: "Para verificar conflitos na matrícula, indique o dia, o início e o fim da aula.", incomplete: "Complete o início e o fim deste horário para permitir a verificação de conflitos." },
  "en-US": { title: "Class days and times (optional)", day: "Day of the week", slot: "time slot", empty: "No specific times. The class can remain organized by shift and academic period only.", hint: "To check enrollment conflicts, enter the day, start time and end time.", incomplete: "Complete the start and end times to enable conflict checking." },
  "es-ES": { title: "Días y horarios del grupo (opcional)", day: "Día de la semana", slot: "horario", empty: "Sin horario específico. El grupo puede seguir organizado solo por turno y período lectivo.", hint: "Para comprobar conflictos de matrícula, indique el día, la hora de inicio y la de fin.", incomplete: "Complete el inicio y el fin de este horario para comprobar los conflictos." },
  "fr-FR": { title: "Jours et horaires de la classe (facultatif)", day: "Jour de la semaine", slot: "créneau", empty: "Aucun horaire précis. La classe peut rester organisée uniquement par période de la journée et période scolaire.", hint: "Pour vérifier les conflits d’inscription, indiquez le jour, l’heure de début et l’heure de fin.", incomplete: "Complétez les heures de début et de fin pour vérifier les conflits." },
} as const;
const dias = [[1, "classesMon"], [2, "classesTue"], [3, "classesWed"], [4, "classesThu"], [5, "classesFri"], [6, "classesSat"], [0, "classesSun"]] as const;
const campo = "h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

export default function HorariosDisciplinaTurma({ nome, horarios, onChange, disabled = false, geral = false }: Props) {
  const t = useTranslations("AdminOperations");
  const locale = useLocale();
  const copy = textos[locale as keyof typeof textos] || textos["en-US"];
  const geralCopy = gerais[locale] || gerais["en-US"];
  function alterar(index: number, chave: keyof Horario, valor: string) {
    onChange(horarios.map((h, i) => i === index ? { ...h, [chave]: valor } : h));
  }
  return <fieldset disabled={disabled} className="phanyx-turma-horarios-card min-w-0 rounded-xl border p-3">
    <legend className="phanyx-turma-horarios-titulo px-1 text-sm font-bold">{geral ? geralCopy.title : copy.title} — {nome}</legend>
    <p className="phanyx-turma-horarios-texto mb-3 text-xs">{geral ? geralCopy.hint : copy.hint}</p>
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

const gerais: Record<string, { title: string; hint: string; invalid: string; overlap: string; limit: string; history: string }> = {
  "pt-BR": { title: "Horário geral da turma (opcional)", hint: "Salvo pelo botão Salvar, sem exigir disciplina nem mudar o curso. Horários específicos das disciplinas têm prioridade sobre este horário geral.", invalid: "Informe o dia e os dois horários, com início anterior ao fim. Remova as linhas que não deseja utilizar.", overlap: "Os horários desta turma não podem se sobrepor no mesmo dia.", limit: "Informe até 30 horários válidos ou remova as linhas não utilizadas.", history: "A turma tem matrículas, aulas ou vínculos que precisam ser preservados. Os horários e as disciplinas não foram alterados." },
  "pt-PT": { title: "Horário geral da turma (opcional)", hint: "Guardado pelo botão Guardar, sem exigir disciplina nem mudar o curso. Horários específicos das disciplinas têm prioridade sobre este horário geral.", invalid: "Indique o dia e os dois horários, com início anterior ao fim. Remova as linhas que não pretende utilizar.", overlap: "Os horários desta turma não podem sobrepor-se no mesmo dia.", limit: "Indique até 30 horários válidos ou remova as linhas não utilizadas.", history: "A turma tem matrículas, aulas ou vínculos que precisam de ser preservados. Os horários e as disciplinas não foram alterados." },
  "en-US": { title: "General class schedule (optional)", hint: "Saved with the Save button without requiring a subject or changing the course. Subject-specific schedules take precedence over this general schedule.", invalid: "Enter the day and both times, with start before end. Remove any unused rows.", overlap: "This class cannot have overlapping times on the same day.", limit: "Enter up to 30 valid time slots or remove unused rows.", history: "This class has enrollments, lessons or linked records that must be preserved. Its schedules and subjects were not changed." },
  "es-ES": { title: "Horario general de la clase (opcional)", hint: "Se guarda con el botón Guardar sin exigir asignatura ni cambiar el curso. Los horarios específicos de las asignaturas tienen prioridad sobre este horario general.", invalid: "Indique el día y ambas horas, con inicio anterior al fin. Quite las filas que no utilice.", overlap: "Los horarios de esta clase no pueden solaparse el mismo día.", limit: "Indique hasta 30 horarios válidos o quite las filas no utilizadas.", history: "Esta clase tiene matrículas, clases o vínculos que deben conservarse. No se modificaron sus horarios ni asignaturas." },
  "fr-FR": { title: "Horaire général de la classe (facultatif)", hint: "Enregistré avec le bouton Enregistrer sans exiger de matière ni changer de cursus. Les horaires propres aux matières priment sur cet horaire général.", invalid: "Indiquez le jour et les deux heures, le début précédant la fin. Supprimez les lignes inutilisées.", overlap: "Les horaires de cette classe ne peuvent pas se chevaucher le même jour.", limit: "Indiquez au maximum 30 créneaux valides ou supprimez les lignes inutilisées.", history: "Cette classe comporte des inscriptions, séances ou liens à conserver. Ses horaires et matières n’ont pas été modifiés." },
};
export function mensagemErroHorarioTurma(codigo: string | undefined, locale: string): string | undefined {
  const copy = gerais[locale] || gerais["en-US"];
  return codigo === "HORARIO_INVALIDO" ? copy.invalid : codigo === "HORARIOS_SOBREPOSTOS" ? copy.overlap
    : codigo === "HORARIOS_OBRIGATORIOS" ? copy.limit : codigo === "OFERTA_COM_HISTORICO" ? copy.history : undefined;
}
