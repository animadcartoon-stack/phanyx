"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LancarNotaPage() {
  const params =
    useParams<{
      alunoId: string;
    }>();

  const t = useTranslations(
    "ProfessorStudentGrade"
  );

  const alunoId = String(
    params?.alunoId || ""
  ).trim();

  const alunoIdValido =
    /^\d+$/.test(alunoId) &&
    Number(alunoId) > 0;

  if (!alunoIdValido) {
    return (
      <main className="min-h-screen p-6 text-slate-900 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-950/40">
            <h1 className="text-lg font-black text-red-800 dark:text-red-200">
              {t(
                "invalid.title"
              )}
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-300">
              {t(
                "invalid.description"
              )}
            </p>

            <Link
              href="/professor/notas"
              className="mt-5 inline-flex rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {t(
                "actions.back"
              )}
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 text-slate-900 dark:text-slate-100 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/professor/notas"
          className="inline-flex text-sm font-semibold text-violet-600 transition hover:text-violet-700 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
        >
          {t(
            "actions.back"
          )}
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-400">
            {t("eyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t(
              "description"
            )}
          </p>

          <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            {t(
              "studentReference",
              {
                id: alunoId,
              }
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex gap-4">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-900/50"
            >
              ⚠️
            </div>

            <div>
              <h2 className="font-black text-amber-950 dark:text-amber-100">
                {t(
                  "integration.title"
                )}
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-900/80 dark:text-amber-200">
                {t(
                  "integration.description"
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t(
              "available.title"
            )}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t(
              "available.description"
            )}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Link
              href="/professor/provas"
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-violet-700 dark:hover:bg-violet-950/30"
            >
              <div
                aria-hidden="true"
                className="text-2xl"
              >
                📝
              </div>

              <h3 className="mt-3 font-black text-slate-900 dark:text-white">
                {t(
                  "available.exams.title"
                )}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t(
                  "available.exams.description"
                )}
              </p>

              <p className="mt-4 text-sm font-bold text-violet-600 group-hover:underline dark:text-violet-400">
                {t(
                  "available.exams.action"
                )}
              </p>
            </Link>

            <Link
              href="/professor/turmas"
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-violet-700 dark:hover:bg-violet-950/30"
            >
              <div
                aria-hidden="true"
                className="text-2xl"
              >
                👥
              </div>

              <h3 className="mt-3 font-black text-slate-900 dark:text-white">
                {t(
                  "available.classes.title"
                )}
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t(
                  "available.classes.description"
                )}
              </p>

              <p className="mt-4 text-sm font-bold text-violet-600 group-hover:underline dark:text-violet-400">
                {t(
                  "available.classes.action"
                )}
              </p>
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t(
              "safetyNotice"
            )}
          </p>
        </section>
      </div>
    </main>
  );
}