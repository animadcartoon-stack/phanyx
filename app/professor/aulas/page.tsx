"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type AulaProfessor = {
  id: number;
  titulo?: string;
  nome?: string;
  disciplina?: {
    nome?: string;
  };
  turma?: {
    nome?: string;
  };
  substituicaoAtiva?: {
    id: number;
    professorTitular?: {
      id: number;
      nome: string;
    } | null;
    dataInicio?: string | null;
    dataFim?: string | null;
  } | null;
};

function formatarData(
  data: string | null | undefined,
  locale: string,
  semPrevisao: string
) {
  if (!data) return semPrevisao;

  return new Date(data).toLocaleDateString(locale, {
    timeZone: "UTC",
  });
}

export default function ProfessorAulasPage() {
  const t = useTranslations("ProfessorLessons");
  const locale = useLocale();

  const [aulas, setAulas] = useState<AulaProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/professor/aulas", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || t("errorLoad"));
        }

        const lista = Array.isArray(json)
          ? json
          : json.aulas || json.items || [];

        setAulas(lista);
      } catch (e: any) {
        setErro(e?.message || t("errorLoad"));
        setAulas([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [t]);

  return (
    <main className="space-y-5 px-1 py-2 text-slate-900 sm:px-0">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900">
          {t("title")}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {t("description")}
        </p>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          {t("loading")}
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
          {erro}
        </div>
      )}

      {!loading && !erro && aulas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm">
          {t("empty")}
        </div>
      )}

      {!loading && !erro && aulas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {aulas.map((aula) => (
            <article
              key={aula.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {t("lesson")}
              </p>

              <h2 className="mt-2 text-lg font-black text-slate-900">
                {aula.titulo || aula.nome || t("untitled")}
              </h2>

              {aula.substituicaoAtiva && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="font-black">
                    🔁 {t("substitution.title")}
                  </p>

                  <p className="mt-1">
                    {t("substitution.holder")}:{" "}
                    <strong>
                      {aula.substituicaoAtiva.professorTitular?.nome || "-"}
                    </strong>
                  </p>

                  <p>
                    {t("substitution.period")}:{" "}
                    {formatarData(
                      aula.substituicaoAtiva.dataInicio,
                      locale,
                      t("substitution.noForecast")
                    )}{" "}
                    {t("substitution.until")}{" "}
                    {formatarData(
                      aula.substituicaoAtiva.dataFim,
                      locale,
                      t("substitution.noForecast")
                    )}
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                <p>
                  <strong className="font-semibold text-slate-800">
                    {t("subject")}:
                  </strong>{" "}
                  {aula.disciplina?.nome || "-"}
                </p>

                <p>
                  <strong className="font-semibold text-slate-800">
                    {t("class")}:
                  </strong>{" "}
                  {aula.turma?.nome || "-"}
                </p>
              </div>

              <a
                href={`/professor/aulas/${aula.id}/materiais/novo`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {aula.substituicaoAtiva
                  ? t("addMaterialAsSubstitute")
                  : t("addMaterial")}
              </a>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}