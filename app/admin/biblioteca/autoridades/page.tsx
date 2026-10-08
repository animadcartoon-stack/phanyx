"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import AutoridadeModal from "./AutoridadeModal";

type TipoVariante =
  | "VARIANTE"
  | "PSEUDONIMO"
  | "NOME_ANTERIOR"
  | "TRANSLITERACAO"
  | "OUTRO";

type Variante = {
  id: number;
  nome: string;
  nomeNormalizado: string;
  tipo: TipoVariante;
  idioma: string | null;
  observacao: string | null;
  ativo: boolean;
};

type Pessoa = {
  id: number;
  nome: string;
  nomeOrdenacao: string | null;
  codigoCutterBase: string | null;
  biografia: string | null;
  nacionalidade: string | null;
  dataNascimento: string | null;
  dataFalecimento: string | null;
  fotoUrl: string | null;
  siteUrl: string | null;

  orcid: string | null;
  viaf: string | null;
  isni: string | null;
  wikidataId: string | null;
  lccn: string | null;

  notaAutoridade: string | null;
  ativo: boolean;

  variantes: Variante[];

  _count: {
    itens: number;
    variantes: number;
  };
};

type RespostaApi = {
  ok: boolean;

  acesso: {
    podeCriar: boolean;
    podeEditar: boolean;
  };

  pessoas: Pessoa[];

  paginacao: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };

  filtros: {
    busca: string | null;
    ativo: boolean | "todos";
  };
};

type FiltroSituacao =
  | "ativos"
  | "inativos"
  | "todos";

const campoClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";

const botaoSecundarioClass =
  "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";

function identificadores(
  pessoa: Pessoa
) {
  return [
    pessoa.codigoCutterBase
      ? ["Cutter", pessoa.codigoCutterBase]
      : null,

    pessoa.orcid
      ? ["ORCID", pessoa.orcid]
      : null,

    pessoa.viaf
      ? ["VIAF", pessoa.viaf]
      : null,

    pessoa.isni
      ? ["ISNI", pessoa.isni]
      : null,

    pessoa.wikidataId
      ? ["Wikidata", pessoa.wikidataId]
      : null,

    pessoa.lccn
      ? ["LCCN", pessoa.lccn]
      : null,
  ].filter(
    (
      item
    ): item is [string, string] =>
      Boolean(item)
  );
}

