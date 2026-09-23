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
  | "AGUARDANDO"
  | "DISPONIVEIS"
  | "ATENDIDAS"
  | "EXPIRADAS"
  | "CANCELADAS";

type Reserva = {
  id: number;
  status: string;
  posicaoFila: number | null;

  reservadaEm: string;
  disponivelEm: string | null;
  expiraEm: string | null;
  atendidaEm: string | null;
  canceladaEm: string | null;

  origem: string;
  observacao: string | null;
  motivoCancelamento: string | null;

  criadoEm: string;
  atualizadoEm: string;

  prazoExpirado: boolean;
  podeCancelar: boolean;

  usuario: {
    id: number;
    nome: string;
    email: string;
    role: string;
  };

  item: {
    id: number;
    titulo: string;
    subtitulo: string | null;
    isbn10: string | null;
    isbn13: string | null;
  };

  exemplar: {
    id: number;
    codigoInterno: string;
    codigoBarras: string | null;
    numeroTombo: string | null;
    status: string;
  } | null;
};

type RespostaAcao = {
  error?: string;
  mensagem?: string;
  codigo?: string;
  code?: string;
};

type Resposta = {
  contexto?: {
    impersonacao: boolean;
  };

  filtros?: {
    situacao: Situacao;
    q: string;
    pagina: number;
    porPagina: number;
  };

  resumo?: {
    total: number;
    aguardando: number;
    disponiveis: number;
    atendidas: number;
    expiradas: number;
    canceladas: number;
  };

  paginacao?: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };

  reservas?: Reserva[];

  error?: string;
  mensagem?: string;
};

const SITUACOES: Situacao[] = [
  "TODAS",
  "AGUARDANDO",
  "DISPONIVEIS",
  "ATENDIDAS",
  "EXPIRADAS",
  "CANCELADAS",
];

function classeStatus(
  status: string,
  prazoExpirado: boolean,
) {
  if (
    status === "DISPONIVEL" &&
    prazoExpirado
  ) {
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200";
  }

  switch (status) {
    case "AGUARDANDO":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";

    case "DISPONIVEL":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";

    case "ATENDIDA":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200";

    case "EXPIRADA":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200";

    case "CANCELADA":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

    default:
      return "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
  }
}

