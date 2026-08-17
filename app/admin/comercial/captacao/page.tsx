"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR"
  ).format(
    Number(valor || 0)
  );
}

function formatarPercentual(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
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
    undefined
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
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(data);
}

function nomeMes(
  mes: number
) {
  const nomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return (
    nomes[mes - 1] ??
    `Mês ${mes}`
  );
}

function textoStatus(
  status: string
) {
  const mapa:
    Record<
      string,
      string
    > = {
    RECEBIDA:
      "Recebida",

    VALIDANDO:
      "Validando",

    PROCESSANDO:
      "Processando",

    PROCESSADA:
      "Processada",

    DUPLICADA:
      "Duplicada",

    REJEITADA:
      "Rejeitada",

    SPAM:
      "Spam",

    ERRO:
      "Erro",
  };

  return (
    mapa[status] ??
    status
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
  const [
    temaEscuro,
    setTemaEscuro,
  ] = useState(false);

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
    function calcularTema() {
      const tema =
        (
          localStorage.getItem(
            "phanyx_tema"
          ) ||
          "system"
        ) as Tema;

      const sistemaEscuro =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      setTemaEscuro(
        tema === "dark" ||
          (
            tema ===
              "system" &&
            sistemaEscuro
          )
      );
    }

    calcularTema();

    window.addEventListener(
      "storage",
      calcularTema
    );

    const media =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    media.addEventListener(
      "change",
      calcularTema
    );

    return () => {
      window.removeEventListener(
        "storage",
        calcularTema
      );

      media.removeEventListener(
        "change",
        calcularTema
      );
    };
  }, []);

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
                "Não foi possível carregar a Central de Captação."
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
              : "Não foi possível carregar a Central de Captação."
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
      []
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const c =
    useMemo(
      () => ({
        pagina:
          temaEscuro
            ? "bg-slate-950 text-slate-100"
            : "bg-slate-100 text-slate-900",

        card:
          temaEscuro
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-white",

        subCard:
          temaEscuro
            ? "border-slate-800 bg-slate-950"
            : "border-slate-200 bg-slate-50",

        titulo:
          temaEscuro
            ? "text-white"
            : "text-slate-900",

        texto:
          temaEscuro
            ? "text-slate-300"
            : "text-slate-700",

        muted:
          temaEscuro
            ? "text-slate-400"
            : "text-slate-500",

        divisoria:
          temaEscuro
            ? "border-slate-800"
            : "border-slate-200",

        botao:
          temaEscuro
            ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",

        tabelaHover:
          temaEscuro
            ? "hover:bg-slate-800/60"
            : "hover:bg-slate-50",
      }),
      [
        temaEscuro,
      ]
    );

  if (
    carregando &&
    !dados
  ) {
    return (
      <div
        className={`min-h-screen p-6 ${c.pagina}`}
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
        className={`min-h-screen p-6 ${c.pagina}`}
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
            Não foi possível
            abrir a Central de
            Captação
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
            Tentar novamente
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
        "Canais",

      descricao:
        `${formatarNumero(
          resumo.canais.ativos
        )} ativos de ${formatarNumero(
          resumo.canais.total
        )}`,

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
        "Campanhas",

      descricao:
        `${formatarNumero(
          resumo.campanhas.ativas
        )} ativas de ${formatarNumero(
          resumo.campanhas.total
        )}`,

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
        "Formulários",

      descricao:
        `${formatarNumero(
          resumo.formularios
            .publicados
        )} publicados de ${formatarNumero(
          resumo.formularios.total
        )}`,

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
        "Submissões",

      descricao:
        `${formatarNumero(
          resumo.submissoes.mes
        )} recebidas no mês`,

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
        "Distribuição",

      descricao:
        `${formatarNumero(
          resumo.distribuicao
            .regrasAtivas
        )} regras ativas`,

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
        "Integrações",

      descricao:
        `${formatarNumero(
          resumo.integracoes.ativas
        )} ativas de ${formatarNumero(
          resumo.integracoes.total
        )}`,

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
        "Submissões hoje",

      valor:
        formatarNumero(
          resumo.submissoes.hoje
        ),

      detalhe:
        `${formatarNumero(
          resumo.submissoes.mes
        )} no mês`,

      icone:
        "📥",
    },

    {
      titulo:
        "Novos leads",

      valor:
        formatarNumero(
          resumo.leads.novos
        ),

      detalhe:
        `${formatarNumero(
          resumo.leads
            .totalGerados
        )} leads impactados`,

      icone:
        "👤",
    },

    {
      titulo:
        "Processamento",

      valor:
        `${formatarPercentual(
          resumo.taxas
            .processamento
        )}%`,

      detalhe:
        `${formatarNumero(
          resumo.submissoes
            .processadas
        )} processadas`,

      icone:
        "✅",
    },

    {
      titulo:
        "Pendências",

      valor:
        formatarNumero(
          resumo.submissoes
            .pendentes
        ),

      detalhe:
        resumo.submissoes
            .comErro >
          0
          ? `${formatarNumero(
              resumo.submissoes
                .comErro
            )} com erro`
          : "Sem erros no mês",

      icone:
        "⏳",
    },
  ];

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 ${c.pagina}`}
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
                Comercial
              </div>

              <h1
                className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${c.titulo}`}
              >
                🎯 Central de
                Captação
              </h1>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
              >
                Acompanhe a
                entrada de leads,
                formulários,
                campanhas,
                distribuição e
                integrações da
                instituição.
              </p>

              <p
                className={`mt-2 text-xs ${c.muted}`}
              >
                Período:
                {" "}
                {nomeMes(
                  periodo.mes
                )}
                {" de "}
                {periodo.ano}
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
                ? "Atualizando..."
                : "↻ Atualizar"}
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
              Acessos rápidos
            </h2>

            <p
              className={`mt-1 text-sm ${c.muted}`}
            >
              Configure e acompanhe
              os componentes da
              Central de Captação.
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
                    temaEscuro
                      ? "hover:border-slate-600 hover:bg-slate-800"
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
                Desempenho do mês
              </h2>

              <p
                className={`mt-1 text-sm ${c.muted}`}
              >
                Situação das
                submissões recebidas.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  nome:
                    "Processadas",

                  valor:
                    resumo
                      .submissoes
                      .processadas,
                },

                {
                  nome:
                    "Duplicadas",

                  valor:
                    resumo
                      .submissoes
                      .duplicadas,
                },

                {
                  nome:
                    "Rejeitadas",

                  valor:
                    resumo
                      .submissoes
                      .rejeitadas,
                },

                {
                  nome:
                    "Spam",

                  valor:
                    resumo
                      .submissoes
                      .spam,
                },

                {
                  nome:
                    "Com erro",

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
                        item.valor
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
                  Taxa de
                  processamento
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${c.titulo}`}
                >
                  {formatarPercentual(
                    resumo.taxas
                      .processamento
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
                  Taxa de erro
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${c.titulo}`}
                >
                  {formatarPercentual(
                    resumo.taxas
                      .erro
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
              Estrutura ativa
            </h2>

            <p
              className={`mt-1 text-sm ${c.muted}`}
            >
              Recursos atualmente
              disponíveis para
              captação.
            </p>

            <div className="mt-5 space-y-3">
              {[
                {
                  nome:
                    "Canais ativos",

                  valor:
                    resumo.canais
                      .ativos,
                },

                {
                  nome:
                    "Campanhas ativas",

                  valor:
                    resumo.campanhas
                      .ativas,
                },

                {
                  nome:
                    "Formulários publicados",

                  valor:
                    resumo
                      .formularios
                      .publicados,
                },

                {
                  nome:
                    "Regras de distribuição",

                  valor:
                    resumo
                      .distribuicao
                      .regrasAtivas,
                },

                {
                  nome:
                    "Integrações ativas",

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
                        item.valor
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
                  {formatarNumero(
                    resumo
                      .integracoes
                      .comErro
                  )}{" "}
                  integração
                  {resumo
                    .integracoes
                    .comErro ===
                  1
                    ? ""
                    : "ões"}{" "}
                  com erro.
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
                  Últimas submissões
                </h2>

                <p
                  className={`mt-1 text-sm ${c.muted}`}
                >
                  As 10 entradas mais
                  recentes da Central.
                </p>
              </div>

              <Link
                href="/admin/comercial/captacao/submissoes"
                className={`inline-flex rounded-xl border px-4 py-2 text-sm font-semibold transition ${c.botao}`}
              >
                Ver todas
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
                  Nenhuma submissão
                  recebida
                </p>

                <p
                  className={`mt-1 text-sm ${c.muted}`}
                >
                  Assim que um lead
                  entrar, ele aparecerá
                  aqui.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead
                    className={
                      temaEscuro
                        ? "bg-slate-950 text-slate-400"
                        : "bg-slate-50 text-slate-500"
                    }
                  >
                    <tr>
                      <th className="px-5 py-3 font-semibold">
                        Lead
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Origem
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Campanha
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Status
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Lead
                        vinculado
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Recebido em
                      </th>

                      <th className="px-5 py-3 text-right font-semibold">
                        Ação
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
                                "Sem nome"}
                            </div>

                            <div
                              className={`mt-1 text-xs ${c.muted}`}
                            >
                              {submissao.emailSnapshot ||
                                "Sem e-mail"}
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
                              submissao.recebidoEm
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/admin/comercial/captacao/submissoes/${submissao.id}`}
                              className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${c.botao}`}
                            >
                              Abrir
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