"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

type ItemAcervo = {
  id: number;
  tipo: string;
  status: string;
  modalidade: string;
  titulo: string;
  subtitulo: string | null;
  slug: string;
  isbn10: string | null;
  isbn13: string | null;
  issn: string | null;
  doi: string | null;
  anoPublicacao: number | null;
  capaUrl: string | null;
  miniaturaUrl: string | null;
  destaque: boolean;
  criadoEm: string;
  atualizadoEm: string;
  editora: {
    id: number;
    nome: string;
  } | null;
  autores: Array<{
    funcao: string;
    ordem: number;
    autor: {
      id: number;
      nome: string;
      nomeOrdenacao: string | null;
    };
  }>;
  categorias: Array<{
    principal: boolean;
    categoria: {
      id: number;
      nome: string;
      slug: string;
      cor: string | null;
      icone: string | null;
    };
  }>;
  _count: {
    arquivos: number;
    exemplares: number;
  };
};

type Paginacao = {
  pagina: number;
  porPagina: number;
  total: number;
  totalPaginas: number;
};

type RespostaAcervo = {
  ok?: boolean;
  itens?: ItemAcervo[];
  paginacao?: Paginacao;
  error?: string;
  codigo?: string;
};

type FormularioItem = {
  titulo: string;
  subtitulo: string;
  tipo: string;
  modalidade: string;
  isbn13: string;
  doi: string;
  anoPublicacao: string;
  palavrasChave: string;
  sinopse: string;
  permitirAvaliacao: boolean;
  permitirDownload: boolean;
  acessoLivre: boolean;
};

type Toast = {
  tipo: "sucesso" | "erro";
  mensagem: string;
} | null;

const TIPOS_ITEM = [
  "LIVRO",
  "EBOOK",
  "ARTIGO_CIENTIFICO",
  "REVISTA",
  "PERIODICO",
  "APOSTILA",
  "TCC",
  "MONOGRAFIA",
  "DISSERTACAO",
  "TESE",
  "PESQUISA",
  "DOCUMENTO",
  "VIDEO",
  "DOCUMENTARIO",
  "AUDIO",
  "AUDIOLIVRO",
  "PODCAST",
  "LINK_EXTERNO",
  "OUTRO",
] as const;

const STATUS_ITEM = [
  "RASCUNHO",
  "EM_REVISAO",
  "PUBLICADO",
  "RESTRITO",
  "INDISPONIVEL",
  "ARQUIVADO",
] as const;

const MODALIDADES = [
  "LEITURA_INTERNA",
  "ACESSO_LIVRE",
  "DOWNLOAD_AUTORIZADO",
  "EMPRESTIMO_DIGITAL",
  "EMPRESTIMO_FISICO",
  "STREAMING",
  "LINK_EXTERNO",
] as const;

const FORMULARIO_INICIAL: FormularioItem = {
  titulo: "",
  subtitulo: "",
  tipo: "LIVRO",
  modalidade: "LEITURA_INTERNA",
  isbn13: "",
  doi: "",
  anoPublicacao: "",
  palavrasChave: "",
  sinopse: "",
  permitirAvaliacao: true,
  permitirDownload: false,
  acessoLivre: false,
};

const PAGINACAO_INICIAL: Paginacao = {
  pagina: 1,
  porPagina: 20,
  total: 0,
  totalPaginas: 0,
};

function formatarData(valor: string | null | undefined, locale: string) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function classeStatus(status: string) {
  switch (status) {
    case "PUBLICADO":
      return "bib-status bib-status-success";
    case "EM_REVISAO":
      return "bib-status bib-status-warning";
    case "RESTRITO":
    case "INDISPONIVEL":
      return "bib-status bib-status-danger";
    case "ARQUIVADO":
      return "bib-status bib-status-neutral";
    default:
      return "bib-status bib-status-draft";
  }
}

function identificadorItem(item: ItemAcervo, semIdentificador: string) {
  return (
    item.isbn13 ||
    item.isbn10 ||
    item.issn ||
    item.doi ||
    semIdentificador
  );
}

