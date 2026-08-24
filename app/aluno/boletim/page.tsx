"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type ProvaBoletim = {
  tentativaId: number;
  provaId: number;
  titulo: string;
  nota: number | null;
  notaMaxima: number;
  notaLiberada?: boolean;
  notaDisponivelEm?: string | null;
  finalizada: boolean;
  startedAt?: string;
  finishedAt?: string | null;
  status: "FINALIZADA" | "EM_ANDAMENTO";
};

type DisciplinaBoletim = {
  disciplinaId: number;
  disciplinaNome: string;
  media: number;
  provas: ProvaBoletim[];
};

type BoletimResponse = {
  aluno: {
    id: number;
    userId: number;
  };
  totalDisciplinas: number;
  boletim: DisciplinaBoletim[];
};

function getMediaClass(media: number) {
  if (media >= 7) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200";
  }

  if (media >= 5) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200";
  }

  return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200";
}

function getDesempenhoClass(nota: number) {
  if (nota >= 7) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200";
  }

  if (nota >= 5) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200";
  }

  return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200";
}

export default function AlunoBoletimPage() {
  const locale = useLocale();
  const t = useTranslations("StudentGradebook");

  const [data, setData] = useState<BoletimResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarBoletim() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/boletim", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t("errors.load"));
      }

      setData(json);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : t("errors.load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarBoletim();
    // A consulta deve ser refeita somente quando a página for aberta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mediaGeral = useMemo(() => {
    if (!data || data.boletim.length === 0) return 0;

    const disciplinasComNota = data.boletim.filter((item) =>
      item.provas.some((prova) => prova.notaLiberada && prova.nota !== null)
    );

    if (disciplinasComNota.length === 0) return 0;

    const soma = disciplinasComNota.reduce(
      (acc, item) => acc + Number(item.media || 0),
      0
    );

    return Number((soma / disciplinasComNota.length).toFixed(1));
  }, [data]);

  const totalProvas = useMemo(() => {
    if (!data) return 0;

    return data.boletim.reduce((acc, item) => acc + item.provas.length, 0);
  }, [data]);

  function formatarData(valor?: string | null) {
    if (!valor) return t("common.notProvided");

    const dataFormatada = new Date(valor);

    if (Number.isNaN(dataFormatada.getTime())) {
      return valor;
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(dataFormatada);
  }

  function formatarNumero(valor: number | null | undefined) {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(Number(valor ?? 0));
  }

  function getDesempenhoLabel(nota: number) {
    if (nota >= 7) return t("performance.good");
    if (nota >= 5) return t("performance.attention");
    return t("performance.low");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <section className="aluno-boletim-hero overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-sm dark:border-slate-700">
          <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.3fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-200">
                {t("hero.eyebrow")}
              </p>

              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                {t("hero.title")}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100 md:text-base">
                {t("hero.description")}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/aluno"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {t("actions.backToDashboard")}
                </a>

                <a
                  href="/aluno/boletim"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  {t("actions.refreshGradebook")}
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-200">
                  {t("metrics.subjects.title")}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {loading ? "..." : data?.totalDisciplinas ?? 0}
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  {t("metrics.subjects.heroDescription")}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-200">
                  {t("metrics.overallAverage.title")}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {loading ? "..." : formatarNumero(mediaGeral)}
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  {t("metrics.overallAverage.heroDescription")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t("loading")}
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  {t("metrics.subjects.title")}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {data.totalDisciplinas}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {t("metrics.subjects.cardDescription")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  {t("metrics.exams.title")}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {totalProvas}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {t("metrics.exams.cardDescription")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  {t("metrics.overallAverage.title")}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatarNumero(mediaGeral)}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {t("metrics.overallAverage.cardDescription")}
                </p>
              </div>
            </section>

            {data.boletim.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t("empty.title")}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {t("empty.description")}
                </p>
              </div>
            )}

            <section className="space-y-6">
              {data.boletim.map((disciplina) => (
                <div
                  key={disciplina.disciplinaId}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {disciplina.disciplinaNome}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        {t("subject.examCount", {
                          count: disciplina.provas.length,
                        })}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getMediaClass(
                        disciplina.media
                      )}`}
                    >
                      {t("subject.average", {
                        value: formatarNumero(disciplina.media),
                      })}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {disciplina.provas.map((prova) => (
                      <div
                        key={prova.tentativaId}
                        className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-2">
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {prova.titulo}
                          </h3>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-300">
                            <span>
                              <strong className="font-medium text-slate-700 dark:text-slate-100">
                                {t("exam.gradeLabel")}:
                              </strong>{" "}

                              {prova.notaLiberada ? (
                                <>
                                  {formatarNumero(prova.nota)} /{" "}
                                  {formatarNumero(prova.notaMaxima)}
                                </>
                              ) : (
                                <span className="font-medium text-amber-600 dark:text-amber-300">
                                  {t("exam.gradeNotReleased")}
                                </span>
                              )}
                            </span>

                            <span>
                              <strong className="font-medium text-slate-700 dark:text-slate-100">
                                {t("exam.statusLabel")}:
                              </strong>{" "}
                              {prova.status === "FINALIZADA"
                                ? t("exam.status.finished")
                                : t("exam.status.inProgress")}
                            </span>

                            <span>
                              <strong className="font-medium text-slate-700 dark:text-slate-100">
                                {t("exam.finishedAtLabel")}:
                              </strong>{" "}
                              {formatarData(prova.finishedAt)}
                            </span>
                          </div>
                        </div>

                        <div>
                          {prova.notaLiberada ? (
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDesempenhoClass(
                                Number(prova.nota)
                              )}`}
                            >
                              {getDesempenhoLabel(Number(prova.nota))}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                              {t("exam.awaitingRelease")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}