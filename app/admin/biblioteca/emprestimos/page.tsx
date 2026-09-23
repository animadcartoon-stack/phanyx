"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Situacao =
  | "TODOS"
  | "ATIVOS"
  | "ATRASADOS"
  | "VENCENDO"
  | "DEVOLVIDOS"
  | "OCORRENCIAS";

type CondicaoDevolucao =
  | "NORMAL"
  | "DESGASTE"
  | "DANIFICADO"
  | "INCOMPLETO"
  | "PERDIDO";

type TipoAcao =
  | "RENOVAR"
  | "DEVOLVER";

type Emprestimo = {
  id: number;
  status: string;
  statusPersistido: string;
  statusEfetivo: string;

  emprestadoEm: string;
  vencimentoEm: string;
  devolvidoEm: string | null;

  quantidadeRenovacoes: number;

  devolucaoCondicao: string | null;

  diasAtrasoCalculado: number;
  diasAtrasoAtual: number;

  bloqueioGerado: boolean;
  multaGerada: boolean;

  valorMultaCalculado:
    | string
    | null;

  multaLancamentoFinanceiroId:
    | number
    | null;

  canceladoEm: string | null;
  motivoCancelamento: string | null;

  atrasado: boolean;
  vencendoEmBreve: boolean;

  usuario: {
    id: number;
    nome: string;
    email: string;
    role: string;
    ativo: boolean;
  };

  exemplar: {
    id: number;
    itemId: number;

    tipo: string;
    status: string;

    codigoInterno: string;
    codigoBarras: string | null;
    numeroTombo: string | null;
    patrimonio: string | null;

    unidadeSnapshot: string | null;
    setor: string | null;
    sala: string | null;
    estante: string | null;
    prateleira: string | null;
    localizacaoCompleta: string | null;

    item: {
      id: number;
      titulo: string;
      subtitulo: string | null;
      tipo: string;
      capaUrl: string | null;
      isbn10: string | null;
      isbn13: string | null;
    };
  };

  renovacoes: Array<{
    id: number;
    status: string;
    vencimentoAnterior: string;
    novoVencimento: string | null;
    solicitadaEm: string;
    analisadaEm: string | null;
  }>;
};

type RespostaAcao = {
  error?: string;
  mensagem?: string;
  codigo?: string;
  code?: string;
};

type Resposta = {
  filtros?: {
    situacao: Situacao;
    busca: string;
    pagina: number;
    porPagina: number;
    diasVencendoEmBreve: number;
  };

  resumo?: {
    total: number;
    ativos: number;
    atrasados: number;
    vencendo: number;
    devolvidos: number;
    ocorrencias: number;
  };

  paginacao?: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };

  contexto?: {
    impersonacao: boolean;
  };

  emprestimos?: Emprestimo[];

  error?: string;
  mensagem?: string;
};

const SITUACOES: Situacao[] = [
  "TODOS",
  "ATIVOS",
  "ATRASADOS",
  "VENCENDO",
  "DEVOLVIDOS",
  "OCORRENCIAS",
];

function classeStatus(
  status: string,
) {
  switch (status) {
    case "ATIVO":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";

    case "ATRASADO":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200";

    case "DEVOLVIDO":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

    case "DANIFICADO":
    case "PERDIDO":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";

    case "CANCELADO":
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";

    default:
      return "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
  }
}

