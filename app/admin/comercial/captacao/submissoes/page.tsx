"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type Filtros = {
  busca: string;
  status: string;
  resultado: string;
  canalId: string;
  campanhaId: string;
  formularioId: string;
  integracaoId: string;
};

type ReferenciaCanal = {
  id: number;
  nome: string;
  tipo: string;
  cor?: string | null;
  ativo?: boolean;
};

type ReferenciaCampanha = {
  id: number;
  nome: string;
  codigo?: string;
  status?: string;
  ativo?: boolean;
};

type ReferenciaFormulario = {
  id: number;
  nome: string;
  titulo: string;
  status?: string;
  ativo?: boolean;
};

type ReferenciaIntegracao = {
  id: number;
  nome: string;
  tipo: string;
  status?: string;
  ativo?: boolean;
};

type Submissao = {
  id: number;

  canalId?: number | null;
  campanhaId?: number | null;
  formularioId?: number | null;
  integracaoId?: number | null;
  leadId?: number | null;

  identificadorExterno?: string | null;

  status: string;
  resultadoDeduplicacao?: string | null;

  nomeSnapshot?: string | null;
  emailSnapshot?: string | null;
  telefoneSnapshot?: string | null;

  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;

  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;

  paginaOrigem?: string | null;
  referrer?: string | null;

  consentimentoLgpd: boolean;
  consentimentoEm?: string | null;

  codigoErro?: string | null;
  mensagemErro?: string | null;

  recebidoEm: string;
  processadoEm?: string | null;
  atualizadoEm: string;

  canal?: {
    id: number;
    nome: string;
    tipo: string;
    cor?: string | null;
  } | null;

  campanha?: {
    id: number;
    nome: string;
    codigo: string;
    status: string;
  } | null;

  formulario?: {
    id: number;
    nome: string;
    titulo: string;
    slug: string;
    status: string;
  } | null;

  integracao?: {
    id: number;
    nome: string;
    tipo: string;
    status: string;
  } | null;

  lead?: {
    id: number;
    nome: string;

    cursoInteresse?: {
      id: number;
      nome: string;
    } | null;

    poloInteresse?: {
      id: number;
      nome: string;
    } | null;
  } | null;
};

type RespostaApi = {
  success: true;

  permissoes: {
    podeVer: boolean;
    podeReprocessar: boolean;
  };

  statusDisponiveis: string[];
  resultadosDeduplicacaoDisponiveis: string[];

  resumo: {
    total: number;
    recebidas: number;
    emProcessamento: number;
    processadas: number;
    duplicadas: number;
    rejeitadas: number;
    spam: number;
    comErro: number;
  };

  referencias: {
    canais: ReferenciaCanal[];
    campanhas: ReferenciaCampanha[];
    formularios: ReferenciaFormulario[];
    integracoes: ReferenciaIntegracao[];
  };

  filtros: {
    busca?: string | null;
    status?: string | null;
    resultado?: string | null;
    canalId?: number | null;
    campanhaId?: number | null;
    formularioId?: number | null;
    integracaoId?: number | null;
  };

  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
    temAnterior: boolean;
    temProxima: boolean;
  };

  submissoes: Submissao[];
};

type RespostaErro = {
  success?: false;
  error?: string;
  codigo?: string;
};

const FILTROS_VAZIOS: Filtros = {
  busca: "",
  status: "",
  resultado: "",
  canalId: "",
  campanhaId: "",
  formularioId: "",
  integracaoId: "",
};

function nomeStatus(
  status: string,
  t: any
) {
  const mapa: Record<string, string> = {
    RECEBIDA: t("statuses.received.name"),
    VALIDANDO: t("statuses.validating.name"),
    PROCESSANDO: t("statuses.processing.name"),
    PROCESSADA: t("statuses.processed.name"),
    DUPLICADA: t("statuses.duplicate.name"),
    REJEITADA: t("statuses.rejected.name"),
    SPAM: t("statuses.spam.name"),
    ERRO: t("statuses.error.name"),
  };

  return mapa[status] || status;
}

function descricaoStatus(
  status: string,
  t: any
) {
  const mapa: Record<string, string> = {
    RECEBIDA: t("statuses.received.description"),
    VALIDANDO: t("statuses.validating.description"),
    PROCESSANDO: t("statuses.processing.description"),
    PROCESSADA: t("statuses.processed.description"),
    DUPLICADA: t("statuses.duplicate.description"),
    REJEITADA: t("statuses.rejected.description"),
    SPAM: t("statuses.spam.description"),
    ERRO: t("statuses.error.description"),
  };

  return mapa[status] || "";
}

