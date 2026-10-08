"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type InstituicaoParceira = {
  id: number;
  nome: string;
  sigla: string | null;
  paisCodigo: string;
  paisNome: string | null;
  cidade: string | null;
  estadoProvincia: string | null;
  site: string | null;
};

type Oportunidade = {
  id: number;
  titulo: string;
  codigo: string | null;
  descricao: string | null;
  ano: number | null;
  periodo: string | null;
  inscricoesInicio: string | null;
  inscricoesFim: string | null;
  mobilidadeInicio: string | null;
  mobilidadeFim: string | null;
  vagas: number | null;
  permiteListaEspera: boolean;
  publicadoEm: string | null;

  programa: {
    id: number;
    nome: string;
    tipo: string;
    direcao: string;
    idiomaPrincipal: string | null;
    nivelIdiomaMinimo: string | null;
    duracaoMinimaDias: number | null;
    duracaoMaximaDias: number | null;
  };

  instituicaoParceira:
    | InstituicaoParceira
    | null;

  cursos: Array<{
    cursoId: number;
  }>;

  documentos: {
    total: number;
    obrigatorios: number;
  };

  candidatura:
    | {
        id: number;
        status: string;
        createdAt: string;
      }
    | null;

  jaCandidatado: boolean;
};

type RespostaApi =
  | {
      ok: true;
      aluno: {
        id: number;
        nome: string;
      };
      total: number;
      oportunidades: Oportunidade[];
    }
  | {
      ok: false;
      codigo?: string;
    };

type Filtros = {
  q: string;
  pais: string;
  tipo: string;
  periodo: string;
};

const tiposPrograma = [
  "SEMESTRE_ACADEMICO",
  "ANO_ACADEMICO",
  "CURTA_DURACAO",
  "PROGRAMA_IDIOMAS",
  "ESTAGIO",
  "PESQUISA",
  "SUMMER_SCHOOL",
  "WINTER_SCHOOL",
  "DUPLA_TITULACAO",
  "HIBRIDA",
  "VIRTUAL",
  "OUTRO",
] as const;

