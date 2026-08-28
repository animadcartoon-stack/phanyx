"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function TurmaDetalhePage() {
  const params =
    useParams<{
      id: string;
    }>();

  const t = useTranslations(
    "ProfessorClassDetail"
  );

  const turmaId = String(
    params?.id || ""
  ).trim();

  const turmaIdValido =
    /^\d+$/.test(turmaId) &&
    Number(turmaId) > 0;

  if (!turmaIdValido) {
    return (
      <main className="min-h-screen p-6 text-slate-900 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-5xl">
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
              href="/professor/turmas"
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
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/professor/turmas"
          className="inline-flex text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t(
            "actions.back"
          )}
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            {t("eyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t(
              "description"
            )}
          </p>

          <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            {t(
              "classReference",
              {
                id: turmaId,
              }
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href={`/professor/turmas/${turmaId}/aulas`}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
          >
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/50"
            >
              📚
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
              {t(
                "modules.lessons.title"
              )}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t(
                "modules.lessons.description"
              )}
            </p>

            <p className="mt-5 text-sm font-bold text-blue-700 group-hover:underline dark:text-blue-400">
              {t(
                "modules.lessons.action"
              )}
            </p>
          </Link>

          <Link
            href={`/professor/turmas/${turmaId}/boletim`}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
          >
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/50"
            >
              📊
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
              {t(
                "modules.gradebook.title"
              )}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t(
                "modules.gradebook.description"
              )}
            </p>

            <p className="mt-5 text-sm font-bold text-emerald-700 group-hover:underline dark:text-emerald-400">
              {t(
                "modules.gradebook.action"
              )}
            </p>
          </Link>
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
                  "studentsIntegration.title"
                )}
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-900/80 dark:text-amber-200">
                {t(
                  "studentsIntegration.description"
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {t(
                "students.title"
              )}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t(
                "students.description"
              )}
            </p>
          </div>

          <div className="p-6">
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900">
                👩‍🎓
              </div>

              <div className="mx-auto mt-4 max-w-xl">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t(
                    "students.emptyTitle"
                  )}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(
                    "students.emptyDescription"
                  )}
                </p>
              </div>

              <div className="mt-6">
                <Link
                  href="/professor/alunos"
                  className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
    </main>
  );
}