"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ProgressoProfessor() {
  const t = useTranslations(
    "ProfessorProgress"
  );

  return (
    <div className="space-y-6 p-6 text-slate-900 dark:text-slate-100 md:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
          {t("description")}
        </p>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex gap-4">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl dark:bg-amber-900/50"
          >
            ⚠️
          </div>

          <div>
            <h2 className="font-black text-amber-950 dark:text-amber-100">
              {t(
                "integration.title"
              )}
            </h2>

            <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-200">
              {t(
                "integration.description"
              )}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {t(
              "available.title"
            )}
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "available.description"
            )}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/professor/turmas"
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
          >
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/50"
            >
              👥
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
              {t(
                "available.classes.title"
              )}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t(
                "available.classes.description"
              )}
            </p>

            <p className="mt-5 text-sm font-bold text-emerald-700 group-hover:underline dark:text-emerald-400">
              {t(
                "available.classes.action"
              )}
            </p>
          </Link>

          <Link
            href="/professor/alunos"
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
          >
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/50"
            >
              🎓
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
              {t(
                "available.students.title"
              )}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t(
                "available.students.description"
              )}
            </p>

            <p className="mt-5 text-sm font-bold text-emerald-700 group-hover:underline dark:text-emerald-400">
              {t(
                "available.students.action"
              )}
            </p>
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t(
              "progress.title"
            )}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t(
              "progress.description"
            )}
          </p>
        </div>

        <div className="p-6">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900">
              📈
            </div>

            <div className="mx-auto mt-4 max-w-xl">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {t(
                  "progress.emptyTitle"
                )}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(
                  "progress.emptyDescription"
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/professor/turmas"
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {t(
                  "actions.viewClasses"
                )}
              </Link>

              <Link
                href="/professor/alunos"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "actions.viewStudents"
                )}
              </Link>
            </div>
          </div>
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
  );
}