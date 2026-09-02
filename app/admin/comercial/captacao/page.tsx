"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Tema =
  | "light"
  | "dark"
  | "system";

type Permissoes = {
  podeVer: boolean;

  podeVerCanais: boolean;
  podeGerenciarCanais: boolean;

  podeVerCampanhas: boolean;
  podeGerenciarCampanhas: boolean;

  podeVerFormularios: boolean;
  podeGerenciarFormularios: boolean;

  podeVerSubmissoes: boolean;
  podeReprocessarSubmissoes:
    boolean;

  podeVerDistribuicao: boolean;
  podeGerenciarDistribuicao:
    boolean;

  podeVerIntegracoes: boolean;
  podeGerenciarIntegracoes:
    boolean;

  podeVerAuditoria: boolean;
};

type UltimaSubmissao = {
  id: number;

  status: string;

  resultadoDeduplicacao:
    string;

  nomeSnapshot:
    string | null;

  emailSnapshot:
    string | null;

  telefoneSnapshot:
    string | null;

  utmSource:
    string | null;

  utmMedium:
    string | null;

  utmCampaign:
    string | null;

  consentimentoLgpd:
    boolean;

  codigoErro:
    string | null;

  mensagemErro:
    string | null;

  recebidoEm:
    string;

  processadoEm:
    string | null;

  leadId:
    number | null;

  canal: {
    id: number;
    nome: string;
    tipo: string;
    cor: string | null;
  } | null;

  campanha: {
    id: number;
    nome: string;
    codigo: string;
    status: string;
  } | null;

  formulario: {
    id: number;
    nome: string;
    titulo: string;
    status: string;
  } | null;
};

type RespostaResumo = {
  success: true;

  permissoes:
    Permissoes;

  periodo: {
    mes: number;
    ano: number;
  };

  resumo: {
    canais: {
      total: number;
      ativos: number;
    };

    campanhas: {
      total: number;
      ativas: number;
    };

    formularios: {
      total: number;
      publicados: number;
    };

    integracoes: {
      total: number;
      ativas: number;
      comErro: number;
    };

    distribuicao: {
      regrasAtivas: number;
    };

    submissoes: {
      hoje: number;
      mes: number;
      pendentes: number;
      processadas: number;
      duplicadas: number;
      rejeitadas: number;
      spam: number;
      comErro: number;
    };

    leads: {
      novos: number;

      existentesAtualizados:
        number;

      totalGerados: number;
    };

    taxas: {
      processamento: number;
      erro: number;
    };
  };

  ultimasSubmissoes:
    UltimaSubmissao[];
};

type RespostaErro = {
  success?: false;
  error?: string;
  codigo?: string;
};

function formatarNumero(
  valor: number,
  locale: string
) {
  return new Intl.NumberFormat(
    locale
  ).format(
    Number(valor || 0)
  );
}

function formatarPercentual(
  valor: number,
  locale: string
) {
  return new Intl.NumberFormat(
    locale,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(valor || 0)
  );
}

function formatarDataHora(
  valor:
    string |
    null |
    undefined,
  locale: string
) {
  if (!valor) {
    return "—";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  ).format(data);
}

function nomeMes(
  mes: number,
  locale: string
) {
  if (
    !Number.isInteger(
      mes
    ) ||
    mes < 1 ||
    mes > 12
  ) {
    return String(mes);
  }

  const data =
    new Date(
      2024,
      mes - 1,
      1
    );

  const nome =
    new Intl.DateTimeFormat(
      locale,
      {
        month:
          "long",
      }
    ).format(data);

  return (
    nome.charAt(0)
      .toLocaleUpperCase(
        locale
      ) +
    nome.slice(1)
  );
}