export default function BibliotecaEmprestimosPage() {
  const t =
    useTranslations(
      "AdminLibraryLoans",
    );

  const locale =
    useLocale();

  const [situacao, setSituacao] =
    useState<Situacao>("TODOS");

  const [buscaDigitada, setBuscaDigitada] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const [pagina, setPagina] =
    useState(1);

  const [dados, setDados] =
    useState<Resposta | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState<string | null>(null);

  const [modalAcao, setModalAcao] =
    useState<{
      tipo: TipoAcao;
      emprestimo: Emprestimo;
    } | null>(null);

  const [
    condicaoDevolucao,
    setCondicaoDevolucao,
  ] =
    useState<CondicaoDevolucao>(
      "NORMAL",
    );

  const [
    observacaoAcao,
    setObservacaoAcao,
  ] = useState("");

  const [
    processandoAcao,
    setProcessandoAcao,
  ] = useState(false);

  const [toast, setToast] =
    useState<{
      tipo: "sucesso" | "erro";
      mensagem: string;
    } | null>(null);

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
              `/api/admin/biblioteca/emprestimos?${parametros.toString()}`,
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
            (await resposta.json()) as Resposta;

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
            erroAtual instanceof Error
              ? erroAtual.message
              : t("errors.load"),
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
        atual?.mensagem === mensagem
          ? null
          : atual,
      );
    }, 5_000);
  }

  function abrirAcao(
    tipo: TipoAcao,
    emprestimo: Emprestimo,
  ) {
    setModalAcao({
      tipo,
      emprestimo,
    });

    setCondicaoDevolucao(
      "NORMAL",
    );

    setObservacaoAcao("");
  }

  function fecharAcao() {
    if (processandoAcao) {
      return;
    }

    setModalAcao(null);
    setObservacaoAcao("");
    setCondicaoDevolucao(
      "NORMAL",
    );
  }

  function mensagemErroAcao(
    codigo:
      | string
      | undefined,
    tipo: TipoAcao,
  ) {
    switch (codigo) {
      case "OPERACAO_BLOQUEADA_EM_IMPERSONACAO":
        return t(
          "actions.errors.impersonation",
        );

      case "EMPRESTIMO_ATRASADO":
        return t(
          "actions.errors.overdue",
        );

      case "EMPRESTIMO_NAO_ATIVO":
        return t(
          "actions.errors.notActive",
        );

      case "RENOVACAO_DESABILITADA":
        return t(
          "actions.errors.renewalDisabled",
        );

      case "LIMITE_RENOVACOES_ATINGIDO":
        return t(
          "actions.errors.renewalLimit",
        );

      case "ITEM_COM_FILA_DE_RESERVA":
        return t(
          "actions.errors.reservationQueue",
        );

      case "CONDICAO_OBRIGATORIA":
      case "CONDICAO_INVALIDA":
        return t(
          "actions.errors.invalidCondition",
        );

      case "OBSERVACAO_INVALIDA":
      case "OBSERVACAO_MUITO_LONGA":
        return t(
          "actions.errors.invalidNotes",
        );

      default:
        return tipo === "RENOVAR"
          ? t(
              "actions.errors.renew",
            )
          : t(
              "actions.errors.return",
            );
    }
  }

  async function executarAcao(
    evento: FormEvent,
  ) {
    evento.preventDefault();

    if (!modalAcao) {
      return;
    }

    setProcessandoAcao(true);

    try {
      const emprestimo =
        modalAcao.emprestimo;

      const renovando =
        modalAcao.tipo ===
          "RENOVAR";

      const url = renovando
        ? "/api/admin/biblioteca/emprestimos/" +
          emprestimo.id +
          "/renovar"
        : "/api/admin/biblioteca/exemplares/" +
          emprestimo.exemplar.id +
          "/devolver";

      const observacao =
        observacaoAcao.trim();

      const corpo = renovando
        ? {
            observacao:
              observacao ||
              undefined,
          }
        : {
            condicao:
              condicaoDevolucao,
            observacaoDevolucao:
              observacao ||
              undefined,
          };

      const resposta =
        await fetch(url, {
          method: "POST",
          credentials:
            "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(
              corpo,
            ),
        });

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
            modalAcao.tipo,
          ),
        );
      }

      const mensagem =
        renovando
          ? t(
              "actions.renewSuccess",
            )
          : t(
              "actions.returnSuccess",
            );

      setModalAcao(null);
      setObservacaoAcao("");
      setCondicaoDevolucao(
        "NORMAL",
      );

      exibirToast(
        "sucesso",
        mensagem,
      );

      await carregar();
    } catch (erroAtual) {
      exibirToast(
        "erro",
        erroAtual instanceof Error
          ? erroAtual.message
          : modalAcao.tipo ===
              "RENOVAR"
            ? t(
                "actions.errors.renew",
              )
            : t(
                "actions.errors.return",
              ),
      );
    } finally {
      setProcessandoAcao(false);
    }
  }

  function formatarData(
    valor:
      | string
      | null
      | undefined,
  ) {
    if (!valor) {
      return String.fromCharCode(8212);
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime(),
      )
    ) {
      return String.fromCharCode(8212);
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    ).format(data);
  }

  function formatarNumero(
    valor:
      | string
      | null
      | undefined,
  ) {
    if (!valor) {
      return String.fromCharCode(8212);
    }

    const numero =
      Number(valor);

    if (
      !Number.isFinite(numero)
    ) {
      return valor;
    }

    return new Intl.NumberFormat(
      locale,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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

  const emprestimos =
    dados?.emprestimos || [];

  const contadorSituacao:
    Record<
      Situacao,
      number | undefined
    > = {
      TODOS: resumo?.total,
      ATIVOS: resumo?.ativos,
      ATRASADOS:
        resumo?.atrasados,
      VENCENDO:
        resumo?.vencendo,
      DEVOLVIDOS:
        resumo?.devolvidos,
      OCORRENCIAS:
        resumo?.ocorrencias,
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
                {t("description")}
              </p>
            </div>

            <Link
              href="/admin/biblioteca/acervo"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {String.fromCharCode(8592)} {t("backToCollection")}
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
            onSubmit={pesquisar}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <div className="flex-1">
              <label
                htmlFor="biblioteca-busca-emprestimos"
                className="mb-1.5 block text-sm font-bold"
              >
                {t("search.label")}
              </label>

              <input
                id="biblioteca-busca-emprestimos"
                value={
                  buscaDigitada
                }
                onChange={(evento) =>
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
                className="min-h-11 rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  carregando
                }
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
            <strong>
              {t(
                "errors.title",
              )}
            </strong>

            <p className="mt-1 text-sm">
              {erro}
            </p>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
            >
              {t("retry")}
            </button>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black">
                {t(
                  "list.title",
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {paginacao
                  ? t(
                      "list.resultCount",
                      {
                        count:
                          paginacao.total,
                      },
                    )
                  : t(
                      "list.loading",
                    )}
              </p>
            </div>

            {dados?.filtros ? (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t(
                  "list.dueSoonRule",
                  {
                    days:
                      dados.filtros
                        .diasVencendoEmBreve,
                  },
                )}
              </span>
            ) : null}
          </div>

          {carregando ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t("loading")}
            </div>
          ) : emprestimos.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-3xl">
                ??
              </div>

              <h3 className="mt-3 font-black">
                {t("empty.title")}
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "empty.description",
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        "table.loanDate",
                      )}
                    </th>

                    <th className="px-5 py-3">
                      {t(
                        "table.dueDate",
                      )}
                    </th>

                    <th className="px-5 py-3">
                      {t(
                        "table.renewals",
                      )}
                    </th>

                    <th className="px-5 py-3">
                      {t(
                        "table.status",
                      )}
                    </th>

                    <th className="px-5 py-3">
                      {t(
                        "table.fine",
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
                  {emprestimos.map(
                    (emprestimo) => (
                      <tr
                        key={
                          emprestimo.id
                        }
                        className="border-b border-slate-100 align-top transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-5 py-4">
                          <strong className="block max-w-[230px]">
                            {
                              emprestimo
                                .usuario
                                .nome
                            }
                          </strong>

                          <span className="mt-1 block max-w-[230px] truncate text-xs text-slate-500 dark:text-slate-400">
                            {
                              emprestimo
                                .usuario
                                .email
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <strong className="block max-w-[260px]">
                            {
                              emprestimo
                                .exemplar
                                .item
                                .titulo
                            }
                          </strong>

                          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            {
                              emprestimo
                                .exemplar
                                .codigoInterno
                            }

                            {emprestimo
                              .exemplar
                              .numeroTombo
                              ? ` ${String.fromCharCode(183)} ${t(
                                  "table.tomb",
                                )} ${emprestimo.exemplar.numeroTombo}`
                              : ""}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {formatarData(
                            emprestimo.emprestadoEm,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={
                              emprestimo.atrasado
                                ? "font-extrabold text-red-700 dark:text-red-300"
                                : emprestimo.vencendoEmBreve
                                  ? "font-extrabold text-amber-700 dark:text-amber-300"
                                  : ""
                            }
                          >
                            {formatarData(
                              emprestimo.vencimentoEm,
                            )}
                          </span>

                          {emprestimo.atrasado ? (
                            <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                              {t(
                                "table.daysOverdue",
                                {
                                  count:
                                    emprestimo.diasAtrasoAtual,
                                },
                              )}
                            </span>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 font-bold">
                          {
                            emprestimo.quantidadeRenovacoes
                          }
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold",
                              classeStatus(
                                emprestimo.statusEfetivo,
                              ),
                            ].join(
                              " ",
                            )}
                          >
                            {nomeStatus(
                              emprestimo.statusEfetivo,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {emprestimo.multaGerada ? (
                            <div>
                              <strong className="block">
                                {formatarNumero(
                                  emprestimo.valorMultaCalculado,
                                )}
                              </strong>

                              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                {t(
                                  "table.fineGenerated",
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              {String.fromCharCode(8212)}
                            </span>
                          )}
                        </td>

                        <td className="sticky right-0 z-10 min-w-[190px] border-l border-slate-200 bg-white px-5 py-4 text-right dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex flex-wrap justify-end gap-2">
                            {emprestimo.statusEfetivo ===
                            "ATIVO" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirAcao(
                                    "RENOVAR",
                                    emprestimo,
                                  )
                                }
                                disabled={
                                  processandoAcao ||
                                  dados?.contexto
                                    ?.impersonacao ===
                                    true
                                }
                                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-extrabold text-indigo-800 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/60"
                              >
                                {t(
                                  "actions.renewButton",
                                )}
                              </button>
                            ) : null}

                            {emprestimo.statusEfetivo ===
                              "ATIVO" ||
                            emprestimo.statusEfetivo ===
                              "ATRASADO" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirAcao(
                                    "DEVOLVER",
                                    emprestimo,
                                  )
                                }
                                disabled={
                                  processandoAcao ||
                                  dados?.contexto
                                    ?.impersonacao ===
                                    true
                                }
                                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
                              >
                                {t(
                                  "actions.returnButton",
                                )}
                              </button>
                            ) : null}

                            <Link
                              href={`/admin/biblioteca/acervo/${emprestimo.exemplar.itemId}`}
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
          )}

          {modalAcao ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
              onMouseDown={
                fecharAcao
              }
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="biblioteca-acao-titulo"
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
                    void executarAcao(
                      evento,
                    )
                  }
                >
                  <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                    <h2
                      id="biblioteca-acao-titulo"
                      className="text-xl font-black text-slate-950 dark:text-white"
                    >
                      {modalAcao.tipo ===
                      "RENOVAR"
                        ? t(
                            "actions.renewTitle",
                          )
                        : t(
                            "actions.returnTitle",
                          )}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {modalAcao.tipo ===
                      "RENOVAR"
                        ? t(
                            "actions.renewDescription",
                            {
                              item:
                                modalAcao
                                  .emprestimo
                                  .exemplar
                                  .item
                                  .titulo,
                              user:
                                modalAcao
                                  .emprestimo
                                  .usuario
                                  .nome,
                            },
                          )
                        : t(
                            "actions.returnDescription",
                            {
                              item:
                                modalAcao
                                  .emprestimo
                                  .exemplar
                                  .item
                                  .titulo,
                              user:
                                modalAcao
                                  .emprestimo
                                  .usuario
                                  .nome,
                            },
                          )}
                    </p>
                  </div>

                  <div className="grid gap-5 px-6 py-5">
                    {modalAcao.tipo ===
                    "DEVOLVER" ? (
                      <label className="grid gap-2">
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                          {t(
                            "actions.condition",
                          )}
                        </span>

                        <select
                          value={
                            condicaoDevolucao
                          }
                          onChange={(
                            evento,
                          ) =>
                            setCondicaoDevolucao(
                              evento
                                .target
                                .value as
                                CondicaoDevolucao,
                            )
                          }
                          disabled={
                            processandoAcao
                          }
                          className="min-h-11 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
                        >
                          <option value="NORMAL">
                            {t(
                              "actions.conditions.normal",
                            )}
                          </option>
                          <option value="DESGASTE">
                            {t(
                              "actions.conditions.wear",
                            )}
                          </option>
                          <option value="DANIFICADO">
                            {t(
                              "actions.conditions.damaged",
                            )}
                          </option>
                          <option value="INCOMPLETO">
                            {t(
                              "actions.conditions.incomplete",
                            )}
                          </option>
                          <option value="PERDIDO">
                            {t(
                              "actions.conditions.lost",
                            )}
                          </option>
                        </select>
                      </label>
                    ) : null}

                    <label className="grid gap-2">
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        {t(
                          "actions.notes",
                        )}
                      </span>

                      <textarea
                        value={
                          observacaoAcao
                        }
                        onChange={(
                          evento,
                        ) =>
                          setObservacaoAcao(
                            evento.target.value,
                          )
                        }
                        maxLength={5_000}
                        disabled={
                          processandoAcao
                        }
                        rows={4}
                        placeholder={
                          modalAcao.tipo ===
                          "RENOVAR"
                            ? t(
                                "actions.renewNotesPlaceholder",
                              )
                            : t(
                                "actions.returnNotesPlaceholder",
                              )
                        }
                        className="resize-y rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={
                        fecharAcao
                      }
                      disabled={
                        processandoAcao
                      }
                      className="min-h-11 rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      {t(
                        "actions.cancel",
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={
                        processandoAcao
                      }
                      className="min-h-11 rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processandoAcao
                        ? t(
                            "actions.processing",
                          )
                        : modalAcao.tipo ===
                            "RENOVAR"
                          ? t(
                              "actions.confirmRenew",
                            )
                          : t(
                              "actions.confirmReturn",
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
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "pagination.page",
                  {
                    page:
                      paginacao.pagina,
                    total:
                      paginacao.totalPaginas,
                  },
                )}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    paginacao.pagina <=
                      1 ||
                    carregando
                  }
                  onClick={() =>
                    setPagina(
                      Math.max(
                        1,
                        pagina - 1,
                      ),
                    )
                  }
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {t(
                    "pagination.previous",
                  )}
                </button>

                <button
                  type="button"
                  disabled={
                    paginacao.pagina >=
                      paginacao.totalPaginas ||
                    carregando
                  }
                  onClick={() =>
                    setPagina(
                      pagina + 1,
                    )
                  }
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
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
