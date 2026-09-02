"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Tema = "light" | "dark" | "system";
type ModoTema = "light" | "dark" | "system-dark";

type EtapaFunil = {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string;
  resultado: string;
  ordem: number;
  cor: string;
  probabilidadeConversao: number;
  prazoMaximoHoras: number | null;
  exigeProximaAcao: boolean;
  exigeMotivoPerda: boolean;
  permiteMovimentoManual: boolean;
  visivelNoKanban: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  arquivadoEm: string | null;
};

type FunilComercial = {
  id: number;
  nome: string;
  descricao: string | null;
  padrao: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  arquivadoEm: string | null;
  etapas: EtapaFunil[];
};

type MotivoPerda = {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string;
  exigeObservacao: boolean;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  arquivadoEm: string | null;
};

type RespostaFunis = {
  success: boolean;
  error?: string;
  permissoes: {
    podeVer: boolean;
    podeGerenciar: boolean;
  };
  configuracao: {
    estruturaConfigurada: boolean;
    funilPadraoId: number | null;
    quantidadeFunis: number;
    quantidadeEtapas: number;
    quantidadeMotivosPerda: number;
    totalLeads: number;
    leadsSemEstrutura: number;
  };
  funis: FunilComercial[];
  motivosPerda: MotivoPerda[];
};

type Toast = {
  tipo: "sucesso" | "erro";
  mensagem: string;
};

const CATEGORIAS_ETAPA: Record<string, string> = {
  ENTRADA: "entry",
  PRIMEIRO_CONTATO: "firstContact",
  EM_ATENDIMENTO: "inService",
  QUALIFICACAO: "qualification",
  APRESENTACAO: "presentation",
  PROPOSTA: "proposal",
  NEGOCIACAO: "negotiation",
  DOCUMENTACAO: "documentation",
  PAGAMENTO: "payment",
  CONVERSAO: "conversion",
  PERDA: "loss",
  PAUSA: "pause",
  DESCARTE: "discard",
};

const RESULTADOS_ETAPA: Record<string, string> = {
  ABERTA: "open",
  GANHA: "won",
  PERDIDA: "lost",
  DESCARTADA: "discarded",
};

const CATEGORIAS_PERDA: Record<string, string> = {
  SEM_INTERESSE: "noInterest",
  PRECO: "price",
  CONCORRENCIA: "competition",
  SEM_CONTATO: "noContact",
  CURSO_INDISPONIVEL: "courseUnavailable",
  HORARIO_INCOMPATIVEL: "scheduleConflict",
  LOCALIZACAO: "location",
  DOCUMENTACAO: "documentation",
  FINANCEIRO: "financial",
  DESISTENCIA: "withdrawal",
  DUPLICIDADE: "duplicate",
  FORA_DO_PERFIL: "outOfProfile",
  OUTRO: "other",
};

function useModoTema(): ModoTema {
  const [modoTema, setModoTema] =
    useState<ModoTema>("light");

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    function atualizarTema() {
      const escolha = (
        localStorage.getItem("phanyx_tema") ||
        document.documentElement.dataset.themeChoice ||
        "system"
      ) as Tema;

      if (escolha === "dark") {
        setModoTema("dark");
        return;
      }

      if (escolha === "system" && media.matches) {
        setModoTema("system-dark");
        return;
      }

      setModoTema("light");
    }

    atualizarTema();

    window.addEventListener("storage", atualizarTema);
    window.addEventListener(
      "phanyx-theme-change",
      atualizarTema as EventListener
    );
    media.addEventListener("change", atualizarTema);

    const observador = new MutationObserver(atualizarTema);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-theme",
        "data-theme-choice",
        "class",
      ],
    });

    return () => {
      window.removeEventListener("storage", atualizarTema);
      window.removeEventListener(
        "phanyx-theme-change",
        atualizarTema as EventListener
      );
      media.removeEventListener("change", atualizarTema);
      observador.disconnect();
    };
  }, []);

  return modoTema;
}

