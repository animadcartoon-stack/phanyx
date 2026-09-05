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
import { useLocale, useTranslations } from "next-intl";

type TipoIntegracao =
  | "WEBHOOK_ENTRADA"
  | "WEBHOOK_SAIDA"
  | "META_LEAD_ADS"
  | "GOOGLE_LEAD_FORM"
  | "API"
  | "IMPORTACAO"
  | "OUTRA";

type StatusIntegracao = "INATIVA" | "ATIVA" | "PAUSADA" | "ERRO" | "REVOGADA";

type EventoSaidaCaptacao =
  | "SUBMISSAO_PROCESSADA"
  | "SUBMISSAO_DUPLICADA"
  | "SUBMISSAO_REJEITADA"
  | "LEAD_CRIADO"
  | "LEAD_ATUALIZADO"
  | "LEAD_ETAPA_ALTERADA"
  | "LEAD_PERDIDO"
  | "LEAD_CONVERTIDO"
  | "LEAD_RESPONSAVEL_ALTERADO"
  | "TAREFA_CRIADA"
  | "TAREFA_CONCLUIDA";

type Canal = {
  id: number;
  nome: string;
  tipo: string;
  cor?: string | null;
};

type Campanha = {
  id: number;
  canalId?: number | null;
  nome: string;
  codigo: string;
  status: string;
};

type Formulario = {
  id: number;
  canalId?: number | null;
  campanhaId?: number | null;
  nome: string;
  titulo: string;
  status: string;
};

type Integracao = {
  id: number;

  canalId?: number | null;
  campanhaId?: number | null;
  formularioId?: number | null;

  nome: string;
  tipo: TipoIntegracao;
  status: StatusIntegracao;

  chavePublica: string;

  urlEndpoint?: string | null;

  configuracao?: unknown;
  eventosAssinados?: unknown;

  ativo: boolean;
  possuiSegredo: boolean;

  ultimoSucessoEm?: string | null;
  ultimoErroEm?: string | null;
  ultimoErro?: string | null;

  criadoEm: string;
  atualizadoEm: string;

  canal?: Canal | null;

  campanha?: {
    id: number;
    nome: string;
    codigo: string;
    status: string;
    ativo: boolean;
  } | null;

  formulario?: {
    id: number;
    nome: string;
    titulo: string;
    status: string;
    ativo: boolean;
  } | null;

  _count: {
    submissoes: number;
    eventos: number;
  };
};

type RespostaLista = {
  success: true;

  permissoes: {
    podeVer: boolean;
    podeGerenciar: boolean;
  };

  tiposDisponiveis: TipoIntegracao[];
  statusDisponiveis: StatusIntegracao[];

  resumo: {
    total: number;
    ativas: number;
    pausadas: number;
    comErro: number;
    revogadas: number;
  };

  referencias: {
    canais: Canal[];
    campanhas: Campanha[];
    formularios: Formulario[];
  };

  integracoes: Integracao[];
};

type RespostaErro = {
  success?: false;
  error?: string;
  codigo?: string;
};

type CredenciaisCriadas = {
  chavePublica: string;
  segredo: string | null;
  exibirUmaUnicaVez: boolean;
};

const EVENTOS_SAIDA_DISPONIVEIS: EventoSaidaCaptacao[] = [
  "SUBMISSAO_PROCESSADA",
  "SUBMISSAO_DUPLICADA",
  "SUBMISSAO_REJEITADA",
  "LEAD_CRIADO",
  "LEAD_ATUALIZADO",
  "LEAD_ETAPA_ALTERADA",
  "LEAD_PERDIDO",
  "LEAD_CONVERTIDO",
  "LEAD_RESPONSAVEL_ALTERADO",
  "TAREFA_CRIADA",
  "TAREFA_CONCLUIDA",
];

const CHAVES_EVENTOS_SAIDA: Record<EventoSaidaCaptacao, string> = {
  SUBMISSAO_PROCESSADA: "list.modal.webhookEvents.items.submissionProcessed",

  SUBMISSAO_DUPLICADA: "list.modal.webhookEvents.items.submissionDuplicated",

  SUBMISSAO_REJEITADA: "list.modal.webhookEvents.items.submissionRejected",

  LEAD_CRIADO: "list.modal.webhookEvents.items.leadCreated",

  LEAD_ATUALIZADO: "list.modal.webhookEvents.items.leadUpdated",

  LEAD_ETAPA_ALTERADA: "list.modal.webhookEvents.items.leadStageChanged",

  LEAD_PERDIDO: "list.modal.webhookEvents.items.leadLost",

  LEAD_CONVERTIDO: "list.modal.webhookEvents.items.leadConverted",

  LEAD_RESPONSAVEL_ALTERADO: "list.modal.webhookEvents.items.leadOwnerChanged",

  TAREFA_CRIADA: "list.modal.webhookEvents.items.taskCreated",

  TAREFA_CONCLUIDA: "list.modal.webhookEvents.items.taskCompleted",
};

