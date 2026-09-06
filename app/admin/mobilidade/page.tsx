"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type IndicadoresMobilidade = {
  instituicoesParceiras: number;
  conveniosAtivos: number;
  programasAtivos: number;
  ofertasAbertas: number;
  totalCandidaturas: number;
  candidaturasPendentes: number;
  candidaturasAprovadas: number;
  documentosPendentes: number;
};

type PrazoMobilidade = {
  id: number;
  titulo: string;
  status: string;
  inscricoesInicio: string | null;
  inscricoesFim: string | null;
  mobilidadeInicio: string | null;
  mobilidadeFim: string | null;
  vagas: number | null;

  programa: {
    nome: string;
    tipo: string;

    instituicaoParceira: {
      nome: string;
      paisCodigo: string;
      paisNome: string | null;
    } | null;
  };
};

type CandidaturaRecente = {
  id: number;
  nomeSnapshot: string;
  status: string;
  vinculoCandidato: string;
  enviadaEm: string | null;
  createdAt: string;

  oferta: {
    titulo: string;

    programa: {
      instituicaoParceira: {
        nome: string;
        paisCodigo: string;
      } | null;
    };
  };
};

type DashboardMobilidade = {
  ok: true;

  indicadores: IndicadoresMobilidade;
  proximosPrazos: PrazoMobilidade[];
  candidaturasRecentes: CandidaturaRecente[];
};

function formatarData(
  valor: string | null,
  locale: string
) {
  if (!valor) {
    return null;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      dateStyle: "medium",
    }
  ).format(data);
}

function CardIndicador({
  titulo,
  valor,
  icone,
  alerta = false,
  locale,
}: {
  titulo: string;
  valor: number;
  icone: string;
  alerta?: boolean;
  locale: string;
}) {
  const destaque =
    alerta && valor > 0;

  return (
    <div
      className={[
        "rounded-2xl border p-5 shadow-sm transition",
        destaque
          ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/70 dark:bg-amber-950/30"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={[
              "text-sm font-medium",
              destaque
                ? "text-amber-800 dark:text-amber-200"
                : "text-slate-600 dark:text-slate-300",
            ].join(" ")}
          >
            {titulo}
          </p>

          <p
            className={[
              "mt-2 text-3xl font-bold tracking-tight",
              destaque
                ? "text-amber-950 dark:text-amber-100"
                : "text-slate-950 dark:text-white",
            ].join(" ")}
          >
            {valor.toLocaleString(locale)}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="rounded-xl bg-slate-100 px-3 py-2 text-xl dark:bg-slate-800"
        >
          {icone}
        </span>
      </div>
    </div>
  );
}

