"use client";

import { useTranslations } from "next-intl";

const MODULOS_COMERCIAIS = [
  {
    chave: "leads",
    icone: "🎯",
  },
  {
    chave: "sellers",
    icone: "🧑‍💼",
  },
  {
    chave: "goals",
    icone: "📈",
  },
  {
    chave: "salesEnrollments",
    icone: "📝",
  },
  {
    chave: "commissions",
    icone: "💰",
  },
  {
    chave: "reports",
    icone: "📊",
  },
] as const;

const INDICADORES_COMERCIAIS = [
  "activeLeads",
  "periodSales",
  "goalsReached",
  "pendingCommissions",
] as const;

export default function FuncionariosComercialPage() {
  const t = useTranslations(
    "AdminFuncionariosComercial"
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
          📈 {t("title")}
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {INDICADORES_COMERCIAIS.map(
          (indicador) => (
            <article
              key={indicador}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(
                  `metrics.${indicador}.label`
                )}
              </p>

              <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
                —
              </p>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t(
                  `metrics.${indicador}.help`
                )}
              </p>
            </article>
          )
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            {t("resources.title")}
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("resources.help")}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULOS_COMERCIAIS.map(
            (modulo) => (
              <article
                key={modulo.chave}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="text-2xl">
                  {modulo.icone}
                </div>

                <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">
                  {t(
                    `modules.${modulo.chave}.title`
                  )}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(
                    `modules.${modulo.chave}.description`
                  )}
                </p>

                <span className="mt-4 inline-flex rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                  {t(
                    "resources.inDevelopment"
                  )}
                </span>
              </article>
            )
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
        <h2 className="text-base font-black text-blue-950 dark:text-blue-100">
          {t("hrIntegration.title")}
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-900 dark:text-blue-200">
          {t("hrIntegration.description")}
        </p>
      </section>
    </main>
  );
}
