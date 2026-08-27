"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotasPage() {
  const t = useTranslations(
    "ProfessorGrades"
  );

  const modulos = [
    {
      id: "classes",
      href: "/professor/turmas",
      icon: "👥",
      title: t(
        "modules.classes.title"
      ),
      description: t(
        "modules.classes.description"
      ),
      action: t(
        "modules.classes.action"
      ),
    },
    {
      id: "exams",
      href: "/professor/provas",
      icon: "📝",
      title: t(
        "modules.exams.title"
      ),
      description: t(
        "modules.exams.description"
      ),
      action: t(
        "modules.exams.action"
      ),
    },
    {
      id: "activities",
      href: "/professor/atividades",
      icon: "📚",
      title: t(
        "modules.activities.title"
      ),
      description: t(
        "modules.activities.description"
      ),
      action: t(
        "modules.activities.action"
      ),
    },
    {
      id: "submissions",
      href: "/professor/entregas",
      icon: "📥",
      title: t(
        "modules.submissions.title"
      ),
      description: t(
        "modules.submissions.description"
      ),
      action: t(
        "modules.submissions.action"
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 text-slate-900 dark:text-slate-100 md:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-400">
            {t("eyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
            {t("description")}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex gap-4">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl dark:bg-amber-900/50"
          >
            ℹ️
          </div>

          <div>
            <h2 className="font-bold text-amber-950 dark:text-amber-100">
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
          {modulos.map(
            (modulo) => (
              <article
                key={modulo.id}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-violet-700"
              >
                <div
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl dark:bg-violet-950/50"
                >
                  {modulo.icon}
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
                  {modulo.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {
                    modulo.description
                  }
                </p>

                <div className="mt-5">
                  <Link
                    href={modulo.href}
                    className="inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    {
                      modulo.action
                    }
                  </Link>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t(
              "consolidated.title"
            )}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t(
              "consolidated.description"
            )}
          </p>
        </div>

        <div className="p-6">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900">
              📊
            </div>

            <div className="mx-auto mt-4 max-w-xl">
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {t(
                  "consolidated.emptyTitle"
                )}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(
                  "consolidated.emptyDescription"
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/professor/provas"
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                {t(
                  "actions.viewExams"
                )}
              </Link>

              <Link
                href="/professor/turmas"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "actions.viewClasses"
                )}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}