function DashboardSkeleton({
  label,
}: {
  label: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className="space-y-6"
    >
      <div className="h-40 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map(
          (_, indice) => (
            <div
              key={indice}
              className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          )
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function MobilidadeDashboardPage() {
  const t =
    useTranslations(
      "AdminMobilityDashboard"
    );

  const locale = useLocale();

  const [dados, setDados] =
    useState<DashboardMobilidade | null>(
      null
    );

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState<string | null>(null);

  const carregarDashboard =
    useCallback(async () => {
      setCarregando(true);
      setErro(null);

      try {
        const resposta =
          await fetch(
            "/api/admin/mobilidade/dashboard",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        if (!resposta.ok) {
          if (resposta.status === 401) {
            throw new Error(
              t("errors.unauthorized")
            );
          }

          if (resposta.status === 403) {
            throw new Error(
              t("errors.forbidden")
            );
          }

          throw new Error(
            t("errors.load")
          );
        }

        const corpo =
          (await resposta.json()) as DashboardMobilidade;

        setDados(corpo);
      } catch (error: unknown) {
        setDados(null);

        setErro(
          error instanceof Error
            ? error.message
            : t("errors.load")
        );
      } finally {
        setCarregando(false);
      }
    }, [t]);

  useEffect(() => {
    void carregarDashboard();
  }, [carregarDashboard]);

  function rotuloStatus(
    status: string
  ) {
    const mapa: Record<string, string> = {
      RASCUNHO: "draft",
      ENVIADA: "submitted",
      EM_ANALISE: "underReview",
      DOCUMENTACAO_PENDENTE:
        "documentsPending",
      ELEGIVEL: "eligible",
      INELEGIVEL: "ineligible",
      EM_SELECAO: "selection",
      CLASSIFICADA: "ranked",
      LISTA_ESPERA: "waitingList",
      APROVADA: "approved",
      REPROVADA: "rejected",
      DESISTENTE: "withdrawn",
      CANCELADA: "cancelled",
    };

    const chave = mapa[status];

    if (!chave) {
      return status;
    }

    return t(`statuses.${chave}`);
  }

  function classeStatus(
    status: string
  ) {
    if (status === "APROVADA") {
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    }

    if (
      status === "REPROVADA" ||
      status === "CANCELADA"
    ) {
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200";
    }

    if (
      status ===
        "DOCUMENTACAO_PENDENTE" ||
      status === "LISTA_ESPERA"
    ) {
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    }

    return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";
  }

  if (carregando) {
    return (
      <main className="min-h-full bg-slate-50/70 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
        <DashboardSkeleton
          label={t("loading")}
        />
      </main>
    );
  }

  if (erro || !dados) {
    return (
      <main className="min-h-full bg-slate-50/70 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900 dark:bg-slate-900">
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">
              {t("errors.title")}
            </h1>

            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {erro ?? t("errors.load")}
            </p>

            <button
              type="button"
              onClick={() =>
                void carregarDashboard()
              }
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {t("actions.retry")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const indicadores =
    dados.indicadores;

  return (
    <main className="min-h-full bg-slate-50/70 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm dark:border-blue-950 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {t("title")}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
                {t("subtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void carregarDashboard()
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-blue-950/50"
            >
              <span aria-hidden="true">
                ↻
              </span>

              {t("actions.refresh")}
            </button>
          </div>
        </header>

        <section
          aria-label={t("sections.indicators")}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <CardIndicador
            titulo={t(
              "metrics.partners"
            )}
            valor={
              indicadores.instituicoesParceiras
            }
            icone="🌐"
            locale={locale}
          />

          <CardIndicador
            titulo={t(
              "metrics.agreements"
            )}
            valor={
              indicadores.conveniosAtivos
            }
            icone="🤝"
            locale={locale}
          />

          <CardIndicador
            titulo={t(
              "metrics.programs"
            )}
            valor={
              indicadores.programasAtivos
            }
            icone="🎓"
            locale={locale}
          />

          <CardIndicador
            titulo={t(
              "metrics.openOffers"
            )}
            valor={
              indicadores.ofertasAbertas
            }
            icone="📣"
            locale={locale}
          />

          <CardIndicador
            titulo={t(
              "metrics.applications"
            )}
            valor={
              indicadores.totalCandidaturas
            }
            icone="📝"
            locale={locale}
          />

          <CardIndicador
            titulo={t(
              "metrics.pendingApplications"
            )}
            valor={
              indicadores.candidaturasPendentes
            }
            icone="⏳"
            alerta
            locale={locale}
          />

          <CardIndicador
            titulo={t(
              "metrics.approvedApplications"
            )}
            valor={
              indicadores.candidaturasAprovadas
            }
            icone="✅"
            locale={locale}
          />

          <CardIndicador
            titulo={t(
              "metrics.pendingDocuments"
            )}
            valor={
              indicadores.documentosPendentes
            }
            icone="📄"
            alerta
            locale={locale}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                {t(
                  "sections.deadlines"
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t(
                  "sections.deadlinesDescription"
                )}
              </p>
            </div>

            {dados.proximosPrazos
              .length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t(
                    "empty.deadlines"
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dados.proximosPrazos.map(
                  (item) => {
                    const fim =
                      formatarData(
                        item.inscricoesFim,
                        locale
                      );

                    return (
                      <article
                        key={item.id}
                        className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-950 dark:text-white">
                              {item.titulo}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                              {
                                item.programa
                                  .nome
                              }
                            </p>

                            {item.programa
                              .instituicaoParceira && (
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                🌍{" "}
                                {
                                  item
                                    .programa
                                    .instituicaoParceira
                                    .nome
                                }
                              </p>
                            )}
                          </div>

                          {fim && (
                            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                              {t(
                                "deadline.until",
                                {
                                  date: fim,
                                }
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                {t(
                  "sections.recentApplications"
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t(
                  "sections.recentApplicationsDescription"
                )}
              </p>
            </div>

            {dados.candidaturasRecentes
              .length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t(
                    "empty.applications"
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dados.candidaturasRecentes.map(
                  (item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-950 dark:text-white">
                            {
                              item.nomeSnapshot
                            }
                          </h3>

                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {
                              item.oferta
                                .titulo
                            }
                          </p>

                          {item.oferta
                            .programa
                            .instituicaoParceira && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                              {
                                item
                                  .oferta
                                  .programa
                                  .instituicaoParceira
                                  .nome
                              }
                            </p>
                          )}
                        </div>

                        <span
                          className={[
                            "inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold",
                            classeStatus(
                              item.status
                            ),
                          ].join(" ")}
                        >
                          {rotuloStatus(
                            item.status
                          )}
                        </span>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              {t(
                "sections.quickActions"
              )}
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t(
                "sections.quickActionsDescription"
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["🌐", "partners"],
              ["🤝", "agreements"],
              ["🎓", "programs"],
              ["📣", "offers"],
              ["📝", "applications"],
            ].map(
              ([icone, chave]) => (
                <div
                  key={chave}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div className="text-xl">
                    {icone}
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t(
                      `actions.${chave}`
                    )}
                  </p>

                  <span className="mt-2 inline-flex rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t(
                      "actions.comingSoon"
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
