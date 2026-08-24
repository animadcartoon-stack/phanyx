"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type DisciplinaAluno = {
  id: number;
  nome: string;
  turmaId?: number;
  turmaNome?: string;
  totalAulas?: number;
  totalPresencas?: number;
};

type AulasAlunoResponse = {
  curso?: {
    id: number;
    nome: string;
  } | null;
  disciplinas?: DisciplinaAluno[];
};

function getPercentual(totalAulas?: number, totalPresencas?: number) {
  const aulas = Number(totalAulas || 0);
  const presencas = Number(totalPresencas || 0);

  if (!Number.isFinite(aulas) || aulas <= 0) {
    return 0;
  }

  if (!Number.isFinite(presencas) || presencas <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((presencas / aulas) * 100)));
}

export default function ProgressoAluno() {
  const t = useTranslations("StudentProgress");
  const [disciplinas, setDisciplinas] = useState<DisciplinaAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregarProgresso = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const response = await fetch("/api/aluno/aulas", {
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as
        | AulasAlunoResponse
        | null;

      if (!response.ok || !Array.isArray(data?.disciplinas)) {
        setDisciplinas([]);
        setErro(t("loadError"));
        return;
      }

      setDisciplinas(data.disciplinas);
    } catch (error) {
      console.error("Failed to load student progress:", error);
      setDisciplinas([]);
      setErro(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void carregarProgresso();
  }, [carregarProgresso]);

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
      </section>

      {loading ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          {t("loading")}
        </div>
      ) : erro ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
        >
          <p className="text-sm font-semibold">{erro}</p>

          <button
            type="button"
            onClick={() => void carregarProgresso()}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          >
            {t("retry")}
          </button>
        </div>
      ) : disciplinas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-6">
          {disciplinas.map((disciplina) => {
            const percentual = getPercentual(
              disciplina.totalAulas,
              disciplina.totalPresencas
            );
            const concluido = percentual >= 100;

            return (
              <article
                key={`${disciplina.id}-${disciplina.turmaId ?? "sem-turma"}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                      {disciplina.nome}
                    </h2>

                    <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      <p>
                        <strong className="font-semibold text-slate-950 dark:text-white">
                          {t("classLabel")}:
                        </strong>{" "}
                        {disciplina.turmaNome || t("notInformed")}
                      </p>

                      <p>
                        <strong className="font-semibold text-slate-950 dark:text-white">
                          {t("totalLessons")}:
                        </strong>{" "}
                        {disciplina.totalAulas ?? 0}
                      </p>

                      <p>
                        <strong className="font-semibold text-slate-950 dark:text-white">
                          {t("attendanceRecords")}:
                        </strong>{" "}
                        {disciplina.totalPresencas ?? 0}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`aluno-status-progresso-pill inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      concluido
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                        : "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200"
                    }`}
                  >
                    {concluido ? t("completed") : t("inProgress")}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {t("progressPercentage")}
                    </span>
                    <span className="font-semibold text-slate-950 dark:text-white">
                      {percentual}%
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-label={`${disciplina.nome}: ${percentual}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentual}
                    className="h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                  >
                    <div
                      className={`h-4 rounded-full transition-all ${
                        concluido ? "bg-emerald-600" : "bg-blue-600"
                      }`}
                      style={{ width: `${percentual}%` }}
                    />
                  </div>

                  {concluido && (
                    <p className="mt-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      ✅ {t("completedMessage")}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}