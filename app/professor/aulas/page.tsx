"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type AulaProfessor = {
  id: number;
  titulo?: string;

  ordem?: number | null;


  createdAt?: string | null;
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

type OrdenacaoAulas =
  | "ordemAsc"
  | "ordemDesc"
  | "alfabeticaAsc"
  | "alfabeticaDesc"
  | "postagemRecente"
  | "postagemAntiga";

type VisualizacaoAulas = "cards" | "lista";

export default function ProfessorAulasPage() {
  const t = useTranslations("ProfessorLessons");
  const locale = useLocale();

  const [aulas, setAulas] = useState<AulaProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [ordenacao, setOrdenacao] =

    useState<OrdenacaoAulas>("ordemAsc");
  const [visualizacao, setVisualizacao] =
    useState<VisualizacaoAulas>("cards");
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

  const aulasOrdenadas = [...aulas].sort((a, b) => {
    const tituloA = (a.titulo || a.nome || "").trim();
    const tituloB = (b.titulo || b.nome || "").trim();

    const disciplinaA = (a.disciplina?.nome || "").trim();
    const disciplinaB = (b.disciplina?.nome || "").trim();

    const turmaA = (a.turma?.nome || "").trim();
    const turmaB = (b.turma?.nome || "").trim();

    const ordemAValida = typeof a.ordem === "number";
    const ordemBValida = typeof b.ordem === "number";

    const ordemA = ordemAValida ? a.ordem! : 0;
    const ordemB = ordemBValida ? b.ordem! : 0;

    const dataA = a.createdAt
      ? new Date(a.createdAt).getTime()
      : 0;

    const dataB = b.createdAt
      ? new Date(b.createdAt).getTime()
      : 0;

    const compararTexto = (x: string, y: string) =>
      x.localeCompare(y, locale, {
        sensitivity: "base",
        numeric: true,
      });

    switch (ordenacao) {
      case "ordemAsc": {
        const porDisciplina = compararTexto(
          disciplinaA,
          disciplinaB
        );

        if (porDisciplina !== 0) {
          return porDisciplina;
        }

        const porTurma = compararTexto(
          turmaA,
          turmaB
        );

        if (porTurma !== 0) {
          return porTurma;
        }

        if (ordemAValida !== ordemBValida) {
          return ordemAValida ? -1 : 1;
        }

        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }

        return compararTexto(tituloA, tituloB);
      }

      case "ordemDesc": {
        const porDisciplina = compararTexto(
          disciplinaA,
          disciplinaB
        );

        if (porDisciplina !== 0) {
          return porDisciplina;
        }

        const porTurma = compararTexto(
          turmaA,
          turmaB
        );

        if (porTurma !== 0) {
          return porTurma;
        }

        if (ordemAValida !== ordemBValida) {
          return ordemAValida ? -1 : 1;
        }

        if (ordemA !== ordemB) {
          return ordemB - ordemA;
        }

        return compararTexto(tituloA, tituloB);
      }

      case "alfabeticaAsc":
        return compararTexto(tituloA, tituloB);

      case "alfabeticaDesc":
        return compararTexto(tituloB, tituloA);

      case "postagemAntiga": {
        if (dataA !== dataB) {
          return dataA - dataB;
        }

        return a.id - b.id;
      }

      case "postagemRecente":
      default: {
        if (dataA !== dataB) {
          return dataB - dataA;
        }

        return b.id - a.id;
      }
    }
  });

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
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <label
            htmlFor="ordenacao-aulas"
            className="text-sm font-bold text-slate-700 dark:text-slate-200"
          >
            {t("sort.label")}
          </label>

          <select
            id="ordenacao-aulas"
            value={ordenacao}
            onChange={(event) =>
              setOrdenacao(
                event.target.value as OrdenacaoAulas
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white sm:w-auto"
          >
            <option value="ordemAsc">
              {t("sort.lessonAsc")}
            </option>

            <option value="ordemDesc">
              {t("sort.lessonDesc")}
            </option>

            <option value="alfabeticaAsc">
              {t("sort.alphabeticalAsc")}
            </option>

            <option value="alfabeticaDesc">
              {t("sort.alphabeticalDesc")}
            </option>

            <option value="postagemRecente">
              {t("sort.newest")}
            </option>

            <option value="postagemAntiga">
              {t("sort.oldest")}
            </option>
          </select>

            <div className="flex items-center gap-2 sm:ml-3">
              <span className="hidden text-sm font-bold text-slate-700 dark:text-slate-200 lg:inline">
                {t("view.label")}
              </span>

              <div
                className="inline-flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-600 dark:bg-slate-900"
                aria-label={t("view.label")}
              >
                <button
                  type="button"
                  onClick={() => setVisualizacao("cards")}
                  aria-pressed={visualizacao === "cards"}
                  title={t("view.cards")}
                  className={
                    visualizacao === "cards"
                      ? "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm"
                      : "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>

                  <span className="hidden sm:inline">
                    {t("view.cards")}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisualizacao("lista")}
                  aria-pressed={visualizacao === "lista"}
                  title={t("view.list")}
                  className={
                    visualizacao === "lista"
                      ? "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm"
                      : "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M8 6h13" />
                    <path d="M8 12h13" />
                    <path d="M8 18h13" />
                    <path d="M3 6h.01" />
                    <path d="M3 12h.01" />
                    <path d="M3 18h.01" />
                  </svg>

                  <span className="hidden sm:inline">
                    {t("view.list")}
                  </span>
                </button>
              </div>
            </div>

        </div>
      )}

      {!loading && !erro && aulas.length > 0 && (
        <div
          className={
            visualizacao === "cards"
              ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              : "grid grid-cols-1 gap-2"
          }
        >
          {aulasOrdenadas.map((aula) =>
            visualizacao === "lista" ? (
              <article
                key={aula.id}
                data-view="compact-list"
                className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-blue-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {typeof aula.ordem === "number"
                    ? aula.ordem
                    : "—"}
                </div>

                <div className="min-w-0 flex-[2]">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2
                      className="truncate text-sm font-black text-slate-900 dark:text-white"
                      title={
                        aula.titulo ||
                        aula.nome ||
                        t("untitled")
                      }
                    >
                      {aula.titulo ||
                        aula.nome ||
                        t("untitled")}
                    </h2>

                    {aula.substituicaoAtiva && (
                      <span className="hidden shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 xl:inline">
                        {t("substitution.title")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 md:block">
                  <p
                    className="truncate text-xs text-slate-600 dark:text-slate-300"
                    title={aula.disciplina?.nome || "-"}
                  >
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">
                      {t("subject")}:
                    </strong>{" "}
                    {aula.disciplina?.nome || "-"}
                  </p>
                </div>

                <div className="hidden min-w-0 flex-1 lg:block">
                  <p
                    className="truncate text-xs text-slate-600 dark:text-slate-300"
                    title={aula.turma?.nome || "-"}
                  >
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">
                      {t("class")}:
                    </strong>{" "}
                    {aula.turma?.nome || "-"}
                  </p>
                </div>

                <a
                  href={`/professor/aulas/${aula.id}/materiais/novo`}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <span className="hidden sm:inline">
                    {aula.substituicaoAtiva
                      ? t("addMaterialAsSubstitute")
                      : t("addMaterial")}
                  </span>

                  <span
                    className="text-base sm:hidden"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </a>
              </article>
            ) : (
            <article
              key={aula.id}
              className={
                visualizacao === "cards"
                  ? "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
              }
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
            )
          )}
        </div>
      )}
    </main>
  );
}