export default function FunisComerciaisPage() {
  const t = useTranslations("AdminCommercialFunnels");
  const locale = useLocale();
  const modoTema = useModoTema();

  const [dados, setDados] =
    useState<RespostaFunis | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [inicializando, setInicializando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [toast, setToast] =
    useState<Toast | null>(null);

  const c = useMemo(() => {
    if (modoTema === "dark") {
      return {
        pagina: "text-blue-50",
        card: "border-blue-900 bg-blue-950/55",
        soft: "border-blue-900 bg-blue-950/35",
        softStrong:
          "border-blue-800 bg-blue-950/70",
        titulo: "text-white",
        texto: "text-blue-100/80",
        muted: "text-blue-200/60",
        button:
          "border-blue-800 bg-blue-950/55 text-blue-100 hover:bg-blue-900",
        badge:
          "border-blue-800 bg-blue-950/70 text-blue-100",
        divider: "border-blue-900",
      };
    }

    if (modoTema === "system-dark") {
      return {
        pagina: "text-neutral-100",
        card: "border-neutral-700 bg-neutral-900",
        soft: "border-neutral-700 bg-neutral-800/70",
        softStrong:
          "border-neutral-600 bg-neutral-800",
        titulo: "text-white",
        texto: "text-neutral-300",
        muted: "text-neutral-400",
        button:
          "border-neutral-600 bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
        badge:
          "border-neutral-600 bg-neutral-800 text-neutral-200",
        divider: "border-neutral-700",
      };
    }

    return {
      pagina: "text-slate-900",
      card: "border-slate-200 bg-white",
      soft: "border-slate-200 bg-slate-50",
      softStrong:
        "border-slate-300 bg-white",
      titulo: "text-slate-950",
      texto: "text-slate-600",
      muted: "text-slate-500",
      button:
        "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
      badge:
        "border-slate-300 bg-white text-slate-700",
      divider: "border-slate-200",
    };
  }, [modoTema]);

  const exibirToast = useCallback(
    (
      tipo: Toast["tipo"],
      mensagem: string
    ) => {
      setToast({
        tipo,
        mensagem,
      });
    },
    []
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        setToast(null);
      }, 5000);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [toast]);

  const carregarFunis =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch(
          "/api/admin/comercial/funis",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const payload = (await resposta
          .json()
          .catch(() => null)) as
          | RespostaFunis
          | null;

        if (
          !resposta.ok ||
          !payload?.success
        ) {
          throw new Error(
            payload?.error ??
              t("errors.load")
          );
        }

        setDados(payload);
      } catch (error: unknown) {
        const mensagem =
          error instanceof Error
            ? error.message
            : t("errors.load");

        setErro(mensagem);
      } finally {
        setCarregando(false);
      }
    }, [t]);

  useEffect(() => {
    void carregarFunis();
  }, [carregarFunis]);

  async function inicializarEstrutura() {
    try {
      setInicializando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/comercial/funis/inicializar",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const payload = (await resposta
        .json()
        .catch(() => null)) as
        | {
            success?: boolean;
            mensagem?: string;
            error?: string;
          }
        | null;

      if (
        !resposta.ok ||
        !payload?.success
      ) {
        throw new Error(
          payload?.error ??
            t("errors.initialize")
        );
      }

      exibirToast(
        "sucesso",
        payload.mensagem ??
          t("success.initialized")
      );

      await carregarFunis();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t("errors.initialize");

      setErro(mensagem);
      exibirToast("erro", mensagem);
    } finally {
      setInicializando(false);
    }
  }

  function formatarPrazo(
    horas: number | null
  ) {
    if (horas === null) {
      return t("common.noMaximumDeadline");
    }

    if (horas < 24) {
      return t("common.hours", {
        count: horas,
      });
    }

    const dias = horas / 24;

    if (Number.isInteger(dias)) {
      return t("common.days", {
        count: dias,
      });
    }

    return t("common.hours", {
      count: horas,
    });
  }

  function formatarData(valor: string) {
    const data = new Date(valor);

    if (
      Number.isNaN(data.getTime())
    ) {
      return t("common.dateUnavailable");
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(data);
  }

  function categoriaEtapa(
    valor: string
  ) {
    const chave =
      CATEGORIAS_ETAPA[valor];

    return chave
      ? t(`stageCategories.${chave}`)
      : valor;
  }

  function resultadoEtapa(
    valor: string
  ) {
    const chave =
      RESULTADOS_ETAPA[valor];

    return chave
      ? t(`stageResults.${chave}`)
      : valor;
  }

  function categoriaPerda(
    valor: string
  ) {
    const chave =
      CATEGORIAS_PERDA[valor];

    return chave
      ? t(`lossCategories.${chave}`)
      : valor;
  }

  const configuracao =
    dados?.configuracao;

  const podeGerenciar =
    dados?.permissoes
      .podeGerenciar ?? false;

  const textoBotaoInicializacao =
    !configuracao?.estruturaConfigurada
      ? t("actions.createStructure")
      : configuracao.leadsSemEstrutura >
          0
        ? t(
            "actions.linkPendingLeads"
          )
        : t("actions.checkStructure");

  const cardsResumo = dados
    ? [
        {
          titulo: t(
            "summary.status.title"
          ),
          valor:
            configuracao?.estruturaConfigurada
              ? t(
                  "summary.status.configured"
                )
              : t(
                  "summary.status.pending"
                ),
          detalhe:
            configuracao?.estruturaConfigurada
              ? t(
                  "summary.status.available"
                )
              : t(
                  "summary.status.initializationRequired"
                ),
          icone:
            configuracao?.estruturaConfigurada
              ? "✅"
              : "⚠️",
        },
        {
          titulo: t(
            "summary.funnels.title"
          ),
          valor:
            configuracao?.quantidadeFunis ??
            0,
          detalhe: t(
            "summary.funnels.description"
          ),
          icone: "🧭",
        },
        {
          titulo: t(
            "summary.stages.title"
          ),
          valor:
            configuracao?.quantidadeEtapas ??
            0,
          detalhe: t(
            "summary.stages.description"
          ),
          icone: "📊",
        },
        {
          titulo: t(
            "summary.lossReasons.title"
          ),
          valor:
            configuracao?.quantidadeMotivosPerda ??
            0,
          detalhe: t(
            "summary.lossReasons.description"
          ),
          icone: "📋",
        },
        {
          titulo: t(
            "summary.pendingLeads.title"
          ),
          valor:
            configuracao?.leadsSemEstrutura ??
            0,
          detalhe: t(
            "summary.pendingLeads.description",
            {
              count:
                configuracao?.totalLeads ??
                0,
            }
          ),
          icone: "🎯",
        },
      ]
    : [];

  return (
    <div
      className={`phanyx-funis-comerciais-page mx-auto max-w-7xl space-y-6 p-4 sm:p-6 ${c.pagina}`}
    >
      {toast ? (
        <div
          aria-live="polite"
          className={`fixed right-4 top-4 z-50 max-w-md rounded-2xl border px-5 py-4 text-sm font-semibold shadow-xl ${
            toast.tipo === "sucesso"
              ? modoTema === "light"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-emerald-800 bg-emerald-950/45 text-emerald-100"
              : modoTema === "light"
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-red-800 bg-red-950/45 text-red-100"
          }`}
        >
          <div className="flex items-start gap-3">
            <span>
              {toast.tipo === "sucesso"
                ? "✅"
                : "⚠️"}
            </span>

            <span>
              {toast.mensagem}
            </span>

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
              className="ml-auto rounded-lg px-2 py-1 opacity-70 transition hover:opacity-100"
              aria-label={t(
                "actions.closeMessage"
              )}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <header
        className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${c.card}`}
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div
              className={`mb-3 flex flex-wrap items-center gap-2 text-sm ${c.muted}`}
            >
              <Link
                href="/admin/comercial"
                className={`font-semibold transition hover:opacity-80 ${c.texto}`}
              >
                {t(
                  "breadcrumb.commercial"
                )}
              </Link>

              <span>/</span>

              <span
                className={`font-semibold ${c.titulo}`}
              >
                {t(
                  "breadcrumb.salesFunnels"
                )}
              </span>
            </div>

            <h1
              className={`text-2xl font-black sm:text-3xl ${c.titulo}`}
            >
              {t("header.title")}
            </h1>

            <p
              className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
            >
              {t("header.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void carregarFunis()
              }
              disabled={
                carregando ||
                inicializando
              }
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${c.button}`}
            >
              {carregando
                ? t(
                    "actions.refreshing"
                  )
                : t("actions.refresh")}
            </button>

            {podeGerenciar ? (
              <button
                type="button"
                onClick={() =>
                  void inicializarEstrutura()
                }
                disabled={
                  carregando ||
                  inicializando
                }
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {inicializando
                  ? t(
                      "actions.processing"
                    )
                  : textoBotaoInicializacao}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {erro ? (
        <section
          className={
            modoTema === "light"
              ? "rounded-2xl border border-red-300 bg-red-50 p-5 text-red-900"
              : "rounded-2xl border border-red-800 bg-red-950/45 p-5 text-red-100"
          }
        >
          <h2 className="font-black">
            {t("errors.operationTitle")}
          </h2>

          <p className="mt-1 text-sm">
            {erro}
          </p>

          <button
            type="button"
            onClick={() =>
              void carregarFunis()
            }
            className={`mt-4 rounded-xl border px-4 py-2 text-sm font-bold transition ${c.button}`}
          >
            {t("actions.tryAgain")}
          </button>
        </section>
      ) : null}

      {carregando && !dados ? (
        <section
          className={`rounded-3xl border p-8 text-center shadow-sm ${c.card}`}
        >
          <div className="text-3xl">
            ⏳
          </div>

          <p
            className={`mt-3 font-bold ${c.titulo}`}
          >
            {t("states.loading")}
          </p>
        </section>
      ) : null}

      {dados ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cardsResumo.map(
              (card) => (
                <article
                  key={card.titulo}
                  className={`rounded-2xl border p-5 shadow-sm ${c.card}`}
                >
                  <div
                    className={`flex min-w-0 items-center gap-3 ${
                      card.titulo ===
                      t(
                        "summary.status.title"
                      )
                        ? ""
                        : "justify-between"
                    }`}
                  >
                    <span className="shrink-0 text-2xl">
                      {card.icone}
                    </span>

                    <span
                      className={`min-w-0 font-black ${c.titulo} ${
                        card.titulo ===
                        t(
                          "summary.status.title"
                        )
                          ? "whitespace-nowrap text-lg"
                          : "text-2xl"
                      }`}
                    >
                      {card.valor}
                    </span>
                  </div>

                  <h2
                    className={`mt-4 font-black ${c.titulo}`}
                  >
                    {card.titulo}
                  </h2>

                  <p
                    className={`mt-1 text-xs leading-5 ${c.muted}`}
                  >
                    {card.detalhe}
                  </p>
                </article>
              )
            )}
          </section>

          {!configuracao?.estruturaConfigurada ? (
            <section
              className={`rounded-3xl border border-l-4 border-l-amber-500 p-6 shadow-sm ${c.card}`}
            >
              <h2
                className={`text-lg font-black ${c.titulo}`}
              >
                {t(
                  "initialization.title"
                )}
              </h2>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
              >
                {t(
                  "initialization.description"
                )}
              </p>

              {podeGerenciar ? (
                <button
                  type="button"
                  onClick={() =>
                    void inicializarEstrutura()
                  }
                  disabled={
                    inicializando
                  }
                  className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-400"
                >
                  {inicializando
                    ? t(
                        "actions.initializing"
                      )
                    : t(
                        "actions.initializeNow"
                      )}
                </button>
              ) : (
                <p
                  className={`mt-4 text-sm font-bold ${
                    modoTema ===
                    "light"
                      ? "text-amber-950"
                      : "text-amber-200"
                  }`}
                >
                  {t(
                    "initialization.noPermission"
                  )}
                </p>
              )}
            </section>
          ) : null}

          <section className="space-y-5">
            {dados.funis.map(
              (funil) => (
                <article
                  key={funil.id}
                  className={`overflow-hidden rounded-3xl border shadow-sm ${c.card}`}
                >
                  <div
                    className={`border-b p-5 sm:p-6 ${c.divider}`}
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2
                            className={`text-xl font-black ${c.titulo}`}
                          >
                            {funil.nome}
                          </h2>

                          {funil.padrao ? (
                            <span
                              className={
                                modoTema ===
                                "light"
                                  ? "rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                                  : "rounded-full border border-emerald-800 bg-emerald-950/45 px-3 py-1 text-xs font-bold text-emerald-200"
                              }
                            >
                              {t(
                                "funnel.default"
                              )}
                            </span>
                          ) : null}

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              funil.ativo
                                ? c.badge
                                : modoTema ===
                                  "light"
                                  ? "border-red-300 bg-red-50 text-red-800"
                                  : "border-red-800 bg-red-950/45 text-red-200"
                            }`}
                          >
                            {funil.ativo
                              ? t(
                                  "common.active"
                                )
                              : t(
                                  "common.archived"
                                )}
                          </span>
                        </div>

                        {funil.descricao ? (
                          <p
                            className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
                          >
                            {
                              funil.descricao
                            }
                          </p>
                        ) : null}
                      </div>

                      <div
                        className={`text-xs ${c.muted}`}
                      >
                        {t(
                          "funnel.updatedAt",
                          {
                            date: formatarData(
                              funil.atualizadoEm
                            ),
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3
                          className={`font-black ${c.titulo}`}
                        >
                          {t(
                            "stages.title"
                          )}
                        </h3>

                        <p
                          className={`mt-1 text-xs ${c.muted}`}
                        >
                          {t(
                            "stages.count",
                            {
                              count:
                                funil
                                  .etapas
                                  .length,
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {funil.etapas.map(
                        (etapa) => (
                          <div
                            key={
                              etapa.id
                            }
                            className={`rounded-2xl border p-4 ${c.soft}`}
                          >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                              <div className="flex min-w-0 flex-1 items-start gap-4">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${c.softStrong} ${c.titulo}`}
                                >
                                  {
                                    etapa.ordem
                                  }
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className="h-3 w-3 rounded-full ring-2 ring-white"
                                      style={{
                                        backgroundColor:
                                          etapa.cor,
                                      }}
                                    />

                                    <h4
                                      className={`font-black ${c.titulo}`}
                                    >
                                      {
                                        etapa.nome
                                      }
                                    </h4>

                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${c.badge}`}
                                    >
                                      {categoriaEtapa(
                                        etapa.categoria
                                      )}
                                    </span>

                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${c.badge}`}
                                    >
                                      {resultadoEtapa(
                                        etapa.resultado
                                      )}
                                    </span>
                                  </div>

                                  {etapa.descricao ? (
                                    <p
                                      className={`mt-2 text-xs leading-5 ${c.muted}`}
                                    >
                                      {
                                        etapa.descricao
                                      }
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
                                <div
                                  className={`rounded-xl border px-3 py-2 ${c.softStrong}`}
                                >
                                  <div
                                    className={`text-[10px] font-bold uppercase ${c.muted}`}
                                  >
                                    {t(
                                      "stageMetrics.conversion"
                                    )}
                                  </div>

                                  <div
                                    className={`mt-1 text-sm font-black ${c.titulo}`}
                                  >
                                    {
                                      etapa.probabilidadeConversao
                                    }
                                    %
                                  </div>
                                </div>

                                <div
                                  className={`rounded-xl border px-3 py-2 ${c.softStrong}`}
                                >
                                  <div
                                    className={`text-[10px] font-bold uppercase ${c.muted}`}
                                  >
                                    {t(
                                      "stageMetrics.deadline"
                                    )}
                                  </div>

                                  <div
                                    className={`mt-1 text-sm font-black ${c.titulo}`}
                                  >
                                    {formatarPrazo(
                                      etapa.prazoMaximoHoras
                                    )}
                                  </div>
                                </div>

                                <div
                                  className={`rounded-xl border px-3 py-2 ${c.softStrong}`}
                                >
                                  <div
                                    className={`text-[10px] font-bold uppercase ${c.muted}`}
                                  >
                                    {t(
                                      "stageMetrics.nextAction"
                                    )}
                                  </div>

                                  <div
                                    className={`mt-1 text-sm font-black ${c.titulo}`}
                                  >
                                    {etapa.exigeProximaAcao
                                      ? t(
                                          "common.required"
                                        )
                                      : t(
                                          "common.optional"
                                        )}
                                  </div>
                                </div>

                                <div
                                  className={`rounded-xl border px-3 py-2 ${c.softStrong}`}
                                >
                                  <div
                                    className={`text-[10px] font-bold uppercase ${c.muted}`}
                                  >
                                    {t(
                                      "stageMetrics.movement"
                                    )}
                                  </div>

                                  <div
                                    className={`mt-1 text-sm font-black ${c.titulo}`}
                                  >
                                    {etapa.permiteMovimentoManual
                                      ? t(
                                          "common.manual"
                                        )
                                      : t(
                                          "common.automatic"
                                        )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}

                      {funil.etapas.length ===
                      0 ? (
                        <div
                          className={`rounded-2xl border border-dashed p-6 text-center text-sm ${c.muted}`}
                        >
                          {t(
                            "stages.empty"
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            )}

            {dados.funis.length ===
            0 ? (
              <div
                className={`rounded-3xl border border-dashed p-8 text-center ${c.card}`}
              >
                <div className="text-4xl">
                  🧭
                </div>

                <h2
                  className={`mt-3 font-black ${c.titulo}`}
                >
                  {t(
                    "emptyFunnels.title"
                  )}
                </h2>

                <p
                  className={`mt-2 text-sm ${c.muted}`}
                >
                  {t(
                    "emptyFunnels.description"
                  )}
                </p>
              </div>
            ) : null}
          </section>

          <section
            className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
          >
            <div>
              <h2
                className={`text-xl font-black ${c.titulo}`}
              >
                {t("lossReasons.title")}
              </h2>

              <p
                className={`mt-1 text-sm ${c.muted}`}
              >
                {t(
                  "lossReasons.description"
                )}
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dados.motivosPerda.map(
                (motivo) => (
                  <article
                    key={
                      motivo.id
                    }
                    className={`rounded-2xl border p-4 ${c.soft}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          className={`font-black ${c.titulo}`}
                        >
                          {motivo.nome}
                        </h3>

                        <p
                          className={`mt-1 text-xs ${c.muted}`}
                        >
                          {categoriaPerda(
                            motivo.categoria
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${c.badge}`}
                      >
                        {motivo.ativo
                          ? t(
                              "common.active"
                            )
                          : t(
                              "common.archived"
                            )}
                      </span>
                    </div>

                    {motivo.exigeObservacao ? (
                      <p
                        className={
                          modoTema ===
                          "light"
                            ? "mt-3 text-xs font-bold text-amber-800"
                            : "mt-3 text-xs font-bold text-amber-200"
                        }
                      >
                        {t(
                          "lossReasons.requiresObservation"
                        )}
                      </p>
                    ) : null}
                  </article>
                )
              )}

              {dados.motivosPerda
                .length === 0 ? (
                <div
                  className={`rounded-2xl border border-dashed p-6 text-sm ${c.muted}`}
                >
                  {t(
                    "lossReasons.empty"
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}