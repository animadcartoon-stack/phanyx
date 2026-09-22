"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type Notificacao = {
  id: number;
  tipo: string;
  categoria?: string | null;
  titulo: string;
  descricao?: string | null;
  link?: string | null;
  quantidade?: number;
  lida: boolean;
  criadoEm: string;
};

const FILTROS = [
  "TODAS",
  "NAO_LIDAS",
  "RH",
  "FINANCEIRO",
  "ACADEMICO",
  "SISTEMA",
  "OUVIDORIA",
  "CHAT",
  "BIBLIOTECA",
] as const;

type Filtro =
  (typeof FILTROS)[number];

export default function NotificacoesPage() {
  const t =
    useTranslations(
      "AdminNotifications"
    );

  const locale =
    useLocale();

  const [
    notificacoes,
    setNotificacoes,
  ] = useState<Notificacao[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    filtro,
    setFiltro,
  ] = useState<Filtro>(
    "TODAS"
  );

  function formatarDataHora(
    data: string
  ) {
    const dataConvertida =
      new Date(data);

    if (
      Number.isNaN(
        dataConvertida.getTime()
      )
    ) {
      return data;
    }

    return dataConvertida
      .toLocaleString(
        locale
      );
  }

  function rotuloFiltro(
    chave: Filtro
  ) {
    switch (chave) {
      case "TODAS":
        return t(
          "filters.all"
        );

      case "NAO_LIDAS":
        return t(
          "filters.unread"
        );

      case "RH":
        return t(
          "filters.hr"
        );

      case "FINANCEIRO":
        return t(
          "filters.finance"
        );

      case "ACADEMICO":
        return t(
          "filters.academic"
        );

      case "SISTEMA":
        return t(
          "filters.system"
        );

      case "OUVIDORIA":
        return t(
          "filters.ombudsman"
        );

      case "CHAT":
        return t(
          "filters.chat"
        );

      case "BIBLIOTECA":
        return t(
          "filters.library"
        );
    }
  }

  function rotuloCategoria(
    valor?: string | null
  ) {
    const codigo =
      String(
        valor || ""
      )
        .trim()
        .toUpperCase();

    switch (codigo) {
      case "RH":
        return t(
          "filters.hr"
        );

      case "FINANCEIRO":
        return t(
          "filters.finance"
        );

      case "ACADEMICO":
        return t(
          "filters.academic"
        );

      case "SISTEMA":
        return t(
          "filters.system"
        );

      case "OUVIDORIA":
        return t(
          "filters.ombudsman"
        );

      case "CHAT":
        return t(
          "filters.chat"
        );

      case "BIBLIOTECA":
        return t(
          "filters.library"
        );

      default:
        return (
          valor ||
          "-"
        );
    }
  }

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res =
        await fetch(
          "/api/admin/notificacoes",
          {
            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t(
            "errors.load"
          )
        );
      }

      setNotificacoes(
        Array.isArray(
          data?.notificacoes
        )
          ? data.notificacoes
          : []
      );
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : t(
              "errors.load"
            )
      );
    } finally {
      setLoading(false);
    }
  }

  async function abrirNotificacao(
    item: Notificacao
  ) {
    try {
      const res =
        await fetch(
          "/api/admin/notificacoes",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify({
                id: item.id,
                lida: true,
              }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t(
            "errors.update"
          )
        );
      }

      setNotificacoes(
        (atual) =>
          atual.map(
            (notificacao) =>
              notificacao.id ===
              item.id
                ? {
                    ...notificacao,
                    lida: true,
                  }
                : notificacao
          )
      );

      const tipo =
        String(
          item.tipo || ""
        )
          .trim()
          .toUpperCase();

      const categoria =
        String(
          item.categoria || ""
        )
          .trim()
          .toUpperCase();

      if (
        tipo === "CHAT" ||
        categoria === "CHAT"
      ) {
        let conversaId:
          number | null =
          null;

        if (item.link) {
          try {
            const url =
              new URL(
                item.link,
                window.location
                  .origin
              );

            const parametro =
              url.searchParams
                .get(
                  "conversaId"
                );

            if (parametro) {
              const convertido =
                Number(
                  parametro
                );

              if (
                Number.isFinite(
                  convertido
                ) &&
                convertido > 0
              ) {
                conversaId =
                  convertido;
              }
            }
          } catch {
            conversaId =
              null;
          }
        }

        const remetenteExtraido =
          item.descricao
            ?.includes(":")
            ? item.descricao
                .split(":")[0]
                .trim()
            : "";

        const remetenteLower =
          remetenteExtraido
            .toLowerCase();

        const remetenteValido =
          Boolean(
            remetenteExtraido
          ) &&
          remetenteLower !==
            "null" &&
          remetenteLower !==
            "usuario" &&
          remetenteLower !==
            "usu\u00e1rio" &&
          remetenteLower !==
            "usu\u00c3\u00a1rio";

        const remetenteNome =
          remetenteValido
            ? remetenteExtraido
            : conversaId
              ? t(
                  "chat.conversation",
                  {
                    id:
                      conversaId,
                  }
                )
              : t(
                  "chat.defaultName"
                );

        window.dispatchEvent(
          new CustomEvent(
            "phanyx:abrir-chat",
            {
              detail:
                conversaId
                  ? {
                      conversaId,
                      remetenteNome,
                      remetenteRole:
                        "",
                    }
                  : {
                      remetenteNome,
                      remetenteRole:
                        "",
                    },
            }
          )
        );

        return;
      }

      const destino =
        item.link
          ?.trim() ||
        "";

      if (destino) {
        window.location.assign(
          destino
        );

        return;
      }

      setErro(
        t(
          "errors.noDestination"
        )
      );
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : t(
              "errors.open"
            )
      );
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const naoLidas =
    useMemo(
      () =>
        notificacoes.filter(
          (item) =>
            !item.lida
        ).length,
      [notificacoes]
    );

  const categorias =
    useMemo(
      () =>
        Array.from(
          new Set(
            notificacoes
              .map(
                (item) =>
                  item.categoria
              )
              .filter(Boolean)
          )
        ),
      [notificacoes]
    );

  const notificacoesFiltradas =
    useMemo(
      () => {
        if (
          filtro ===
          "TODAS"
        ) {
          return notificacoes;
        }

        if (
          filtro ===
          "NAO_LIDAS"
        ) {
          return notificacoes
            .filter(
              (item) =>
                !item.lida
            );
        }

        return notificacoes
          .filter(
            (item) =>
              String(
                item.categoria ||
                item.tipo ||
                ""
              )
                .toUpperCase() ===
              filtro
          );
      },
      [
        notificacoes,
        filtro,
      ]
    );

  return (
    <main className="phanyx-notificacoes-page space-y-6 text-slate-900 dark:text-slate-100">
      <header>
        <p className="text-sm font-semibold uppercase text-blue-600 dark:text-blue-400">
          PHANYX
        </p>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t(
            "header.title"
          )}
        </h1>

        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          {t(
            "header.description"
          )}
        </p>
      </header>

      {erro ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
        >
          {erro}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-300">
            {t(
              "stats.total"
            )}
          </div>

          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {notificacoes.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-300">
            {t(
              "stats.unread"
            )}
          </div>

          <div className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
            {naoLidas}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-300">
            {t(
              "stats.categories"
            )}
          </div>

          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {categorias.length}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t(
            "list.title"
          )}
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTROS.map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setFiltro(
                    item
                  )
                }
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  filtro === item
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-300",
                ].join(" ")}
              >
                {rotuloFiltro(
                  item
                )}
              </button>
            )
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-left">
                  {t(
                    "table.category"
                  )}
                </th>

                <th className="p-3 text-left">
                  {t(
                    "table.title"
                  )}
                </th>

                <th className="p-3 text-left">
                  {t(
                    "table.description"
                  )}
                </th>

                <th className="p-3 text-left">
                  {t(
                    "table.date"
                  )}
                </th>

                <th className="p-3 text-left">
                  {t(
                    "table.status"
                  )}
                </th>

                <th className="p-3 text-left">
                  {t(
                    "table.actions"
                  )}
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-slate-600 dark:text-slate-300"
                  >
                    {t(
                      "states.loading"
                    )}
                  </td>
                </tr>
              ) : notificacoesFiltradas.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-slate-600 dark:text-slate-300"
                  >
                    {t(
                      "states.empty"
                    )}
                  </td>
                </tr>
              ) : (
                notificacoesFiltradas.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                      className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                    >
                      <td className="p-3">
                        {rotuloCategoria(
                          item.categoria ||
                          item.tipo
                        )}
                      </td>

                      <td className="p-3 font-semibold">
                        {
                          item.titulo
                        }
                      </td>

                      <td className="p-3">
                        {item.descricao ||
                          "-"}
                      </td>

                      <td className="whitespace-nowrap p-3">
                        {formatarDataHora(
                          item.criadoEm
                        )}
                      </td>

                      <td className="p-3">
                        {item.lida ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {t(
                              "status.read"
                            )}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            {t(
                              "status.unread"
                            )}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() =>
                            abrirNotificacao(
                              item
                            )
                          }
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          {t(
                            "actions.open"
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
