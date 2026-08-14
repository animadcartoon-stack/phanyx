"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";

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

function rotuloEnum(valor?: string | null) {
  if (!valor) return "—";

  return valor
    .replaceAll("_", " ")
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\p{L}/gu, (letra) =>
      letra.toLocaleUpperCase("pt-BR")
    );
}

function formatarData(valor?: string | null) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
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

function identificadorItem(item: ItemAcervo) {
  return (
    item.isbn13 ||
    item.isbn10 ||
    item.issn ||
    item.doi ||
    "Sem identificador"
  );
}

async function lerJsonSeguro<T>(resposta: Response) {
  const tipo = resposta.headers.get("content-type") || "";

  if (!tipo.includes("application/json")) {
    throw new Error(
      "A API do acervo não retornou uma resposta válida."
    );
  }

  return (await resposta.json()) as T;
}

function EstadoVazio({ filtrado }: { filtrado: boolean }) {
  return (
    <div className="bib-empty">
      <div className="bib-empty-icon" aria-hidden="true">
        📚
      </div>
      <h2>
        {filtrado
          ? "Nenhum item encontrado"
          : "O acervo ainda está vazio"}
      </h2>
      <p>
        {filtrado
          ? "Altere os filtros para encontrar outras obras."
          : "Cadastre livros, artigos, documentos e conteúdos multimídia."}
      </p>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="bib-list" aria-label="Carregando acervo">
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
          resposta
        );

        if (!resposta.ok) {
          throw new Error(
            dados.error ||
            "Não foi possível carregar o acervo."
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
            : "Não foi possível carregar o acervo."
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
      return "Nenhum item encontrado";
    }

    const inicio =
      (paginacao.pagina - 1) * paginacao.porPagina +
      1;
    const fim = Math.min(
      inicio + itens.length - 1,
      paginacao.total
    );

    return `${inicio}–${fim} de ${paginacao.total}`;
  }, [itens.length, paginacao]);

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
      setErroFormulario("Informe o título da obra.");
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
        resposta
      );

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
          "Não foi possível cadastrar o item."
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
          "Item cadastrado no acervo como rascunho.",
      });
    } catch (falha) {
      setErroFormulario(
        falha instanceof Error
          ? falha.message
          : "Não foi possível cadastrar o item."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-biblioteca-acervo-page">
      <div className="bib-page-shell">
        <header className="bib-hero">
          <div>
            <p className="bib-eyebrow">
              Biblioteca Virtual PHANYX
            </p>
            <h1>Acervo da instituição</h1>
            <p className="bib-hero-description">
              Cadastre e organize livros, artigos,
              documentos, pesquisas e conteúdos
              multimídia da biblioteca.
            </p>
          </div>

          <div className="bib-hero-actions">
            <Link
              href="/admin/biblioteca"
              className="bib-button bib-button-secondary"
            >
              ← Voltar ao painel
            </Link>
            <button
              type="button"
              className="bib-button bib-button-primary"
              onClick={abrirCadastro}
            >
              + Cadastrar item
            </button>
          </div>
        </header>

        <section className="bib-summary" aria-label="Resumo do acervo">
          <div className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              📚
            </span>
            <div>
              <span>Total encontrado</span>
              <strong>{paginacao.total}</strong>
            </div>
          </div>

          <div className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              📄
            </span>
            <div>
              <span>Página atual</span>
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
              <span>Exibindo</span>
              <strong>{itens.length}</strong>
            </div>
          </div>
        </section>

        <section className="bib-card bib-filter-card">
          <div className="bib-section-heading">
            <div>
              <h2>Pesquisar no acervo</h2>
              <p>
                Localize itens por título, ISBN, ISSN ou DOI.
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
              <span>Busca</span>
              <input
                className="bib-input"
                type="search"
                value={buscaDigitada}
                onChange={(evento) =>
                  setBuscaDigitada(evento.target.value)
                }
                placeholder="Digite o título ou identificador"
                maxLength={150}
              />
            </label>

            <label className="bib-field">
              <span>Tipo</span>
              <select
                className="bib-input"
                value={tipo}
                onChange={(evento) => {
                  setTipo(evento.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todos os tipos</option>
                {TIPOS_ITEM.map((item) => (
                  <option value={item} key={item}>
                    {rotuloEnum(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="bib-field">
              <span>Status</span>
              <select
                className="bib-input"
                value={status}
                onChange={(evento) => {
                  setStatus(evento.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todos os status</option>
                {STATUS_ITEM.map((item) => (
                  <option value={item} key={item}>
                    {rotuloEnum(item)}
                  </option>
                ))}
              </select>
            </label>

            <div className="bib-filter-actions">
              <button
                className="bib-button bib-button-primary"
                type="submit"
              >
                Pesquisar
              </button>
              <button
                className="bib-button bib-button-ghost"
                type="button"
                onClick={limparFiltros}
                disabled={!possuiFiltros && !buscaDigitada}
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        <section className="bib-card bib-catalog-card">
          <div className="bib-section-heading bib-catalog-heading">
            <div>
              <h2>Itens cadastrados</h2>
              <p>
                Os itens novos permanecem como rascunho até a
                revisão e publicação.
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
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {erro ? (
            <div className="bib-feedback bib-feedback-error">
              <div>
                <strong>Não foi possível carregar o acervo</strong>
                <p>{erro}</p>
              </div>
              <button
                type="button"
                className="bib-button bib-button-danger"
                onClick={() =>
                  setAtualizacao((valor) => valor + 1)
                }
              >
                Tentar novamente
              </button>
            </div>
          ) : carregando ? (
            <Esqueleto />
          ) : itens.length === 0 ? (
            <EstadoVazio filtrado={possuiFiltros} />
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
                          {rotuloEnum(item.status)}
                        </span>
                        <span className="bib-type-badge">
                          {rotuloEnum(item.tipo)}
                        </span>
                        {item.destaque ? (
                          <span className="bib-highlight-badge">
                            ★ Destaque
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
                        <b>Modalidade:</b>{" "}
                        {rotuloEnum(item.modalidade)}
                      </span>
                      <span>
                        <b>Identificador:</b>{" "}
                        {identificadorItem(item)}
                      </span>
                      <span>
                        <b>Ano:</b>{" "}
                        {item.anoPublicacao || "—"}
                      </span>
                    </div>

                    <div className="bib-item-footer">
                      <div className="bib-item-counts">
                        <span>
                          📎 {item._count.arquivos}{" "}
                          {item._count.arquivos === 1
                            ? "arquivo"
                            : "arquivos"}
                        </span>
                        <span>
                          📚 {item._count.exemplares}{" "}
                          {item._count.exemplares === 1
                            ? "exemplar"
                            : "exemplares"}
                        </span>
                        <span>
                          Atualizado em {formatarData(item.atualizadoEm)}
                        </span>
                      </div>
                      <Link
                        href={`/admin/biblioteca/acervo/${item.id}`}
                        className="bib-item-open-link"
                      >
                        Abrir item →
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
              aria-label="Paginação do acervo"
            >
              <button
                type="button"
                className="bib-button bib-button-secondary"
                onClick={() =>
                  setPagina((valor) => Math.max(1, valor - 1))
                }
                disabled={pagina <= 1}
              >
                ← Anterior
              </button>
              <span>
                Página <strong>{pagina}</strong> de{" "}
                <strong>{totalPaginasExibido}</strong>
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
                Próxima →
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
                <p className="bib-eyebrow">Novo item</p>
                <h2 id="bib-modal-title">
                  Cadastrar no acervo
                </h2>
                <p>
                  O item será salvo como rascunho para posterior
                  complementação e publicação.
                </p>
              </div>
              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharCadastro}
                disabled={salvando}
                aria-label="Fechar cadastro"
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
                      Título <b aria-hidden="true">*</b>
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
                      placeholder="Ex.: Introdução à Teologia"
                    />
                  </label>

                  <label className="bib-field bib-field-full">
                    <span>Subtítulo</span>
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
                      placeholder="Complemento do título"
                    />
                  </label>

                  <label className="bib-field">
                    <span>Tipo de conteúdo</span>
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
                          {rotuloEnum(item)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="bib-field">
                    <span>Modalidade de acesso</span>
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
                          {rotuloEnum(item)}
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
                    <span>Ano de publicação</span>
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
                    <span>Palavras-chave</span>
                    <input
                      className="bib-input"
                      value={formulario.palavrasChave}
                      onChange={(evento) =>
                        atualizarFormulario(
                          "palavrasChave",
                          evento.target.value
                        )
                      }
                      placeholder="teologia, história, educação"
                    />
                  </label>

                  <label className="bib-field bib-field-full">
                    <span>Sinopse ou resumo</span>
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
                      placeholder="Apresente brevemente o conteúdo da obra."
                    />
                  </label>
                </div>

                <fieldset className="bib-options">
                  <legend>Opções iniciais</legend>

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
                      <b>Permitir avaliações</b>
                      <small>
                        Alunos e professores poderão avaliar após a
                        publicação.
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
                      <b>Acesso livre</b>
                      <small>
                        Disponível aos públicos autorizados sem
                        empréstimo.
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
                      <b>Solicitar permissão de download</b>
                      <small>
                        Depende da configuração geral da biblioteca e
                        da licença da obra.
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar como rascunho"}
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
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      ) : null}
    </main>
  );
}
