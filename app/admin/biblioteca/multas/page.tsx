"use client";

import Link from "next/link";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type Situacao =
  | "TODAS"
  | "PENDENTES"
  | "PARCIAIS"
  | "ATRASADAS"
  | "PAGAS"
  | "CANCELADAS"
  | "SEM_LANCAMENTO";

type Multa = {
  id: number;

  statusEmprestimo: string;

  emprestadoEm: string;
  vencimentoEm: string;
  devolvidoEm: string | null;

  diasAtraso: number;

  multaGerada: boolean;

  valorMultaCalculado:
    | string
    | null;

  usuario: {
    id: number;
    nome: string;
    email: string;
    role: string;
  };

  exemplar: {
    id: number;
    itemId: number;
    codigoInterno: string;
    codigoBarras: string | null;
    numeroTombo: string | null;

    item: {
      id: number;
      titulo: string;
      subtitulo: string | null;
      isbn10: string | null;
      isbn13: string | null;
    };
  };

  financeiro: {
    id: number;

    descricao: string | null;

    statusPersistido: string;
    statusEfetivo: string;

    valorOriginal: number;
    valorPago: number | null;
    descontoValor: number | null;
    jurosValor: number | null;
    multaValor: number | null;
    valorFinal: number | null;

    vencimento: string | null;
    pagoEm: string | null;

    observacao: string | null;

    aluno: {
      id: number;
      nome: string;
    };

    createdAt: string;
    updatedAt: string;
  } | null;
};

type Resposta = {
  filtros?: {
    situacao: Situacao;
    busca: string;
    pagina: number;
    porPagina: number;
  };

  resumo?: {
    total: number;
    pendentes: number;
    parciais: number;
    atrasadas: number;
    pagas: number;
    canceladas: number;
    semLancamento: number;
  };

  paginacao?: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };

  multas?: Multa[];

  error?: string;
  mensagem?: string;
};

const SITUACOES: Situacao[] = [
  "TODAS",
  "PENDENTES",
  "PARCIAIS",
  "ATRASADAS",
  "PAGAS",
  "CANCELADAS",
  "SEM_LANCAMENTO",
];

function classeStatus(
  status: string,
) {
  switch (status) {
    case "PENDENTE":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";

    case "PARCIAL":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200";

    case "ATRASADO":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200";

    case "PAGO":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";

    case "CANCELADO":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

    case "SEM_LANCAMENTO":
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200";

    default:
      return "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
  }
}

