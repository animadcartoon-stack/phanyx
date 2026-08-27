"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AtividadesDisciplinaPage() {
  const t = useTranslations(
    "ProfessorDisciplineActivities"
  );

  return (
    <div className="space-y-6 p-6 text-slate-900 dark:text-slate-100 md:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
              {t("eyebrow")}
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {t("title")}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("description")}
            </p>
          </div>

          <Link
            href="/professor/atividades/nova"
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            {t("actions.newActivity")}
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-950">
          📝
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          {t("empty.title")}
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          {t("empty.description")}
        </p>

        <Link
          href="/professor/atividades/nova"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          {t("actions.createFirst")}
        </Link>

        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left dark:border-blue-800 dark:bg-blue-950/40">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            {t("integration.title")}
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-700 dark:text-blue-300">
            {t("integration.description")}
          </p>
        </div>
      </section>
    </div>
  );
}