"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type PermissoesTimeline = {
  podeVerHistorico: boolean;
  podeVerTodos: boolean;
  somenteMeus: boolean;
  podeInteragir: boolean;
  podeEditar: boolean;
  podeMovimentar: boolean;
  podeTransferir: boolean;
  podeCriarTarefa: boolean;
  podeConverter: boolean;
  podeRegistrarPerda: boolean;
  podeArquivar: boolean;
  podeRestaurar: boolean;
};

type Referencia = {
  id: number;
  nome: string;
};

type EventoTimeline = {
  id: string;
  tipo:
  | "CRIACAO"
  | "INTERACAO"
  | "MOVIMENTACAO_FUNIL"
  | "TRANSFERENCIA"
  | "TAREFA"
  | "PERDA"
  | "ARQUIVAMENTO"
  | "RESTAURACAO"
  | "CONVERSAO";
  subtipo: string;
  titulo: string;
  descricao: string | null;
  ocorridoEm: string;
  usuario: {
    id: number | null;
    nome: string | null;
  } | null;
  metadados: Record<string, unknown>;
};

type RespostaTimeline = {
  success: boolean;
  error?: string;
  codigo?: string;
  permissoes: PermissoesTimeline;
  lead: {
    id: number;
    nome: string;
    email: string;
    telefone: string | null;
    instituicaoNome: string | null;
    cargo: string | null;
    origem: string;
    tipo: string;
    interesse: string | null;
    observacoes: string | null;
    status: string;
    prioridade: string;
    valorEstimado: number | null;
    proximoContatoEm: string | null;
    primeiroContatoEm: string | null;
    ultimoContatoEm: string | null;
    qualificadoEm: string | null;
    entrouEtapaEm: string | null;
    perdidoEm: string | null;
    encerradoEm: string | null;
    arquivadoEm: string | null;
    restauradoEm: string | null;
    createdAt: string;
    updatedAt: string;
    responsavel: {
      id: number | null;
      nome: string | null;
      cargo: string | null;
    } | null;
    equipe: Referencia | null;
    funil: Referencia | null;
    etapa:
    | (Referencia & {
      categoria: string;
      resultado: string;
      ordem: number;
      cor: string;
    })
    | null;
    motivoPerda:
    | (Referencia & {
      categoria: string;
      observacao: string | null;
    })
    | null;
    curso: Referencia | null;
    polo: Referencia | null;
    matricula: {
      id: number;
      numeroMatricula: string | null;
      status: string;
      alunoId: number;
      cursoId: number | null;
      poloId: number | null;
      vendedorResponsavelId: number | null;
      vendedorResponsavelNomeSnapshot: string | null;
      origemComercial: string | null;
      campanhaComercial: string | null;
      confirmadaEm: string | null;
      createdAt: string;
    } | null;
  };
  marcos: {
    criadoEm: string;
    primeiroContatoEm: string | null;
    qualificadoEm: string | null;
    entrouEtapaEm: string | null;
    perdidoEm: string | null;
    encerradoEm: string | null;
    arquivadoEm: string | null;
    restauradoEm: string | null;
    convertidoEm: string | null;
  };
  resumo: {
    totalEventos: number;
    totalInteracoes: number;
    totalMovimentacoes: number;
    totalTransferencias: number;
    totalTarefas: number;
    tarefasPendentes: number;
    possuiMatricula: boolean;
    ultimaAtividadeEm: string;
  };
  eventos: EventoTimeline[];
  paginacao: {
    pagina: number;
    limite: number;
    totalItens: number;
    totalPaginas: number;
    temAnterior: boolean;
    temProxima: boolean;
  };
};

type TipoInteracao =
  | "WHATSAPP"
  | "LIGACAO"
  | "EMAIL"
  | "REUNIAO"
  | "OBSERVACAO";

type TipoFiltro = "TODOS" | EventoTimeline["tipo"];

const TIPOS_INTERACAO: Array<{
  valor: TipoInteracao;
  chave: string;
  icone: string;
}> = [
  { valor: "WHATSAPP", chave: "whatsapp", icone: "💬" },
  { valor: "LIGACAO", chave: "call", icone: "📞" },
  { valor: "EMAIL", chave: "email", icone: "✉️" },
  { valor: "REUNIAO", chave: "meeting", icone: "👥" },
  { valor: "OBSERVACAO", chave: "note", icone: "📝" },
];

const TIPOS_QUE_REGISTRAM_CONTATO = new Set<string>([
  "WHATSAPP",
  "LIGACAO",
  "EMAIL",
  "REUNIAO",
]);

const FILTROS_EVENTO: Array<{
  valor: TipoFiltro;
  chave: string;
}> = [
  { valor: "TODOS", chave: "all" },
  { valor: "INTERACAO", chave: "contacts" },
  { valor: "MOVIMENTACAO_FUNIL", chave: "funnel" },
  { valor: "TAREFA", chave: "tasks" },
  { valor: "TRANSFERENCIA", chave: "transfers" },
  { valor: "CONVERSAO", chave: "conversion" },
];

const EVENTOS_VISUAIS: Record<
  EventoTimeline["tipo"],
  { icone: string; chave: string }
> = {
  CRIACAO: { icone: "✨", chave: "creation" },
  INTERACAO: { icone: "💬", chave: "contact" },
  MOVIMENTACAO_FUNIL: { icone: "↗", chave: "funnel" },
  TRANSFERENCIA: { icone: "⇄", chave: "transfer" },
  TAREFA: { icone: "✓", chave: "task" },
  PERDA: { icone: "×", chave: "loss" },
  ARQUIVAMENTO: { icone: "📦", chave: "archiving" },
  RESTAURACAO: { icone: "♻", chave: "restoration" },
  CONVERSAO: { icone: "🎓", chave: "conversion" },
};

const ROTULOS_ENUM: Record<string, string> = {
  BAIXA: "enum.low",
  MEDIA: "enum.medium",
  ALTA: "enum.high",
  URGENTE: "enum.urgent",
  NOVO: "enum.new",
  NOVA: "enum.new",
  EM_ATENDIMENTO: "enum.inService",
  QUALIFICADO: "enum.qualified",
  QUALIFICADA: "enum.qualified",
  CONVERTIDO: "enum.converted",
  CONVERTIDA: "enum.converted",
  PERDIDO: "enum.lost",
  PERDIDA: "enum.lost",
  ARQUIVADO: "enum.archived",
  ARQUIVADA: "enum.archived",
  ATIVO: "enum.active",
  ATIVA: "enum.active",
  INATIVO: "enum.inactive",
  INATIVA: "enum.inactive",
  PENDENTE: "enum.pending",
  CONCLUIDO: "enum.completed",
  CONCLUIDA: "enum.completed",
  CANCELADO: "enum.cancelled",
  CANCELADA: "enum.cancelled",
  WHATSAPP: "interactionTypes.whatsapp",
  LIGACAO: "interactionTypes.call",
  EMAIL: "interactionTypes.email",
  REUNIAO: "interactionTypes.meeting",
  OBSERVACAO: "interactionTypes.note",
};