function classeStatus(status: string) {
  if (status === "PROCESSADA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    status === "VALIDANDO" ||
    status === "PROCESSANDO"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (status === "RECEBIDA") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    status === "ERRO" ||
    status === "REJEITADA"
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "SPAM") {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function nomeResultado(
  resultado: string | null | undefined,
  t: any
) {
  if (!resultado) {
    return t("results.waiting");
  }

  const mapa: Record<string, string> = {
    NAO_VERIFICADA: t("results.notChecked"),
    NOVO_LEAD: t("results.newLead"),
    LEAD_EXISTENTE_ATUALIZADO:
      t("results.existingLeadUpdated"),
    DUPLICADA_IGNORADA:
      t("results.duplicateIgnored"),
    REVISAO_MANUAL:
      t("results.manualReview"),
  };

  return mapa[resultado] || resultado;
}

function formatarData(
  valor: string | null | undefined,
  locale: string
) {
  if (!valor) {
    return "—";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(data);
}

function origemSubmissao(
  submissao: Submissao,
  t: any
) {
  if (submissao.canal?.nome) {
    return submissao.canal.nome;
  }

  if (submissao.integracao?.nome) {
    return submissao.integracao.nome;
  }

  return t("list.item.unknownOrigin");
}

type OpcaoSeletor = {
  value: string;
  label: string;
};

function SeletorSubmissao({
  value,
  options,
  onChange,
}: {
  value: string;
  options: OpcaoSeletor[];
  onChange: (value: string) => void;
}) {
  const [
    aberto,
    setAberto,
  ] = useState(false);

  const ref =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(() => {
    function fecharFora(
      event: MouseEvent
    ) {
      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharFora
      );
    };
  }, []);

  const selecionada =
    options.find(
      (option) =>
        option.value === value
    ) ?? options[0];

  return (
    <div
      ref={ref}
      className="phanyx-submissao-select relative"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() =>
          setAberto(
            (atual) =>
              !atual
          )
        }
        className="phanyx-submissao-select-button flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm outline-none"
      >
        <span className="truncate">
          {selecionada?.label ?? ""}
        </span>

        <span
          aria-hidden="true"
          className="text-[10px]"
        >
          {aberto
            ? "▲"
            : "▼"}
        </span>
      </button>

      {aberto && (
        <div
          role="listbox"
          className="phanyx-submissao-select-menu absolute left-0 right-0 top-full z-[220] mt-1 max-h-64 overflow-y-auto rounded-xl p-1 shadow-2xl"
        >
          {options.map(
            (option) => {
              const ativa =
                option.value ===
                value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    ativa
                  }
                  onClick={() => {
                    onChange(
                      option.value
                    );
                    setAberto(
                      false
                    );
                  }}
                  className={`phanyx-submissao-select-option block w-full rounded-lg px-3 py-2 text-left text-sm ${
                    ativa
                      ? "is-selected"
                      : ""
                  }`}
                >
                  {
                    option.label
                  }
                </button>
              );
            }
          )}
        </div>
      )}
      <style jsx global>{`
        .captacao-submissoes-page
          .phanyx-submissao-select-button {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
        }

        .captacao-submissoes-page
          .phanyx-submissao-select-menu {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
        }

        .captacao-submissoes-page
          .phanyx-submissao-select-option:hover,
        .captacao-submissoes-page
          .phanyx-submissao-select-option.is-selected {
          background: #e2e8f0;
        }

        html[data-theme="dark"]
          .captacao-submissoes-page {
          background: #020b2a;
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .captacao-submissoes-page
          .phanyx-submissao-select-button {
          border-color: #1e3a8a;
          background: #0f172a;
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .captacao-submissoes-page
          .phanyx-submissao-select-menu {
          border-color: #1e3a8a;
          background: #111827;
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .captacao-submissoes-page
          .phanyx-submissao-select-option:hover,
        html[data-theme="dark"]
          .captacao-submissoes-page
          .phanyx-submissao-select-option.is-selected {
          background: #1e3a8a;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page {
          background: #262626;
          color: #ffffff;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-admin-hero,
        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-card {
          background: #171717 !important;
          border-color: #404040 !important;
          color: #ffffff !important;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .bg-slate-50 {
          background: #262626 !important;
          border-color: #525252 !important;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .bg-white {
          background: #262626 !important;
          color: #ffffff !important;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .text-slate-900,
        html[data-theme="system"].dark
          .captacao-submissoes-page
          .text-slate-950 {
          color: #ffffff !important;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .text-slate-600,
        html[data-theme="system"].dark
          .captacao-submissoes-page
          .text-slate-500,
        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-muted {
          color: #b3b3b3 !important;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .border-slate-200,
        html[data-theme="system"].dark
          .captacao-submissoes-page
          .border-slate-300 {
          border-color: #525252 !important;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-input {
          background: #414141 !important;
          border-color: #686868 !important;
          color: #ffffff !important;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-input::placeholder {
          color: #b3b3b3 !important;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-submissao-select-button {
          border-color: #686868;
          background: #414141;
          color: #ffffff;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-submissao-select-menu {
          border-color: #686868;
          background: #383838;
          color: #ffffff;
        }

        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-submissao-select-option:hover,
        html[data-theme="system"].dark
          .captacao-submissoes-page
          .phanyx-submissao-select-option.is-selected {
          background: #666666;
        }
      `}</style>

    </div>
  );
}