function classesStatus(
  status: string,
  temaEscuro: boolean
) {
  if (
    status ===
    "PROCESSADA"
  ) {
    return temaEscuro
      ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    status ===
      "ERRO" ||
    status ===
      "REJEITADA"
  ) {
    return temaEscuro
      ? "border-red-900 bg-red-950/60 text-red-300"
      : "border-red-200 bg-red-50 text-red-700";
  }

  if (
    status ===
    "DUPLICADA"
  ) {
    return temaEscuro
      ? "border-amber-900 bg-amber-950/60 text-amber-300"
      : "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    status ===
    "SPAM"
  ) {
    return temaEscuro
      ? "border-violet-900 bg-violet-950/60 text-violet-300"
      : "border-violet-200 bg-violet-50 text-violet-700";
  }

  return temaEscuro
    ? "border-slate-700 bg-slate-800 text-slate-200"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

export default function CentralCaptacaoPage() {
  const t =
    useTranslations(
      "AdminCommercialLeadGenerationCenter"
    );

  const locale =
    useLocale();

  const [
    temaAtual,
    setTemaAtual,
  ] =
    useState<Tema>(
      "light"
    );

  const [
    sistemaEscuro,
    setSistemaEscuro,
  ] =
    useState(false);

  const [
    dados,
    setDados,
  ] =
    useState<RespostaResumo | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    atualizando,
    setAtualizando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  useEffect(() => {
    const media =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    function calcularTema() {
      const valorSalvo =
        localStorage.getItem(
          "phanyx_tema"
        );

      const escolha =
        (
          valorSalvo ===
            "light" ||
          valorSalvo ===
            "dark" ||
          valorSalvo ===
            "system"
            ? valorSalvo
            : document
                .documentElement
                .dataset
                .themeChoice ||
              "system"
        ) as Tema;

      setTemaAtual(
        escolha
      );

      setSistemaEscuro(
        media.matches
      );
    }

    calcularTema();

    window.addEventListener(
      "storage",
      calcularTema
    );

    window.addEventListener(
      "phanyx-theme-change",
      calcularTema
    );

    media.addEventListener(
      "change",
      calcularTema
    );

    const observer =
      new MutationObserver(
        calcularTema
      );

    observer.observe(
      document.documentElement,
      {
        attributes:
          true,

        attributeFilter: [
          "class",
          "data-theme",
          "data-theme-choice",
        ],
      }
    );

    return () => {
      window.removeEventListener(
        "storage",
        calcularTema
      );

      window.removeEventListener(
        "phanyx-theme-change",
        calcularTema
      );

      media.removeEventListener(
        "change",
        calcularTema
      );

      observer.disconnect();
    };
  }, []);

  const temaAzul =
    temaAtual ===
    "dark";

  const temaEscuro =
    temaAzul ||
    (
      temaAtual ===
        "system" &&
      sistemaEscuro
    );

  const carregar =
    useCallback(
      async (
        silencioso = false
      ) => {
        try {
          if (
            silencioso
          ) {
            setAtualizando(
              true
            );
          } else {
            setCarregando(
              true
            );
          }

          setErro("");

          const resposta =
            await fetch(
              "/api/admin/comercial/captacao/resumo",
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const json =
            (
              await resposta
                .json()
                .catch(
                  () => ({})
                )
            ) as
              | RespostaResumo
              | RespostaErro;

          if (
            !resposta.ok ||
            !(
              "success" in
                json
            ) ||
            json.success !==
              true
          ) {
            throw new Error(
              (
                json as
                  RespostaErro
              ).error ||
                t(
                  "errors.load"
                )
            );
          }

          setDados(
            json
          );
        } catch (
          error
        ) {
          setErro(
            error instanceof
              Error
              ? error.message
              : t(
                  "errors.load"
                )
          );
        } finally {
          setCarregando(
            false
          );

          setAtualizando(
            false
          );
        }
      },
      [
        t,
      ]
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const c =
    useMemo(
      () => ({
        pagina:
          temaAzul
            ? "bg-[#071525] text-blue-50"
            : temaEscuro
              ? "bg-neutral-900 text-neutral-100"
              : "bg-slate-100 text-slate-900",

        card:
          temaAzul
            ? "border-blue-900 bg-[#0b1f36]"
            : temaEscuro
              ? "border-neutral-700 bg-neutral-800"
              : "border-slate-200 bg-white",

        subCard:
          temaAzul
            ? "border-blue-900 bg-[#08192d]"
            : temaEscuro
              ? "border-neutral-600 bg-neutral-700"
              : "border-slate-200 bg-slate-50",

        titulo:
          temaEscuro
            ? "text-white"
            : "text-slate-900",

        texto:
          temaAzul
            ? "text-blue-100"
            : temaEscuro
              ? "text-neutral-200"
              : "text-slate-700",

        muted:
          temaAzul
            ? "text-blue-300/75"
            : temaEscuro
              ? "text-neutral-400"
              : "text-slate-500",

        divisoria:
          temaAzul
            ? "border-blue-900"
            : temaEscuro
              ? "border-neutral-700"
              : "border-slate-200",

        botao:
          temaAzul
            ? "border-blue-800 bg-blue-950 text-blue-50 hover:bg-blue-900"
            : temaEscuro
              ? "border-neutral-600 bg-neutral-700 text-white hover:bg-neutral-600"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",

        tabelaHover:
          temaAzul
            ? "hover:bg-blue-900/40"
            : temaEscuro
              ? "hover:bg-neutral-700/70"
              : "hover:bg-slate-50",

        tabelaCabecalho:
          temaAzul
            ? "bg-blue-950/80 text-blue-300"
            : temaEscuro
              ? "bg-neutral-900 text-neutral-400"
              : "bg-slate-50 text-slate-500",
      }),
      [
        temaAzul,
        temaEscuro,
      ]
    );

  const textoStatus =
    useCallback(
      (
        status:
          string
      ) => {
        const mapa:
          Record<
            string,
            string
          > = {
          RECEBIDA:
            "statuses.received",

          VALIDANDO:
            "statuses.validating",

          PROCESSANDO:
            "statuses.processing",

          PROCESSADA:
            "statuses.processed",

          DUPLICADA:
            "statuses.duplicate",

          REJEITADA:
            "statuses.rejected",

          SPAM:
            "statuses.spam",

          ERRO:
            "statuses.error",
        };

        const chave =
          mapa[status];

        return chave
          ? t(chave)
          : status;
      },
      [
        t,
      ]
    );

  if (
    carregando &&
    !dados
  ) {
    return (
      <div
        className={`captacao-central-page min-h-screen p-6 ${c.pagina}`}
      >
        <div className="mx-auto max-w-7xl space-y-5">
          <div
            className={`h-32 animate-pulse rounded-3xl border ${c.card}`}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className={`h-32 animate-pulse rounded-3xl border ${c.card}`}
                />
              )
            )}
          </div>

          <div
            className={`h-80 animate-pulse rounded-3xl border ${c.card}`}
          />
        </div>
      </div>
    );
  }

  if (
    erro &&
    !dados
  ) {
    return (
      <div
        className={`captacao-central-page min-h-screen p-6 ${c.pagina}`}
      >
        <div
          className={`mx-auto max-w-2xl rounded-3xl border p-6 shadow-sm ${c.card}`}
        >
          <div className="text-3xl">
            ⚠️
          </div>

          <h1
            className={`mt-4 text-xl font-bold ${c.titulo}`}
          >
            {t(
              "errors.openTitle"
            )}
          </h1>

          <p
            className={`mt-2 text-sm leading-6 ${c.texto}`}
          >
            {erro}
          </p>

          <button
            type="button"
            onClick={() =>
              void carregar()
            }
            className={`mt-5 rounded-xl border px-4 py-2 text-sm font-semibold transition ${c.botao}`}
          >
            {t(
              "actions.tryAgain"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!dados) {
    return null;
  }

  const {
    permissoes,
    resumo,
    periodo,
    ultimasSubmissoes,
  } = dados;

  const acessosRapidos = [
    {
      chave:
        "canais",

      titulo:
        t(
          "quickAccess.channels.title"
        ),

      descricao:
        t(
          "quickAccess.channels.description",
          {
            active:
              formatarNumero(
                resumo.canais.ativos,
                locale
              ),

            total:
              formatarNumero(
                resumo.canais.total,
                locale
              ),
          }
        ),

      href:
        "/admin/comercial/captacao/canais",

      icone:
        "📡",

      visivel:
        permissoes.podeVerCanais,
    },

    {
      chave:
        "campanhas",

      titulo:
        t(
          "quickAccess.campaigns.title"
        ),

      descricao:
        t(
          "quickAccess.campaigns.description",
          {
            active:
              formatarNumero(
                resumo.campanhas.ativas,
                locale
              ),

            total:
              formatarNumero(
                resumo.campanhas.total,
                locale
              ),
          }
        ),

      href:
        "/admin/comercial/captacao/campanhas",

      icone:
        "📣",

      visivel:
        permissoes.podeVerCampanhas,
    },

    {
      chave:
        "formularios",

      titulo:
        t(
          "quickAccess.forms.title"
        ),

      descricao:
        t(
          "quickAccess.forms.description",
          {
            published:
              formatarNumero(
                resumo.formularios
                  .publicados,
                locale
              ),

            total:
              formatarNumero(
                resumo.formularios.total,
                locale
              ),
          }
        ),

      href:
        "/admin/comercial/captacao/formularios",

      icone:
        "📝",

      visivel:
        permissoes.podeVerFormularios,
    },

    {
      chave:
        "submissoes",

      titulo:
        t(
          "quickAccess.submissions.title"
        ),

      descricao:
        t(
          "quickAccess.submissions.description",
          {
            count:
              formatarNumero(
                resumo.submissoes.mes,
                locale
              ),
          }
        ),

      href:
        "/admin/comercial/captacao/submissoes",

      icone:
        "📥",

      visivel:
        permissoes.podeVerSubmissoes,
    },

    {
      chave:
        "distribuicao",

      titulo:
        t(
          "quickAccess.distribution.title"
        ),

      descricao:
        t(
          "quickAccess.distribution.description",
          {
            count:
              formatarNumero(
                resumo.distribuicao
                  .regrasAtivas,
                locale
              ),
          }
        ),

      href:
        "/admin/comercial/captacao/distribuicao",

      icone:
        "🔀",

      visivel:
        permissoes.podeVerDistribuicao,
    },

    {
      chave:
        "integracoes",

      titulo:
        t(
          "quickAccess.integrations.title"
        ),

      descricao:
        t(
          "quickAccess.integrations.description",
          {
            active:
              formatarNumero(
                resumo.integracoes.ativas,
                locale
              ),

            total:
              formatarNumero(
                resumo.integracoes.total,
                locale
              ),
          }
        ),

      href:
        "/admin/comercial/captacao/integracoes",

      icone:
        "🔌",

      visivel:
        permissoes.podeVerIntegracoes,
    },
  ].filter(
    (
      item
    ) =>
      item.visivel
  );

  const indicadores = [
    {
      titulo:
        t(
          "indicators.submissionsToday.title"
        ),

      valor:
        formatarNumero(
          resumo.submissoes.hoje,
          locale
        ),

      detalhe:
        t(
          "indicators.submissionsToday.detail",
          {
            count:
              formatarNumero(
                resumo.submissoes.mes,
                locale
              ),
          }
        ),

      icone:
        "📥",
    },

    {
      titulo:
        t(
          "indicators.newLeads.title"
        ),

      valor:
        formatarNumero(
          resumo.leads.novos,
          locale
        ),

      detalhe:
        t(
          "indicators.newLeads.detail",
          {
            count:
              formatarNumero(
                resumo.leads
                  .totalGerados,
                locale
              ),
          }
        ),

      icone:
        "👤",
    },

    {
      titulo:
        t(
          "indicators.processing.title"
        ),

      valor:
        `${formatarPercentual(
          resumo.taxas
            .processamento,
          locale
        )}%`,

      detalhe:
        t(
          "indicators.processing.detail",
          {
            count:
              formatarNumero(
                resumo.submissoes
                  .processadas,
                locale
              ),
          }
        ),

      icone:
        "✅",
    },

    {
      titulo:
        t(
          "indicators.pending.title"
        ),

      valor:
        formatarNumero(
          resumo.submissoes
            .pendentes,
          locale
        ),

      detalhe:
        resumo.submissoes
            .comErro >
          0
          ? t(
              "indicators.pending.withErrors",
              {
                count:
                  formatarNumero(
                    resumo.submissoes
                      .comErro,
                    locale
                  ),
              }
            )
          : t(
              "indicators.pending.noErrors"
            ),

      icone:
        "⏳",
    },
  ];

  return (
    <div
      className={`captacao-central-page min-h-screen p-4 sm:p-6 ${c.pagina}`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section
          className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div
                className={`text-xs font-bold uppercase tracking-[0.18em] ${c.muted}`}
              >
                {t(
                  "header.section"
                )}
              </div>

              <h1
                className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${c.titulo}`}
              >
                🎯{" "}
                {t(
                  "header.title"
                )}
              </h1>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
              >
                {t(
                  "header.description"
                )}
              </p>

              <p
                className={`mt-2 text-xs ${c.muted}`}
              >
                {t(
                  "header.period",
                  {
                    month:
                      nomeMes(
                        periodo.mes,
                        locale
                      ),

                    year:
                      periodo.ano,
                  }
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void carregar(
                  true
                )
              }
              disabled={
                atualizando
              }
              className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${c.botao}`}
            >
              {atualizando
                ? t(
                    "actions.updating"
                  )
                : t(
                    "actions.refresh"
                  )}
            </button>
          </div>
        </section>

        {erro && (
          <div
            className={
              temaEscuro
                ? "rounded-2xl border border-amber-900 bg-amber-950/50 px-4 py-3 text-sm text-amber-200"
                : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            }
          >
            {erro}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map(
            (
              item
            ) => (
              <div
                key={
                  item.titulo
                }
                className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-sm font-medium ${c.muted}`}
                    >
                      {
                        item.titulo
                      }
                    </p>

                    <p
                      className={`mt-3 text-3xl font-bold tracking-tight ${c.titulo}`}
                    >
                      {
                        item.valor
                      }
                    </p>

                    <p
                      className={`mt-2 text-xs ${c.texto}`}
                    >
                      {
                        item.detalhe
                      }
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl ${c.subCard}`}
                  >
                    {
                      item.icone
                    }
                  </div>
                </div>
              </div>
            )
          )}
        </section>

        <section
          className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
        >
          <div>
            <h2
              className={`text-lg font-bold ${c.titulo}`}
            >
              {t(
                "quickAccess.heading"
              )}
            </h2>

            <p
              className={`mt-1 text-sm ${c.muted}`}
            >
              {t(
                "quickAccess.description"
              )}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {acessosRapidos.map(
              (
                item
              ) => (
                <Link
                  key={
                    item.chave
                  }
                  href={
                    item.href
                  }
                  className={`group rounded-2xl border p-4 transition ${c.subCard} ${
                    temaAzul
                      ? "hover:border-blue-700 hover:bg-blue-900/50"
                      : temaEscuro
                        ? "hover:border-neutral-500 hover:bg-neutral-600"
                        : "hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {
                        item.icone
                      }
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-semibold ${c.titulo}`}
                      >
                        {
                          item.titulo
                        }
                      </p>

                      <p
                        className={`mt-1 truncate text-xs ${c.muted}`}
                      >
                        {
                          item.descricao
                        }
                      </p>
                    </div>

                    <span
                      className={`text-lg transition group-hover:translate-x-1 ${c.muted}`}
                    >
                      →
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section
            className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
          >
            <div>
              <h2
                className={`text-lg font-bold ${c.titulo}`}
              >
                {t(
                  "performance.title"
                )}
              </h2>

              <p
                className={`mt-1 text-sm ${c.muted}`}
              >
                {t(
                  "performance.description"
                )}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  nome:
                    t(
                      "performance.processed"
                    ),

                  valor:
                    resumo
                      .submissoes
                      .processadas,
                },

                {
                  nome:
                    t(
                      "performance.duplicates"
                    ),

                  valor:
                    resumo
                      .submissoes
                      .duplicadas,
                },

                {
                  nome:
                    t(
                      "performance.rejected"
                    ),

                  valor:
                    resumo
                      .submissoes
                      .rejeitadas,
                },

                {
                  nome:
                    t(
                      "performance.spam"
                    ),

                  valor:
                    resumo
                      .submissoes
                      .spam,
                },

                {
                  nome:
                    t(
                      "performance.withErrors"
                    ),

                  valor:
                    resumo
                      .submissoes
                      .comErro,
                },
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.nome
                    }
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${c.subCard}`}
                  >
                    <span
                      className={`text-sm ${c.texto}`}
                    >
                      {
                        item.nome
                      }
                    </span>

                    <strong
                      className={
                        c.titulo
                      }
                    >
                      {formatarNumero(
                        item.valor,
                        locale
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>

            <div
              className={`mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 ${c.divisoria}`}
            >
              <div
                className={`rounded-2xl border p-4 ${c.subCard}`}
              >
                <p
                  className={`text-xs ${c.muted}`}
                >
                  {t(
                    "performance.processingRate"
                  )}
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${c.titulo}`}
                >
                  {formatarPercentual(
                    resumo.taxas
                      .processamento,
                    locale
                  )}
                  %
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 ${c.subCard}`}
              >
                <p
                  className={`text-xs ${c.muted}`}
                >
                  {t(
                    "performance.errorRate"
                  )}
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${c.titulo}`}
                >
                  {formatarPercentual(
                    resumo.taxas
                      .erro,
                    locale
                  )}
                  %
                </p>
              </div>
            </div>
          </section>

          <section
            className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
          >
            <h2
              className={`text-lg font-bold ${c.titulo}`}
            >
              {t(
                "structure.title"
              )}
            </h2>

            <p
              className={`mt-1 text-sm ${c.muted}`}
            >
              {t(
                "structure.description"
              )}
            </p>

            <div className="mt-5 space-y-3">
              {[
                {
                  nome:
                    t(
                      "structure.activeChannels"
                    ),

                  valor:
                    resumo.canais
                      .ativos,
                },

                {
                  nome:
                    t(
                      "structure.activeCampaigns"
                    ),

                  valor:
                    resumo.campanhas
                      .ativas,
                },

                {
                  nome:
                    t(
                      "structure.publishedForms"
                    ),

                  valor:
                    resumo
                      .formularios
                      .publicados,
                },

                {
                  nome:
                    t(
                      "structure.distributionRules"
                    ),

                  valor:
                    resumo
                      .distribuicao
                      .regrasAtivas,
                },

                {
                  nome:
                    t(
                      "structure.activeIntegrations"
                    ),

                  valor:
                    resumo
                      .integracoes
                      .ativas,
                },
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.nome
                    }
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${c.subCard}`}
                  >
                    <span
                      className={`text-sm ${c.texto}`}
                    >
                      {
                        item.nome
                      }
                    </span>

                    <strong
                      className={
                        c.titulo
                      }
                    >
                      {formatarNumero(
                        item.valor,
                        locale
                      )}
                    </strong>
                  </div>
                )
              )}

              {resumo
                .integracoes
                .comErro >
                0 && (
                <div
                  className={
                    temaEscuro
                      ? "rounded-2xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300"
                      : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  }
                >
                  ⚠️{" "}
                  {resumo
                    .integracoes
                    .comErro ===
                  1
                    ? t(
                        "structure.integrationErrorSingular",
                        {
                          count:
                            formatarNumero(
                              resumo
                                .integracoes
                                .comErro,
                              locale
                            ),
                        }
                      )
                    : t(
                        "structure.integrationErrorPlural",
                        {
                          count:
                            formatarNumero(
                              resumo
                                .integracoes
                                .comErro,
                              locale
                            ),
                        }
                      )}
                </div>
              )}
            </div>
          </section>
        </div>

        {permissoes.podeVerSubmissoes && (
          <section
            className={`overflow-hidden rounded-3xl border shadow-sm ${c.card}`}
          >
            <div
              className={`flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${c.divisoria}`}
            >
              <div>
                <h2
                  className={`text-lg font-bold ${c.titulo}`}
                >
                  {t(
                    "latest.title"
                  )}
                </h2>

                <p
                  className={`mt-1 text-sm ${c.muted}`}
                >
                  {t(
                    "latest.description"
                  )}
                </p>
              </div>

              <Link
                href="/admin/comercial/captacao/submissoes"
                className={`inline-flex rounded-xl border px-4 py-2 text-sm font-semibold transition ${c.botao}`}
              >
                {t(
                  "latest.viewAll"
                )}
              </Link>
            </div>

            {ultimasSubmissoes.length ===
            0 ? (
              <div className="p-10 text-center">
                <div className="text-3xl">
                  📭
                </div>

                <p
                  className={`mt-3 font-semibold ${c.titulo}`}
                >
                  {t(
                    "latest.emptyTitle"
                  )}
                </p>

                <p
                  className={`mt-1 text-sm ${c.muted}`}
                >
                  {t(
                    "latest.emptyDescription"
                  )}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead
                    className={
                      c.tabelaCabecalho
                    }
                  >
                    <tr>
                      <th className="px-5 py-3 font-semibold">
                        {t(
                          "latest.columns.lead"
                        )}
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        {t(
                          "latest.columns.source"
                        )}
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        {t(
                          "latest.columns.campaign"
                        )}
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        {t(
                          "latest.columns.status"
                        )}
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        {t(
                          "latest.columns.linkedLead"
                        )}
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        {t(
                          "latest.columns.receivedAt"
                        )}
                      </th>

                      <th className="px-5 py-3 text-right font-semibold">
                        {t(
                          "latest.columns.action"
                        )}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ultimasSubmissoes.map(
                      (
                        submissao
                      ) => (
                        <tr
                          key={
                            submissao.id
                          }
                          className={`border-t ${c.divisoria} ${c.tabelaHover}`}
                        >
                          <td className="px-5 py-4">
                            <div
                              className={`font-semibold ${c.titulo}`}
                            >
                              {submissao.nomeSnapshot ||
                                t(
                                  "latest.noName"
                                )}
                            </div>

                            <div
                              className={`mt-1 text-xs ${c.muted}`}
                            >
                              {submissao.emailSnapshot ||
                                t(
                                  "latest.noEmail"
                                )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div
                              className={
                                c.texto
                              }
                            >
                              {submissao
                                .canal
                                ?.nome ||
                                "—"}
                            </div>

                            {submissao.utmSource && (
                              <div
                                className={`mt-1 text-xs ${c.muted}`}
                              >
                                UTM:{" "}
                                {
                                  submissao.utmSource
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={
                                c.texto
                              }
                            >
                              {submissao
                                .campanha
                                ?.nome ||
                                "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classesStatus(
                                submissao.status,
                                temaEscuro
                              )}`}
                            >
                              {textoStatus(
                                submissao.status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {submissao.leadId ? (
                              <span
                                className={`font-medium ${c.titulo}`}
                              >
                                #
                                {
                                  submissao.leadId
                                }
                              </span>
                            ) : (
                              <span
                                className={
                                  c.muted
                                }
                              >
                                —
                              </span>
                            )}
                          </td>

                          <td
                            className={`whitespace-nowrap px-5 py-4 ${c.texto}`}
                          >
                            {formatarDataHora(
                              submissao.recebidoEm,
                              locale
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/admin/comercial/captacao/submissoes/${submissao.id}`}
                              className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${c.botao}`}
                            >
                              {t(
                                "latest.open"
                              )}
                            </Link>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}