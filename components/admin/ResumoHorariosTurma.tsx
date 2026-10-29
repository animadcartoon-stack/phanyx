"use client";

import { useLocale, useTranslations } from "next-intl";

type Horario = {
  id?: number;
  diaSemana: number;
  horaInicio: string;
  horaFim?: string | null;
  ativo?: boolean;
};

type Disciplina = { id: number; nome: string; horarios?: Horario[] };

const textos: Record<string, { titulo: string; vazio: string }> = {
  "pt-BR": { titulo: "Horários", vazio: "Horários não informados." },
  "pt-PT": { titulo: "Horários", vazio: "Horários não indicados." },
  "en-US": { titulo: "Class times", vazio: "Class times not provided." },
  "es-ES": { titulo: "Horarios", vazio: "Horarios no indicados." },
  "fr-FR": { titulo: "Horaires", vazio: "Horaires non renseignés." },
};
const dias = ["classesSun", "classesMon", "classesTue", "classesWed", "classesThu", "classesFri", "classesSat"] as const;

export default function ResumoHorariosTurma({ disciplinas = [] }: { disciplinas?: Disciplina[] }) {
  const locale = useLocale();
  const t = useTranslations("AdminOperations");
  const texto = textos[locale] || textos["en-US"];

  return (
    <div className="phanyx-turma-horarios-card my-2 rounded-xl border p-3 text-sm" role="group" aria-label={texto.titulo}>
      <p className="phanyx-turma-horarios-titulo font-semibold">{texto.titulo}</p>
      {disciplinas.length === 0 ? (
        <p className="phanyx-turma-horarios-texto">{texto.vazio}</p>
      ) : disciplinas.map(disciplina => {
        const horarios = (disciplina.horarios || []).filter(horario => horario.ativo !== false);
        return (
          <div key={disciplina.id} className="phanyx-turma-horarios-texto mt-1 break-words">
            <span className="font-medium">{disciplina.nome}</span>
            {horarios.length === 0 ? <p>{texto.vazio}</p> : (
              <ul className="space-y-1">
                {horarios.map((horario, index) => (
                  <li key={horario.id ?? index}>
                    {dias[horario.diaSemana] ? t(dias[horario.diaSemana]) : "—"}{" · "}
                    {horario.horaInicio || "—"}–{horario.horaFim || "—"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