export default function BibliotecaAutoridadesPage() {
  const t =
    useTranslations(
      "AdminLibraryAuthorities"
    );

  const [
    pessoas,
    setPessoas,
  ] =
    useState<Pessoa[]>([]);

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
    podeCriar,
    setPodeCriar,
  ] =
    useState(false);

  const [
    podeEditar,
    setPodeEditar,
  ] =
    useState(false);

  const [
    modalAberto,
    setModalAberto,
  ] =
    useState(false);

  const [
    autorIdEdicao,
    setAutorIdEdicao,
  ] =
    useState<number | null>(
      null
    );

  const [
    toast,
    setToast,
  ] =
    useState("");

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
    situacao,
    setSituacao,
  ] =
    useState<FiltroSituacao>(
      "ativos"
    );

  const [
    pagina,
    setPagina,
  ] =
    useState(1);

  const [
    paginacao,
    setPaginacao,
  ] =
    useState({
      pagina: 1,
      porPagina: 25,
      total: 0,
      totalPaginas: 0,
    });

  const carregar =
    useCallback(
      async () => {
        setCarregando(true);
        setErro(false);

        try {
          const parametros =
            new URLSearchParams({
              pagina:
                String(pagina),

              porPagina:
                "25",

              ativo:
                situacao,
            });

          if (
            busca.trim()
          ) {
            parametros.set(
              "busca",
              busca.trim()
            );
          }

          const resposta =
            await fetch(
              `/api/admin/biblioteca/autoridades/pessoas?${parametros.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const corpo =
            (await resposta.json()) as
              Partial<RespostaApi> & {
                error?: string;
              };

          if (
            !resposta.ok ||
            corpo.ok !== true ||
            !Array.isArray(
              corpo.pessoas
            ) ||
            !corpo.paginacao
          ) {
            throw new Error(
              corpo.error ||
                "AUTORIDADES_INDISPONIVEIS"
            );
          }

          setPessoas(
            corpo.pessoas
          );

          setPodeCriar(
            corpo.acesso?.podeCriar ===
              true
          );

          setPodeEditar(
            corpo.acesso?.podeEditar ===
              true
          );

          setPaginacao(
            corpo.paginacao
          );
        } catch {
          setPessoas([]);
          setErro(true);
        } finally {
          setCarregando(false);
        }
      },
      [
        busca,
        pagina,
        situacao,
      ]
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!toast) return;

    const temporizador =
      window.setTimeout(
        () => setToast(""),
        4500
      );

    return () =>
      window.clearTimeout(
        temporizador
      );
  }, [toast]);

  function abrirCriacao() {
    setAutorIdEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(
    id: number
  ) {
    setAutorIdEdicao(id);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setAutorIdEdicao(null);
  }

  function autoridadeSalva(
    mensagem: string
  ) {
    fecharModal();
    setToast(mensagem);

    if (pagina === 1) {
      void carregar();
    } else {
      setPagina(1);
    }
  }

  function pesquisar(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPagina(1);
    setBusca(
      buscaDigitada.trim()
    );
  }

  function alterarSituacao(
    valor: FiltroSituacao
  ) {
    setPagina(1);
    setSituacao(valor);
  }

  function rotuloVariante(
    tipo: TipoVariante
  ) {
    switch (tipo) {
      case "VARIANTE":
        return t(
          "variantType.VARIANTE"
        );

      case "PSEUDONIMO":
        return t(
          "variantType.PSEUDONIMO"
        );

      case "NOME_ANTERIOR":
        return t(
          "variantType.NOME_ANTERIOR"
        );

      case "TRANSLITERACAO":
        return t(
          "variantType.TRANSLITERACAO"
        );

      case "OUTRO":
      default:
        return t(
          "variantType.OUTRO"
        );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {t("title")}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(
                  "description"
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {podeCriar && (
                <button
                  type="button"
                  onClick={
                    abrirCriacao
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:ring-offset-slate-900"
                >
                  +{" "}
                  {t(
                    "newAuthority"
                  )}
                </button>
              )}

              <button
                type="button"
                className={
                  botaoSecundarioClass
                }
                onClick={() =>
                  void carregar()
                }
                disabled={
                  carregando
                }
              >
                {String.fromCodePoint(
                  0x21bb
                )}{" "}
                {t("refresh")}
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <form
            onSubmit={
              pesquisar
            }
            className="grid gap-4 lg:grid-cols-[1fr_220px_auto]"
          >
            <div>
              <label
                htmlFor="busca-autoridades"
                className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t(
                  "searchLabel"
                )}
              </label>

              <input
                id="busca-autoridades"
                className={
                  campoClass
                }
                value={
                  buscaDigitada
                }
                onChange={(
                  event
                ) =>
                  setBuscaDigitada(
                    event.target
                      .value
                  )
                }
                placeholder={t(
                  "searchPlaceholder"
                )}
                maxLength={
                  150
                }
              />
            </div>

            <div>
              <label
                htmlFor="situacao-autoridades"
                className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t(
                  "status"
                )}
              </label>

              <select
                id="situacao-autoridades"
                className={
                  campoClass
                }
                value={
                  situacao
                }
                onChange={(
                  event
                ) =>
                  alterarSituacao(
                    event.target
                      .value as
                      FiltroSituacao
                  )
                }
              >
                <option value="ativos">
                  {t(
                    "active"
                  )}
                </option>

                <option value="inativos">
                  {t(
                    "inactive"
                  )}
                </option>

                <option value="todos">
                  {t(
                    "all"
                  )}
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:ring-offset-slate-900 lg:w-auto"
              >
                {String.fromCodePoint(
                  0x1f50e
                )}{" "}
                {t(
                  "search"
                )}
              </button>
            </div>
          </form>
        </section>

        {!carregando &&
          !erro && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold">
                {t(
                  "totalResults",
                  {
                    count:
                      paginacao.total,
                  }
                )}
              </span>

              {paginacao.totalPaginas >
                0 && (
                <span>
                  {t(
                    "pageOf",
                    {
                      page:
                        paginacao.pagina,

                      total:
                        paginacao.totalPaginas,
                    }
                  )}
                </span>
              )}
            </div>
          )}

        {carregando && (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {t("loading")}
          </section>
        )}

        {!carregando &&
          erro && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
              <p className="font-semibold text-red-800 dark:text-red-200">
                {t(
                  "loadError"
                )}
              </p>

              <button
                type="button"
                onClick={() =>
                  void carregar()
                }
                className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-200"
              >
                {t("retry")}
              </button>
            </section>
          )}

        {!carregando &&
          !erro &&
          pessoas.length ===
            0 && (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div
                className="text-4xl"
                aria-hidden="true"
              >
                {String.fromCodePoint(
                  0x1f464
                )}
              </div>

              <h2 className="mt-3 text-lg font-bold">
                {t(
                  "emptyTitle"
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t(
                  "emptyDescription"
                )}
              </p>
            </section>
          )}

        {!carregando &&
          !erro &&
          pessoas.length >
            0 && (
            <section className="grid gap-4">
              {pessoas.map(
                (pessoa) => {
                  const ids =
                    identificadores(
                      pessoa
                    );

                  return (
                    <article
                      key={
                        pessoa.id
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                              {
                                pessoa.nome
                              }
                            </h2>

                            <span
                              className={
                                pessoa.ativo
                                  ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                  : "rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }
                            >
                              {pessoa.ativo
                                ? t(
                                    "statusActive"
                                  )
                                : t(
                                    "statusInactive"
                                  )}
                            </span>

                            {podeEditar && (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirEdicao(
                                    pessoa.id
                                  )
                                }
                                className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {t(
                                  "edit"
                                )}
                              </button>
                            )}
                          </div>

                          {pessoa.nomeOrdenacao && (
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                              <span className="font-semibold">
                                {t(
                                  "sortName"
                                )}
                                :
                              </span>{" "}
                              {
                                pessoa.nomeOrdenacao
                              }
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {t(
                                "linkedWorks",
                                {
                                  count:
                                    pessoa
                                      ._count
                                      .itens,
                                }
                              )}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {t(
                                "variants",
                                {
                                  count:
                                    pessoa
                                      .variantes
                                      .length,
                                }
                              )}
                            </span>
                          </div>

                          <div className="mt-5">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              {t(
                                "identifiers"
                              )}
                            </h3>

                            {ids.length >
                            0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {ids.map(
                                  ([
                                    tipo,
                                    valor,
                                  ]) => (
                                    <span
                                      key={
                                        tipo
                                      }
                                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                    >
                                      <strong>
                                        {
                                          tipo
                                        }
                                        :
                                      </strong>{" "}
                                      {
                                        valor
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {t(
                                  "noIdentifiers"
                                )}
                              </p>
                            )}
                          </div>

                          <div className="mt-5">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              {t(
                                "variants",
                                {
                                  count:
                                    pessoa
                                      .variantes
                                      .length,
                                }
                              )}
                            </h3>

                            {pessoa
                              .variantes
                              .length >
                            0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {pessoa.variantes.map(
                                  (
                                    variante
                                  ) => (
                                    <span
                                      key={
                                        variante.id
                                      }
                                      className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                                    >
                                      {
                                        variante.nome
                                      }{" "}
                                      <span className="opacity-70">
                                        ·{" "}
                                        {rotuloVariante(
                                          variante.tipo
                                        )}
                                      </span>
                                    </span>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {t(
                                  "noVariants"
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          )}

        {!carregando &&
          !erro &&
          paginacao.totalPaginas >
            1 && (
            <nav
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              aria-label={t(
                "pageOf",
                {
                  page:
                    paginacao.pagina,
                  total:
                    paginacao.totalPaginas,
                }
              )}
            >
              <button
                type="button"
                className={
                  botaoSecundarioClass
                }
                disabled={
                  pagina <= 1
                }
                onClick={() =>
                  setPagina(
                    (atual) =>
                      Math.max(
                        1,
                        atual - 1
                      )
                  )
                }
              >
                {t(
                  "previous"
                )}
              </button>

              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {t(
                  "pageOf",
                  {
                    page:
                      paginacao.pagina,

                    total:
                      paginacao.totalPaginas,
                  }
                )}
              </span>

              <button
                type="button"
                className={
                  botaoSecundarioClass
                }
                disabled={
                  pagina >=
                  paginacao.totalPaginas
                }
                onClick={() =>
                  setPagina(
                    (atual) =>
                      atual + 1
                  )
                }
              >
                {t("next")}
              </button>
            </nav>
          )}
      </div>

      <AutoridadeModal
        aberto={
          modalAberto
        }
        autorId={
          autorIdEdicao
        }
        onClose={
          fecharModal
        }
        onSaved={
          autoridadeSalva
        }
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[140] max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
