"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type ItemAcervo = {
  id: number;
  titulo: string;
  subtitulo: string | null;
  tipo: string;
  status: string;
  slug: string;
  capaUrl: string | null;
  miniaturaUrl: string | null;
};

type Vinculo = {
  id: number;
  itemId: number;
  ordem: number;
  adicionadoEm: string;
  item: ItemAcervo;
};

type DadosItens = {
  success: boolean;
  prateleira: {
    id: number;
    nome: string;
    ativa: boolean;
    _count: {
      itens: number;
    };
  };
  itens: Vinculo[];
  paginacao: {
    pagina: number;
    tamanhoPagina: number;
    total: number;
    totalPaginas: number;
  };
  disponiveis: ItemAcervo[];
};

type Props = {
  prateleira: {
    id: number;
    nome: string;
  };
  onClose: () => void;
  onChanged: () => void | Promise<void>;
};

type Aviso = {
  texto: string;
  erro: boolean;
};

const botaoSecundario =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700";

export default function ItensPrateleira({
  prateleira,
  onClose,
  onChanged,
}: Props) {
  const t = useTranslations("AdminLibraryShelves");

  const [dados, setDados] = useState<DadosItens | null>(null);
  const [pagina, setPagina] = useState(1);
  const [textoBusca, setTextoBusca] = useState("");
  const [busca, setBusca] = useState("");
  const [versao, setVersao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [operando, setOperando] = useState(false);
  const [confirmacao, setConfirmacao] = useState<Vinculo | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const urlBase = `/api/admin/biblioteca/prateleiras/${prateleira.id}/itens`;

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setPagina(1);
      setBusca(textoBusca.trim());
    }, 300);

    return () => window.clearTimeout(temporizador);
  }, [textoBusca]);

  useEffect(() => {
    const controlador = new AbortController();
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErroCarregamento(false);

      try {
        const parametros = new URLSearchParams({
          pagina: String(pagina),
          busca,
        });
        const resposta = await fetch(`${urlBase}?${parametros}`, {
          cache: "no-store",
          signal: controlador.signal,
        });
        const corpo = (await resposta.json()) as DadosItens;

        if (!resposta.ok || !corpo.success) {
          throw new Error("ITENS_INDISPONIVEIS");
        }

        if (ativo) setDados(corpo);
      } catch {
        if (ativo && !controlador.signal.aborted) {
          setErroCarregamento(true);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();

    return () => {
      ativo = false;
      controlador.abort();
    };
  }, [urlBase, pagina, busca, versao]);

  useEffect(() => {
    if (!aviso) return;

    const temporizador = window.setTimeout(() => setAviso(null), 4500);
    return () => window.clearTimeout(temporizador);
  }, [aviso]);

  useEffect(() => {
    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key !== "Escape" || operando) return;

      if (confirmacao) setConfirmacao(null);
      else onClose();
    }

    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [confirmacao, operando, onClose]);

  const atualizar = useCallback(async () => {
    setVersao((atual) => atual + 1);
    await onChanged();
  }, [onChanged]);

  async function adicionar(itemId: number) {
    if (operando) return;
    setOperando(true);

    try {
      const resposta = await fetch(urlBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });

      if (!resposta.ok) throw new Error("FALHA_AO_ADICIONAR");

      setAviso({ texto: t("itemAdded"), erro: false });
      await atualizar();
    } catch {
      setAviso({ texto: t("actionError"), erro: true });
    } finally {
      setOperando(false);
    }
  }

  async function remover() {
    if (!confirmacao || operando) return;

    setOperando(true);

    try {
      const resposta = await fetch(
        `${urlBase}/${confirmacao.id}`,
        { method: "DELETE" },
      );

      if (!resposta.ok) throw new Error("FALHA_AO_REMOVER");

      const totalRestante = Math.max(
        0,
        (dados?.paginacao.total ?? 1) - 1,
      );
      const ultimaPagina = Math.max(1, Math.ceil(totalRestante / 50));

      if (pagina > ultimaPagina) setPagina(ultimaPagina);

      setConfirmacao(null);
      setAviso({ texto: t("itemRemoved"), erro: false });
      await atualizar();
    } catch {
      setAviso({ texto: t("actionError"), erro: true });
    } finally {
      setOperando(false);
    }
  }

  async function mover(vinculoId: number, novaPosicao: number) {
    if (operando) return;
    setOperando(true);

    try {
      const resposta = await fetch(`${urlBase}/${vinculoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ novaPosicao }),
      });

      if (!resposta.ok) throw new Error("FALHA_AO_ORDENAR");

      const primeiraPosicao = (pagina - 1) * 50;
      if (novaPosicao < primeiraPosicao) setPagina(pagina - 1);
      if (novaPosicao >= primeiraPosicao + 50) setPagina(pagina + 1);

      setAviso({ texto: t("itemReordered"), erro: false });
      await atualizar();
    } catch {
      setAviso({ texto: t("actionError"), erro: true });
    } finally {
      setOperando(false);
    }
  }

  const total = dados?.paginacao.total ?? 0;
  const totalPaginas = Math.max(1, dados?.paginacao.totalPaginas ?? 1);
  const tamanhoPagina = dados?.paginacao.tamanhoPagina ?? 50;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-slate-950/70"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !operando) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-itens-prateleira"
        className="flex h-full w-full max-w-5xl flex-col border-l border-slate-200 bg-slate-50 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <h2
              id="titulo-itens-prateleira"
              className="text-xl font-bold text-slate-900 dark:text-white"
            >
              {t("itemsTitle", { name: prateleira.nome })}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("itemCount", { count: total })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={operando}
            className={botaoSecundario}
          >
            {t("close")}
          </button>
        </header>

        {aviso && (
          <div
            role={aviso.erro ? "alert" : "status"}
            className={`mx-5 mt-4 rounded-xl border p-3 text-sm font-semibold ${
              aviso.erro
                ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
            }`}
          >
            {aviso.texto}
          </div>
        )}

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <label className="block">
            <span className="sr-only">{t("searchItems")}</span>
            <input
              type="search"
              maxLength={120}
              value={textoBusca}
              onChange={(evento) => setTextoBusca(evento.target.value)}
              placeholder={t("searchItems")}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </label>

          {carregando ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {t("itemsLoading")}
            </p>
          ) : erroCarregamento ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
            >
              <p>{t("itemsError")}</p>
              <button
                type="button"
                onClick={() => setVersao((atual) => atual + 1)}
                className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white"
              >
                {t("retry")}
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-base font-bold">
                  {t("linkedItems")}
                </h3>

                {dados?.itens.length ? (
                  <ul className="mt-4 space-y-3">
                    {dados.itens.map((vinculo, indice) => {
                      const posicao =
                        (pagina - 1) * tamanhoPagina + indice;

                      return (
                        <li
                          key={vinculo.id}
                          className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                        >
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {vinculo.item.titulo}
                          </p>
                          {vinculo.item.subtitulo && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                              {vinculo.item.subtitulo}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={operando || posicao === 0}
                              onClick={() =>
                                void mover(vinculo.id, posicao - 1)
                              }
                              className={botaoSecundario}
                              aria-label={`${t("moveUp")}: ${vinculo.item.titulo}`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={operando || posicao >= total - 1}
                              onClick={() =>
                                void mover(vinculo.id, posicao + 1)
                              }
                              className={botaoSecundario}
                              aria-label={`${t("moveDown")}: ${vinculo.item.titulo}`}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              disabled={operando}
                              onClick={() => setConfirmacao(vinculo)}
                              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-40 dark:border-red-800 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900"
                            >
                              {t("removeItem")}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                    {t("noLinked")}
                  </p>
                )}

                {total > tamanhoPagina && (
                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={operando || pagina <= 1}
                      onClick={() => setPagina((atual) => atual - 1)}
                      className={botaoSecundario}
                    >
                      {t("previous")}
                    </button>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t("pageOf", {
                        page: pagina,
                        total: totalPaginas,
                      })}
                    </span>
                    <button
                      type="button"
                      disabled={operando || pagina >= totalPaginas}
                      onClick={() => setPagina((atual) => atual + 1)}
                      className={botaoSecundario}
                    >
                      {t("next")}
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-base font-bold">
                  {t("availableItems")}
                </h3>

                {dados?.disponiveis.length ? (
                  <ul className="mt-4 space-y-3">
                    {dados.disponiveis.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.titulo}
                          </p>
                          {item.subtitulo && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                              {item.subtitulo}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={operando}
                          onClick={() => void adicionar(item.id)}
                          className="shrink-0 rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-40 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
                        >
                          {t("addItem")}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                    {t("noAvailable")}
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </aside>

      {confirmacao && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-remocao-prateleira"
            aria-describedby="descricao-remocao-prateleira"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <h3
              id="titulo-remocao-prateleira"
              className="text-lg font-bold"
            >
              {t("confirmRemoveTitle")}
            </h3>
            <p
              id="descricao-remocao-prateleira"
              className="mt-3 text-sm text-slate-700 dark:text-slate-200"
            >
              {t("confirmRemoveText", {
                title: confirmacao.item.titulo,
              })}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={operando}
                onClick={() => setConfirmacao(null)}
                className={botaoSecundario}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={operando}
                onClick={() => void remover()}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-40"
              >
                {t("confirmRemove")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}