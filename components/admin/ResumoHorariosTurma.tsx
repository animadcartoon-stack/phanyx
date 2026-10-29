"use client";

import { useLocale, useTranslations } from "next-intl";
import estilos from "@/components/phanyx/DestaquesPainel.module.css";

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

export default function ResumoHorariosTurma({ disciplinas = [], horariosAvulsos = [], semDisciplinas = false }: {
  disciplinas?: Disciplina[]; horariosAvulsos?: Horario[]; semDisciplinas?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("AdminOperations");
  const texto = textos[locale] || textos["en-US"];
  const horariosProprios = horariosAvulsos.filter(horario => horario.ativo !== false);
  const grupos = semDisciplinas || horariosProprios.length > 0
    ? (horariosProprios.length ? [{ id: "turma", nome: "", horarios: horariosProprios }] : [])
    : disciplinas;

  return (
    <div className={`${estilos.horarios} text-sm`} role="group" aria-label={texto.titulo}>
      {grupos.length === 0 ? (
        <span>{texto.vazio}</span>
      ) : <><span className="font-semibold">{texto.titulo}: </span>{grupos.map((grupo, indiceGrupo) => {
        const horarios = (grupo.horarios || []).filter(horario => horario.ativo !== false);
        return (
          <span key={grupo.id}>
            {indiceGrupo > 0 ? " · " : null}
            {grupos.length > 1 ? <span className="font-medium">{grupo.nome}: </span> : null}
            {horarios.length === 0 ? <span>{texto.vazio}</span> : horarios.map((horario, index) => (
                  <span key={horario.id ?? index}>
                    {index > 0 ? " / " : null}
                    {dias[horario.diaSemana] ? t(dias[horario.diaSemana]) : "—"}{" · "}
                    <strong className={estilos.hora}>{horario.horaInicio || "—"}–{horario.horaFim || "—"}</strong>
                  </span>
                ))}
          </span>
        );
      })}</>}
    </div>
  );
}
