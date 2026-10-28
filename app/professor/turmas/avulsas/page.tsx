"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { copyTurmasAvulsas } from "@/lib/professor/turmas-avulsas-copy";

type Horario = { diaSemana: number; horaInicio: string; horaFim: string };
type Turma = {
  id: number;
  nome: string;
  turno: string | null;
  periodoLetivo: string | null;
  curso: { id: number; nome: string } | null;
  capacidadeMaxima: number | null;
  alunos: number;
  horarios: Horario[];
};
const classe = "rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export default function TurmasAvulsasProfessorPage() {
  const router = useRouter();
  const locale = useLocale();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const copy = copyTurmasAvulsas(locale);
  const dias = copy.days;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/professor/turmas/avulsas", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async response => {
        const json = await response.json();
        if (!response.ok || !Array.isArray(json)) throw new Error(json?.error || copy.fetchError);
        if (!controller.signal.aborted) setTurmas(json);
      })
      .catch(error => { if (!controller.signal.aborted) setErro(error?.message || copy.fetchError); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [copy.fetchError]);
  return (
    <main className="min-h-screen space-y-5 bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:p-8">
      <button type="button" onClick={() => router.push("/professor/turmas")}
        className="font-semibold text-blue-700 hover:underline dark:text-blue-300">← {copy.back}</button>
      <header className={classe}>
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {copy.description}
        </p>
      </header>
      {loading && <p role="status">{copy.loading}</p>}
      {erro && <p role="alert" className="rounded-xl border border-red-300 p-4 text-red-800 dark:text-red-300">{erro}</p>}
      {!loading && !erro && !turmas.length && <section className={classe}>
        {copy.empty}
      </section>}
      <div className="grid gap-4 lg:grid-cols-2">
        {turmas.map(turma => <article key={turma.id} className={classe}>
          <h2 className="text-xl font-bold">{turma.nome}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{turma.curso?.nome || copy.missingCourse} · {turma.turno || copy.missingShift} · {turma.periodoLetivo || copy.missingPeriod}</p>
          <p className="mt-2 text-sm">{copy.students}: {turma.alunos}
            {turma.capacidadeMaxima !== null ? ` · ${copy.capacity}: ${turma.capacidadeMaxima}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {turma.horarios.map((h, i) => <span key={`${h.diaSemana}-${h.horaInicio}-${i}`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold dark:border-slate-600">
              {dias[h.diaSemana] || "Dia"} · {h.horaInicio}–{h.horaFim}
            </span>)}
          </div>
          <button type="button" onClick={() => router.push(`/professor/turmas/${turma.id}/chamadas-avulsas`)}
            className="mt-4 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
            {copy.openAttendance}
          </button>
        </article>)}
      </div>
    </main>
  );
}