export default function BibliotecaReservasPage() {
  const t =
    useTranslations(
      "AdminLibraryReservations",
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
  ] = useState("");

  const [busca, setBusca] =
    useState("");

  const [pagina, setPagina] =
    useState(1);

  const [dados, setDados] =
    useState<Resposta | null>(
      null,
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [erro, setErro] =
    useState<string | null>(
      null,
    );

  const [
    reservaCancelar,
    setReservaCancelar,
  ] =
    useState<Reserva | null>(
      null,
    );

  const [
    motivoCancelamento,
    setMotivoCancelamento,
  ] = useState("");

  const [
    processando,
    setProcessando,
  ] = useState(false);

  const [toast, setToast] =
    useState<{
      tipo: "sucesso" | "erro";
      mensagem: string;
    } | null>(null);

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
              `/api/admin/biblioteca/reservas/central?${parametros.toString()}`,
              {
                method: "GET",
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
                t("errors.load"),
            );
          }

          setDados(resultado);
        } catch (erroAtual) {
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
            setCarregando(false);
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

  function exibirToast(
    tipo: "sucesso" | "erro",
    mensagem: string,
  ) {
    setToast({
      tipo,
      mensagem,
    });

    window.setTimeout(() => {
      setToast((atual) =>
        atual?.mensagem ===
        mensagem
          ? null
          : atual,
      );
    }, 5_000);
  }

  function abrirCancelamento(
    reserva: Reserva,
  ) {
    setReservaCancelar(
      reserva,
    );

    setMotivoCancelamento("");
  }

  function fecharCancelamento() {
    if (processando) {
      return;
    }

    setReservaCancelar(null);
    setMotivoCancelamento("");
  }

  function mensagemErroAcao(
    codigo:
      | string
      | undefined,
  ) {
    switch (codigo) {
      case "OPERACAO_BLOQUEADA_EM_IMPERSONACAO":
        return t(
          "actions.errors.impersonation",
        );

      case "RESERVA_NAO_ENCONTRADA":
        return t(
          "actions.errors.notFound",
        );

      case "RESERVA_NAO_CANCELAVEL":
        return t(
          "actions.errors.notCancelable",
        );

      case "MOTIVO_INVALIDO":
      case "MOTIVO_MUITO_LONGO":
        return t(
          "actions.errors.invalidReason",
        );

      default:
        return t(
          "actions.errors.cancel",
        );
    }
  }

  async function cancelarReserva(
    evento: FormEvent,
  ) {
    evento.preventDefault();

    if (!reservaCancelar) {
      return;
    }

    setProcessando(true);

    try {
      const motivo =
        motivoCancelamento
          .trim();

      const resposta =
        await fetch(
          `/api/admin/biblioteca/reservas/${reservaCancelar.id}/cancelar`,
          {
            method: "POST",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                motivo:
                  motivo ||
                  undefined,
              }),
          },
        );

      let resultado:
        RespostaAcao = {};

      try {
        resultado =
          (await resposta.json()) as
            RespostaAcao;
      } catch {
        resultado = {};
      }

      if (!resposta.ok) {
        throw new Error(
          mensagemErroAcao(
            resultado.codigo ||
              resultado.code,
          ),
        );
      }

      setReservaCancelar(
        null,
      );

      setMotivoCancelamento(
        "",
      );

      exibirToast(
        "sucesso",
        t(
          "actions.cancelSuccess",
        ),
      );

      await carregar();
    } catch (erroAtual) {
      exibirToast(
        "erro",
        erroAtual instanceof
          Error
          ? erroAtual.message
          : t(
              "actions.errors.cancel",
            ),
      );
    } finally {
      setProcessando(false);
    }
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
        dateStyle: "short",
        timeStyle: "short",
      },
    ).format(data);
  }

  function nomeStatus(
    reserva: Reserva,
  ) {
    if (
      reserva.status ===
        "DISPONIVEL" &&
      reserva.prazoExpirado
    ) {
      return t(
        "statuses.availableExpired",
      );
    }

    const chave =
      reserva.status.toLowerCase();

    try {
      return t(
        `statuses.${chave}`,
      );
    } catch {
      return reserva.status;
    }
  }

  const resumo =
    dados?.resumo;

  const paginacao =
    dados?.paginacao;

  const reservas =
    dados?.reservas || [];

  const contadorSituacao:
    Record<
      Situacao,
      number | undefined
    > = {
      TODAS:
        resumo?.total,
      AGUARDANDO:
        resumo?.aguardando,
      DISPONIVEIS:
        resumo?.disponiveis,
      ATENDIDAS:
        resumo?.atendidas,
      EXPIRADAS:
        resumo?.expiradas,
      CANCELADAS:
        resumo?.canceladas,
    };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      {toast ? (
        <div
          aria-live="polite"
          role="status"
          className={[
            "fixed right-4 top-4 z-[70] max-w-md rounded-2xl border px-4 py-3 text-sm font-bold shadow-xl",
            toast.tipo ===
            "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
              : "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
          ].join(" ")}
        >
          {toast.mensagem}
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-[1600px] gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {t("title")}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(
                  "description",
                )}
              </p>
            </div>

            <Link
              href="/admin/biblioteca/acervo"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {String.fromCharCode(
                8592,
              )}{" "}
              {t(
                "backToCollection",
              )}
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {SITUACOES.map(
            (item) => {
              const ativo =
                situacao === item;

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
                    "rounded-2xl border p-4 text-left transition",
                    ativo
                      ? "border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      `filters.${item.toLowerCase()}`,
                    )}
                  </span>

                  <strong className="mt-2 block text-2xl font-black">
                    {contadorSituacao[
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
                htmlFor="biblioteca-busca-reservas"
                className="mb-1.5 block text-sm font-bold"
              >
                {t(
                  "search.label",
                )}
              </label>

              <input
                id="biblioteca-busca-reservas"
                value={
                  buscaDigitada
                }
                onChange={(
                  evento,
                ) =>
                  setBuscaDigitada(
                    evento.target
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
              <button
                type="submit"
                disabled={
                  carregando
                }
                className="min-h-11 rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t(
                  "search.button",
                )}
              </button>

              {(busca ||
                buscaDigitada) && (
                <button
                  type="button"
                  onClick={
                    limparBusca
                  }
                  className="min-h-11 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t(
                    "search.clear",
                  )}
                </button>
              )}
            </div>
          </form>
        </section>

        {erro ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900 shadow-sm dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <h2 className="font-black">
              {t(
                "errors.title",
              )}
            </h2>

            <p className="mt-1 text-sm">
              {erro}
            </p>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black">
                {t(
                  "results.title",
                )}
              </h2>

              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "results.count",
                  {
                    count:
                      paginacao?.total ??
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

          {carregando ? (
            <div className="p-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
              {t(
                "loading",
              )}
            </div>
          ) : reservas.length ===
            0 ? (
            <div className="p-10 text-center">
              <h3 className="font-black">
                {t(
                  "empty.title",
                )}
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "empty.description",
                )}
              </p>
            </div>
          ) : (
            <>
              <div
                ref={barraSuperiorRef}
                onScroll={(evento) => {
                  const destino =
                    tabelaScrollRef.current;

                  if (
                    destino &&
                    destino.scrollLeft !==
                      evento.currentTarget.scrollLeft
                  ) {
                    destino.scrollLeft =
                      evento.currentTarget.scrollLeft;
                  }
                }}
                className="sticky top-0 z-30 overflow-x-auto border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                aria-label={t(
                  "table.horizontalScroll",
                )}
              >
                <div
                  className="h-3 min-w-[1280px]"
                  aria-hidden="true"
                />
              </div>

              <div
                ref={tabelaScrollRef}
                onScroll={(evento) => {
                  const destino =
                    barraSuperiorRef.current;

                  if (
                    destino &&
                    destino.scrollLeft !==
                      evento.currentTarget.scrollLeft
                  ) {
                    destino.scrollLeft =
                      evento.currentTarget.scrollLeft;
                  }
                }}
                className="overflow-x-auto"
              >
                <table className="w-full min-w-[1280px] border-collapse text-sm">
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
                        "table.reservedAt",
                      )}
                    </th>

                    <th className="px-5 py-3">
                      {t(
                        "table.queue",
                      )}
                    </th>

                    <th className="min-w-[220px] px-5 py-3">
                      {t(
                        "table.deadline",
                      )}
                    </th>

                    <th className="px-5 py-3">
                      {t(
                        "table.status",
                      )}
                    </th>

                    <th className="sticky right-0 z-20 min-w-[190px] border-l border-slate-200 bg-slate-50 px-5 py-3 text-right dark:border-slate-800 dark:bg-slate-900">
                      {t(
                        "table.actions",
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reservas.map(
                    (reserva) => (
                      <tr
                        key={
                          reserva.id
                        }
                        className="border-b border-slate-100 align-top last:border-b-0 dark:border-slate-800"
                      >
                        <td className="px-5 py-4">
                          <strong className="block font-extrabold text-slate-950 dark:text-white">
                            {
                              reserva
                                .usuario
                                .nome
                            }
                          </strong>

                          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            {
                              reserva
                                .usuario
                                .email
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <strong className="block max-w-[260px] font-extrabold text-slate-950 dark:text-white">
                            {
                              reserva
                                .item
                                .titulo
                            }
                          </strong>

                          {reserva
                            .exemplar ? (
                            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                              {
                                reserva
                                  .exemplar
                                  .codigoInterno
                              }

                              {reserva
                                .exemplar
                                .numeroTombo
                                ? ` ${String.fromCharCode(
                                    183,
                                  )} ${t(
                                    "table.tomb",
                                  )} ${reserva.exemplar.numeroTombo}`
                                : ""}
                            </span>
                          ) : (
                            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                              {t(
                                "table.noCopyAssigned",
                              )}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          {formatarData(
                            reserva.reservadaEm,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {reserva
                            .status ===
                            "AGUARDANDO" &&
                          reserva
                            .posicaoFila !==
                            null ? (
                            <span className="inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 text-xs font-extrabold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                              {t(
                                "table.queuePosition",
                                {
                                  position:
                                    reserva
                                      .posicaoFila,
                                },
                              )}
                            </span>
                          ) : (
                            String.fromCharCode(
                              8212,
                            )
                          )}
                        </td>

                        <td className="min-w-[220px] px-5 py-4">
                          {reserva.status ===
                          "DISPONIVEL" ? (
                            <div>
                              <strong
                                className={
                                  reserva.prazoExpirado
                                    ? "text-red-700 dark:text-red-300"
                                    : "text-slate-900 dark:text-slate-100"
                                }
                              >
                                {formatarData(
                                  reserva.expiraEm,
                                )}
                              </strong>

                              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                {reserva.prazoExpirado
                                  ? t(
                                      "table.deadlineExpired",
                                    )
                                  : t(
                                      "table.pickupDeadline",
                                    )}
                              </span>
                            </div>
                          ) : reserva.status ===
                            "ATENDIDA" ? (
                            <div>
                              {formatarData(
                                reserva.atendidaEm,
                              )}

                              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                {t(
                                  "table.attendedAt",
                                )}
                              </span>
                            </div>
                          ) : reserva.status ===
                            "CANCELADA" ? (
                            <div>
                              {formatarData(
                                reserva.canceladaEm,
                              )}

                              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                {t(
                                  "table.canceledAt",
                                )}
                              </span>
                            </div>
                          ) : (
                            String.fromCharCode(
                              8212,
                            )
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-extrabold",
                              classeStatus(
                                reserva.status,
                                reserva.prazoExpirado,
                              ),
                            ].join(
                              " ",
                            )}
                          >
                            {nomeStatus(
                              reserva,
                            )}
                          </span>
                        </td>

                        <td className="sticky right-0 z-10 min-w-[190px] border-l border-slate-200 bg-white px-5 py-4 text-right dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex flex-wrap justify-end gap-2">
                            {reserva.podeCancelar ? (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirCancelamento(
                                    reserva,
                                  )
                                }
                                disabled={
                                  processando ||
                                  dados
                                    ?.contexto
                                    ?.impersonacao ===
                                    true
                                }
                                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/50"
                              >
                                {t(
                                  "actions.cancelButton",
                                )}
                              </button>
                            ) : null}

                            <Link
                              href={`/admin/biblioteca/acervo/${reserva.item.id}`}
                              className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                              {t(
                                "table.openItem",
                              )}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
                </table>
              </div>
            </>
          )}

          {reservaCancelar ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
              onMouseDown={
                fecharCancelamento
              }
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="biblioteca-cancelar-reserva-titulo"
                className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                onMouseDown={(
                  evento,
                ) =>
                  evento.stopPropagation()
                }
              >
                <form
                  onSubmit={(
                    evento,
                  ) =>
                    void cancelarReserva(
                      evento,
                    )
                  }
                >
                  <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                    <h2
                      id="biblioteca-cancelar-reserva-titulo"
                      className="text-xl font-black text-slate-950 dark:text-white"
                    >
                      {t(
                        "actions.cancelTitle",
                      )}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {t(
                        "actions.cancelDescription",
                        {
                          item:
                            reservaCancelar
                              .item
                              .titulo,
                          user:
                            reservaCancelar
                              .usuario
                              .nome,
                        },
                      )}
                    </p>
                  </div>

                  <div className="grid gap-2 px-6 py-5">
                    <label
                      htmlFor="biblioteca-motivo-cancelamento-reserva"
                      className="text-sm font-extrabold text-slate-800 dark:text-slate-200"
                    >
                      {t(
                        "actions.reason",
                      )}
                    </label>

                    <textarea
                      id="biblioteca-motivo-cancelamento-reserva"
                      value={
                        motivoCancelamento
                      }
                      onChange={(
                        evento,
                      ) =>
                        setMotivoCancelamento(
                          evento.target
                            .value,
                        )
                      }
                      rows={4}
                      maxLength={
                        5_000
                      }
                      disabled={
                        processando
                      }
                      placeholder={t(
                        "actions.reasonPlaceholder",
                      )}
                      className="resize-y rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={
                        fecharCancelamento
                      }
                      disabled={
                        processando
                      }
                      className="min-h-11 rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      {t(
                        "actions.close",
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={
                        processando
                      }
                      className="min-h-11 rounded-2xl bg-red-600 px-5 py-2 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processando
                        ? t(
                            "actions.processing",
                          )
                        : t(
                            "actions.confirmCancel",
                          )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

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
                  onClick={() =>
                    setPagina(
                      (atual) =>
                        Math.max(
                          1,
                          atual - 1,
                        ),
                    )
                  }
                  disabled={
                    paginacao.pagina <=
                      1 ||
                    carregando
                  }
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t(
                    "pagination.previous",
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPagina(
                      (atual) =>
                        Math.min(
                          paginacao.totalPaginas,
                          atual + 1,
                        ),
                    )
                  }
                  disabled={
                    paginacao.pagina >=
                      paginacao.totalPaginas ||
                    carregando
                  }
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
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
