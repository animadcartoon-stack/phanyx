"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import ResolverDivergenciaModal from "@/components/financeiro/ResolverDivergenciaModal";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Aba =
  | "AGUARDANDO_BAIXA"
  | "BAIXADO"
  | "DIVERGENCIA";

type Cobranca = {
  id: number;
  resolucaoDivergencia?: { tipo: string; saldoAposBaixa: number } | null;
  referenciaInterna: string;
  cobrancaExternaId?: string | null;
  provedor: string;
  tipo: string;

  statusBancario: string;
  statusOperacional: string;

  valorCobrado: number;
  valorCompensado?: number | null;

  vencimento: string;
  emitidoEm: string;
  pagoEm?: string | null;
  compensadoEm?: string | null;
  baixadoEm?: string | null;

  boletoUrl?: string | null;
  invoiceUrl?: string | null;

  baixadoPorUsuarioId?: number | null;
  baixadoPorNomeSnapshot?: string | null;

  contaFinanceira: {
    id: number;
    nome: string;
    provedor: string;
    bancoCodigo?: string | null;
    moeda: string;
  };

  aluno: {
    id: number;
    nome: string;
    cpf?: string | null;
    telefone?: string | null;

    user?: {
      email?: string | null;
    } | null;
  };

  matricula?: {
    id: number;
    numeroMatricula?: string | null;
    numeroMatriculaLegado?: string | null;

    curso?: {
      id: number;
      nome: string;
    } | null;
  } | null;

  lancamentoFinanceiro: {
    id: number;
    tipo: string;
    descricao?: string | null;
    status: string;

    valorOriginal: number;
    valorPago?: number | null;
    valorFinal?: number | null;

    vencimento?: string | null;
    pagoEm?: string | null;
  };
};

type Resumo = {
  AGUARDANDO_PAGAMENTO: number;
  AGUARDANDO_BAIXA: number;
  BAIXADO: number;
  DIVERGENCIA: number;
  CANCELADO: number;
};

type Paginacao = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

type RespostaCobrancas = {
  cobrancas: Cobranca[];
  resumo: Resumo;
  paginacao: Paginacao;
};

const resumoInicial: Resumo = {
  AGUARDANDO_PAGAMENTO: 0,
  AGUARDANDO_BAIXA: 0,
  BAIXADO: 0,
  DIVERGENCIA: 0,
  CANCELADO: 0,
};