export default function OportunidadesMobilidadePage() {
  const t =
    useTranslations(
      "StudentMobilityOpportunities"
    );

  const locale =
    useLocale();

  const [
    oportunidades,
    setOportunidades,
  ] =
    useState<Oportunidade[]>(
      []
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState(false);

  const [
    formulario,
    setFormulario,
  ] =
    useState<Filtros>({
      q: "",
      pais: "",
      tipo: "",
      periodo: "",
    });

  const [
    filtros,
    setFiltros,
  ] =
    useState<Filtros>({
      q: "",
      pais: "",
      tipo: "",
      periodo: "",
    });

  function formatarData(
    valor:
      | string
      | null
  ) {
    if (!valor) {
      return null;
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return null;
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle:
          "medium",
      }
    ).format(
      data
    );
  }

  function nomeTipo(
    tipo: string
  ) {
    switch (tipo) {
      case "SEMESTRE_ACADEMICO":
        return t(
          "programTypes.SEMESTRE_ACADEMICO"
        );
      case "ANO_ACADEMICO":
        return t(
          "programTypes.ANO_ACADEMICO"
        );
      case "CURTA_DURACAO":
        return t(
          "programTypes.CURTA_DURACAO"
        );
      case "PROGRAMA_IDIOMAS":
        return t(
          "programTypes.PROGRAMA_IDIOMAS"
        );
      case "ESTAGIO":
        return t(
          "programTypes.ESTAGIO"
        );
      case "PESQUISA":
        return t(
          "programTypes.PESQUISA"
        );
      case "SUMMER_SCHOOL":
        return t(
          "programTypes.SUMMER_SCHOOL"
        );
      case "WINTER_SCHOOL":
        return t(
          "programTypes.WINTER_SCHOOL"
        );
      case "DUPLA_TITULACAO":
        return t(
          "programTypes.DUPLA_TITULACAO"
        );
      case "HIBRIDA":
        return t(
          "programTypes.HIBRIDA"
        );
      case "VIRTUAL":
        return t(
          "programTypes.VIRTUAL"
        );
      default:
        return t(
          "programTypes.OUTRO"
        );
    }
  }

  function nomeDirecao(
    direcao: string
  ) {
    if (
      direcao ===
      "BIDIRECIONAL"
    ) {
      return t(
        "directions.BIDIRECIONAL"
      );
    }

    return t(
      "directions.SAIDA"
    );
  }

  async function carregar() {
    setCarregando(
      true
    );

    setErro(
      false
    );

    try {
      const params =
        new URLSearchParams();

      if (
        filtros.q
          .trim()
      ) {
        params.set(
          "q",
          filtros.q.trim()
        );
      }

      if (
        filtros.pais
          .trim()
      ) {
        params.set(
          "pais",
          filtros.pais
            .trim()
            .toUpperCase()
        );
      }

      if (
        filtros.tipo
      ) {
        params.set(
          "tipo",
          filtros.tipo
        );
      }

      if (
        filtros.periodo
          .trim()
      ) {
        params.set(
          "periodo",
          filtros.periodo.trim()
        );
      }

      const query =
        params.toString();

      const resposta =
        await fetch(
          `/api/aluno/mobilidade/oportunidades${query ? `?${query}` : ""}`,
          {
            credentials:
              "include",
            cache:
              "no-store",
          }
        );

      const corpo =
        (await resposta.json()) as
          RespostaApi;

      if (
        !resposta.ok ||
        !corpo.ok
      ) {
        throw new Error();
      }

      setOportunidades(
        corpo.oportunidades
      );
    } catch {
      setOportunidades(
        []
      );

      setErro(
        true
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  useEffect(() => {
    void carregar();
  }, [
    filtros.q,
    filtros.pais,
    filtros.tipo,
    filtros.periodo,
  ]);

  function aplicarFiltros(
    evento:
      FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setFiltros({
      q:
        formulario.q,
      pais:
        formulario.pais,
      tipo:
        formulario.tipo,
      periodo:
        formulario.periodo,
    });
  }

  function limparFiltros() {
    const vazio = {
      q: "",
      pais: "",
      tipo: "",
      periodo: "",
    };

    setFormulario(
      vazio
    );

    setFiltros(
      vazio
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-sm dark:border-blue-900 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">
          {t(
            "eyebrow"
          )}
        </p>

        <h1 className="mt-2 text-2xl font-bold md:text-3xl">
          {t(
            "title"
          )}
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-50 md:text-base">
          {t(
            "subtitle"
          )}
        </p>
      </section>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <a
          href="/aluno/mobilidade/oportunidades"
          aria-current="page"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          {t(
            "tabs.opportunities"
          )}
        </a>

        <a
          href="/aluno/mobilidade"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {t(
            "tabs.applications"
          )}
        </a>
      </nav>

      <form
        onSubmit={
          aplicarFiltros
        }
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "filters.search"
              )}
            </span>

            <input
              value={
                formulario.q
              }
              onChange={(
                evento
              ) =>
                setFormulario(
                  (
                    anterior
                  ) => ({
                    ...anterior,
                    q:
                      evento
                        .target
                        .value,
                  })
                )
              }
              placeholder={t(
                "filters.searchPlaceholder"
              )}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "filters.country"
              )}
            </span>

            <input
              value={
                formulario.pais
              }
              maxLength={2}
              onChange={(
                evento
              ) =>
                setFormulario(
                  (
                    anterior
                  ) => ({
                    ...anterior,
                    pais:
                      evento
                        .target
                        .value
                        .toUpperCase(),
                  })
                )
              }
              placeholder={t(
                "filters.countryPlaceholder"
              )}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "filters.type"
              )}
            </span>

            <select
              value={
                formulario.tipo
              }
              onChange={(
                evento
              ) =>
                setFormulario(
                  (
                    anterior
                  ) => ({
                    ...anterior,
                    tipo:
                      evento
                        .target
                        .value,
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900"
            >
              <option value="">
                {t(
                  "filters.allTypes"
                )}
              </option>

              {tiposPrograma.map(
                (tipo) => (
                  <option
                    key={
                      tipo
                    }
                    value={
                      tipo
                    }
                  >
                    {nomeTipo(
                      tipo
                    )}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "filters.period"
              )}
            </span>

            <input
              value={
                formulario.periodo
              }
              onChange={(
                evento
              ) =>
                setFormulario(
                  (
                    anterior
                  ) => ({
                    ...anterior,
                    periodo:
                      evento
                        .target
                        .value,
                  })
                )
              }
              placeholder={t(
                "filters.periodPlaceholder"
              )}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {t(
              "filters.apply"
            )}
          </button>

          <button
            type="button"
            onClick={
              limparFiltros
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t(
              "filters.clear"
            )}
          </button>
        </div>
      </form>

      {carregando && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t(
            "loading"
          )}
        </div>
      )}

      {!carregando &&
        erro && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/30">
            <p className="font-semibold text-rose-800 dark:text-rose-200">
              {t(
                "errorTitle"
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t(
                "tryAgain"
              )}
            </button>
          </div>
        )}

      {!carregando &&
        !erro && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                {t(
                  "resultsTitle"
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t(
                  "resultsCount",
                  {
                    count:
                      oportunidades.length,
                  }
                )}
              </p>
            </div>
          </div>
        )}

      {!carregando &&
        !erro &&
        oportunidades.length ===
          0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-4xl">
              🌍
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
              {t(
                "emptyTitle"
              )}
            </h2>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t(
                "emptyDescription"
              )}
            </p>
          </div>
        )}

      {!carregando &&
        !erro &&
        oportunidades.length >
          0 && (
          <div className="grid gap-5 xl:grid-cols-2">
            {oportunidades.map(
              (
                oportunidade
              ) => {
                const parceira =
                  oportunidade
                    .instituicaoParceira;

                const local = [
                  parceira
                    ?.cidade,
                  parceira
                    ?.estadoProvincia,
                  parceira
                    ?.paisNome ||
                    parceira
                      ?.paisCodigo,
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " • "
                  );

                const inicio =
                  formatarData(
                    oportunidade
                      .mobilidadeInicio
                  );

                const fim =
                  formatarData(
                    oportunidade
                      .mobilidadeFim
                  );

                const prazo =
                  formatarData(
                    oportunidade
                      .inscricoesFim
                  );

                return (
                  <article
                    key={
                      oportunidade.id
                    }
                    className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                              {nomeTipo(
                                oportunidade
                                  .programa
                                  .tipo
                              )}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {nomeDirecao(
                                oportunidade
                                  .programa
                                  .direcao
                              )}
                            </span>

                            {oportunidade
                              .jaCandidatado && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                                {t(
                                  "alreadyApplied"
                                )}
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                            {
                              oportunidade
                                .titulo
                            }
                          </h3>

                          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {
                              oportunidade
                                .programa
                                .nome
                            }
                          </p>

                          {parceira && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {
                                  parceira.nome
                                }
                              </span>

                              {local
                                ? ` — ${local}`
                                : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      {oportunidade
                        .descricao && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {
                            oportunidade
                              .descricao
                          }
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 p-6 sm:grid-cols-2">
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(
                            "deadline"
                          )}
                        </span>

                        <span className="mt-1 block font-semibold text-slate-950 dark:text-white">
                          {prazo ||
                            t(
                              "notInformed"
                            )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(
                            "vacancies"
                          )}
                        </span>

                        <span className="mt-1 block font-semibold text-slate-950 dark:text-white">
                          {oportunidade
                            .vagas ??
                            t(
                              "notInformed"
                            )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(
                            "mobilityPeriod"
                          )}
                        </span>

                        <span className="mt-1 block font-semibold text-slate-950 dark:text-white">
                          {inicio ||
                            "—"}{" "}
                          —{" "}
                          {fim ||
                            "—"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(
                            "language"
                          )}
                        </span>

                        <span className="mt-1 block font-semibold text-slate-950 dark:text-white">
                          {oportunidade
                            .programa
                            .idiomaPrincipal ||
                            t(
                              "notInformed"
                            )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(
                            "period"
                          )}
                        </span>

                        <span className="mt-1 block font-semibold text-slate-950 dark:text-white">
                          {oportunidade
                            .periodo ||
                            oportunidade
                              .ano ||
                            t(
                              "notInformed"
                            )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(
                            "documents"
                          )}
                        </span>

                        <span className="mt-1 block font-semibold text-slate-950 dark:text-white">
                          {t(
                            "documentsCount",
                            {
                              count:
                                oportunidade
                                  .documentos
                                  .total,
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto border-t border-slate-200 p-5 dark:border-slate-700">
                      {oportunidade
                        .jaCandidatado ? (
                        <a
                          href="/aluno/mobilidade"
                          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
                        >
                          {t(
                            "viewApplication"
                          )}
                        </a>
                      ) : (
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {t(
                            "applicationNextPhase"
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
    </div>
  );
}
