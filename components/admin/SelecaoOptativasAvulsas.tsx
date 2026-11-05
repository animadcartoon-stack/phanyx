"use client";

import { useLocale } from "next-intl";
import type { SessaoOptativa } from "@/lib/matriculas/optativas-avulsas";

export default function SelecaoOptativasAvulsas({ sessoes, selecionadas, onChange, disabled }: {
  sessoes: SessaoOptativa[]; selecionadas: number[]; onChange: (ids: number[]) => void; disabled?: boolean;
}) {
  const locale = useLocale();
  if (!sessoes.length) return null;
  const dia = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  return <fieldset disabled={disabled} className="my-3 space-y-2 rounded-xl border border-blue-300 p-3 dark:border-blue-800">
    <legend className="px-1 font-semibold">Atividades optativas incluídas</legend>
    <p className="text-sm">A matrícula na turma pode ser feita sem escolher atividades. As escolhas não alteram o preço do curso.</p>
    {sessoes.map(sessao => {
      const marcada = selecionadas.includes(sessao.id);
      return <label key={sessao.id} className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5" checked={marcada} disabled={!marcada && sessao.vagas <= 0}
          onChange={e => onChange(e.target.checked ? [...selecionadas, sessao.id] : selecionadas.filter(id => id !== sessao.id))} />
        <span>{sessao.nome} · {dia.format(new Date(Date.UTC(2023, 0, 1 + sessao.diaSemana)))} · {sessao.horaInicio}–{sessao.horaFim} · {sessao.vagas ? `${sessao.vagas} vaga(s)` : "Sem vagas"}</span>
      </label>;
    })}
  </fieldset>;
}