async function lerJsonSeguro<T>(resposta: Response, mensagemInvalida: string) {
  const tipo = resposta.headers.get("content-type") || "";

  if (!tipo.includes("application/json")) {
    throw new Error(
      mensagemInvalida
    );
  }

  return (await resposta.json()) as T;
}

function EstadoVazio({
  filtrado,
  tituloFiltrado,
  tituloVazio,
  descricaoFiltrada,
  descricaoVazia,
}: {
  filtrado: boolean;
  tituloFiltrado: string;
  tituloVazio: string;
  descricaoFiltrada: string;
  descricaoVazia: string;
}) {
  return (
    <div className="bib-empty">
      <div className="bib-empty-icon" aria-hidden="true">
        📚
      </div>
      <h2>
        {filtrado
          ? tituloFiltrado
          : tituloVazio}
      </h2>
      <p>
        {filtrado
          ? descricaoFiltrada
          : descricaoVazia}
      </p>
    </div>
  );
}

function Esqueleto({ label }: { label: string }) {
  return (
    <div className="bib-list" aria-label={label}>
      {[1, 2, 3].map((item) => (
        <div className="bib-item bib-skeleton" key={item}>
          <span />
          <div>
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BibliotecaAcervoPage() {
  const t = useTranslations("AdminLibraryCollection");
  const tDashboard = useTranslations("AdminLibraryDashboard");
  const locale = useLocale();
  const [itens, setItens] = useState<ItemAcervo[]>([]);
  const [paginacao, setPaginacao] =
    useState<Paginacao>(PAGINACAO_INICIAL);
  const [pagina, setPagina] = useState(1);
  const [buscaDigitada, setBuscaDigitada] =
    useState("");
  const [buscaAplicada, setBuscaAplicada] =
    useState("");
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");
  const [carregando, setCarregando] =
    useState(true);
  const [erro, setErro] = useState("");
  const [atualizacao, setAtualizacao] =
    useState(0);

  const [modalAberto, setModalAberto] =
    useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] =
    useState("");
  const [formulario, setFormulario] =
    useState<FormularioItem>(FORMULARIO_INICIAL);
  const [toast, setToast] = useState<Toast>(null);

  const possuiFiltros = Boolean(
    buscaAplicada || tipo || status
  );

  const totalPaginasExibido = Math.max(
    1,
    paginacao.totalPaginas
  );

  const carregarAcervo = useCallback(
    async (signal?: AbortSignal) => {
      setCarregando(true);
      setErro("");

      try {
        const parametros = new URLSearchParams({
          pagina: String(pagina),
          porPagina: "20",
        });

        if (buscaAplicada) {
          parametros.set("busca", buscaAplicada);
        }
        if (tipo) parametros.set("tipo", tipo);
        if (status) parametros.set("status", status);

        const resposta = await fetch(
          `/api/admin/biblioteca/acervo?${parametros.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal,
          }
        );

        const dados = await lerJsonSeguro<RespostaAcervo>(
          resposta,
          t("errors.invalidApiResponse")
        );

        if (!resposta.ok) {
          throw new Error(
            dados.error ||
            t("errors.loadCollection")
          );
        }

        setItens(Array.isArray(dados.itens) ? dados.itens : []);
        setPaginacao(
          dados.paginacao || PAGINACAO_INICIAL
        );
      } catch (falha) {
        if (
          falha instanceof DOMException &&
          falha.name === "AbortError"
        ) {
          return;
        }

        setErro(
          falha instanceof Error
            ? falha.message
            : t("errors.loadCollection")
        );
        setItens([]);
        setPaginacao(PAGINACAO_INICIAL);
      } finally {
        if (!signal?.aborted) {
          setCarregando(false);
        }
      }
    }, [
    atualizacao,
    buscaAplicada,
    pagina,
    status,
    t,
    tipo,
  ]
  );

  useEffect(() => {
    const controle = new AbortController();

    void carregarAcervo(controle.signal);

    return () => controle.abort();
  }, [carregarAcervo]);

  useEffect(() => {
    if (!toast) return;

    const temporizador = window.setTimeout(
      () => setToast(null),
      4500
    );

    return () => window.clearTimeout(temporizador);
  }, [toast]);

  useEffect(() => {
    if (!modalAberto) return;

    function fecharComEsc(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !salvando) {
        setModalAberto(false);
      }
    }

    document.addEventListener("keydown", fecharComEsc);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        fecharComEsc
      );
      document.body.style.overflow = overflowAnterior;
    };
  }, [modalAberto, salvando]);

  const resumoPagina = useMemo(() => {
    if (paginacao.total === 0) {
      return t("empty.noItemsFound");
    }

    const inicio =
      (paginacao.pagina - 1) * paginacao.porPagina +
      1;
    const fim = Math.min(
      inicio + itens.length - 1,
      paginacao.total
    );

    return t("results.range", {
      start: inicio,
      end: fim,
      total: paginacao.total,
    });
  }, [itens.length, paginacao, t]);

  function aplicarFiltros(evento: FormEvent) {
    evento.preventDefault();
    setPagina(1);
    setBuscaAplicada(buscaDigitada.trim());
  }

  function limparFiltros() {
    setBuscaDigitada("");
    setBuscaAplicada("");
    setTipo("");
    setStatus("");
    setPagina(1);
  }

  function abrirCadastro() {
    setFormulario(FORMULARIO_INICIAL);
    setErroFormulario("");
    setModalAberto(true);
  }

  function fecharCadastro() {
    if (salvando) return;
    setModalAberto(false);
    setErroFormulario("");
  }

  function atualizarFormulario<K extends keyof FormularioItem>(
    campo: K,
    valor: FormularioItem[K]
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function cadastrarItem(evento: FormEvent) {
    evento.preventDefault();
    setErroFormulario("");

    if (!formulario.titulo.trim()) {
      setErroFormulario(t("errors.titleRequired"));
      return;
    }

    setSalvando(true);

    try {
      const palavrasChave = formulario.palavrasChave
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const resposta = await fetch(
        "/api/admin/biblioteca/acervo",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            titulo: formulario.titulo.trim(),
            subtitulo:
              formulario.subtitulo.trim() || null,
            tipo: formulario.tipo,
            modalidade: formulario.modalidade,
            isbn13: formulario.isbn13.trim() || null,
            doi: formulario.doi.trim() || null,
            anoPublicacao: formulario.anoPublicacao
              ? Number(formulario.anoPublicacao)
              : null,
            palavrasChave,
            sinopse: formulario.sinopse.trim() || null,
            permitirAvaliacao:
              formulario.permitirAvaliacao,
            permitirDownload:
              formulario.permitirDownload,
            acessoLivre:
              formulario.modalidade === "ACESSO_LIVRE"
                ? true
                : formulario.acessoLivre,
          }),
        }
      );

      const dados = await lerJsonSeguro<RespostaAcervo>(
        resposta,
        t("errors.invalidApiResponse")
      );

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
          t("errors.createItem")
        );
      }

      setModalAberto(false);
      setFormulario(FORMULARIO_INICIAL);
      setBuscaDigitada("");
      setBuscaAplicada("");
      setTipo("");
      setStatus("RASCUNHO");
      setPagina(1);
      setAtualizacao((valor) => valor + 1);
      setToast({
        tipo: "sucesso",
        mensagem:
          t("success.itemCreated"),
      });
    } catch (falha) {
      setErroFormulario(
        falha instanceof Error
          ? falha.message
          : t("errors.createItem")
      );
    } finally {
      setSalvando(false);
    }
  }

  function rotuloTipo(valor: string) {
    switch (valor) {
      case "LIVRO": return tDashboard("types.book");
      case "EBOOK": return tDashboard("types.ebook");
      case "ARTIGO_CIENTIFICO": return tDashboard("types.scientificArticle");
      case "REVISTA": return tDashboard("types.magazine");
      case "PERIODICO": return tDashboard("types.journal");
      case "APOSTILA": return tDashboard("types.handout");
      case "TCC": return tDashboard("types.finalPaper");
      case "MONOGRAFIA": return tDashboard("types.monograph");
      case "DISSERTACAO": return tDashboard("types.dissertation");
      case "TESE": return tDashboard("types.thesis");
      case "PESQUISA": return tDashboard("types.research");
      case "DOCUMENTO": return tDashboard("types.document");
      case "VIDEO": return tDashboard("types.video");
      case "DOCUMENTARIO": return tDashboard("types.documentary");
      case "AUDIO": return tDashboard("types.audio");
      case "AUDIOLIVRO": return tDashboard("types.audiobook");
      case "PODCAST": return tDashboard("types.podcast");
      case "LINK_EXTERNO": return tDashboard("types.externalLink");
      case "OUTRO": return tDashboard("types.other");
      default: return valor;
    }
  }

  function rotuloStatus(valor: string) {
    switch (valor) {
      case "RASCUNHO": return tDashboard("itemStatus.draft");
      case "EM_REVISAO": return tDashboard("itemStatus.inReview");
      case "PUBLICADO": return tDashboard("itemStatus.published");
      case "RESTRITO": return tDashboard("itemStatus.restricted");
      case "INDISPONIVEL": return tDashboard("itemStatus.unavailable");
      case "ARQUIVADO": return tDashboard("itemStatus.archived");
      default: return valor;
    }
  }

  function rotuloModalidade(valor: string) {
    switch (valor) {
      case "LEITURA_INTERNA": return t("modalities.internalReading");
      case "ACESSO_LIVRE": return t("modalities.openAccess");
      case "DOWNLOAD_AUTORIZADO": return t("modalities.authorizedDownload");
      case "EMPRESTIMO_DIGITAL": return t("modalities.digitalLoan");
      case "EMPRESTIMO_FISICO": return t("modalities.physicalLoan");
      case "STREAMING": return t("modalities.streaming");
      case "LINK_EXTERNO": return t("modalities.externalLink");
      default: return valor;
    }
  }

  const estilos = (
    <style jsx global>{`
      html[data-theme="system"] .phanyx-biblioteca-acervo-page {
        background: #242424 !important;
        color: #ffffff !important;
        color-scheme: dark;
      }

      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-hero,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-card,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-summary-card,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-item,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-modal {
        background: #2d2d2d !important;
        border-color: #505050 !important;
        color: #ffffff !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-input,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page select,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page textarea,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page option,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-cover,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-options {
        background: #383838 !important;
        border-color: #606060 !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-acervo-page h1,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page h2,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page h3,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page label,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-item-title-link,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-summary-card strong {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-acervo-page p,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page small,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-item-meta,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-item-counts,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-result-count,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-summary-card span {
        color: #d1d5db !important;
        -webkit-text-fill-color: #d1d5db !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-button-secondary,
      html[data-theme="system"] .phanyx-biblioteca-acervo-page .bib-button-ghost {
        background: #383838 !important;
        border-color: #666666 !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
    `}</style>
  );

  return (
    <main className="phanyx-biblioteca-acervo-page">
      {estilos}
      <div className="bib-page-shell">
        <header className="bib-hero">
          <div>
            <p className="bib-eyebrow">
              {t("eyebrow")}
            </p>
            <h1>{t("title")}</h1>
            <p className="bib-hero-description">
              {t("description")}
            </p>
          </div>

          <div className="bib-hero-actions">
            <Link
              href="/admin/biblioteca"
              className="bib-button bib-button-secondary"
            >
              {t("backToDashboard")}
            </Link>
            <button
              type="button"
              className="bib-button bib-button-primary"
              onClick={abrirCadastro}
            >
              {t("registerItem")}
            </button>
          </div>
        </header>

        <section className="bib-summary" aria-label={t("summary.ariaLabel")}>
          <div className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              📚
            </span>
            <div>
              <span>{t("summary.totalFound")}</span>
              <strong>{paginacao.total.toLocaleString(locale)}</strong>
            </div>
          </div>

          <div className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              📄
            </span>
            <div>
              <span>{t("summary.currentPage")}</span>
              <strong>
                {paginacao.total === 0
                  ? 0
                  : paginacao.pagina}
              </strong>
            </div>
          </div>

          <div className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              🔎
            </span>
            <div>
              <span>{t("summary.showing")}</span>
              <strong>{itens.length.toLocaleString(locale)}</strong>
            </div>
          </div>
        </section>

        <section className="bib-card bib-filter-card">
          <div className="bib-section-heading">
            <div>
              <h2>{t("filters.title")}</h2>
              <p>
                {t("filters.description")}
              </p>
            </div>
            <span className="bib-result-count">
              {resumoPagina}
            </span>
          </div>

          <form
            className="bib-filter-grid"
            onSubmit={aplicarFiltros}
          >
            <label className="bib-field bib-search-field">
              <span>{t("filters.searchLabel")}</span>
              <input
                className="bib-input"
                type="search"
                value={buscaDigitada}
                onChange={(evento) =>
                  setBuscaDigitada(evento.target.value)
                }
                placeholder={t("filters.searchPlaceholder")}
                maxLength={150}
              />
            </label>

            <label className="bib-field">
              <span>{t("filters.typeLabel")}</span>
              <select
                className="bib-input"
                value={tipo}
                onChange={(evento) => {
                  setTipo(evento.target.value);
                  setPagina(1);
                }}
              >
                <option value="">{t("filters.allTypes")}</option>
                {TIPOS_ITEM.map((item) => (
                  <option value={item} key={item}>
                    {rotuloTipo(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="bib-field">
              <span>{t("filters.statusLabel")}</span>
              <select
                className="bib-input"
                value={status}
                onChange={(evento) => {
                  setStatus(evento.target.value);
                  setPagina(1);
                }}
              >
                <option value="">{t("filters.allStatuses")}</option>
                {STATUS_ITEM.map((item) => (
                  <option value={item} key={item}>
                    {rotuloStatus(item)}
                  </option>
                ))}
              </select>
            </label>

            <div className="bib-filter-actions">
              <button
                className="bib-button bib-button-primary"
                type="submit"
              >
                {t("filters.search")}
              </button>
              <button
                className="bib-button bib-button-ghost"
                type="button"
                onClick={limparFiltros}
                disabled={!possuiFiltros && !buscaDigitada}
              >
                {t("filters.clear")}
              </button>
            </div>
          </form>
        </section>

        <section className="bib-card bib-catalog-card">
          <div className="bib-section-heading bib-catalog-heading">
            <div>
              <h2>{t("catalog.title")}</h2>
              <p>
                {t("catalog.description")}
              </p>
            </div>
            <button
              type="button"
              className="bib-button bib-button-ghost"
              onClick={() =>
                setAtualizacao((valor) => valor + 1)
              }
              disabled={carregando}
            >
              {carregando ? t("catalog.refreshing") : t("catalog.refresh")}
            </button>
          </div>

          {erro ? (
            <div className="bib-feedback bib-feedback-error">
              <div>
                <strong>{t("errors.loadCollectionTitle")}</strong>
                <p>{erro}</p>
              </div>
              <button
                type="button"
                className="bib-button bib-button-danger"
                onClick={() =>
                  setAtualizacao((valor) => valor + 1)
                }
              >
                {t("retry")}
              </button>
            </div>
          ) : carregando ? (
            <Esqueleto label={t("loadingCollection")} />
          ) : itens.length === 0 ? (
            <EstadoVazio
              filtrado={possuiFiltros}
              tituloFiltrado={t("empty.noItemsFound")}
              tituloVazio={t("empty.collectionEmpty")}
              descricaoFiltrada={t("empty.changeFilters")}
              descricaoVazia={t("empty.registerFirstItems")}
            />
          ) : (
            <div className="bib-list">
              {itens.map((item) => (
                <article className="bib-item" key={item.id}>
                  <div className="bib-cover" aria-hidden="true">
                    {item.capaUrl || item.miniaturaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.capaUrl || item.miniaturaUrl || ""}
                        alt=""
                      />
                    ) : (
                      <span>📘</span>
                    )}
                  </div>

                  <div className="bib-item-content">
                    <div className="bib-item-topline">
                      <div className="bib-item-badges">
                        <span className={classeStatus(item.status)}>
                          {rotuloStatus(item.status)}
                        </span>
                        <span className="bib-type-badge">
                          {rotuloTipo(item.tipo)}
                        </span>
                        {item.destaque ? (
                          <span className="bib-highlight-badge">
                            {t("item.featured")}
                          </span>
                        ) : null}
                      </div>
                      <span className="bib-item-id">
                        #{item.id}
                      </span>
                    </div>

                    <h3>
                      <Link
                        href={`/admin/biblioteca/acervo/${item.id}`}
                        className="bib-item-title-link"
                      >
                        {item.titulo}
                      </Link>
                    </h3>
                    {item.subtitulo ? (
                      <p className="bib-subtitle">
                        {item.subtitulo}
                      </p>
                    ) : null}

                    <div className="bib-item-meta">
                      <span>
                        <b>{t("item.modality")}:</b>{" "}
                        {rotuloModalidade(item.modalidade)}
                      </span>
                      <span>
                        <b>{t("item.identifier")}:</b>{" "}
                        {identificadorItem(item, t("item.noIdentifier"))}
                      </span>
                      <span>
                        <b>{t("item.year")}:</b>{" "}
                        {item.anoPublicacao || "—"}
                      </span>
                    </div>

                    <div className="bib-item-footer">
                      <div className="bib-item-counts">
                        <span>
                          📎 {t("item.files", { count: item._count.arquivos })}
                        </span>
                        <span>
                          📚 {t("item.copies", { count: item._count.exemplares })}
                        </span>
                        <span>
                          {t("item.updatedAt", {
                            date: formatarData(item.atualizadoEm, locale),
                          })}
                        </span>
                      </div>
                      <Link
                        href={`/admin/biblioteca/acervo/${item.id}`}
                        className="bib-item-open-link"
                      >
                        {t("item.open")}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!carregando && !erro && paginacao.total > 0 ? (
            <nav
              className="bib-pagination"
              aria-label={t("pagination.ariaLabel")}
            >
              <button
                type="button"
                className="bib-button bib-button-secondary"
                onClick={() =>
                  setPagina((valor) => Math.max(1, valor - 1))
                }
                disabled={pagina <= 1}
              >
                {t("pagination.previous")}
              </button>
              <span>
                {t.rich("pagination.pageOf", {
                  page: pagina,
                  total: totalPaginasExibido,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
              <button
                type="button"
                className="bib-button bib-button-secondary"
                onClick={() =>
                  setPagina((valor) =>
                    Math.min(totalPaginasExibido, valor + 1)
                  )
                }
                disabled={pagina >= totalPaginasExibido}
              >
                {t("pagination.next")}
              </button>
            </nav>
          ) : null}
        </section>
      </div>

      {modalAberto ? (
        <div
          className="bib-modal-backdrop"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharCadastro();
            }
          }}
        >
          <section
            className="bib-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bib-modal-title"
          >
            <header className="bib-modal-header">
              <div>
                <p className="bib-eyebrow">{t("modal.eyebrow")}</p>
                <h2 id="bib-modal-title">
                  {t("modal.title")}
                </h2>
                <p>
                  {t("modal.description")}
                </p>
              </div>
              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharCadastro}
                disabled={salvando}
                aria-label={t("modal.close")}
              >
                ×
              </button>
            </header>

            <form onSubmit={cadastrarItem}>
              <div className="bib-modal-body">
                {erroFormulario ? (
                  <div className="bib-feedback bib-feedback-error">
                    <p>{erroFormulario}</p>
                  </div>
                ) : null}

                <div className="bib-form-grid">
                  <label className="bib-field bib-field-full">
                    <span>
                      {t("modal.fields.title")} <b aria-hidden="true">*</b>
                    </span>
                    <input
                      className="bib-input"
                      autoFocus
                      required
                      maxLength={240}
                      value={formulario.titulo}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "titulo",
                          evento.target.value
                        )
                      }
                      placeholder={t("modal.fields.titlePlaceholder")}
                    />
                  </label>

                  <label className="bib-field bib-field-full">
                    <span>{t("modal.fields.subtitle")}</span>
                    <input
                      className="bib-input"
                      maxLength={240}
                      value={formulario.subtitulo}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "subtitulo",
                          evento.target.value
                        )
                      }
                      placeholder={t("modal.fields.subtitlePlaceholder")}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{t("modal.fields.contentType")}</span>
                    <select
                      className="bib-input"
                      value={formulario.tipo}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "tipo",
                          evento.target.value
                        )
                      }
                    >
                      {TIPOS_ITEM.map((item) => (
                        <option value={item} key={item}>
                          {rotuloTipo(item)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="bib-field">
                    <span>{t("modal.fields.accessMode")}</span>
                    <select
                      className="bib-input"
                      value={formulario.modalidade}
                      onChange={(evento) => {
                        const valor = evento.target.value;
                        setFormulario((atual) => ({
                          ...atual,
                          modalidade: valor,
                          acessoLivre:
                            valor === "ACESSO_LIVRE"
                              ? true
                              : atual.acessoLivre,
                        }));
                      }}
                    >
                      {MODALIDADES.map((item) => (
                        <option value={item} key={item}>
                          {rotuloModalidade(item)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="bib-field">
                    <span>ISBN-13</span>
                    <input
                      className="bib-input"
                      maxLength={32}
                      value={formulario.isbn13}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "isbn13",
                          evento.target.value
                        )
                      }
                      placeholder="978-00-00000-00-0"
                    />
                  </label>

                  <label className="bib-field">
                    <span>DOI</span>
                    <input
                      className="bib-input"
                      maxLength={255}
                      value={formulario.doi}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "doi",
                          evento.target.value
                        )
                      }
                      placeholder="10.xxxx/xxxxx"
                    />
                  </label>

                  <label className="bib-field">
                    <span>{t("modal.fields.publicationYear")}</span>
                    <input
                      className="bib-input"
                      type="number"
                      min={1}
                      max={new Date().getFullYear() + 2}
                      value={formulario.anoPublicacao}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "anoPublicacao",
                          evento.target.value
                        )
                      }
                      placeholder={String(new Date().getFullYear())}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{t("modal.fields.keywords")}</span>
                    <input
                      className="bib-input"
                      value={formulario.palavrasChave}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "palavrasChave",
                          evento.target.value
                        )
                      }
                      placeholder={t("modal.fields.keywordsPlaceholder")}
                    />
                  </label>

                  <label className="bib-field bib-field-full">
                    <span>{t("modal.fields.synopsis")}</span>
                    <textarea
                      className="bib-input bib-textarea"
                      maxLength={20_000}
                      value={formulario.sinopse}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "sinopse",
                          evento.target.value
                        )
                      }
                      placeholder={t("modal.fields.synopsisPlaceholder")}
                    />
                  </label>
                </div>

                <fieldset className="bib-options">
                  <legend>{t("modal.options.title")}</legend>

                  <label className="bib-check">
                    <input
                      type="checkbox"
                      checked={formulario.permitirAvaliacao}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "permitirAvaliacao",
                          evento.target.checked
                        )
                      }
                    />
                    <span>
                      <b>{t("modal.options.allowReviews")}</b>
                      <small>
                        {t("modal.options.allowReviewsDescription")}
                      </small>
                    </span>
                  </label>

                  <label className="bib-check">
                    <input
                      type="checkbox"
                      checked={formulario.acessoLivre}
                      disabled={
                        formulario.modalidade === "ACESSO_LIVRE"
                      }
                      onChange={(evento) =>
                        atualizarFormulario(
                          "acessoLivre",
                          evento.target.checked
                        )
                      }
                    />
                    <span>
                      <b>{t("modal.options.openAccess")}</b>
                      <small>
                        {t("modal.options.openAccessDescription")}
                      </small>
                    </span>
                  </label>

                  <label className="bib-check">
                    <input
                      type="checkbox"
                      checked={formulario.permitirDownload}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "permitirDownload",
                          evento.target.checked
                        )
                      }
                    />
                    <span>
                      <b>{t("modal.options.allowDownload")}</b>
                      <small>
                        {t("modal.options.allowDownloadDescription")}
                      </small>
                    </span>
                  </label>
                </fieldset>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharCadastro}
                  disabled={salvando}
                >
                  {t("modal.cancel")}
                </button>
                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={salvando}
                >
                  {salvando
                    ? t("modal.saving")
                    : t("modal.saveDraft")}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`bib-toast bib-toast-${toast.tipo}`}
          role="status"
        >
          <span aria-hidden="true">
            {toast.tipo === "sucesso" ? "✓" : "!"}
          </span>
          <p>{toast.mensagem}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label={t("toast.close")}
          >
            ×
          </button>
        </div>
      ) : null}
    </main>
  );
}