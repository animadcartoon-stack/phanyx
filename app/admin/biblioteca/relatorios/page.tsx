"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type DadosRelatorio = {
  periodo: {
    inicio: string;
    fim: string;
  };

  circulacao: {
    emprestimos: number;
    devolucoes: number;
    ativos: number;
    atrasados: number;
    devolvidos: number;
    perdidos: number;
    danificados: number;
    cancelados: number;
  };

  renovacoes: {
    total: number;
    solicitadas: number;
    aprovadas: number;
    recusadas: number;
    canceladas: number;
  };

  reservas: {
    total: number;
    aguardando: number;
    disponiveis: number;
    atendidas: number;
    expiradas: number;
    canceladas: number;
  };

  multas: {
    quantidade: number;
    valorGerado: number;
    valorPago: number;
    valorEmAberto: number;
    pendentes: number;
    pagas: number;
    canceladas: number;
  };

  acervo: {
    titulos: number;
    exemplares: number;
    porStatus: Record<
      string,
      number
    >;
  };

  digital: {
    acessos: number;
    usuariosUnicos: number;
    leituras: number;
    visualizacoes: number;
    downloads: number;
    reproducoes: number;
    retomadas: number;
    conclusoesRegistradas: number;
    leiturasConcluidas: number;
  };

  rankings: {
    itensMaisEmprestados: Array<{
      itemId: number;
      titulo: string;
      subtitulo: string | null;
      isbn13: string | null;
      quantidade: number;
    }>;

    usuariosMaisAtivos: Array<{
      usuarioId: number;
      nome: string;
      email: string | null;
      quantidade: number;
    }>;
  };
};

function hojeISO() {
  return new Date()
    .toISOString()
    .slice(
      0,
      10,
    );
}

function dataInicialPadrao() {
  const data = new Date();

  data.setDate(
    data.getDate() - 29,
  );

  return data
    .toISOString()
    .slice(
      0,
      10,
    );
}

