"use client";

import {
  useTranslations,
} from "next-intl";

type CardResumoProps = {
  valor: string;
  titulo: string;
  variante:
    | "critical"
    | "risk"
    | "attention"
    | "normal"
    | "insufficient";
};

function CardResumo({
  valor,
  titulo,
  variante,
}: CardResumoProps) {
  const estilos = {
    critical:
      "border-red-200 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-100",

    risk:
      "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-900/70 dark:bg-orange-950/35 dark:text-orange-100",

    attention:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-100",

    normal:
      "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-100",

    insufficient:
      "border-slate-200 bg-slate-50 text-slate-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100",
  };

  return (
    <div
      className={[
        "phanyx-student-success-summary-card",
        `phanyx-student-success-${variante}`,
        "rounded-2xl border p-5 shadow-sm transition",
        estilos[variante],
      ].join(" ")}
    >
      <div
        className="
          text-3xl
          font-bold
          tracking-tight
        "
      >
        {valor}
      </div>

      <div
        className="
          mt-2
          text-sm
          font-semibold
        "
      >
        {titulo}
      </div>
    </div>
  );
}

export default function AdminStudentSuccessPage() {
  const t =
    useTranslations(
      "AdminStudentSuccess"
    );

  return (
    <main
      className="
        phanyx-student-success-page
        min-h-full
        bg-slate-50
        text-slate-950
        dark:bg-slate-950
        dark:text-slate-100
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          space-y-6
          p-4
          sm:p-6
          lg:p-8
        "
      >
        {/* CABEÇALHO */}
        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            border-blue-200
            bg-gradient-to-br
            from-blue-50
            via-white
            to-sky-50
            p-6
            shadow-sm
            dark:border-blue-900/60
            dark:from-blue-950/50
            dark:via-slate-950
            dark:to-sky-950/30
            sm:p-8
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                max-w-3xl
              "
            >
              <div
                className="
                  mb-3
                  inline-flex
                  rounded-full
                  border
                  border-blue-200
                  bg-blue-100
                  px-3
                  py-1
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-blue-900
                  dark:border-blue-800
                  dark:bg-blue-950
                  dark:text-blue-200
                "
              >
                PHANYX
              </div>

              <h1
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                  dark:text-white
                  sm:text-3xl
                "
              >
                {t("title")}
              </h1>

              <p
                className="
                  mt-2
                  text-base
                  font-semibold
                  text-blue-800
                  dark:text-blue-300
                "
              >
                {t(
                  "subtitle"
                )}
              </p>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-700
                  dark:text-slate-300
                  sm:text-base
                "
              >
                {t(
                  "description"
                )}
              </p>
            </div>

            <div
              className="
                flex
                h-20
                w-20
                shrink-0
                items-center
                justify-center
                self-start
                rounded-3xl
                border
                border-blue-200
                bg-white
                shadow-sm
                dark:border-blue-800
                dark:bg-slate-900
                lg:self-center
              "
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="
                  h-10
                  w-10
                  text-blue-700
                  dark:text-blue-300
                "
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 19V9m5 10V5m5 14v-7m5 7V3"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3 7 5-3 5 4 7-5"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* VISÃO GERAL */}
        <section>
          <div
            className="
              mb-4
            "
          >
            <h2
              className="
                phanyx-student-success-section-title
                text-lg
                font-bold
                text-slate-950
                dark:text-white
              "
            >
              {t(
                "overview.title"
              )}
            </h2>
          </div>

          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              xl:grid-cols-5
            "
          >
            <CardResumo
              valor="—"
              titulo={t(
                "cards.critical"
              )}
              variante="critical"
            />

            <CardResumo
              valor="—"
              titulo={t(
                "cards.risk"
              )}
              variante="risk"
            />

            <CardResumo
              valor="—"
              titulo={t(
                "cards.attention"
              )}
              variante="attention"
            />

            <CardResumo
              valor="—"
              titulo={t(
                "cards.normal"
              )}
              variante="normal"
            />

            <CardResumo
              valor="—"
              titulo={t(
                "cards.insufficient"
              )}
              variante="insufficient"
            />
          </div>
        </section>

        {/* ALUNOS QUE PRECISAM DE ATENÇÃO */}
        <section
          className="
            phanyx-student-success-panel
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div
            className="
              border-b
              border-slate-200
              px-5
              py-5
              dark:border-slate-800
              sm:px-6
            "
          >
            <h2
              className="
                phanyx-student-success-panel-title
                text-lg
                font-bold
                text-slate-950
                dark:text-white
              "
            >
              {t(
                "studentsAttention.title"
              )}
            </h2>

            <p
              className="
                phanyx-student-success-muted
                mt-1
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-300
              "
            >
              {t(
                "studentsAttention.description"
              )}
            </p>
          </div>

          <div
            className="
              flex
              min-h-[280px]
              items-center
              justify-center
              p-6
            "
          >
            <div
              className="
                max-w-md
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-100
                  text-slate-700
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-200
                "
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="
                    h-7
                    w-7
                  "
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                  />

                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 8v6m-3-3h6"
                  />
                </svg>
              </div>

              <p
                className="
                  phanyx-student-success-muted
                  mt-4
                  text-sm
                  font-semibold
                  leading-6
                  text-slate-700
                  dark:text-slate-200
                "
              >
                {t(
                  "states.loading"
                )}
              </p>
            </div>
          </div>
        </section>

        {/* APOIO À DECISÃO */}
        <section
          className="
            rounded-2xl
            border
            border-blue-200
            bg-blue-50
            p-5
            text-blue-950
            dark:border-blue-900/70
            dark:bg-blue-950/30
            dark:text-blue-100
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                mt-0.5
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-800
                dark:bg-blue-900/70
                dark:text-blue-200
              "
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="
                  h-5
                  w-5
                "
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />

                <path
                  strokeLinecap="round"
                  d="M12 10v6"
                />

                <path
                  strokeLinecap="round"
                  d="M12 7h.01"
                />
              </svg>
            </div>

            <div>
              <h3
                className="
                  font-bold
                "
              >
                {t(
                  "disclaimer.title"
                )}
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-blue-900
                  dark:text-blue-200
                "
              >
                {t(
                  "disclaimer.text"
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}