const CHAVES_TIPO = {
  WEBHOOK_ENTRADA: "list.types.webhookIn",
  WEBHOOK_SAIDA: "list.types.webhookOut",
  META_LEAD_ADS: "list.types.metaLeadAds",
  GOOGLE_LEAD_FORM: "list.types.googleLeadForm",
  API: "list.types.api",
  IMPORTACAO: "list.types.import",
  OUTRA: "list.types.other",
} as const;

const CHAVES_DESCRICAO_TIPO = {
  WEBHOOK_ENTRADA: "list.typeDescriptions.webhookIn",
  WEBHOOK_SAIDA: "list.typeDescriptions.webhookOut",
  META_LEAD_ADS: "list.typeDescriptions.metaLeadAds",
  GOOGLE_LEAD_FORM: "list.typeDescriptions.googleLeadForm",
  API: "list.typeDescriptions.api",
  IMPORTACAO: "list.typeDescriptions.import",
  OUTRA: "list.typeDescriptions.other",
} as const;

const CHAVES_STATUS = {
  INATIVA: "list.statuses.inactive",
  ATIVA: "list.statuses.active",
  PAUSADA: "list.statuses.paused",
  ERRO: "list.statuses.error",
  REVOGADA: "list.statuses.revoked",
} as const;

function chaveTipo(tipo: TipoIntegracao) {
  return CHAVES_TIPO[tipo];
}

function chaveDescricaoTipo(tipo: TipoIntegracao) {
  return CHAVES_DESCRICAO_TIPO[tipo];
}

function chaveStatus(status: StatusIntegracao) {
  return CHAVES_STATUS[status];
}