export default function BibliotecaRelatoriosPage() {
  const t =
    useTranslations(
      "AdminLibraryReports",
    );

  const locale =
    useLocale();

  const [
    inicio,
    setInicio,
  ] =
    useState(
      dataInicialPadrao,
    );

  const [
    fim,
    setFim,
  ] =
    useState(
      hojeISO,
    );

  const [
    periodoAplicado,
    setPeriodoAplicado,
  ] =
    useState({
      inicio:
        dataInicialPadrao(),
      fim:
        hojeISO(),
    });

  const [
    dados,
    setDados,
  ] =
    useState<DadosRelatorio | null>(
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
    useState("");

  const [
    exportando,
    setExportando,
  ] =
    useState(false);

  const [
    exportandoExcel,
    setExportandoExcel,
  ] =
    useState(false);

  const [
    exportandoPdf,
    setExportandoPdf,
  ] =
    useState(false);

  const carregar =
    useCallback(
      async () => {
        try {
          setCarregando(
            true,
          );

          setErro("");

          const parametros =
            new URLSearchParams({
              inicio:
                periodoAplicado.inicio,
              fim:
                periodoAplicado.fim,
            });

          const resposta =
            await fetch(
              `/api/admin/biblioteca/relatorios?${parametros.toString()}`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              },
            );

          const json =
            await resposta.json();

          if (!resposta.ok) {
            throw new Error(
              json?.error ||
                t(
                  "errors.load",
                ),
            );
          }

          setDados(
            json,
          );
        } catch (
          e: any
        ) {
          setDados(
            null,
          );

          setErro(
            e?.message ||
              t(
                "errors.load",
              ),
          );
        } finally {
          setCarregando(
            false,
          );
        }
      },
      [
        periodoAplicado,
        t,
      ],
    );

  useEffect(
    () => {
      carregar();
    },
    [
      carregar,
    ],
  );

  function aplicarPeriodo(
    evento: FormEvent,
  ) {
    evento.preventDefault();

    setPeriodoAplicado({
      inicio,
      fim,
    });
  }

  async function exportarPdf() {
    try {
      setExportandoPdf(true);
      setErro("");

      const parametros =
        new URLSearchParams({
          inicio:
            periodoAplicado.inicio,
          fim:
            periodoAplicado.fim,
          locale,
        });

      const resposta =
        await fetch(
          `/api/admin/biblioteca/relatorios/pdf?${parametros.toString()}`,
          {
            credentials:
              "include",
            cache:
              "no-store",
          },
        );

      if (!resposta.ok) {
        let mensagem =
          t(
            "errors.exportPdf",
          );

        try {
          const json =
            await resposta.json();

          if (json?.error) {
            mensagem =
              json.error;
          }
        } catch {}

        throw new Error(
          mensagem,
        );
      }

      const blob =
        await resposta.blob();

      const url =
        URL.createObjectURL(
          blob,
        );

      const link =
        document.createElement(
          "a",
        );

      link.href =
        url;

      link.download =
        `biblioteca-relatorio-${periodoAplicado.inicio}-${periodoAplicado.fim}.pdf`;

      document.body.appendChild(
        link,
      );

      link.click();
      link.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            url,
          ),
        0,
      );
    } catch (e: any) {
      setErro(
        e?.message ||
          t(
            "errors.exportPdf",
          ),
      );
    } finally {
      setExportandoPdf(
        false,
      );
    }
  }

  async function exportarExcel() {
    try {
      setExportandoExcel(true);
      setErro("");

      const parametros =
        new URLSearchParams({
          inicio:
            periodoAplicado.inicio,
          fim:
            periodoAplicado.fim,
          locale,
        });

      const resposta =
        await fetch(
          `/api/admin/biblioteca/relatorios/excel?${parametros.toString()}`,
          {
            credentials:
              "include",
            cache:
              "no-store",
          },
        );

      if (!resposta.ok) {
        let mensagem =
          t(
            "errors.exportExcel",
          );

        try {
          const json =
            await resposta.json();

          if (json?.error) {
            mensagem =
              json.error;
          }
        } catch {}

        throw new Error(
          mensagem,
        );
      }

      const blob =
        await resposta.blob();

      const url =
        URL.createObjectURL(
          blob,
        );

      const link =
        document.createElement(
          "a",
        );

      link.href =
        url;

      link.download =
        `biblioteca-relatorio-${periodoAplicado.inicio}-${periodoAplicado.fim}.xlsx`;

      document.body.appendChild(
        link,
      );

      link.click();
      link.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            url,
          ),
        0,
      );
    } catch (e: any) {
      setErro(
        e?.message ||
          t(
            "errors.exportExcel",
          ),
      );
    } finally {
      setExportandoExcel(
        false,
      );
    }
  }

  async function exportarCsv() {
    try {
      setExportando(true);
      setErro("");

      const parametros =
        new URLSearchParams({
          inicio:
            periodoAplicado.inicio,
          fim:
            periodoAplicado.fim,
          locale,
        });

      const resposta =
        await fetch(
          `/api/admin/biblioteca/relatorios/exportar?${parametros.toString()}`,
          {
            credentials:
              "include",
            cache:
              "no-store",
          },
        );

      if (!resposta.ok) {
        let mensagem =
          t("errors.export");

        try {
          const json =
            await resposta.json();

          if (json?.error) {
            mensagem =
              json.error;
          }
        } catch {}

        throw new Error(
          mensagem,
        );
      }

      const blob =
        await resposta.blob();

      const url =
        URL.createObjectURL(
          blob,
        );

      const link =
        document.createElement(
          "a",
        );

      link.href = url;

      link.download =
        `biblioteca-relatorios-${periodoAplicado.inicio}-${periodoAplicado.fim}.csv`;

      document.body.appendChild(
        link,
      );

      link.click();
      link.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            url,
          ),
        0,
      );
    } catch (e: any) {
      setErro(
        e?.message ||
          t(
            "errors.export",
          ),
      );
    } finally {
      setExportando(
        false,
      );
    }
  }

  function formatarMoeda(
    valor: number,
  ) {
    return new Intl.NumberFormat(
      locale,
      {
        style:
          "currency",
        currency:
          "BRL",
      },
    ).format(
      valor || 0,
    );
  }

  function formatarData(
    valor: string,
  ) {
    if (!valor) {
      return "-";
    }

    return new Date(
      `${valor}T12:00:00`,
    ).toLocaleDateString(
      locale,
    );
  }

  const maxItens =
    useMemo(
      () =>
        Math.max(
          1,
          ...(
            dados
              ?.rankings
              .itensMaisEmprestados ||
            []
          ).map(
            (item) =>
              item.quantidade,
          ),
        ),
      [
        dados,
      ],
    );

  const maxUsuarios =
    useMemo(
      () =>
        Math.max(
          1,
          ...(
            dados
              ?.rankings
              .usuariosMaisAtivos ||
            []
          ).map(
            (item) =>
              item.quantidade,
          ),
        ),
      [
        dados,
      ],
    );

  const card =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

  const tituloCard =
    "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

  const numeroCard =
    "mt-2 text-2xl font-black text-slate-950 dark:text-white";

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-black">
          📊{" "}
          {t(
            "title",
          )}
        </h1>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t(
            "subtitle",
          )}
        </p>
      </div>

      <form
        onSubmit={
          aplicarPeriodo
        }
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_1fr_auto]"
      >
        <label className="space-y-1">
          <span className="text-sm font-bold">
            {t(
              "filters.start",
            )}
          </span>

          <input
            type="date"
            value={
              inicio
            }
            onChange={(
              e,
            ) =>
              setInicio(
                e.target
                  .value,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-bold">
            {t(
              "filters.end",
            )}
          </span>

          <input
            type="date"
            value={
              fim
            }
            onChange={(
              e,
            ) =>
              setFim(
                e.target
                  .value,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="min-h-10 rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white transition hover:bg-blue-700"
          >
            {t(
              "filters.apply",
            )}
          </button>

          <button
            type="button"
            onClick={
              exportarExcel
            }
            disabled={
              exportandoExcel ||
              carregando ||
              !dados
            }
            className="min-h-10 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {exportandoExcel
              ? t(
                  "actions.exportingExcel",
                )
              : t(
                  "actions.exportExcel",
                )}
          </button>

          <button
            type="button"
            onClick={
              exportarPdf
            }
            disabled={
              exportandoPdf ||
              carregando ||
              !dados
            }
            className="min-h-10 rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-500"
          >
            {exportandoPdf
              ? t(
                  "actions.exportingPdf",
                )
              : t(
                  "actions.exportPdf",
                )}
          </button>

          <details className="relative">
            <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
              {t(
                "actions.moreFormats",
              )}
              <span className="ml-2">
                {String.fromCodePoint(0x25BE)}
              </span>
            </summary>

            <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={
                  exportarCsv
                }
                disabled={
                  exportando ||
                  carregando ||
                  !dados
                }
                className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
              >
                <span className="block text-sm font-bold text-slate-900 dark:text-white">
                  {exportando
                    ? t(
                        "actions.exporting",
                      )
                    : t(
                        "actions.exportCsv",
                      )}
                </span>

                <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                  {t(
                    "actions.csvHelp",
                  )}
                </span>
              </button>
            </div>
          </details>
        </div>
      </form>

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {erro}
        </div>
      ) : null}

      {carregando ? (
        <div className={card}>
          {t(
            "loading",
          )}
        </div>
      ) : null}

      {!carregando &&
      dados ? (
        <>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            {t(
              "period",
              {
                start:
                  formatarData(
                    dados
                      .periodo
                      .inicio,
                  ),

                end:
                  formatarData(
                    dados
                      .periodo
                      .fim,
                  ),
              },
            )}
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-black">
              {t(
                "sections.circulation",
              )}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.loans",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .circulacao
                      .emprestimos
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.returns",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .circulacao
                      .devolucoes
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.renewals",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .renovacoes
                      .total
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.reservations",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .reservas
                      .total
                  }
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black">
              {t(
                "sections.fines",
              )}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.finesCount",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .multas
                      .quantidade
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.finesGenerated",
                  )}
                </p>

                <p className={numeroCard}>
                  {formatarMoeda(
                    dados
                      .multas
                      .valorGerado,
                  )}
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.finesPaid",
                  )}
                </p>

                <p className={numeroCard}>
                  {formatarMoeda(
                    dados
                      .multas
                      .valorPago,
                  )}
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.finesOpen",
                  )}
                </p>

                <p className={numeroCard}>
                  {formatarMoeda(
                    dados
                      .multas
                      .valorEmAberto,
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black">
              {t(
                "sections.collection",
              )}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.titles",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .acervo
                      .titulos
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.copies",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .acervo
                      .exemplares
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.availableCopies",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .acervo
                      .porStatus
                      .DISPONIVEL ||
                    0
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.unavailableCopies",
                  )}
                </p>

                <p className={numeroCard}>
                  {Math.max(
                    0,
                    dados
                      .acervo
                      .exemplares -
                      (
                        dados
                          .acervo
                          .porStatus
                          .DISPONIVEL ||
                        0
                      ),
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black">
              {t(
                "sections.digital",
              )}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.digitalAccesses",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .digital
                      .acessos
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.uniqueUsers",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .digital
                      .usuariosUnicos
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.views",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .digital
                      .visualizacoes
                  }
                </p>
              </div>

              <div className={card}>
                <p className={tituloCard}>
                  {t(
                    "cards.completedReads",
                  )}
                </p>

                <p className={numeroCard}>
                  {
                    dados
                      .digital
                      .leiturasConcluidas
                  }
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className={card}>
              <h2 className="text-lg font-black">
                {t(
                  "sections.mostBorrowed",
                )}
              </h2>

              <div className="mt-5 space-y-4">
                {dados
                  .rankings
                  .itensMaisEmprestados
                  .length ===
                0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "empty.ranking",
                    )}
                  </p>
                ) : (
                  dados
                    .rankings
                    .itensMaisEmprestados
                    .map(
                      (
                        item,
                        indice,
                      ) => (
                        <div
                          key={
                            item.itemId
                          }
                          className="space-y-2"
                        >
                          <div className="flex items-start justify-between gap-4 text-sm">
                            <div>
                              <strong>
                                {indice +
                                  1}
                                .{" "}
                                {
                                  item.titulo
                                }
                              </strong>

                              {item.subtitulo ? (
                                <span className="block text-xs text-slate-500 dark:text-slate-400">
                                  {
                                    item.subtitulo
                                  }
                                </span>
                              ) : null}
                            </div>

                            <span className="font-black">
                              {
                                item.quantidade
                              }
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width:
                                  `${Math.max(
                                    4,
                                    (
                                      item.quantidade /
                                      maxItens
                                    ) *
                                      100,
                                  )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ),
                    )
                )}
              </div>
            </div>

            <div className={card}>
              <h2 className="text-lg font-black">
                {t(
                  "sections.activeUsers",
                )}
              </h2>

              <div className="mt-5 space-y-4">
                {dados
                  .rankings
                  .usuariosMaisAtivos
                  .length ===
                0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "empty.ranking",
                    )}
                  </p>
                ) : (
                  dados
                    .rankings
                    .usuariosMaisAtivos
                    .map(
                      (
                        item,
                        indice,
                      ) => (
                        <div
                          key={
                            item.usuarioId
                          }
                          className="space-y-2"
                        >
                          <div className="flex items-start justify-between gap-4 text-sm">
                            <div>
                              <strong>
                                {indice +
                                  1}
                                .{" "}
                                {
                                  item.nome
                                }
                              </strong>

                              {item.email ? (
                                <span className="block text-xs text-slate-500 dark:text-slate-400">
                                  {
                                    item.email
                                  }
                                </span>
                              ) : null}
                            </div>

                            <span className="font-black">
                              {
                                item.quantidade
                              }
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{
                                width:
                                  `${Math.max(
                                    4,
                                    (
                                      item.quantidade /
                                      maxUsuarios
                                    ) *
                                      100,
                                  )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ),
                    )
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