export default function SubmissoesCaptacaoPage() {
  const t =
    useTranslations(
      "AdminCommercialSubmissions"
    );

  const locale =
    useLocale();

  const [
    dados,
    setDados,
  ] = useState<RespostaApi | null>(
    null
  );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    pagina,
    setPagina,
  ] = useState(1);

  const [
    filtros,
    setFiltros,
  ] = useState<Filtros>(
    FILTROS_VAZIOS
  );

  const [
    filtrosEdicao,
    setFiltrosEdicao,
  ] = useState<Filtros>(
    FILTROS_VAZIOS
  );

  const [
    submissaoReprocessar,
    setSubmissaoReprocessar,
  ] = useState<Submissao | null>(
    null
  );

  const [
    reprocessandoId,
    setReprocessandoId,
  ] = useState<number | null>(
    null
  );

  const carregar =
    useCallback(
      async (
        silencioso = false
      ) => {
        try {
          if (silencioso) {
            setAtualizando(true);
          } else {
            setCarregando(true);
          }

          setErro("");

          const params =
            new URLSearchParams();

          params.set(
            "pagina",
            String(pagina)
          );

          params.set(
            "limite",
            "20"
          );

          if (filtros.busca.trim()) {
            params.set(
              "busca",
              filtros.busca.trim()
            );
          }

          if (filtros.status) {
            params.set(
              "status",
              filtros.status
            );
          }

          if (filtros.resultado) {
            params.set(
              "resultado",
              filtros.resultado
            );
          }

          if (filtros.canalId) {
            params.set(
              "canalId",
              filtros.canalId
            );
          }

          if (filtros.campanhaId) {
            params.set(
              "campanhaId",
              filtros.campanhaId
            );
          }

          if (filtros.formularioId) {
            params.set(
              "formularioId",
              filtros.formularioId
            );
          }

          if (filtros.integracaoId) {
            params.set(
              "integracaoId",
              filtros.integracaoId
            );
          }

          const resposta =
            await fetch(
              `/api/admin/comercial/captacao/submissoes?${params.toString()}`,
              {
                cache: "no-store",
              }
            );

          const json =
            (await resposta
              .json()
              .catch(
                () => null
              )) as
            | RespostaApi
            | RespostaErro
            | null;

          if (
            !resposta.ok ||
            !json ||
            json.success !== true
          ) {
            throw new Error(
              json &&
                "error" in json
                ? json.error ||
                t("errors.load")
                : t("errors.load")
            );
          }

          setDados(json);
        } catch (error) {
          setErro(
            error instanceof Error
              ? error.message
              : t("errors.load")
          );
        } finally {
          setCarregando(false);
          setAtualizando(false);
        }
      },
      [
        filtros,
        pagina,
        t,
      ]
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!mensagem) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setMensagem("");
      }, 4000);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [mensagem]);

  const exigeAtencao =
    useMemo(() => {
      if (!dados) {
        return 0;
      }

      return (
        dados.resumo.comErro +
        dados.resumo.rejeitadas
      );
    }, [dados]);

  function aplicarFiltros(
    event: FormEvent
  ) {
    event.preventDefault();

    setPagina(1);

    setFiltros({
      ...filtrosEdicao,
    });
  }

  function limparFiltros() {
    setPagina(1);

    setFiltrosEdicao({
      ...FILTROS_VAZIOS,
    });

    setFiltros({
      ...FILTROS_VAZIOS,
    });
  }

  function traduzirErroPersistido(
    mensagem:
      | string
      | null
      | undefined
  ) {
    if (!mensagem) {
      return "";
    }

    const campoObrigatorio =
      mensagem.match(
        /^O campo ["“](.+?)["”] é obrigatório\.?$/i
      );

    if (campoObrigatorio) {
      const campo =
        campoObrigatorio[1];

      const campos: Record<
        string,
        string
      > = {
        "Nome completo":
          t(
            "persistedErrors.fields.fullName"
          ),
        "E-mail":
          t(
            "persistedErrors.fields.email"
          ),
        "Telefone":
          t(
            "persistedErrors.fields.phone"
          ),
      };

      return t(
        "persistedErrors.requiredField",
        {
          field:
            campos[campo] ||
            campo,
        }
      );
    }

    return mensagem;
  }

  async function reprocessarSubmissao() {
    if (
      !submissaoReprocessar
    ) {
      return;
    }

    const submissao =
      submissaoReprocessar;

    try {
      setReprocessandoId(
        submissao.id
      );

      setErro("");
      setMensagem("");

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/submissoes/${submissao.id}/reprocessar`,
          {
            method: "POST",
          }
        );

      const json =
        (await resposta
          .json()
          .catch(
            () => null
          )) as
        | {
          success?: boolean;
          error?: string;
          message?: string;
        }
        | null;

      if (!resposta.ok) {
        throw new Error(
          json?.error ||
          t("errors.retry")
        );
      }

      setSubmissaoReprocessar(
        null
      );

      setMensagem(
        t("list.success.requeued")
      );

      await carregar(true);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.retry")
      );
    } finally {
      setReprocessandoId(
        null
      );
    }
  }

  if (
    carregando &&
    !dados
  ) {
    return (
      <div className="captacao-submissoes-page min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="phanyx-card rounded-3xl p-8 shadow-sm">
            <p className="font-semibold">
              {t("list.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="captacao-submissoes-page min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="phanyx-admin-hero rounded-3xl border p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/comercial/captacao"
                className="text-sm font-semibold text-slate-500"
              >
                {t("common.backToLeadGenerationCenter")}
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">
                  📥
                </div>

                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    {t("list.header.title")}
                  </h1>

                  <p className="mt-1 text-sm text-slate-600">
                    {t("list.header.description")}
                  </p>
                </div>
              </div>
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
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm disabled:opacity-60"
            >
              {atualizando
                ? t("common.refreshing")
                : t("common.refresh")}
            </button>
          </div>
        </section>

        {mensagem && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            ✓ {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {erro}
          </div>
        )}

        {dados && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  {t("list.summary.total")}
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.total}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  {t("list.summary.totalHelp")}
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  {t("list.summary.processed")}
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.processadas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  {t("list.summary.processedHelp")}
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  {t("list.summary.inProgress")}
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.emProcessamento +
                    dados.resumo.recebidas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  {t("list.summary.inProgressHelp")}
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  {t("list.summary.attention")}
                </p>

                <strong className="mt-2 block text-3xl">
                  {exigeAtencao}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  {t("list.summary.attentionHelp")}
                </p>
              </div>
            </section>

            <form
              onSubmit={
                aplicarFiltros
              }
              className="phanyx-card rounded-3xl p-5 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-bold">
                    {t("common.search")}
                  </label>

                  <input
                    type="text"
                    value={
                      filtrosEdicao.busca
                    }
                    onChange={(
                      event
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          busca:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="phanyx-input w-full rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder={t("list.filters.searchPlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("common.status")}
                  </label>

                  <SeletorSubmissao
                    value={
                      filtrosEdicao.status
                    }
                    onChange={(
                      value
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          status:
                            value,
                        })
                      )
                    }
                    options={[
                      {
                        value: "",
                        label:
                          t(
                            "common.allFeminine"
                          ),
                      },
                      ...dados.statusDisponiveis.map(
                        (
                          item
                        ) => ({
                          value:
                            item,
                          label:
                            nomeStatus(
                              item,
                              t
                            ),
                        })
                      ),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("list.filters.leadResult")}
                  </label>

                  <SeletorSubmissao
                    value={
                      filtrosEdicao.resultado
                    }
                    onChange={(
                      value
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          resultado:
                            value,
                        })
                      )
                    }
                    options={[
                      {
                        value: "",
                        label:
                          t(
                            "common.allMasculine"
                          ),
                      },
                      ...dados.resultadosDeduplicacaoDisponiveis.map(
                        (
                          item
                        ) => ({
                          value:
                            item,
                          label:
                            nomeResultado(
                              item,
                              t
                            ),
                        })
                      ),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{t("common.channel")}</label>

                  <SeletorSubmissao
                    value={
                      filtrosEdicao.canalId
                    }
                    onChange={(
                      value
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          canalId:
                            value,
                        })
                      )
                    }
                    options={[
                      {
                        value: "",
                        label:
                          t(
                            "list.filters.allChannels"
                          ),
                      },
                      ...dados.referencias.canais.map(
                        (
                          item
                        ) => ({
                          value:
                            String(
                              item.id
                            ),
                          label:
                            item.nome,
                        })
                      ),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{t("common.campaign")}</label>

                  <SeletorSubmissao
                    value={
                      filtrosEdicao.campanhaId
                    }
                    onChange={(
                      value
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          campanhaId:
                            value,
                        })
                      )
                    }
                    options={[
                      {
                        value: "",
                        label:
                          t(
                            "list.filters.allCampaigns"
                          ),
                      },
                      ...dados.referencias.campanhas.map(
                        (
                          item
                        ) => ({
                          value:
                            String(
                              item.id
                            ),
                          label:
                            item.nome,
                        })
                      ),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{t("common.form")}</label>

                  <SeletorSubmissao
                    value={
                      filtrosEdicao.formularioId
                    }
                    onChange={(
                      value
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          formularioId:
                            value,
                        })
                      )
                    }
                    options={[
                      {
                        value: "",
                        label:
                          t(
                            "list.filters.allForms"
                          ),
                      },
                      ...dados.referencias.formularios.map(
                        (
                          item
                        ) => ({
                          value:
                            String(
                              item.id
                            ),
                          label:
                            item.titulo ||
                            item.nome,
                        })
                      ),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{t("common.integration")}</label>

                  <SeletorSubmissao
                    value={
                      filtrosEdicao.integracaoId
                    }
                    onChange={(
                      value
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          integracaoId:
                            value,
                        })
                      )
                    }
                    options={[
                      {
                        value: "",
                        label:
                          t(
                            "list.filters.allIntegrations"
                          ),
                      },
                      ...dados.referencias.integracoes.map(
                        (
                          item
                        ) => ({
                          value:
                            String(
                              item.id
                            ),
                          label:
                            item.nome,
                        })
                      ),
                    ]}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    limparFiltros
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
                >
                  {t("common.clear")}
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  {t("common.filter")}
                </button>
              </div>
            </form>

            <section className="phanyx-card overflow-hidden rounded-3xl shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5">
                <h2 className="text-xl font-black">
                  {t("list.received.title")}
                </h2>

                <p className="phanyx-muted mt-1 text-sm">
                  {t("list.received.results", { count: dados.paginacao.total })}
                </p>
              </div>

              {dados.submissoes.length ===
                0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="text-4xl">
                    📥
                  </div>

                  <h3 className="mt-4 text-lg font-black">
                    {t("list.empty.title")}
                  </h3>

                  <p className="phanyx-muted mt-2 text-sm">
                    {t("list.empty.description")}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dados.submissoes.map(
                    (
                      submissao
                    ) => {
                      const podeTentarNovamente =
                        dados
                          .permissoes
                          .podeReprocessar &&
                        [
                          "ERRO",
                          "REJEITADA",
                        ].includes(
                          submissao.status
                        );

                      return (
                        <article
                          key={
                            submissao.id
                          }
                          className="p-5"
                        >
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-black">
                                  {submissao.nomeSnapshot ||
                                    t("list.item.unnamedProspect")}
                                </h3>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${classeStatus(
                                    submissao.status
                                  )}`}
                                  title={descricaoStatus(submissao.status, t)}
                                >
                                  {nomeStatus(submissao.status, t)}
                                </span>
                              </div>

                              <div className="phanyx-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                {submissao.emailSnapshot && (
                                  <span>
                                    {
                                      submissao.emailSnapshot
                                    }
                                  </span>
                                )}

                                {submissao.telefoneSnapshot && (
                                  <span>
                                    {
                                      submissao.telefoneSnapshot
                                    }
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    {t("common.origin")}
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {origemSubmissao(submissao, t)}
                                  </p>

                                  {submissao.campanha?.nome && (
                                    <p className="phanyx-muted mt-1 text-xs">
                                      {t("common.campaign")}:{" "}
                                      {
                                        submissao
                                          .campanha
                                          .nome
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("common.form")}</p>

                                  <p className="mt-1 text-sm font-bold">
                                    {submissao.formulario?.titulo ||
                                      submissao.formulario?.nome ||
                                      t("common.notInformed")}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    {t("common.interest")}
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {submissao.lead?.cursoInteresse?.nome ||
                                      t("common.notInformed")}
                                  </p>

                                  {submissao.lead?.poloInteresse?.nome && (
                                    <p className="phanyx-muted mt-1 text-xs">
                                      {t("common.unit")}:{" "}
                                      {
                                        submissao
                                          .lead
                                          .poloInteresse
                                          .nome
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    {t("list.item.receivedAt")}
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {formatarData(submissao.recebidoEm, locale)}
                                  </p>

                                  {submissao.processadoEm && (
                                    <p className="phanyx-muted mt-1 text-xs">
                                      {t("list.item.processedPrefix")}:{" "}
                                      {formatarData(submissao.processadoEm, locale)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">
                                  {nomeResultado(submissao.resultadoDeduplicacao, t)}
                                </span>

                                {submissao.consentimentoLgpd ? (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                    ✓ {t("common.consentRecorded")}
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">
                                    {t("common.consentNotRecorded")}
                                  </span>
                                )}
                              </div>

                              {(submissao.status ===
                                "ERRO" ||
                                submissao.status ===
                                "REJEITADA") &&
                                submissao.mensagemErro && (
                                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                      {t("common.whatHappened")}
                                    </p>

                                    <p className="mt-1 text-sm text-red-800">
                                      {traduzirErroPersistido(
                                        submissao.mensagemErro
                                      )}
                                    </p>
                                  </div>
                                )}
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2 xl:flex-col">

                              <Link
                                href={`/admin/comercial/captacao/submissoes/${submissao.id}`}
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-bold"
                              >
                                {t("common.viewDetails")}
                              </Link>

                              {submissao.leadId && (
                                <Link
                                  href={`/admin/comercial/leads/${submissao.leadId}`}
                                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-bold"
                                >
                                  {t("common.openLead")}
                                </Link>
                              )}

                              {podeTentarNovamente && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSubmissaoReprocessar(
                                      submissao
                                    )
                                  }
                                  disabled={
                                    reprocessandoId ===
                                    submissao.id
                                  }
                                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                  {t("common.retry")}
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}

              {dados.paginacao.totalPaginas >
                1 && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="phanyx-muted text-sm">
                      {t("common.pagination", { page: dados.paginacao.pagina, pages: dados.paginacao.totalPaginas })}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          !dados
                            .paginacao
                            .temAnterior
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
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
                      >
                        {t("common.previous")}
                      </button>

                      <button
                        type="button"
                        disabled={
                          !dados
                            .paginacao
                            .temProxima
                        }
                        onClick={() =>
                          setPagina(
                            (
                              atual
                            ) =>
                              atual +
                              1
                          )
                        }
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
                      >
                        {t("common.next")}
                      </button>
                    </div>
                  </div>
                )}
            </section>
          </>
        )}
      </div>

      {submissaoReprocessar && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="phanyx-card w-full max-w-lg rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black">
              {t("list.retryModal.title")}
            </h2>

            <p className="phanyx-muted mt-2 text-sm leading-6">
              {t("list.retryModal.description", {
                name:
                  submissaoReprocessar.nomeSnapshot ||
                  t("list.retryModal.thisProspect"),
              })}
            </p>

            <p className="phanyx-muted mt-2 text-sm leading-6">
              {t("list.retryModal.deduplication")}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setSubmissaoReprocessar(
                    null
                  )
                }
                disabled={
                  reprocessandoId !==
                  null
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                onClick={() =>
                  void reprocessarSubmissao()
                }
                disabled={
                  reprocessandoId !==
                  null
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {reprocessandoId !==
                  null
                  ? t("common.processing")
                  : t("common.retry")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}