function classeStatus(status: StatusIntegracao) {
  if (status === "ATIVA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "ERRO") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "PAUSADA") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "REVOGADA") {
    return "border-slate-300 bg-slate-100 text-slate-600";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
}

function formatarData(
  valor: string | null | undefined,
  locale: string,
  nunca: string,
) {
  if (!valor) {
    return nunca;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return nunca;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

type OpcaoSeletor = {
  value: string;
  label: string;
};

function SeletorIntegracao({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  options: OpcaoSeletor[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fecharFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharFora);

    return () => {
      document.removeEventListener("mousedown", fecharFora);
    };
  }, []);

  const selecionada =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <div ref={ref} className="phanyx-integracao-select relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        className="phanyx-integracao-select-button flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">{selecionada?.label ?? ""}</span>

        <span aria-hidden="true" className="text-[10px]">
          {aberto ? "▲" : "▼"}
        </span>
      </button>

      {aberto && !disabled && (
        <div
          role="listbox"
          className="phanyx-integracao-select-menu absolute left-0 right-0 top-full z-[220] mt-1 max-h-64 overflow-y-auto rounded-xl p-1 shadow-2xl"
        >
          {options.map((option) => {
            const ativa = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={ativa}
                onClick={() => {
                  onChange(option.value);
                  setAberto(false);
                }}
                className={`phanyx-integracao-select-option block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  ativa ? "is-selected" : ""
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function IntegracoesCaptacaoPage() {
  const t = useTranslations("AdminCommercialIntegrations");

  const locale = useLocale();

  const [dados, setDados] = useState<RespostaLista | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [atualizando, setAtualizando] = useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const [busca, setBusca] = useState("");

  const [buscaAplicada, setBuscaAplicada] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("");

  const [filtroAtivo, setFiltroAtivo] = useState("");

  const [modalNova, setModalNova] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");

  const [tipo, setTipo] = useState<TipoIntegracao>("WEBHOOK_ENTRADA");

  const [ativarAgora, setAtivarAgora] = useState(false);

  const [canalId, setCanalId] = useState("");

  const [campanhaId, setCampanhaId] = useState("");

  const [formularioId, setFormularioId] = useState("");

  const [urlEndpoint, setUrlEndpoint] = useState("");

  const [eventosAssinados, setEventosAssinados] = useState<
    EventoSaidaCaptacao[]
  >([...EVENTOS_SAIDA_DISPONIVEIS]);

  const [credenciais, setCredenciais] = useState<CredenciaisCriadas | null>(
    null,
  );

  const carregar = useCallback(
    async (silencioso = false) => {
      try {
        if (silencioso) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        setErro("");

        const params = new URLSearchParams();

        if (buscaAplicada.trim()) {
          params.set("busca", buscaAplicada.trim());
        }

        if (filtroTipo) {
          params.set("tipo", filtroTipo);
        }

        if (filtroStatus) {
          params.set("status", filtroStatus);
        }

        if (filtroAtivo) {
          params.set("ativo", filtroAtivo);
        }

        const query = params.toString();

        const resposta = await fetch(
          `/api/admin/comercial/captacao/integracoes${
            query ? `?${query}` : ""
          }`,
          {
            cache: "no-store",
          },
        );

        const json = (await resposta.json().catch(() => null)) as
          | RespostaLista
          | RespostaErro
          | null;

        if (!resposta.ok || !json || json.success !== true) {
          throw new Error(
            json && "error" in json
              ? json.error || t("errors.load")
              : t("errors.load"),
          );
        }

        setDados(json);
      } catch (error) {
        setErro(error instanceof Error ? error.message : t("errors.load"));
      } finally {
        setCarregando(false);

        setAtualizando(false);
      }
    },
    [buscaAplicada, filtroTipo, filtroStatus, filtroAtivo, t],
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!mensagem) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMensagem("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [mensagem]);

  const campanhasDisponiveis = useMemo(() => {
    if (!dados) {
      return [];
    }

    if (!canalId) {
      return dados.referencias.campanhas;
    }

    return dados.referencias.campanhas.filter(
      (campanha) => !campanha.canalId || String(campanha.canalId) === canalId,
    );
  }, [dados, canalId]);

  const formulariosDisponiveis = useMemo(() => {
    if (!dados) {
      return [];
    }

    return dados.referencias.formularios.filter((formulario) => {
      if (
        canalId &&
        formulario.canalId &&
        String(formulario.canalId) !== canalId
      ) {
        return false;
      }

      if (
        campanhaId &&
        formulario.campanhaId &&
        String(formulario.campanhaId) !== campanhaId
      ) {
        return false;
      }

      return true;
    });
  }, [dados, canalId, campanhaId]);

  function alternarEventoSaida(evento: EventoSaidaCaptacao) {
    setEventosAssinados((atuais) =>
      atuais.includes(evento)
        ? atuais.filter((item) => item !== evento)
        : [...atuais, evento],
    );
  }

  function limparFormulario() {
    setNome("");
    setTipo("WEBHOOK_ENTRADA");
    setAtivarAgora(false);
    setCanalId("");
    setCampanhaId("");
    setFormularioId("");
    setUrlEndpoint("");
    setEventosAssinados([...EVENTOS_SAIDA_DISPONIVEIS]);
  }

  function abrirNova() {
    limparFormulario();
    setErro("");
    setModalNova(true);
  }

  async function criarIntegracao(event: FormEvent) {
    event.preventDefault();

    if (!nome.trim()) {
      setErro(t("errors.nameRequired"));

      return;
    }

    if (tipo === "WEBHOOK_SAIDA" && !urlEndpoint.trim()) {
      setErro(t("errors.endpointRequired"));

      return;
    }

    if (tipo === "WEBHOOK_SAIDA" && eventosAssinados.length === 0) {
      setErro(t("errors.atLeastOneWebhookEvent"));

      return;
    }

    try {
      setSalvando(true);

      setErro("");
      setMensagem("");

      const resposta = await fetch(
        "/api/admin/comercial/captacao/integracoes",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            nome: nome.trim(),

            tipo,

            status: ativarAgora ? "ATIVA" : "INATIVA",

            ativo: ativarAgora,

            canalId: canalId ? Number(canalId) : null,

            campanhaId: campanhaId ? Number(campanhaId) : null,

            formularioId: formularioId ? Number(formularioId) : null,

            urlEndpoint: urlEndpoint.trim() || null,

            eventosAssinados:
              tipo === "WEBHOOK_SAIDA" ? eventosAssinados : null,
          }),
        },
      );

      const json = (await resposta.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        message?: string;

        credenciais?: {
          chavePublica: string;
          segredo: string | null;
          exibirUmaUnicaVez: boolean;
        };
      } | null;

      if (!resposta.ok || !json?.success) {
        throw new Error(json?.error || t("errors.create"));
      }

      setModalNova(false);

      limparFormulario();

      if (json.credenciais && json.credenciais.exibirUmaUnicaVez) {
        setCredenciais(json.credenciais);
      }

      setMensagem(json.message || t("success.created"));

      await carregar(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("errors.create"));
    } finally {
      setSalvando(false);
    }
  }

  function aplicarFiltros(event?: FormEvent) {
    event?.preventDefault();

    setBuscaAplicada(busca);
  }

  function limparFiltros() {
    setBusca("");
    setBuscaAplicada("");
    setFiltroTipo("");
    setFiltroStatus("");
    setFiltroAtivo("");
  }

  if (carregando && !dados) {
    return (
      <div className="captacao-integracoes-page min-h-screen p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="phanyx-card rounded-3xl p-8 shadow-sm">
            <p className="font-semibold">{t("list.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="captacao-integracoes-page min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="phanyx-admin-hero rounded-3xl border p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/comercial/captacao"
                className="text-sm font-bold text-slate-500"
              >
                {t("list.back")}
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <div className="captacao-integracoes-hero-icon flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white">
                  🔌
                </div>

                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    {t("list.title")}
                  </h1>

                  <p className="mt-1 text-sm text-slate-600">
                    {t("list.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {dados?.permissoes.podeGerenciar && (
                <button
                  type="button"
                  onClick={abrirNova}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  {t("list.newIntegration")}
                </button>
              )}

              <button
                type="button"
                onClick={() => void carregar(true)}
                disabled={atualizando}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm disabled:opacity-60"
              >
                {atualizando ? t("common.refreshing") : t("common.refresh")}
              </button>
            </div>
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
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                  {t("list.summary.active")}
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.ativas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  {t("list.summary.activeHelp")}
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  {t("list.summary.paused")}
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.pausadas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  {t("list.summary.pausedHelp")}
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  {t("list.summary.error")}
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.comErro}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  {t("list.summary.errorHelp")}
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  {t("list.summary.revoked")}
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.revogadas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  {t("list.summary.revokedHelp")}
                </p>
              </div>
            </section>

            <form
              onSubmit={aplicarFiltros}
              className="phanyx-card rounded-3xl p-5 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("common.search")}
                  </label>

                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder={t("list.filters.searchPlaceholder")}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("common.type")}
                  </label>

                  <SeletorIntegracao
                    value={filtroTipo}
                    onChange={setFiltroTipo}
                    options={[
                      {
                        value: "",
                        label: t("list.filters.allTypes"),
                      },
                      ...dados.tiposDisponiveis.map((item) => ({
                        value: item,
                        label: t(chaveTipo(item)),
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("common.status")}
                  </label>

                  <SeletorIntegracao
                    value={filtroStatus}
                    onChange={setFiltroStatus}
                    options={[
                      {
                        value: "",
                        label: t("common.allFeminine"),
                      },
                      ...dados.statusDisponiveis.map((item) => ({
                        value: item,
                        label: t(chaveStatus(item)),
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("common.availability")}
                  </label>

                  <SeletorIntegracao
                    value={filtroAtivo}
                    onChange={setFiltroAtivo}
                    options={[
                      {
                        value: "",
                        label: t("common.allFeminine"),
                      },
                      {
                        value: "true",
                        label: t("list.filters.enabled"),
                      },
                      {
                        value: "false",
                        label: t("list.filters.disabled"),
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
                >
                  {t("common.clear")}
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  {t("common.filter")}
                </button>
              </div>
            </form>

            <section className="phanyx-card overflow-hidden rounded-3xl shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-xl font-black">
                  {t("list.configured.title")}
                </h2>

                <p className="phanyx-muted mt-1 text-sm">
                  {t("list.configured.results", {
                    count: dados.integracoes.length,
                  })}
                </p>
              </div>

              {dados.integracoes.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl">🔌</div>

                  <h3 className="mt-3 text-lg font-black">
                    {t("list.configured.emptyTitle")}
                  </h3>

                  <p className="phanyx-muted mx-auto mt-2 max-w-lg text-sm leading-6">
                    {t("list.configured.emptyDescription")}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dados.integracoes.map((integracao) => (
                    <article key={integracao.id} className="p-5">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">
                              {integracao.nome}
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatus(
                                integracao.status,
                              )}`}
                            >
                              {t(chaveStatus(integracao.status))}
                            </span>
                          </div>

                          <p className="phanyx-muted mt-1 text-sm">
                            {t(chaveTipo(integracao.tipo))}
                          </p>

                          <p className="phanyx-muted mt-1 text-xs leading-5">
                            {t(chaveDescricaoTipo(integracao.tipo))}
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-bold uppercase text-slate-500">
                                {t("common.channel")}
                              </p>

                              <p className="mt-1 text-sm font-bold">
                                {integracao.canal?.nome ||
                                  t("common.notLinkedMasculine")}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-bold uppercase text-slate-500">
                                {t("common.campaign")}
                              </p>

                              <p className="mt-1 text-sm font-bold">
                                {integracao.campanha?.nome ||
                                  t("common.notLinkedFeminine")}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-bold uppercase text-slate-500">
                                {t("list.card.receipts")}
                              </p>

                              <p className="mt-1 text-sm font-bold">
                                {integracao._count.submissoes}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-bold uppercase text-slate-500">
                                {t("common.lastSuccess")}
                              </p>

                              <p className="mt-1 text-sm font-bold">
                                {formatarData(
                                  integracao.ultimoSucessoEm,
                                  locale,
                                  t("common.never"),
                                )}
                              </p>
                            </div>
                          </div>

                          {integracao.status === "ERRO" &&
                            integracao.ultimoErro && (
                              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                <p className="font-bold">
                                  {t("common.whatHappened")}
                                </p>

                                <p className="mt-1 leading-6">
                                  {integracao.ultimoErro}
                                </p>
                              </div>
                            )}
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/comercial/captacao/integracoes/${integracao.id}`}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-100"
                          >
                            {t("common.viewDetails")}
                          </Link>

                          <span className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold">
                            {integracao.possuiSegredo
                              ? t("list.card.credentialConfigured")
                              : t("list.card.credentialNotRequired")}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {modalNova && dados && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/65 p-4">
          <form
            onSubmit={criarIntegracao}
            className="phanyx-card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-black">{t("list.modal.title")}</h2>

            <p className="phanyx-muted mt-1 text-sm leading-6">
              {t("list.modal.description")}
            </p>

            <div className="mt-6 space-y-5 pb-32">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  {t("common.integrationName")}
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={t("list.modal.namePlaceholder")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  {t("list.modal.integrationMethod")}
                </label>

                <SeletorIntegracao
                  value={tipo}
                  onChange={(value) => setTipo(value as TipoIntegracao)}
                  options={dados.tiposDisponiveis.map((item) => ({
                    value: item,
                    label: t(chaveTipo(item)),
                  }))}
                />

                <p className="phanyx-muted mt-2 text-xs leading-5">
                  {t(chaveDescricaoTipo(tipo))}
                </p>
              </div>

              {tipo === "WEBHOOK_SAIDA" && (
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("list.modal.destinationAddress")}
                  </label>

                  <input
                    type="url"
                    value={urlEndpoint}
                    onChange={(e) => setUrlEndpoint(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>
              )}

              {tipo === "WEBHOOK_SAIDA" && (
                <section className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-black">
                        {t("list.modal.webhookEvents.title")}
                      </h3>

                      <p className="phanyx-muted mt-1 text-xs leading-5">
                        {t("list.modal.webhookEvents.help")}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEventosAssinados([...EVENTOS_SAIDA_DISPONIVEIS])
                        }
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold transition hover:bg-slate-100"
                      >
                        {t("list.modal.webhookEvents.selectAll")}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventosAssinados([])}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold transition hover:bg-slate-100"
                      >
                        {t("list.modal.webhookEvents.clearAll")}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {EVENTOS_SAIDA_DISPONIVEIS.map((evento) => {
                      const selecionado = eventosAssinados.includes(evento);

                      return (
                        <label
                          key={evento}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => alternarEventoSaida(evento)}
                            className="mt-0.5 h-4 w-4 shrink-0"
                          />

                          <span className="min-w-0">
                            <span className="block text-sm font-bold">
                              {t(CHAVES_EVENTOS_SAIDA[evento])}
                            </span>

                            <span className="phanyx-muted mt-1 block break-all font-mono text-[10px]">
                              {evento}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-black">
                  {t("list.modal.captureOrganization")}
                </h3>

                <p className="phanyx-muted mt-1 text-xs leading-5">
                  {t("list.modal.captureOrganizationHelp")}
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      {t("common.channel")}
                    </label>

                    <SeletorIntegracao
                      value={canalId}
                      onChange={(value) => {
                        setCanalId(value);

                        setCampanhaId("");

                        setFormularioId("");
                      }}
                      options={[
                        {
                          value: "",
                          label: t("common.noLink"),
                        },
                        ...dados.referencias.canais.map((item) => ({
                          value: String(item.id),
                          label: item.nome,
                        })),
                      ]}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      {t("common.campaign")}
                    </label>

                    <SeletorIntegracao
                      value={campanhaId}
                      onChange={(value) => {
                        setCampanhaId(value);

                        setFormularioId("");
                      }}
                      options={[
                        {
                          value: "",
                          label: t("common.noLink"),
                        },
                        ...campanhasDisponiveis.map((item) => ({
                          value: String(item.id),
                          label: item.nome,
                        })),
                      ]}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold">
                      {t("common.form")}
                    </label>

                    <SeletorIntegracao
                      value={formularioId}
                      onChange={setFormularioId}
                      options={[
                        {
                          value: "",
                          label: t("common.noLink"),
                        },
                        ...formulariosDisponiveis.map((item) => ({
                          value: String(item.id),
                          label: item.titulo || item.nome,
                        })),
                      ]}
                    />
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={ativarAgora}
                  onChange={(e) => setAtivarAgora(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block font-bold">
                    {t("list.modal.activateNow")}
                  </span>

                  <span className="phanyx-muted mt-1 block text-xs leading-5">
                    {t("list.modal.activateHelp")}
                  </span>
                </span>
              </label>
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 pb-1 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalNova(false)}
                disabled={salvando}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
              >
                {t("common.cancel")}
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {salvando ? t("common.creating") : t("list.modal.create")}
              </button>
            </div>
          </form>
        </div>
      )}

      {credenciais && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="phanyx-card w-full max-w-xl rounded-3xl p-6 shadow-2xl">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-black">{t("credentials.saveNow")}</p>

              <p className="mt-1 text-sm leading-6">
                {t("credentials.secretWarning")}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">
                  {t("credentials.publicKey")}
                </p>

                <p className="mt-2 break-all font-mono text-sm font-bold">
                  {credenciais.chavePublica}
                </p>
              </div>

              {credenciais.segredo && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {t("credentials.secret")}
                  </p>

                  <p className="mt-2 break-all font-mono text-sm font-bold">
                    {credenciais.segredo}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCredenciais(null)}
                className="rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-700"
              >
                {t("credentials.saved")}
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .captacao-integracoes-page .phanyx-integracao-select-button {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
        }

        .captacao-integracoes-page .phanyx-integracao-select-menu {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
        }

        .captacao-integracoes-page .phanyx-integracao-select-option:hover,
        .captacao-integracoes-page
          .phanyx-integracao-select-option.is-selected {
          background: #e2e8f0;
        }

        html[data-theme="dark"]
          .captacao-integracoes-page
          .phanyx-integracao-select-button {
          border-color: #1e3a8a;
          background: #0f172a;
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .captacao-integracoes-page
          .phanyx-integracao-select-menu {
          border-color: #1e3a8a;
          background: #111827;
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .captacao-integracoes-page
          .phanyx-integracao-select-option:hover,
        html[data-theme="dark"]
          .captacao-integracoes-page
          .phanyx-integracao-select-option.is-selected {
          background: #1e3a8a;
        }

        html[data-theme="system"]
          .captacao-integracoes-page
          .phanyx-integracao-select-button {
          border-color: #686868;
          background: #414141;
          color: #ffffff;
        }

        html[data-theme="system"]
          .captacao-integracoes-page
          .phanyx-integracao-select-menu {
          border-color: #686868;
          background: #383838;
          color: #ffffff;
        }

        html[data-theme="system"]
          .captacao-integracoes-page
          .phanyx-integracao-select-option:hover,
        html[data-theme="system"]
          .captacao-integracoes-page
          .phanyx-integracao-select-option.is-selected {
          background: #666666;
        }
      `}</style>
    </div>
  );
}