function moedaSegura(
  locale: string,
  valor: number,
  moeda?: string | null
) {
  const currency =
    String(moeda || "BRL")
      .trim()
      .toUpperCase() || "BRL";

  try {
    return new Intl.NumberFormat(
      locale,
      {
        style: "currency",
        currency,
      }
    ).format(
      Number(valor || 0)
    );
  } catch {
    return new Intl.NumberFormat(
      locale,
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(
      Number(valor || 0)
    );
  }
}

function dataSegura(
  locale: string,
  valor?: string | null,
  comHora = false
) {
  if (!valor) {
    return "-";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "-";
  }

  return comHora
    ? new Intl.DateTimeFormat(
        locale,
        {
          dateStyle: "short",
          timeStyle: "short",
        }
      ).format(data)
    : new Intl.DateTimeFormat(
        locale
      ).format(data);
}

export default function BoletosCompensadosPage() {
  const td = useTranslations("AdminFinanceiroDivergencias");
  const [divergenciaId, setDivergenciaId] = useState<number | null>(null);
  const router =
    useRouter();

  const locale =
    useLocale();

  const t =
    useTranslations(
      "AdminFinanceiroBoletosCompensados"
    );

  const [
    aba,
    setAba,
  ] = useState<Aba>(
    "AGUARDANDO_BAIXA"
  );

  const [
    cobrancas,
    setCobrancas,
  ] = useState<Cobranca[]>([]);

  const [
    resumo,
    setResumo,
  ] = useState<Resumo>(
    resumoInicial
  );

  const [
    paginacao,
    setPaginacao,
  ] = useState<Paginacao>({
    pagina: 1,
    limite: 20,
    total: 0,
    totalPaginas: 1,
  });

  const [
    pagina,
    setPagina,
  ] = useState(1);

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    buscaAplicada,
    setBuscaAplicada,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const [
    selecionada,
    setSelecionada,
  ] = useState<Cobranca | null>(
    null
  );

  const [
    baixandoId,
    setBaixandoId,
  ] = useState<number | null>(
    null
  );

  const abas = useMemo(
    () => [
      {
        id:
          "AGUARDANDO_BAIXA" as const,
        label:
          t("tabs.awaiting"),
        total:
          resumo.AGUARDANDO_BAIXA,
      },
      {
        id:
          "BAIXADO" as const,
        label:
          t("tabs.settled"),
        total:
          resumo.BAIXADO,
      },
      {
        id:
          "DIVERGENCIA" as const,
        label:
          t("tabs.divergences"),
        total:
          resumo.DIVERGENCIA,
      },
    ],
    [
      resumo,
      t,
    ]
  );

  const carregar =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setErro("");

          const params =
            new URLSearchParams();

          params.set(
            "statusOperacional",
            aba
          );

          params.set(
            "pagina",
            String(pagina)
          );

          params.set(
            "limite",
            "20"
          );

          if (
            buscaAplicada.trim()
          ) {
            params.set(
              "busca",
              buscaAplicada.trim()
            );
          }

          const resposta =
            await fetch(
              `/api/admin/financeiro/cobrancas?${params.toString()}`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const dados =
            await resposta.json();

          if (!resposta.ok) {
            throw new Error(
              dados?.error ||
                t(
                  "messages.loadError"
                )
            );
          }

          const resultado =
            dados as RespostaCobrancas;

          setCobrancas(
            Array.isArray(
              resultado.cobrancas
            )
              ? resultado.cobrancas
              : []
          );

          setResumo({
            ...resumoInicial,
            ...(resultado.resumo ||
              {}),
          });

          setPaginacao(
            resultado.paginacao || {
              pagina,
              limite: 20,
              total: 0,
              totalPaginas: 1,
            }
          );
        } catch (error) {
          setCobrancas([]);

          setErro(
            error instanceof Error
              ? error.message
              : t(
                  "messages.loadError"
                )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        aba,
        pagina,
        buscaAplicada,
        t,
      ]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setPagina(1);
          setBuscaAplicada(
            busca.trim()
          );
        },
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [busca]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function mudarAba(
    novaAba: Aba
  ) {
    setAba(novaAba);
    setPagina(1);
    setErro("");
    setSucesso("");
    setSelecionada(null);
  }

  async function confirmarBaixa() {
    if (!selecionada) {
      return;
    }

    const cobrancaAtual =
      selecionada;

    try {
      setBaixandoId(
        cobrancaAtual.id
      );

      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          `/api/admin/financeiro/cobrancas/${cobrancaAtual.id}/baixar`,
          {
            method:
              "POST",

            credentials:
              "include",
          }
        );

      const dados =
        await resposta
          .json()
          .catch(() => ({}));

      if (
        !resposta.ok
      ) {
        if (
          resposta.status ===
            409 &&
          dados?.codigo ===
            "DIVERGENCIA_BOLETO_COMPENSADO"
        ) {
          setSelecionada(
            null
          );

          setAba(
            "DIVERGENCIA"
          );

          setPagina(1);

          setErro(
            t(
              "messages.divergence"
            )
          );

          return;
        }

        throw new Error(
          dados?.error ||
            t(
              "messages.settlementError"
            )
        );
      }

      setSelecionada(
        null
      );

      setSucesso(
        t(
          "messages.settlementSuccess"
        )
      );

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t(
              "messages.settlementError"
            )
      );
    } finally {
      setBaixandoId(
        null
      );
    }
  }

  function matriculaDaCobranca(
    cobranca: Cobranca
  ) {
    return (
      cobranca.matricula
        ?.numeroMatricula ||
      cobranca.matricula
        ?.numeroMatriculaLegado ||
      t(
        "labels.noEnrollment"
      )
    );
  }

  function valorPrincipal(
    cobranca: Cobranca
  ) {
    return (
      cobranca.valorCompensado ??
      cobranca.valorCobrado
    );
  }

  function moedaDaCobranca(
    cobranca: Cobranca
  ) {
    return moedaSegura(
      locale,
      valorPrincipal(
        cobranca
      ),
      cobranca.contaFinanceira
        ?.moeda
    );
  }

  function statusVisual(
    cobranca: Cobranca
  ) {
    if (
      cobranca.statusOperacional ===
      "BAIXADO"
    ) {
      return {
        label:
          t(
            "labels.settled"
          ),

        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
      };
    }

    if (
      cobranca.statusOperacional ===
      "DIVERGENCIA"
    ) {
      return {
        label:
          t(
            "labels.divergence"
          ),

        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
      };
    }

    return {
      label:
        t(
          "labels.compensated"
        ),

      className:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    };
  }

  const podeAnterior =
    paginacao.pagina > 1;

  const podeProxima =
    paginacao.pagina <
    paginacao.totalPaginas;

  return (
    <>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/financeiro"
                )
              }
              className="mb-3 text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
            >
              ← {t("back")}
            </button>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              {t("title")}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setErro("");
              setSucesso("");
              void carregar();
            }}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            ↻ {t("refresh")}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              mudarAba(
                "AGUARDANDO_BAIXA"
              )
            }
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${
              aba ===
              "AGUARDANDO_BAIXA"
                ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:ring-blue-950"
                : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t(
                "summary.awaiting"
              )}
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">
              {
                resumo.AGUARDANDO_BAIXA
              }
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              mudarAba(
                "BAIXADO"
              )
            }
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${
              aba === "BAIXADO"
                ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:ring-emerald-950"
                : "border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t(
                "summary.settled"
              )}
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {
                resumo.BAIXADO
              }
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              mudarAba(
                "DIVERGENCIA"
              )
            }
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${
              aba ===
              "DIVERGENCIA"
                ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:ring-amber-950"
                : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t(
                "summary.divergences"
              )}
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">
              {
                resumo.DIVERGENCIA
              }
            </p>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(
                event.target.value
              )
            }
            placeholder={t(
              "searchPlaceholder"
            )}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-950"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px dark:border-slate-800">
          {abas.map(
            (item) => (
              <button
                key={
                  item.id
                }
                type="button"
                onClick={() =>
                  mudarAba(
                    item.id
                  )
                }
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  aba === item.id
                    ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                {
                  item.label
                }

                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {
                    item.total
                  }
                </span>
              </button>
            )
          )}
        </div>

        {erro && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {sucesso}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t(
                "messages.loading"
              )}
            </div>
          ) : cobrancas.length ===
            0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t(
                "messages.empty"
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950/70">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    {[
                      t(
                        "table.student"
                      ),
                      t(
                        "table.enrollment"
                      ),
                      t(
                        "table.charge"
                      ),
                      t(
                        "table.dueDate"
                      ),
                      t(
                        "table.value"
                      ),
                      t(
                        "table.account"
                      ),
                      t(
                        "table.status"
                      ),
                      t(
                        "table.action"
                      ),
                    ].map(
                      (
                        titulo
                      ) => (
                        <th
                          key={
                            titulo
                          }
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                        >
                          {
                            titulo
                          }
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {cobrancas.map(
                    (
                      cobranca
                    ) => {
                      const status =
                        statusVisual(
                          cobranca
                        );

                      const linkBoleto =
                        cobranca.boletoUrl ||
                        cobranca.invoiceUrl;

                      return (
                        <tr
                          key={
                            cobranca.id
                          }
                          className="border-b border-slate-100 align-top last:border-b-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {
                                cobranca
                                  .aluno
                                  .nome
                              }
                            </p>

                            {cobranca
                              .aluno
                              .user
                              ?.email && (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {
                                  cobranca
                                    .aluno
                                    .user
                                    .email
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {
                                matriculaDaCobranca(
                                  cobranca
                                )
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {
                                cobranca
                                  .matricula
                                  ?.curso
                                  ?.nome ||
                                t(
                                  "labels.notProvided"
                                )
                              }
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <p className="max-w-[240px] font-medium text-slate-800 dark:text-slate-200">
                              {cobranca
                                .lancamentoFinanceiro
                                .descricao ||
                                cobranca
                                  .lancamentoFinanceiro
                                  .tipo}
                            </p>

                            <p className="mt-1 max-w-[240px] break-all font-mono text-[11px] text-slate-400 dark:text-slate-500">
                              {
                                cobranca.referenciaInterna
                              }
                            </p>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                            {dataSegura(
                              locale,
                              cobranca.vencimento
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {
                                moedaDaCobranca(
                                  cobranca
                                )
                              }
                            </p>

                            <div className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                              <p>
                                {t(
                                  "labels.charged"
                                )}
                                :{" "}
                                {moedaSegura(
                                  locale,
                                  cobranca.valorCobrado,
                                  cobranca
                                    .contaFinanceira
                                    .moeda
                                )}
                              </p>

                              {cobranca.valorCompensado !==
                                null &&
                                cobranca.valorCompensado !==
                                  undefined && (
                                  <p>
                                    {t(
                                      "labels.received"
                                    )}
                                    :{" "}
                                    {moedaSegura(
                                      locale,
                                      cobranca.valorCompensado,
                                      cobranca
                                        .contaFinanceira
                                        .moeda
                                    )}
                                  </p>
                                )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {
                                cobranca
                                  .contaFinanceira
                                  .nome
                              }
                            </p>

                            <p className="mt-1 text-xs uppercase text-slate-500 dark:text-slate-400">
                              {
                                cobranca
                                  .contaFinanceira
                                  .provedor
                              }
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
                            >
                              {
                                status.label
                              }
                            </span>

                            {cobranca.compensadoEm && (
                              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {t(
                                  "labels.compensatedAt"
                                )}
                                :{" "}
                                {dataSegura(
                                  locale,
                                  cobranca.compensadoEm,
                                  true
                                )}
                              </p>
                            )}

                            {cobranca.baixadoEm && (
                              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {t(
                                  "labels.settledAt"
                                )}
                                :{" "}
                                {dataSegura(
                                  locale,
                                  cobranca.baixadoEm,
                                  true
                                )}
                              </p>
                            )}

                            {cobranca.baixadoPorNomeSnapshot && (
                              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {t(
                                  "labels.settledBy"
                                )}
                                :{" "}
                                {
                                  cobranca.baixadoPorNomeSnapshot
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex min-w-[130px] flex-col gap-2">
                              {cobranca.statusOperacional === "DIVERGENCIA" && (
                                <button type="button" onClick={() => setDivergenciaId(cobranca.id)} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                  {td("resolve")}
                                </button>
                              )}
                              {cobranca.statusBancario ===
                                "COMPENSADO" &&
                                cobranca.statusOperacional ===
                                "AGUARDANDO_BAIXA" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelecionada(
                                      cobranca
                                    )
                                  }
                                  disabled={
                                    baixandoId ===
                                    cobranca.id
                                  }
                                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {baixandoId ===
                                  cobranca.id
                                    ? t(
                                        "buttons.settling"
                                      )
                                    : t(
                                        "buttons.settle"
                                      )}
                                </button>
                              )}

                              {linkBoleto && (
                                <a
                                  href={
                                    linkBoleto
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  {t(
                                    "buttons.viewBoleto"
                                  )}
                                </a>
                              )}

                              {cobranca.statusOperacional !==
                                "AGUARDANDO_BAIXA" &&
                                !linkBoleto && (
                                  <span className="text-xs text-slate-400">
                                    —
                                  </span>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading &&
            paginacao.total >
              0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "messages.page",
                    {
                      current:
                        paginacao.pagina,
                      total:
                        paginacao.totalPaginas,
                    }
                  )}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      !podeAnterior ||
                      loading
                    }
                    onClick={() =>
                      setPagina(
                        (
                          atual
                        ) =>
                          Math.max(
                            1,
                            atual -
                              1
                          )
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t(
                      "buttons.previous"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={
                      !podeProxima ||
                      loading
                    }
                    onClick={() =>
                      setPagina(
                        (
                          atual
                        ) =>
                          Math.min(
                            paginacao.totalPaginas,
                            atual +
                              1
                          )
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t(
                      "buttons.next"
                    )}
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {divergenciaId !== null && <ResolverDivergenciaModal cobrancaId={divergenciaId} onFechar={() => setDivergenciaId(null)} onResolvida={async () => {
        setDivergenciaId(null);
        setSucesso(td("success"));
        setAba("AGUARDANDO_BAIXA");
        setPagina(1);
      }} />}

      {selecionada && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              baixandoId === null
            ) {
              setSelecionada(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-baixa-boleto-titulo"
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            {selecionada.resolucaoDivergencia?.tipo === "PARCIAL" && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{td("partialSettlementNotice", { balance: moedaSegura(locale, selecionada.resolucaoDivergencia.saldoAposBaixa, selecionada.contaFinanceira.moeda) })}</p>}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                PHANYX Financeiro
              </p>

              <h2
                id="modal-baixa-boleto-titulo"
                className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100"
              >
                {t(
                  "modal.title"
                )}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(
                  "modal.description"
                )}
              </p>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "modal.student"
                  )}
                </span>

                <span className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {
                    selecionada
                      .aluno
                      .nome
                  }
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "modal.dueDate"
                  )}
                </span>

                <span className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {dataSegura(
                    locale,
                    selecionada.vencimento
                  )}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t(
                      "modal.compensatedValue"
                    )}
                  </span>

                  <span className="text-right text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {moedaSegura(
                      locale,
                      selecionada
                        .valorCompensado ??
                        selecionada
                          .valorCobrado,
                      selecionada
                        .contaFinanceira
                        .moeda
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setSelecionada(
                    null
                  )
                }
                disabled={
                  baixandoId !==
                  null
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "buttons.cancel"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  void confirmarBaixa()
                }
                disabled={
                  baixandoId !==
                  null
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {baixandoId ===
                selecionada.id
                  ? t(
                      "buttons.settling"
                    )
                  : t(
                      "buttons.confirm"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