function formatarDataHora(
  valor: string | null | undefined,
  locale: string
) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function formatarData(
  valor: string | null | undefined,
  locale: string
) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
  }).format(data);
}

function formatarMoeda(
  valor: number | null | undefined,
  locale: string
) {
  if (
    valor === null ||
    valor === undefined ||
    Number.isNaN(valor)
  ) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function obterTelefoneWhatsapp(
  telefone?: string | null
) {
  const numeros = String(
    telefone ?? ""
  ).replace(/\D/g, "");

  if (!numeros) return null;

  if (numeros.startsWith("00")) {
    return numeros.slice(2);
  }

  return numeros;
}

function textoMetadado(valor: unknown) {
  return typeof valor === "string" &&
    valor.trim()
    ? valor.trim()
    : null;
}

export default function Lead360Page() {
  const t = useTranslations("AdminCommercialLead360");
  const locale = useLocale();
  const params = useParams();
  const leadId = String(params?.id ?? "");

  function formatarRotulo(
    valor?: string | null
  ) {
    if (!valor) {
      return t("common.notProvided");
    }

    const normalizado = String(valor)
      .trim()
      .toUpperCase();

    const chave = ROTULOS_ENUM[normalizado];

    if (chave) {
      return t(chave);
    }

    return String(valor)
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(
        /(^|\s)\S/g,
        (letra) => letra.toUpperCase()
      );
  }

  function detalheEvento(
    evento: EventoTimeline
  ) {
    if (
      evento.tipo ===
      "MOVIMENTACAO_FUNIL"
    ) {
      const anterior = textoMetadado(
        evento.metadados
          .etapaAnteriorNome
      );

      const nova = textoMetadado(
        evento.metadados
          .etapaNovaNome
      );

      if (anterior && nova) {
        return `${anterior} → ${nova}`;
      }
    }

    if (
      evento.tipo ===
      "TRANSFERENCIA"
    ) {
      const anterior = textoMetadado(
        evento.metadados
          .responsavelAnteriorNome
      );

      const novo = textoMetadado(
        evento.metadados
          .responsavelNovoNome
      );

      if (anterior || novo) {
        return `${
          anterior ??
          t("common.noResponsible")
        } → ${
          novo ??
          t("common.noResponsible")
        }`;
      }

      const equipeAnterior =
        textoMetadado(
          evento.metadados
            .equipeAnteriorNome
        );

      const equipeNova =
        textoMetadado(
          evento.metadados
            .equipeNovaNome
        );

      if (equipeAnterior || equipeNova) {
        return `${
          equipeAnterior ??
          t("common.noTeam")
        } → ${
          equipeNova ??
          t("common.noTeam")
        }`;
      }
    }

    if (evento.tipo === "TAREFA") {
      const data = textoMetadado(
        evento.metadados.agendadaPara
      );

      if (data) {
        return t(
          "timeline.scheduledFor",
          {
            date: formatarDataHora(
              data,
              locale
            ),
          }
        );
      }
    }

    return null;
  }

  const [dados, setDados] = useState<RespostaTimeline | null>(null);
  const [pagina, setPagina] = useState(1);
  const [atualizacao, setAtualizacao] = useState(0);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<TipoFiltro>("TODOS");

  const [modalInteracaoAberto, setModalInteracaoAberto] = useState(false);
  const [tipoInteracao, setTipoInteracao] =
    useState<TipoInteracao>("WHATSAPP");
  const [descricaoInteracao, setDescricaoInteracao] = useState("");
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);
  const [erroInteracao, setErroInteracao] = useState("");
  const [toast, setToast] = useState<
    | {
      tipo: "sucesso" | "erro";
      mensagem: string;
    }
    | null
  >(null);

  useEffect(() => {
    if (!leadId || !/^\d+$/.test(leadId)) {
      setErro(t("errors.invalidLeadId"));
      setCarregandoInicial(false);
      return;
    }

    const controlador = new AbortController();

    async function carregarTimeline() {
      setAtualizando(true);
      setErro("");

      try {
        const resposta = await fetch(
          `/api/admin/leads/${leadId}/timeline?pagina=${pagina}&limite=30`,
          {
            cache: "no-store",
            credentials: "include",
            signal: controlador.signal,
          }
        );

        const payload = (await resposta
          .json()
          .catch(() => null)) as RespostaTimeline | null;

        if (!resposta.ok || !payload?.success) {
          throw new Error(
            payload?.error ?? t("errors.loadLead")
          );
        }

        setDados(payload);

        if (payload.paginacao.pagina !== pagina) {
          setPagina(payload.paginacao.pagina);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : t("errors.loadLead")
        );
      } finally {
        if (!controlador.signal.aborted) {
          setCarregandoInicial(false);
          setAtualizando(false);
        }
      }
    }

    void carregarTimeline();

    return () => {
      controlador.abort();
    };
  }, [atualizacao, leadId, pagina, t]);

  useEffect(() => {
    if (!toast) return;

    const temporizador = window.setTimeout(() => {
      setToast(null);
    }, 4500);

    return () => window.clearTimeout(temporizador);
  }, [toast]);

  useEffect(() => {
    if (!modalInteracaoAberto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !salvandoInteracao) {
        setModalInteracaoAberto(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [modalInteracaoAberto, salvandoInteracao]);

  const eventosVisiveis = useMemo(() => {
    if (!dados) return [];
    if (filtro === "TODOS") return dados.eventos;

    return dados.eventos.filter((evento) => evento.tipo === filtro);
  }, [dados, filtro]);

  const telefoneWhatsapp = obterTelefoneWhatsapp(dados?.lead.telefone);

  function abrirModalInteracao(tipo: TipoInteracao = "WHATSAPP") {
    setTipoInteracao(tipo);
    setDescricaoInteracao("");
    setErroInteracao("");
    setModalInteracaoAberto(true);
  }

  function fecharModalInteracao() {
    if (salvandoInteracao) return;

    setModalInteracaoAberto(false);
    setErroInteracao("");
  }

  async function registrarInteracao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const descricao = descricaoInteracao.trim();

    if (!descricao) {
      setErroInteracao(t("interaction.validationDescription"));
      return;
    }

    setSalvandoInteracao(true);
    setErroInteracao("");

    try {
      const resposta = await fetch(
        `/api/admin/leads/${leadId}/interacoes`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo: tipoInteracao,
            descricao,
          }),
        }
      );

      const payload = (await resposta
        .json()
        .catch(() => null)) as
        | {
          error?: string;
        }
        | null;

      if (!resposta.ok) {
        throw new Error(
          payload?.error ?? t("interaction.errorRegister")
        );
      }

      setModalInteracaoAberto(false);
      setDescricaoInteracao("");
      setPagina(1);
      setAtualizacao((valor) => valor + 1);
      setToast({
        tipo: "sucesso",
        mensagem: t("interaction.successRegistered"),
      });
    } catch (error) {
      setErroInteracao(
        error instanceof Error
          ? error.message
          : t("interaction.errorRegister")
      );
    } finally {
      setSalvandoInteracao(false);
    }
  }

  if (carregandoInicial) {
    return (
      <main className="lead360-page">
        <div className="lead360-container lead360-loading">
          <div className="lead360-spinner" />
          <strong>{t("loading.title")}</strong>
          <span>{t("loading.description")}</span>
        </div>

        <EstilosLead360 />
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="lead360-page">
        <div className="lead360-container">
          <section className="lead360-surface lead360-empty-page">
            <div className="lead360-empty-icon">!</div>
            <h1>{t("empty.title")}</h1>
            <p>{erro || t("empty.notFound")}</p>

            <div className="lead360-row-actions">
              <button
                type="button"
                className="lead360-button lead360-button-primary"
                onClick={() => setAtualizacao((valor) => valor + 1)}
              >
                {t("actions.tryAgain")}
              </button>

              <Link
                href="/admin/comercial/pipeline"
                className="lead360-button lead360-button-secondary"
              >
                {t("actions.backToPipeline")}
              </Link>
            </div>
          </section>
        </div>

        <EstilosLead360 />
      </main>
    );
  }

  const { lead, resumo, marcos, paginacao, permissoes } = dados;

  // Proteção para leads antigos: se os campos de marco ainda não
  // existiam quando a interação foi criada, a própria linha do tempo
  // fornece a data do primeiro contato visível.
  const primeiroContatoNosEventos = dados.eventos
    .filter(
      (evento) =>
        evento.tipo === "INTERACAO" &&
        TIPOS_QUE_REGISTRAM_CONTATO.has(
          String(evento.subtipo ?? "")
            .trim()
            .toUpperCase()
        )
    )
    .reduce<string | null>((maisAntigo, evento) => {
      if (!maisAntigo) return evento.ocorridoEm;

      const atual = new Date(evento.ocorridoEm).getTime();
      const anterior = new Date(maisAntigo).getTime();

      if (Number.isNaN(atual)) return maisAntigo;
      if (Number.isNaN(anterior)) return evento.ocorridoEm;

      return atual < anterior ? evento.ocorridoEm : maisAntigo;
    }, null);

  const primeiroContatoExibido =
    marcos.primeiroContatoEm ??
    lead.primeiroContatoEm ??
    primeiroContatoNosEventos;

  return (
    <main className="lead360-page">
      <div className="lead360-container">
        <header className="lead360-surface lead360-header">
          <div className="lead360-header-copy">
            <div className="lead360-breadcrumb">
              {t("breadcrumb.commercial")} <span>/</span>{" "}
              {t("breadcrumb.leads")} <span>/</span>{" "}
              {t("breadcrumb.lead360")}
            </div>

            <div className="lead360-title-row">
              <div>
                <div className="lead360-eyebrow">
                  {t("header.leadNumber", { id: lead.id })}
                </div>
                <h1>{lead.nome}</h1>
              </div>

              <span
                className={`lead360-priority lead360-priority-${lead.prioridade.toLowerCase()}`}
              >
                {formatarRotulo(lead.prioridade)}
              </span>
            </div>

            <p>{t("header.description")}</p>
          </div>

          <div className="lead360-header-actions">
            <Link
              href="/admin/comercial/pipeline"
              className="lead360-button lead360-button-secondary"
            >
              {t("actions.pipeline")}
            </Link>

            <Link
              href="/admin/leads"
              className="lead360-button lead360-button-secondary"
            >
              {t("actions.leadList")}
            </Link>

            <button
              type="button"
              disabled={atualizando}
              onClick={() => setAtualizacao((valor) => valor + 1)}
              className="lead360-button lead360-button-secondary"
            >
              {atualizando
                ? t("actions.refreshing")
                : t("actions.refresh")}
            </button>

            {permissoes.podeInteragir ? (
              <button
                type="button"
                onClick={() => abrirModalInteracao()}
                className="lead360-button lead360-button-primary"
              >
                {t("actions.registerInteraction")}
              </button>
            ) : null}
          </div>
        </header>

        {erro ? <div className="lead360-inline-error">{erro}</div> : null}

        <section className="lead360-summary-grid">
          <article className="lead360-surface lead360-summary-card">
            <div className="lead360-summary-icon">🧭</div>
            <div>
              <span>{t("summary.currentStage")}</span>
              <strong>
                {lead.etapa?.nome ?? t("common.noStage")}
              </strong>
              <small>
                {lead.funil?.nome ?? t("common.noFunnel")}
              </small>
            </div>
          </article>

          <article className="lead360-surface lead360-summary-card">
            <div className="lead360-summary-icon">👤</div>
            <div>
              <span>{t("summary.responsible")}</span>
              <strong>
                {lead.responsavel?.nome ?? t("common.unassigned")}
              </strong>
              <small>
                {lead.equipe?.nome ?? t("common.noSalesTeam")}
              </small>
            </div>
          </article>

          <article className="lead360-surface lead360-summary-card">
            <div className="lead360-summary-icon">💰</div>
            <div>
              <span>{t("summary.estimatedValue")}</span>
              <strong>
                {formatarMoeda(lead.valorEstimado, locale)}
              </strong>
              <small>{formatarRotulo(lead.status)}</small>
            </div>
          </article>

          <article className="lead360-surface lead360-summary-card">
            <div className="lead360-summary-icon">📅</div>
            <div>
              <span>{t("summary.nextAction")}</span>
              <strong>
                {formatarDataHora(lead.proximoContatoEm, locale)}
              </strong>
              <small>
                {t("summary.pendingTasks", {
                  count: resumo.tarefasPendentes,
                })}
              </small>
            </div>
          </article>
        </section>

        <div className="lead360-layout">
          <div className="lead360-main-column">
            <section className="lead360-surface lead360-contact-card">
              <div>
                <div className="lead360-section-kicker">
                  {t("quickContact.kicker")}
                </div>
                <h2>{t("quickContact.title")}</h2>
                <p>
                  {lead.email}
                  {lead.telefone ? ` · ${lead.telefone}` : ""}
                </p>
              </div>

              <div className="lead360-contact-actions">
                {telefoneWhatsapp ? (
                  <a
                    href={`https://wa.me/${telefoneWhatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="lead360-button lead360-button-whatsapp"
                  >
                    WhatsApp
                  </a>
                ) : null}

                {lead.telefone ? (
                  <a
                    href={`tel:${lead.telefone}`}
                    className="lead360-button lead360-button-secondary"
                  >
                    {t("quickContact.call")}
                  </a>
                ) : null}

                <a
                  href={`mailto:${lead.email}`}
                  className="lead360-button lead360-button-secondary"
                >
                  {t("quickContact.email")}
                </a>

                {permissoes.podeInteragir ? (
                  <button
                    type="button"
                    onClick={() => abrirModalInteracao("OBSERVACAO")}
                    className="lead360-button lead360-button-secondary"
                  >
                    {t("quickContact.addNote")}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="lead360-surface lead360-timeline-card">
              <div className="lead360-section-header">
                <div>
                  <div className="lead360-section-kicker">
                    {t("timeline.eventCount", {
                      count: resumo.totalEventos,
                    })}
                  </div>
                  <h2>{t("timeline.title")}</h2>
                  <p>{t("timeline.description")}</p>
                </div>

                <div
                  className="lead360-filter-row"
                  aria-label={t("timeline.filterAria")}
                >
                  {FILTROS_EVENTO.map((item) => (
                    <button
                      key={item.valor}
                      type="button"
                      onClick={() => setFiltro(item.valor)}
                      className={filtro === item.valor ? "is-active" : ""}
                    >
                      {t(`timeline.filters.${item.chave}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lead360-timeline-list">
                {eventosVisiveis.map((evento) => {
                  const visual = EVENTOS_VISUAIS[evento.tipo];
                  const detalhe = detalheEvento(evento);

                  return (
                    <article
                      key={evento.id}
                      className={`lead360-event lead360-event-${evento.tipo.toLowerCase()}`}
                    >
                      <div className="lead360-event-rail">
                        <div className="lead360-event-icon">{visual.icone}</div>
                        <div className="lead360-event-line" />
                      </div>

                      <div className="lead360-event-body">
                        <div className="lead360-event-heading">
                          <div>
                            <span className="lead360-event-type">
                              {t(`timeline.eventTypes.${visual.chave}`)} ·{" "}
                              {formatarRotulo(evento.subtipo)}
                            </span>
                            <h3>{evento.titulo}</h3>
                          </div>

                          <time>
                            {formatarDataHora(evento.ocorridoEm, locale)}
                          </time>
                        </div>

                        {detalhe ? (
                          <div className="lead360-event-detail">{detalhe}</div>
                        ) : null}

                        {evento.descricao ? <p>{evento.descricao}</p> : null}

                        <div className="lead360-event-footer">
                          <span>
                            {evento.usuario?.nome
                              ? t("timeline.registeredBy", {
                                  name: evento.usuario.nome,
                                })
                              : t("timeline.systemRecord")}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {eventosVisiveis.length === 0 ? (
                  <div className="lead360-timeline-empty">
                    <span>⌛</span>
                    <strong>{t("timeline.emptyTitle")}</strong>
                    <p>{t("timeline.emptyDescription")}</p>
                  </div>
                ) : null}
              </div>

              <footer className="lead360-pagination">
                <span>
                  {t("pagination.page", {
                    current: paginacao.pagina,
                    total: paginacao.totalPaginas,
                  })}
                </span>

                <div>
                  <button
                    type="button"
                    disabled={!paginacao.temAnterior || atualizando}
                    onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
                    className="lead360-button lead360-button-secondary"
                  >
                    {t("pagination.previous")}
                  </button>

                  <button
                    type="button"
                    disabled={!paginacao.temProxima || atualizando}
                    onClick={() => setPagina((valor) => valor + 1)}
                    className="lead360-button lead360-button-secondary"
                  >
                    {t("pagination.next")}
                  </button>
                </div>
              </footer>
            </section>
          </div>

          <aside className="lead360-side-column">
            <section className="lead360-surface lead360-side-card">
              <div className="lead360-section-kicker">
                {t("commercialSummary.kicker")}
              </div>
              <h2>{t("commercialSummary.title")}</h2>

              <dl className="lead360-data-list">
                <div>
                  <dt>{t("commercialSummary.status")}</dt>
                  <dd>{formatarRotulo(lead.status)}</dd>
                </div>
                <div>
                  <dt>{t("commercialSummary.stage")}</dt>
                  <dd>
                    {lead.etapa?.nome ?? t("common.notDefined")}
                  </dd>
                </div>
                <div>
                  <dt>{t("commercialSummary.funnel")}</dt>
                  <dd>
                    {lead.funil?.nome ?? t("common.notDefined")}
                  </dd>
                </div>
                <div>
                  <dt>{t("commercialSummary.responsible")}</dt>
                  <dd>
                    {lead.responsavel?.nome ?? t("common.unassigned")}
                  </dd>
                </div>
                <div>
                  <dt>{t("commercialSummary.team")}</dt>
                  <dd>
                    {lead.equipe?.nome ?? t("common.unassigned")}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="lead360-surface lead360-side-card">
              <div className="lead360-section-kicker">
                {t("interest.kicker")}
              </div>
              <h2>{t("interest.title")}</h2>

              <dl className="lead360-data-list">
                <div>
                  <dt>{t("interest.course")}</dt>
                  <dd>
                    {lead.curso?.nome ??
                      lead.interesse ??
                      t("common.notProvided")}
                  </dd>
                </div>
                <div>
                  <dt>{t("interest.campus")}</dt>
                  <dd>
                    {lead.polo?.nome ?? t("common.notProvided")}
                  </dd>
                </div>
                <div>
                  <dt>{t("interest.organization")}</dt>
                  <dd>
                    {lead.instituicaoNome ?? t("common.notProvided")}
                  </dd>
                </div>
                <div>
                  <dt>{t("interest.source")}</dt>
                  <dd>{formatarRotulo(lead.origem)}</dd>
                </div>
              </dl>

              {lead.observacoes ? (
                <div className="lead360-note">
                  <strong>{t("interest.initialNotes")}</strong>
                  <p>{lead.observacoes}</p>
                </div>
              ) : null}
            </section>

            <section className="lead360-surface lead360-side-card">
              <div className="lead360-section-kicker">
                {t("milestones.kicker")}
              </div>
              <h2>{t("milestones.title")}</h2>

              <div className="lead360-milestones">
                <Marco
                  titulo={t("milestones.created")}
                  data={marcos.criadoEm}
                  concluido
                  locale={locale}
                  pendente={t("milestones.notRecorded")}
                />
                <Marco
                  titulo={t("milestones.firstContact")}
                  data={primeiroContatoExibido}
                  concluido={Boolean(primeiroContatoExibido)}
                  locale={locale}
                  pendente={t("milestones.notRecorded")}
                />
                <Marco
                  titulo={t("milestones.qualified")}
                  data={marcos.qualificadoEm}
                  concluido={Boolean(marcos.qualificadoEm)}
                  locale={locale}
                  pendente={t("milestones.notRecorded")}
                />
                <Marco
                  titulo={t("milestones.converted")}
                  data={marcos.convertidoEm}
                  concluido={Boolean(marcos.convertidoEm)}
                  locale={locale}
                  pendente={t("milestones.notRecorded")}
                />
              </div>
            </section>

            {lead.matricula ? (
              <section className="lead360-surface lead360-side-card lead360-matricula-card">
                <div className="lead360-section-kicker">
                  {t("enrollment.kicker")}
                </div>
                <h2>{t("enrollment.title")}</h2>

                <div className="lead360-matricula-number">
                  {lead.matricula.numeroMatricula ?? `#${lead.matricula.id}`}
                </div>

                <dl className="lead360-data-list">
                  <div>
                    <dt>{t("commercialSummary.status")}</dt>
                    <dd>{formatarRotulo(lead.matricula.status)}</dd>
                  </div>
                  <div>
                    <dt>{t("enrollment.convertedAt")}</dt>
                    <dd>
                      {formatarData(
                        lead.matricula.confirmadaEm ??
                          lead.matricula.createdAt,
                        locale
                      )}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/admin/matriculas?matriculaId=${lead.matricula.id}`}
                  className="lead360-button lead360-button-primary lead360-full-button"
                >
                  {t("enrollment.open")}
                </Link>
              </section>
            ) : null}

            {lead.motivoPerda ? (
              <section className="lead360-surface lead360-side-card lead360-loss-card">
                <div className="lead360-section-kicker">
                  {t("loss.kicker")}
                </div>
                <h2>{lead.motivoPerda.nome}</h2>
                <p>
                  {lead.motivoPerda.observacao ??
                    t("loss.noAdditionalNote")}
                </p>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {modalInteracaoAberto ? (
        <div
          className="lead360-modal-backdrop"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharModalInteracao();
            }
          }}
        >
          <section
            className="lead360-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead360-modal-title"
          >
            <header>
              <div>
                <div className="lead360-section-kicker">
                  {t("interactionModal.kicker")}
                </div>
                <h2 id="lead360-modal-title">
                  {t("interactionModal.title")}
                </h2>
                <p>
                  {t("interactionModal.description", {
                    name: lead.nome,
                  })}
                </p>
              </div>

              <button
                type="button"
                disabled={salvandoInteracao}
                onClick={fecharModalInteracao}
                aria-label={t("actions.close")}
                className="lead360-modal-close"
              >
                ×
              </button>
            </header>

            <form onSubmit={registrarInteracao}>
              <fieldset disabled={salvandoInteracao}>
                <legend>{t("interactionModal.type")}</legend>

                <div className="lead360-interaction-types">
                  {TIPOS_INTERACAO.map((tipo) => (
                    <button
                      key={tipo.valor}
                      type="button"
                      onClick={() => setTipoInteracao(tipo.valor)}
                      className={
                        tipoInteracao === tipo.valor ? "is-active" : ""
                      }
                    >
                      <span>{tipo.icone}</span>
                      {t(`interactionTypes.${tipo.chave}`)}
                    </button>
                  ))}
                </div>

                <label htmlFor="lead360-descricao-interacao">
                  {t("interactionModal.descriptionLabel")}
                </label>

                <textarea
                  id="lead360-descricao-interacao"
                  value={descricaoInteracao}
                  onChange={(evento) =>
                    setDescricaoInteracao(evento.target.value)
                  }
                  rows={6}
                  maxLength={5000}
                  autoFocus
                  placeholder={t("interactionModal.placeholder")}
                />

                <div className="lead360-character-count">
                  {descricaoInteracao.length}/5000
                </div>
              </fieldset>

              {erroInteracao ? (
                <div className="lead360-form-error">{erroInteracao}</div>
              ) : null}

              <footer>
                <button
                  type="button"
                  disabled={salvandoInteracao}
                  onClick={fecharModalInteracao}
                  className="lead360-button lead360-button-secondary"
                >
                  {t("actions.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={salvandoInteracao || !descricaoInteracao.trim()}
                  className="lead360-button lead360-button-primary"
                >
                  {salvandoInteracao
                    ? t("actions.registering")
                    : t("actions.registerInteractionPlain")}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`lead360-toast lead360-toast-${toast.tipo}`}
          role="status"
        >
          {toast.mensagem}
        </div>
      ) : null}

      <EstilosLead360 />
    </main>
  );
}

function Marco({
  titulo,
  data,
  concluido,
  locale,
  pendente,
}: {
  titulo: string;
  data: string | null;
  concluido: boolean;
  locale: string;
  pendente: string;
}) {
  return (
    <div className={`lead360-milestone ${concluido ? "is-done" : ""}`}>
      <div className="lead360-milestone-dot">{concluido ? "✓" : ""}</div>
      <div>
        <strong>{titulo}</strong>
        <span>
          {concluido
            ? formatarDataHora(data, locale)
            : pendente}
        </span>
      </div>
    </div>
  );
}

function EstilosLead360() {
  return (
    <style jsx global>{`
      html[data-theme="light"] .lead360-page {
        --l360-page: #f3f5f8;
        --l360-surface: #ffffff;
        --l360-soft: #f7f9fc;
        --l360-text: #0f172a;
        --l360-muted: #526176;
        --l360-border: #d8e0ea;
        --l360-border-strong: #c7d2e0;
        --l360-shadow: 0 1px 2px rgba(15, 23, 42, 0.08),
          0 14px 32px rgba(15, 23, 42, 0.04);
        --l360-primary: #009c6b;
        --l360-primary-hover: #007f58;
        --l360-primary-text: #ffffff;
        --l360-input: #ffffff;
        --l360-overlay: rgba(15, 23, 42, 0.62);
        --l360-error-bg: #fef2f2;
        --l360-error-text: #991b1b;
        --l360-error-border: #fca5a5;
        --l360-success-bg: #ecfdf5;
        --l360-success-text: #065f46;
        --l360-success-border: #34d399;
      }

      html[data-theme="dark"] .lead360-page {
        --l360-page: #07101f;
        --l360-surface: #111b2b;
        --l360-soft: #1a2638;
        --l360-text: #f8fafc;
        --l360-muted: #b8c4d4;
        --l360-border: #334155;
        --l360-border-strong: #475569;
        --l360-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
        --l360-primary: #10b981;
        --l360-primary-hover: #34d399;
        --l360-primary-text: #04140f;
        --l360-input: #0d1727;
        --l360-overlay: rgba(2, 6, 23, 0.82);
        --l360-error-bg: rgba(69, 10, 10, 0.72);
        --l360-error-text: #fecaca;
        --l360-error-border: #991b1b;
        --l360-success-bg: rgba(6, 78, 59, 0.55);
        --l360-success-text: #d1fae5;
        --l360-success-border: #047857;
      }

      html[data-theme="system"] .lead360-page {
        --l360-page: #f3f5f8;
        --l360-surface: #ffffff;
        --l360-soft: #f7f9fc;
        --l360-text: #0f172a;
        --l360-muted: #526176;
        --l360-border: #d8e0ea;
        --l360-border-strong: #c7d2e0;
        --l360-shadow: 0 1px 2px rgba(15, 23, 42, 0.08),
          0 14px 32px rgba(15, 23, 42, 0.04);
        --l360-primary: #009c6b;
        --l360-primary-hover: #007f58;
        --l360-primary-text: #ffffff;
        --l360-input: #ffffff;
        --l360-overlay: rgba(15, 23, 42, 0.62);
        --l360-error-bg: #fef2f2;
        --l360-error-text: #991b1b;
        --l360-error-border: #fca5a5;
        --l360-success-bg: #ecfdf5;
        --l360-success-text: #065f46;
        --l360-success-border: #34d399;
      }

      @media (prefers-color-scheme: dark) {
        html[data-theme="system"] .lead360-page {
          --l360-page: #262626;
          --l360-surface: #1f1f1f;
          --l360-soft: #303030;
          --l360-text: #fafafa;
          --l360-muted: #c4c4c4;
          --l360-border: #4b4b4b;
          --l360-border-strong: #626262;
          --l360-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
          --l360-primary: #10b981;
          --l360-primary-hover: #34d399;
          --l360-primary-text: #04140f;
          --l360-input: #303030;
          --l360-overlay: rgba(0, 0, 0, 0.72);
          --l360-error-bg: rgba(69, 10, 10, 0.62);
          --l360-error-text: #fecaca;
          --l360-error-border: #991b1b;
          --l360-success-bg: rgba(6, 78, 59, 0.48);
          --l360-success-text: #d1fae5;
          --l360-success-border: #047857;
        }
      }

      .lead360-page {
        --l360-page: #f3f5f8;
        --l360-surface: #ffffff;
        --l360-soft: #f7f9fc;
        --l360-text: #0f172a;
        --l360-muted: #526176;
        --l360-border: #d8e0ea;
        --l360-border-strong: #c7d2e0;
        --l360-shadow: 0 1px 2px rgba(15, 23, 42, 0.08),
          0 14px 32px rgba(15, 23, 42, 0.04);
        --l360-primary: #009c6b;
        --l360-primary-hover: #007f58;
        --l360-primary-text: #ffffff;
        --l360-input: #ffffff;
        --l360-overlay: rgba(15, 23, 42, 0.62);
        --l360-error-bg: #fef2f2;
        --l360-error-text: #991b1b;
        --l360-error-border: #fca5a5;
        --l360-success-bg: #ecfdf5;
        --l360-success-text: #065f46;
        --l360-success-border: #34d399;
        min-height: 100vh;
        background: var(--l360-page);
        color: var(--l360-text);
        padding: 72px 28px 56px;
      }

      .lead360-page *,
      .lead360-page *::before,
      .lead360-page *::after {
        box-sizing: border-box;
      }

      .lead360-container {
        width: min(1180px, 100%);
        margin: 0 auto;
      }

      .lead360-surface {
        background: var(--l360-surface);
        border: 1px solid var(--l360-border);
        box-shadow: var(--l360-shadow);
      }

      .lead360-header {
        display: flex;
        justify-content: space-between;
        gap: 28px;
        padding: 28px;
        border-radius: 24px;
      }

      .lead360-header-copy {
        min-width: 0;
      }

      .lead360-breadcrumb,
      .lead360-eyebrow,
      .lead360-section-kicker {
        color: var(--l360-muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .lead360-breadcrumb span {
        margin: 0 7px;
        color: var(--l360-primary);
      }

      .lead360-title-row {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin-top: 18px;
      }

      .lead360-title-row h1 {
        margin: 3px 0 0;
        font-size: clamp(26px, 3vw, 38px);
        line-height: 1.08;
        font-weight: 950;
        color: var(--l360-text);
      }

      .lead360-header-copy > p,
      .lead360-section-header p,
      .lead360-contact-card p,
      .lead360-modal header p {
        margin: 10px 0 0;
        color: var(--l360-muted);
        line-height: 1.6;
        font-size: 14px;
      }

      .lead360-priority {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 7px 11px;
        border: 1px solid var(--l360-border-strong);
        font-size: 11px;
        font-weight: 900;
      }

      .lead360-priority-alta,
      .lead360-priority-urgente {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fca5a5;
      }

      .lead360-priority-media {
        background: #fef3c7;
        color: #854d0e;
        border-color: #fcd34d;
      }

      .lead360-header-actions,
      .lead360-contact-actions,
      .lead360-row-actions {
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        gap: 10px;
      }

      .lead360-header-actions {
        justify-content: flex-end;
        max-width: 430px;
      }

      .lead360-button {
        display: inline-flex;
        min-height: 44px;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        border: 1px solid transparent;
        padding: 10px 15px;
        font-size: 13px;
        font-weight: 850;
        line-height: 1.2;
        text-decoration: none;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.15s ease,
          border-color 0.15s ease;
      }

      .lead360-button:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .lead360-button:disabled {
        cursor: not-allowed;
        opacity: 0.52;
      }

      .lead360-button-primary {
        background: var(--l360-primary);
        color: var(--l360-primary-text);
        border-color: var(--l360-primary);
      }

      .lead360-button-primary:hover:not(:disabled) {
        background: var(--l360-primary-hover);
        border-color: var(--l360-primary-hover);
      }

      .lead360-button-secondary {
        background: var(--l360-surface);
        color: var(--l360-text);
        border-color: var(--l360-border-strong);
      }

      .lead360-button-secondary:hover:not(:disabled) {
        background: var(--l360-soft);
      }

      .lead360-button-whatsapp {
        background: #0f9f67;
        color: #ffffff;
        border-color: #0f9f67;
      }

      .lead360-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }

      .lead360-summary-card {
        min-width: 0;
        display: flex;
        gap: 13px;
        padding: 20px;
        border-radius: 18px;
      }

      .lead360-summary-icon {
        flex: 0 0 auto;
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        border-radius: 11px;
        background: var(--l360-soft);
        border: 1px solid var(--l360-border);
      }

      .lead360-summary-card span,
      .lead360-summary-card small {
        display: block;
        color: var(--l360-muted);
      }

      .lead360-summary-card span {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .lead360-summary-card strong {
        display: block;
        margin-top: 6px;
        overflow-wrap: anywhere;
        color: var(--l360-text);
        font-size: 16px;
        line-height: 1.25;
      }

      .lead360-summary-card small {
        margin-top: 6px;
        font-size: 11px;
        line-height: 1.35;
      }

      .lead360-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.75fr) minmax(280px, 0.85fr);
        align-items: start;
        gap: 18px;
        margin-top: 18px;
      }

      .lead360-main-column,
      .lead360-side-column {
        display: grid;
        gap: 18px;
        min-width: 0;
      }

      .lead360-contact-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 22px;
        border-radius: 20px;
      }

      .lead360-contact-card h2,
      .lead360-section-header h2,
      .lead360-side-card h2,
      .lead360-modal h2 {
        margin: 5px 0 0;
        color: var(--l360-text);
        font-size: 20px;
        line-height: 1.25;
        font-weight: 950;
      }

      .lead360-timeline-card {
        overflow: hidden;
        border-radius: 22px;
      }

      .lead360-section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 20px;
        padding: 24px;
        border-bottom: 1px solid var(--l360-border);
      }

      .lead360-filter-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 7px;
      }

      .lead360-filter-row button {
        border: 1px solid var(--l360-border-strong);
        border-radius: 999px;
        background: var(--l360-surface);
        color: var(--l360-muted);
        padding: 7px 10px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
      }

      .lead360-filter-row button.is-active {
        background: var(--l360-text);
        color: var(--l360-surface);
        border-color: var(--l360-text);
      }

      .lead360-timeline-list {
        padding: 8px 24px 2px;
      }

      .lead360-event {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr);
        gap: 14px;
      }

      .lead360-event-rail {
        display: flex;
        min-height: 100%;
        flex-direction: column;
        align-items: center;
      }

      .lead360-event-icon {
        z-index: 1;
        display: grid;
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        place-items: center;
        border: 2px solid var(--l360-border-strong);
        border-radius: 50%;
        background: var(--l360-surface);
        color: var(--l360-text);
        font-size: 15px;
        font-weight: 950;
      }

      .lead360-event-line {
        width: 2px;
        flex: 1 1 auto;
        min-height: 22px;
        background: var(--l360-border);
      }

      .lead360-event-body {
        margin-bottom: 14px;
        border: 1px solid var(--l360-border);
        border-radius: 16px;
        background: var(--l360-soft);
        padding: 16px;
      }

      .lead360-event-heading {
        display: flex;
        justify-content: space-between;
        gap: 18px;
      }

      .lead360-event-type {
        color: var(--l360-muted);
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .lead360-event-heading h3 {
        margin: 4px 0 0;
        color: var(--l360-text);
        font-size: 15px;
        line-height: 1.35;
        font-weight: 900;
      }

      .lead360-event-heading time {
        flex: 0 0 auto;
        color: var(--l360-muted);
        font-size: 11px;
        font-weight: 700;
      }

      .lead360-event-body > p {
        margin: 10px 0 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: var(--l360-muted);
        font-size: 13px;
        line-height: 1.6;
      }

      .lead360-event-detail {
        display: inline-flex;
        margin-top: 10px;
        border: 1px solid var(--l360-border-strong);
        border-radius: 9px;
        background: var(--l360-surface);
        color: var(--l360-text);
        padding: 6px 9px;
        font-size: 11px;
        font-weight: 800;
      }

      .lead360-event-footer {
        margin-top: 11px;
        padding-top: 10px;
        border-top: 1px solid var(--l360-border);
        color: var(--l360-muted);
        font-size: 10px;
        font-weight: 700;
      }

      .lead360-event-interacao .lead360-event-icon {
        border-color: #14b8a6;
      }

      .lead360-event-movimentacao_funil .lead360-event-icon {
        border-color: #3b82f6;
      }

      .lead360-event-transferencia .lead360-event-icon {
        border-color: #a855f7;
      }

      .lead360-event-tarefa .lead360-event-icon {
        border-color: #f59e0b;
      }

      .lead360-event-conversao .lead360-event-icon {
        border-color: #10b981;
      }

      .lead360-event-perda .lead360-event-icon {
        border-color: #ef4444;
      }

      .lead360-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 18px 24px;
        border-top: 1px solid var(--l360-border);
      }

      .lead360-pagination > span {
        color: var(--l360-muted);
        font-size: 12px;
        font-weight: 750;
      }

      .lead360-pagination > div {
        display: flex;
        gap: 8px;
      }

      .lead360-side-card {
        border-radius: 20px;
        padding: 22px;
      }

      .lead360-data-list {
        display: grid;
        gap: 0;
        margin: 18px 0 0;
      }

      .lead360-data-list > div {
        display: grid;
        grid-template-columns: minmax(90px, 0.8fr) minmax(0, 1.2fr);
        gap: 12px;
        padding: 11px 0;
        border-top: 1px solid var(--l360-border);
      }

      .lead360-data-list dt,
      .lead360-data-list dd {
        margin: 0;
        overflow-wrap: anywhere;
        font-size: 12px;
        line-height: 1.45;
      }

      .lead360-data-list dt {
        color: var(--l360-muted);
        font-weight: 700;
      }

      .lead360-data-list dd {
        color: var(--l360-text);
        font-weight: 850;
        text-align: right;
      }

      .lead360-note,
      .lead360-loss-card > p {
        margin-top: 16px;
        border: 1px solid var(--l360-border);
        border-radius: 12px;
        background: var(--l360-soft);
        padding: 13px;
        color: var(--l360-muted);
        font-size: 12px;
        line-height: 1.55;
      }

      .lead360-note strong {
        display: block;
        margin-bottom: 6px;
        color: var(--l360-text);
      }

      .lead360-note p {
        margin: 0;
        white-space: pre-wrap;
      }

      .lead360-milestones {
        display: grid;
        gap: 14px;
        margin-top: 18px;
      }

      .lead360-milestone {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        gap: 10px;
        align-items: center;
      }

      .lead360-milestone-dot {
        display: grid;
        width: 26px;
        height: 26px;
        place-items: center;
        border: 2px solid var(--l360-border-strong);
        border-radius: 50%;
        color: #ffffff;
        font-size: 11px;
        font-weight: 950;
      }

      .lead360-milestone.is-done .lead360-milestone-dot {
        border-color: var(--l360-primary);
        background: var(--l360-primary);
        color: var(--l360-primary-text);
      }

      .lead360-milestone strong,
      .lead360-milestone span {
        display: block;
      }

      .lead360-milestone strong {
        color: var(--l360-text);
        font-size: 12px;
      }

      .lead360-milestone span {
        margin-top: 3px;
        color: var(--l360-muted);
        font-size: 10px;
      }

      .lead360-matricula-card {
        border-color: rgba(16, 185, 129, 0.55);
      }

      .lead360-matricula-number {
        margin-top: 16px;
        border: 1px solid rgba(16, 185, 129, 0.45);
        border-radius: 13px;
        background: rgba(16, 185, 129, 0.12);
        color: var(--l360-text);
        padding: 14px;
        font-size: 18px;
        font-weight: 950;
        text-align: center;
      }

      .lead360-full-button {
        width: 100%;
        margin-top: 16px;
      }

      .lead360-loss-card {
        border-color: rgba(239, 68, 68, 0.45);
      }

      .lead360-inline-error,
      .lead360-form-error {
        border: 1px solid var(--l360-error-border);
        border-radius: 12px;
        background: var(--l360-error-bg);
        color: var(--l360-error-text);
        padding: 12px 14px;
        font-size: 12px;
        font-weight: 750;
      }

      .lead360-inline-error {
        margin-top: 14px;
      }

      .lead360-timeline-empty,
      .lead360-empty-page,
      .lead360-loading {
        display: grid;
        justify-items: center;
        text-align: center;
      }

      .lead360-timeline-empty {
        gap: 6px;
        padding: 42px 18px;
        color: var(--l360-muted);
      }

      .lead360-timeline-empty > span {
        font-size: 25px;
      }

      .lead360-timeline-empty strong {
        color: var(--l360-text);
      }

      .lead360-timeline-empty p {
        margin: 0;
        font-size: 12px;
      }

      .lead360-loading {
        gap: 10px;
        min-height: 430px;
        align-content: center;
        color: var(--l360-text);
      }

      .lead360-loading span {
        color: var(--l360-muted);
        font-size: 13px;
      }

      .lead360-spinner {
        width: 38px;
        height: 38px;
        border: 4px solid var(--l360-border);
        border-top-color: var(--l360-primary);
        border-radius: 50%;
        animation: lead360-spin 0.75s linear infinite;
      }

      @keyframes lead360-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .lead360-empty-page {
        gap: 10px;
        margin-top: 60px;
        border-radius: 22px;
        padding: 48px 24px;
      }

      .lead360-empty-page h1,
      .lead360-empty-page p {
        margin: 0;
      }

      .lead360-empty-page p {
        color: var(--l360-muted);
      }

      .lead360-empty-icon {
        display: grid;
        width: 44px;
        height: 44px;
        place-items: center;
        border-radius: 50%;
        background: #fee2e2;
        color: #991b1b;
        font-size: 22px;
        font-weight: 950;
      }

      .lead360-modal-backdrop {
        position: fixed;
        z-index: 10000;
        inset: 0;
        display: grid;
        place-items: center;
        overflow-y: auto;
        background: var(--l360-overlay);
        padding: 24px;
      }

      .lead360-modal {
        width: min(650px, 100%);
        overflow: hidden;
        border: 1px solid var(--l360-border-strong);
        border-radius: 22px;
        background: var(--l360-surface);
        color: var(--l360-text);
        box-shadow: 0 26px 80px rgba(0, 0, 0, 0.35);
      }

      .lead360-modal > header {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        padding: 22px 24px;
        border-bottom: 1px solid var(--l360-border);
      }

      .lead360-modal-close {
        display: grid;
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        place-items: center;
        border: 1px solid var(--l360-border-strong);
        border-radius: 12px;
        background: var(--l360-surface);
        color: var(--l360-text);
        font-size: 25px;
        line-height: 1;
        cursor: pointer;
      }

      .lead360-modal form {
        padding: 22px 24px 24px;
      }

      .lead360-modal fieldset {
        margin: 0;
        padding: 0;
        border: 0;
      }

      .lead360-modal legend,
      .lead360-modal label {
        display: block;
        margin-bottom: 9px;
        color: var(--l360-text);
        font-size: 13px;
        font-weight: 900;
      }

      .lead360-interaction-types {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 20px;
      }

      .lead360-interaction-types button {
        display: grid;
        justify-items: center;
        gap: 5px;
        min-width: 0;
        border: 1px solid var(--l360-border-strong);
        border-radius: 12px;
        background: var(--l360-surface);
        color: var(--l360-text);
        padding: 10px 5px;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
      }

      .lead360-interaction-types button span {
        font-size: 17px;
      }

      .lead360-interaction-types button.is-active {
        border-color: var(--l360-primary);
        background: rgba(16, 185, 129, 0.14);
        box-shadow: inset 0 0 0 1px var(--l360-primary);
      }

      .lead360-modal textarea {
        width: 100%;
        resize: vertical;
        border: 1px solid var(--l360-border-strong);
        border-radius: 13px;
        outline: none;
        background: var(--l360-input);
        color: var(--l360-text);
        padding: 13px 14px;
        font: inherit;
        font-size: 13px;
        line-height: 1.55;
      }

      .lead360-modal textarea::placeholder {
        color: var(--l360-muted);
        opacity: 0.82;
      }

      .lead360-modal textarea:focus {
        border-color: var(--l360-primary);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16);
      }

      .lead360-character-count {
        margin-top: 6px;
        color: var(--l360-muted);
        font-size: 10px;
        text-align: right;
      }

      .lead360-form-error {
        margin-top: 14px;
      }

      .lead360-modal form > footer {
        display: flex;
        justify-content: flex-end;
        gap: 9px;
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid var(--l360-border);
      }

      .lead360-toast {
        position: fixed;
        z-index: 11000;
        right: 24px;
        bottom: 24px;
        max-width: min(390px, calc(100vw - 48px));
        border: 1px solid;
        border-radius: 13px;
        padding: 13px 16px;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
        font-size: 13px;
        font-weight: 850;
      }

      .lead360-toast-sucesso {
        border-color: var(--l360-success-border);
        background: var(--l360-success-bg);
        color: var(--l360-success-text);
      }

      .lead360-toast-erro {
        border-color: var(--l360-error-border);
        background: var(--l360-error-bg);
        color: var(--l360-error-text);
      }

      @media (max-width: 1050px) {
        .lead360-summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .lead360-layout {
          grid-template-columns: 1fr;
        }

        .lead360-side-column {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .lead360-page {
          padding: 28px 14px 42px;
        }

        .lead360-header,
        .lead360-contact-card,
        .lead360-section-header {
          align-items: stretch;
          flex-direction: column;
        }

        .lead360-header-actions,
        .lead360-contact-actions,
        .lead360-filter-row {
          justify-content: flex-start;
        }

        .lead360-header-actions {
          max-width: none;
        }

        .lead360-side-column {
          grid-template-columns: 1fr;
        }

        .lead360-event-heading {
          flex-direction: column;
          gap: 7px;
        }

        .lead360-interaction-types {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 520px) {
        .lead360-summary-grid {
          grid-template-columns: 1fr;
        }

        .lead360-header,
        .lead360-contact-card,
        .lead360-section-header,
        .lead360-side-card,
        .lead360-modal > header,
        .lead360-modal form {
          padding-left: 18px;
          padding-right: 18px;
        }

        .lead360-header-actions .lead360-button,
        .lead360-contact-actions .lead360-button {
          flex: 1 1 145px;
        }

        .lead360-timeline-list {
          padding-left: 14px;
          padding-right: 14px;
        }

        .lead360-event {
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 9px;
        }

        .lead360-event-icon {
          width: 32px;
          height: 32px;
          font-size: 13px;
        }

        .lead360-pagination {
          align-items: stretch;
          flex-direction: column;
        }

        .lead360-pagination > div,
        .lead360-pagination .lead360-button {
          flex: 1 1 0;
        }

        .lead360-modal-backdrop {
          align-items: end;
          padding: 10px;
        }

        .lead360-modal {
          max-height: calc(100vh - 20px);
          overflow-y: auto;
          border-radius: 20px 20px 12px 12px;
        }
      }
    `}</style>
  );
}