export default function BibliotecaMultasPage() {
  const t =
    useTranslations(
      "AdminLibraryFines",
    );

  const locale =
    useLocale();

  const [
    situacao,
    setSituacao,
  ] =
    useState<Situacao>(
      "TODAS",
    );

  const [
    buscaDigitada,
    setBuscaDigitada,
  ] =
    useState("");

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    pagina,
    setPagina,
  ] =
    useState(1);

  const [
    dados,
    setDados,
  ] =
    useState<Resposta | null>(
      null,
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
    useState<string | null>(
      null,
    );

  const barraSuperiorRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const tabelaScrollRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const carregar =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {
        setCarregando(true);
        setErro(null);

        try {
          const parametros =
            new URLSearchParams();

          parametros.set(
            "situacao",
            situacao,
          );

          parametros.set(
            "pagina",
            String(pagina),
          );

          parametros.set(
            "porPagina",
            "25",
          );

          if (busca) {
            parametros.set(
              "q",
              busca,
            );
          }

          const resposta =
            await fetch(
              `/api/admin/biblioteca/multas?${parametros.toString()}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",

                signal,
              },
            );

          const resultado =
            (await resposta.json()) as
              Resposta;

          if (!resposta.ok) {
            throw new Error(
              resultado.error ||
                resultado.mensagem ||
                t(
                  "errors.load",
                ),
            );
          }

          setDados(
            resultado,
          );
        } catch (
          erroAtual
        ) {
          if (
            erroAtual instanceof
              DOMException &&
            erroAtual.name ===
              "AbortError"
          ) {
            return;
          }

          setErro(
            erroAtual instanceof
              Error
              ? erroAtual.message
              : t(
                  "errors.load",
                ),
          );
        } finally {
          if (!signal?.aborted) {
            setCarregando(
              false,
            );
          }
        }
      },
      [
        busca,
        pagina,
        situacao,
        t,
      ],
    );

  useEffect(() => {
    const controlador =
      new AbortController();

    void carregar(
      controlador.signal,
    );

    return () =>
      controlador.abort();
  }, [carregar]);

  function pesquisar(
    evento: FormEvent,
  ) {
    evento.preventDefault();

    setPagina(1);

    setBusca(
      buscaDigitada.trim(),
    );
  }

  function limparBusca() {
    setBuscaDigitada("");
    setBusca("");
    setPagina(1);
  }

  function selecionarSituacao(
    valor: Situacao,
  ) {
    setSituacao(valor);
    setPagina(1);
  }

  function formatarData(
    valor:
      | string
      | null
      | undefined,
  ) {
    if (!valor) {
      return String.fromCharCode(
        8212,
      );
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime(),
      )
    ) {
      return String.fromCharCode(
        8212,
      );
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle:
          "short",

        timeStyle:
          "short",
      },
    ).format(data);
  }

  function formatarMoeda(
    valor:
      | string
      | number
      | null
      | undefined,
  ) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return String.fromCharCode(
        8212,
      );
    }

    const numero =
      Number(valor);

    if (
      !Number.isFinite(
        numero,
      )
    ) {
      return String.fromCharCode(
        8212,
      );
    }

    return new Intl.NumberFormat(
      locale,
      {
        style:
          "currency",

        currency:
          "BRL",
      },
    ).format(numero);
  }

  function nomeStatus(
    status: string,
  ) {
    const chave =
      status.toLowerCase();

    try {
      return t(
        `statuses.${chave}`,
      );
    } catch {
      return status;
    }
  }

  const resumo =
    dados?.resumo;

  const paginacao =
    dados?.paginacao;

  const multas =
    dados?.multas ||
    [];

  const contador:
    Record<
      Situacao,
      number | undefined
    > = {
      TODAS:
        resumo?.total,

      PENDENTES:
        resumo?.pendentes,

      PARCIAIS:
        resumo?.parciais,

      ATRASADAS:
        resumo?.atrasadas,

      PAGAS:
        resumo?.pagas,

      CANCELADAS:
        resumo?.canceladas,

      SEM_LANCAMENTO:
        resumo?.semLancamento,
    };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                {t(
                  "eyebrow",
                )}
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {t(
                  "title",
                )}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(
                  "description",
                )}
              </p>
            </div>

            <Link
              href="/admin/biblioteca/emprestimos"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {String.fromCharCode(
                8592,
              )}{" "}
              {t(
                "backToLoans",
              )}
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {SITUACOES.map(
            (item) => {
              const ativo =
                situacao ===
                item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    selecionarSituacao(
                      item,
                    )
                  }
                  className={[
                    "cursor-pointer select-none rounded-2xl border p-4 text-left transition",
                    ativo
                      ? "border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800",
                  ].join(
                    " ",
                  )}
                >
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      `filters.${item.toLowerCase()}`,
                    )}
                  </span>

                  <strong className="mt-2 block text-2xl font-black">
                    {contador[
                      item
                    ] ?? "?"}
                  </strong>
                </button>
              );
            },
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <form
            onSubmit={
              pesquisar
            }
            className="flex flex-col gap-3 lg:flex-row"
          >
            <div className="flex-1">
              <label
                htmlFor="biblioteca-busca-multas"
                className="mb-1.5 block text-sm font-bold"
              >
                {t(
                  "search.label",
                )}
              </label>

              <input
                id="biblioteca-busca-multas"
                value={
                  buscaDigitada
                }
                onChange={(
                  evento,
                ) =>
                  setBuscaDigitada(
                    evento
                      .target
                      .value,
                  )
                }
                placeholder={t(
                  "search.placeholder",
                )}
                className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex items-end gap-2">
              {busca ? (
                <button
                  type="button"
                  onClick={
                    limparBusca
                  }
                  className="min-h-11 rounded-2xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t(
                    "search.clear",
                  )}
                </button>
              ) : null}

              <button
                type="submit"
                disabled={
                  carregando
                }
                className="min-h-11 rounded-2xl bg-indigo-600 px-6 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t(
                  "search.button",
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black">
                {t(
                  "results.title",
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "results.count",
                  {
                    count:
                      paginacao
                        ?.total ??
                      0,
                  },
                )}
              </p>
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t(
                "results.hint",
              )}
            </p>
          </div>

          {erro ? (
            <div className="p-8 text-center">
              <p className="font-black text-red-700 dark:text-red-300">
                {t(
                  "errors.title",
                )}
              </p>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {erro}
              </p>
            </div>
          ) : carregando ? (
            <div className="p-12 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
              {t(
                "loading",
              )}
            </div>
          ) : multas.length ===
            0 ? (
            <div className="p-12 text-center">
              <p className="font-black">
                {t(
                  "empty.title",
                )}
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "empty.description",
                )}
              </p>
            </div>
          ) : (
            <>
              <div
                ref={
                  barraSuperiorRef
                }
                onScroll={(
                  evento,
                ) => {
                  const destino =
                    tabelaScrollRef.current;

                  if (
                    destino &&
                    destino.scrollLeft !==
                      evento
                        .currentTarget
                        .scrollLeft
                  ) {
                    destino.scrollLeft =
                      evento
                        .currentTarget
                        .scrollLeft;
                  }
                }}
                className="overflow-x-auto border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                aria-label={t(
                  "table.horizontalScroll",
                )}
              >
                <div
                  className="h-3 min-w-[1500px]"
                  aria-hidden="true"
                />
              </div>

              <div
                ref={
                  tabelaScrollRef
                }
                onScroll={(
                  evento,
                ) => {
                  const destino =
                    barraSuperiorRef.current;

                  if (
                    destino &&
                    destino.scrollLeft !==
                      evento
                        .currentTarget
                        .scrollLeft
                  ) {
                    destino.scrollLeft =
                      evento
                        .currentTarget
                        .scrollLeft;
                  }
                }}
                className="overflow-x-auto"
              >
                <table className="w-full min-w-[1500px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <th className="px-5 py-3">
                        {t(
                          "table.user",
                        )}
                      </th>

                      <th className="px-5 py-3">
                        {t(
                          "table.item",
                        )}
                      </th>

                      <th className="px-5 py-3">
                        {t(
                          "table.delay",
                        )}
                      </th>

                      <th className="px-5 py-3">
                        {t(
                          "table.fine",
                        )}
                      </th>

                      <th className="px-5 py-3">
                        {t(
                          "table.dueDate",
                        )}
                      </th>

                      <th className="px-5 py-3">
                        {t(
                          "table.paid",
                        )}
                      </th>

                      <th className="px-5 py-3">
                        {t(
                          "table.status",
                        )}
                      </th>

                      <th className="sticky right-0 z-20 border-l border-slate-200 bg-slate-50 px-5 py-3 text-right dark:border-slate-800 dark:bg-slate-950">
                        {t(
                          "table.actions",
                        )}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {multas.map(
                      (
                        multa,
                      ) => {
                        const status =
                          multa
                            .financeiro
                            ?.statusEfetivo ||
                          "SEM_LANCAMENTO";

                        return (
                          <tr
                            key={
                              multa.id
                            }
                            className="border-b border-slate-100 align-top last:border-b-0 dark:border-slate-800"
                          >
                            <td className="px-5 py-4">
                              <strong className="block font-black">
                                {
                                  multa
                                    .usuario
                                    .nome
                                }
                              </strong>

                              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                {
                                  multa
                                    .usuario
                                    .email
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <strong className="block font-black">
                                {
                                  multa
                                    .exemplar
                                    .item
                                    .titulo
                                }
                              </strong>

                              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                {
                                  multa
                                    .exemplar
                                    .codigoInterno
                                }

                                {multa
                                  .exemplar
                                  .numeroTombo
                                  ? ` ${String.fromCharCode(
                                      183,
                                    )} ${t(
                                      "table.tomb",
                                    )} ${multa.exemplar.numeroTombo}`
                                  : ""}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <strong>
                                {
                                  multa.diasAtraso
                                }
                              </strong>{" "}
                              {t(
                                "table.days",
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <strong className="font-black">
                                {formatarMoeda(
                                  multa.valorMultaCalculado,
                                )}
                              </strong>

                              {multa
                                .financeiro ? (
                                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                  {t(
                                    "table.launch",
                                    {
                                      id:
                                        multa
                                          .financeiro
                                          .id,
                                    },
                                  )}
                                </span>
                              ) : null}
                            </td>

                            <td className="px-5 py-4">
                              {formatarData(
                                multa
                                  .financeiro
                                  ?.vencimento,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <strong>
                                {formatarMoeda(
                                  multa
                                    .financeiro
                                    ?.valorPago,
                                )}
                              </strong>

                              {multa
                                .financeiro
                                ?.pagoEm ? (
                                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                  {formatarData(
                                    multa
                                      .financeiro
                                      .pagoEm,
                                  )}
                                </span>
                              ) : null}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={[
                                  "inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold",
                                  classeStatus(
                                    status,
                                  ),
                                ].join(
                                  " ",
                                )}
                              >
                                {nomeStatus(
                                  status,
                                )}
                              </span>
                            </td>

                            <td className="sticky right-0 z-10 border-l border-slate-200 bg-white px-5 py-4 text-right dark:border-slate-800 dark:bg-slate-900">
                              <div className="flex flex-wrap justify-end gap-2">
                                {multa.financeiro ? (
                                  <Link
                                    href={`/admin/financeiro/recebimentos?lancamentoId=${multa.financeiro.id}`}
                                    className="inline-flex min-h-9 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-700"
                                  >
                                    {t(
                                      "table.openFinance",
                                    )}
                                  </Link>
                                ) : null}

                                <Link
                                  href={`/admin/biblioteca/acervo/${multa.exemplar.itemId}`}
                                  className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                                >
                                  {t(
                                    "table.openItem",
                                  )}
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {paginacao &&
          paginacao.totalPaginas >
            1 ? (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "pagination.page",
                  {
                    page:
                      paginacao.pagina,

                    total:
                      paginacao.totalPaginas,
                  },
                )}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    pagina <= 1 ||
                    carregando
                  }
                  onClick={() =>
                    setPagina(
                      (
                        atual,
                      ) =>
                        Math.max(
                          1,
                          atual -
                            1,
                        ),
                    )
                  }
                  className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                >
                  {t(
                    "pagination.previous",
                  )}
                </button>

                <button
                  type="button"
                  disabled={
                    pagina >=
                      paginacao.totalPaginas ||
                    carregando
                  }
                  onClick={() =>
                    setPagina(
                      (
                        atual,
                      ) =>
                        atual +
                        1,
                    )
                  }
                  className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                >
                  {t(
                    "pagination.next",
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
