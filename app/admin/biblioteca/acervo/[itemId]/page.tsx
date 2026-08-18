"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

type AutorItem = {
  funcao: string;
  ordem: number;
  autor: {
    id: number;
    nome: string;
    nomeOrdenacao: string | null;
  };
};

type CategoriaItem = {
  principal: boolean;
  categoria: {
    id: number;
    nome: string;
    slug: string;
    cor: string | null;
    icone: string | null;
  };
};

type ArquivoItem = {
  id: number;
  tipo: string;
  status: string;
  nomeOriginal: string;
  extensao: string | null;
  mimeType: string | null;
  tamanhoBytes: string;
  principal: boolean;
  enviadoEm: string;
  atualizadoEm: string;
};

type ArmazenamentoBiblioteca = {
  contratadoBytes: string;
  extraBytes: string;
  limiteBytes: string;
  utilizadoBytes: string;
  disponivelBytes: string;
};

type ExemplarItem = {
  id: number;
  tipo: string;
  codigoInterno: string;
  codigoBarras: string | null;
  numeroTombo: string | null;
  status: string;
  setor: string | null;
  sala: string | null;
  estante: string | null;
  prateleira: string | null;
  localizacaoCompleta: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

type ItemDetalhe = {
  id: number;
  tipo: string;
  status: string;
  modalidade: string;
  titulo: string;
  subtitulo: string | null;
  tituloAlternativo: string | null;
  slug: string;
  sinopse: string | null;
  descricao: string | null;
  palavrasChave: string[];
  isbn10: string | null;
  isbn13: string | null;
  issn: string | null;
  doi: string | null;
  idioma: string;
  paisPublicacao: string | null;
  anoPublicacao: number | null;
  dataPublicacao: string | null;
  edicao: string | null;
  volume: string | null;
  numero: string | null;
  numeroPaginas: number | null;
  duracaoSegundos: number | null;
  classificacaoBibliografica: string | null;
  codigoChamada: string | null;
  cdd: string | null;
  cdu: string | null;
  capaUrl: string | null;
  miniaturaUrl: string | null;
  classificacaoIndicativa: string | null;
  observacoesInternas: string | null;
  destaque: boolean;
  permitirDownload: boolean;
  permitirAvaliacao: boolean;
  acessoLivre: boolean;
  publicadoEm: string | null;
  arquivadoEm: string | null;
  motivoArquivamento: string | null;
  criadoEm: string;
  atualizadoEm: string;
  editora: {
    id: number;
    nome: string;
  } | null;
  autores: AutorItem[];
  categorias: CategoriaItem[];
  arquivos: ArquivoItem[];
  exemplares: ExemplarItem[];
  _count: {
    arquivos: number;
    exemplares: number;
  };
};

type FormularioItem = {
  tipo: string;
  modalidade: string;
  titulo: string;
  subtitulo: string;
  tituloAlternativo: string;
  sinopse: string;
  descricao: string;
  palavrasChave: string;
  isbn10: string;
  isbn13: string;
  issn: string;
  doi: string;
  idioma: string;
  paisPublicacao: string;
  anoPublicacao: string;
  dataPublicacao: string;
  edicao: string;
  volume: string;
  numero: string;
  numeroPaginas: string;
  duracaoSegundos: string;
  classificacaoBibliografica: string;
  codigoChamada: string;
  cdd: string;
  cdu: string;
  capaUrl: string;
  miniaturaUrl: string;
  classificacaoIndicativa: string;
  observacoesInternas: string;
  destaque: boolean;
  permitirDownload: boolean;
  permitirAvaliacao: boolean;
  acessoLivre: boolean;
};

type RespostaItem = {
  ok?: boolean;

  instituicaoId?: number;

  item?: ItemDetalhe;

  mensagem?: string;
  error?: string;
  codigo?: string;

  permissoes?: {
    podeEditar: boolean;
    podeEnviarArquivo: boolean;
    impersonacao: boolean;
  };

  configuracao?: {
    permitirDownload: boolean;
  };

  armazenamento?: ArmazenamentoBiblioteca;
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

const MODALIDADES = [
  "LEITURA_INTERNA",
  "ACESSO_LIVRE",
  "DOWNLOAD_AUTORIZADO",
  "EMPRESTIMO_DIGITAL",
  "EMPRESTIMO_FISICO",
  "STREAMING",
  "LINK_EXTERNO",
] as const;

const EXTENSOES_UPLOAD_BIBLIOTECA =
  new Set([
    "pdf",
    "epub",

    "mp3",
    "m4a",
    "wav",
    "ogg",

    "mp4",
    "webm",
    "mov",
  ]);

const ACCEPT_UPLOAD_BIBLIOTECA = [
  ".pdf",
  ".epub",
  ".mp3",
  ".m4a",
  ".wav",
  ".ogg",
  ".mp4",
  ".webm",
  ".mov",
].join(",");

function obterExtensaoUpload(
  nomeArquivo: string
) {
  const nome =
    String(nomeArquivo || "").trim();

  const ultimaParte =
    nome
      .split(".")
      .pop()
      ?.toLowerCase() || "";

  if (
    !ultimaParte ||
    ultimaParte ===
    nome.toLowerCase()
  ) {
    return "";
  }

  return ultimaParte;
}

function limparNomeArquivoUpload(
  nomeArquivo: string
) {
  const nomeOriginal =
    String(nomeArquivo || "").trim();

  const extensao =
    obterExtensaoUpload(
      nomeOriginal
    );

  const semExtensao =
    extensao
      ? nomeOriginal.slice(
        0,
        -(extensao.length + 1)
      )
      : nomeOriginal;

  const nomeSeguro =
    semExtensao
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "-"
      )
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120) ||
    "arquivo";

  if (!extensao) {
    return nomeSeguro;
  }

  return `${nomeSeguro}.${extensao}`;
}

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

function formatarBytes(valor: string) {
  const bytes = Number(valor);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const unidades = ["B", "KB", "MB", "GB", "TB"];
  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    unidades.length - 1
  );
  const quantidade = bytes / 1024 ** indice;

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: indice === 0 ? 0 : 1,
  }).format(quantidade)} ${unidades[indice]}`;
}

function classeStatus(status: string) {
  if (status === "PUBLICADO") {
    return "bib-status bib-status-success";
  }

  if (status === "EM_REVISAO") {
    return "bib-status bib-status-warning";
  }

  if (
    status === "ARQUIVADO" ||
    status === "INDISPONIVEL"
  ) {
    return "bib-status bib-status-danger";
  }

  if (status === "RASCUNHO") {
    return "bib-status bib-status-draft";
  }

  return "bib-status bib-status-neutral";
}

function dataParaInput(valor: string | null) {
  return valor ? valor.slice(0, 10) : "";
}

function criarFormulario(item: ItemDetalhe): FormularioItem {
  return {
    tipo: item.tipo,
    modalidade: item.modalidade,
    titulo: item.titulo,
    subtitulo: item.subtitulo || "",
    tituloAlternativo: item.tituloAlternativo || "",
    sinopse: item.sinopse || "",
    descricao: item.descricao || "",
    palavrasChave: item.palavrasChave.join(", "),
    isbn10: item.isbn10 || "",
    isbn13: item.isbn13 || "",
    issn: item.issn || "",
    doi: item.doi || "",
    idioma: item.idioma || "pt-BR",
    paisPublicacao: item.paisPublicacao || "",
    anoPublicacao: item.anoPublicacao
      ? String(item.anoPublicacao)
      : "",
    dataPublicacao: dataParaInput(item.dataPublicacao),
    edicao: item.edicao || "",
    volume: item.volume || "",
    numero: item.numero || "",
    numeroPaginas: item.numeroPaginas
      ? String(item.numeroPaginas)
      : "",
    duracaoSegundos: item.duracaoSegundos
      ? String(item.duracaoSegundos)
      : "",
    classificacaoBibliografica:
      item.classificacaoBibliografica || "",
    codigoChamada: item.codigoChamada || "",
    cdd: item.cdd || "",
    cdu: item.cdu || "",
    capaUrl: item.capaUrl || "",
    miniaturaUrl: item.miniaturaUrl || "",
    classificacaoIndicativa:
      item.classificacaoIndicativa || "",
    observacoesInternas:
      item.observacoesInternas || "",
    destaque: item.destaque,
    permitirDownload: item.permitirDownload,
    permitirAvaliacao: item.permitirAvaliacao,
    acessoLivre: item.acessoLivre,
  };
}

function obterMensagemErro(
  resposta: RespostaItem,
  padrao: string
) {
  return resposta.error || padrao;
}

export default function BibliotecaItemPage() {
  const params = useParams<{ itemId: string }>();
  const itemId = Number(params.itemId);

  const [item, setItem] = useState<ItemDetalhe | null>(null);
  const [formulario, setFormulario] =
    useState<FormularioItem | null>(null);
  const [podeEditar, setPodeEditar] = useState(false);
  const [impersonacao, setImpersonacao] = useState(false);
  const [downloadPermitido, setDownloadPermitido] =
    useState(false);

  const [
    instituicaoId,
    setInstituicaoId,
  ] =
    useState<number | null>(null);

  const [
    podeEnviarArquivo,
    setPodeEnviarArquivo,
  ] =
    useState(false);

  const [
    armazenamento,
    setArmazenamento,
  ] =
    useState<ArmazenamentoBiblioteca | null>(
      null
    );

  const [
    enviandoArquivo,
    setEnviandoArquivo,
  ] =
    useState(false);

  const [
    progressoUpload,
    setProgressoUpload,
  ] =
    useState(0);

  const arquivoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [atualizacao, setAtualizacao] = useState(0);

  const carregarItem = useCallback(
    async (signal?: AbortSignal) => {
      if (!Number.isInteger(itemId) || itemId <= 0) {
        setErro("O identificador do item é inválido.");
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro(null);

      try {
        const resposta = await fetch(
          `/api/admin/biblioteca/acervo/${itemId}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          }
        );
        const resultado =
          (await resposta.json()) as RespostaItem;

        if (!resposta.ok || !resultado.item) {
          throw new Error(
            obterMensagemErro(
              resultado,
              "Não foi possível carregar o item."
            )
          );
        }

        setItem(resultado.item);
        setFormulario(criarFormulario(resultado.item));
        setPodeEditar(
          resultado.permissoes?.podeEditar === true
        );
        setImpersonacao(
          resultado.permissoes?.impersonacao === true
        );
        setDownloadPermitido(
          resultado.configuracao?.permitirDownload ===
          true
        );
        setInstituicaoId(
          Number.isInteger(
            resultado.instituicaoId
          )
            ? resultado.instituicaoId!
            : null
        );

        setPodeEnviarArquivo(
          resultado.permissoes
            ?.podeEnviarArquivo === true
        );

        setArmazenamento(
          resultado.armazenamento ||
          null
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
            : "Não foi possível carregar o item."
        );
      } finally {
        if (!signal?.aborted) {
          setCarregando(false);
        }
      }
    },
    [itemId]
  );

  useEffect(() => {
    const controlador = new AbortController();

    void carregarItem(controlador.signal);

    return () => controlador.abort();
  }, [carregarItem, atualizacao]);

  useEffect(() => {
    if (!toast) return;

    const temporizador = window.setTimeout(
      () => setToast(null),
      5_000
    );

    return () => window.clearTimeout(temporizador);
  }, [toast]);

  const alterado = useMemo(() => {
    if (!item || !formulario) return false;

    return (
      JSON.stringify(formulario) !==
      JSON.stringify(criarFormulario(item))
    );
  }, [formulario, item]);

  function alterar<K extends keyof FormularioItem>(
    campo: K,
    valor: FormularioItem[K]
  ) {
    setFormulario((atual) =>
      atual
        ? {
          ...atual,
          [campo]: valor,
        }
        : atual
    );
  }

  function cancelarEdicao() {
    if (item) {
      setFormulario(criarFormulario(item));
    }

    setEditando(false);
  }

  async function enviarArquivo(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      evento.target.files?.[0];

    /*
     * Permite escolher novamente
     * o mesmo arquivo depois.
     */
    evento.target.value = "";

    if (!arquivo) {
      return;
    }

    if (
      enviandoArquivo ||
      !podeEnviarArquivo
    ) {
      return;
    }

    if (
      !instituicaoId ||
      !Number.isInteger(
        instituicaoId
      )
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          "Não foi possível identificar a instituição da Biblioteca Virtual.",
      });

      return;
    }

    if (!armazenamento) {
      setToast({
        tipo: "erro",
        mensagem:
          "Não foi possível consultar o armazenamento disponível.",
      });

      return;
    }

    const extensao =
      obterExtensaoUpload(
        arquivo.name
      );

    if (
      !EXTENSOES_UPLOAD_BIBLIOTECA.has(
        extensao
      )
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          "Formato não permitido. Envie PDF, EPUB, áudio ou vídeo compatível.",
      });

      return;
    }

    let disponivel = 0n;

    try {
      disponivel =
        BigInt(
          armazenamento
            .disponivelBytes ||
          "0"
        );
    } catch {
      disponivel = 0n;
    }

    const tamanhoArquivo =
      BigInt(arquivo.size);

    if (
      tamanhoArquivo >
      disponivel
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          `O arquivo possui ${formatarBytes(
            String(arquivo.size)
          )}, mas existem apenas ${formatarBytes(
            armazenamento.disponivelBytes
          )} disponíveis.`,
      });

      return;
    }

    const nomeSeguro =
      limparNomeArquivoUpload(
        arquivo.name
      );

    const pathname = [
      "biblioteca",
      `instituicao-${instituicaoId}`,
      `item-${itemId}`,
      nomeSeguro,
    ].join("/");

    setEnviandoArquivo(true);
    setProgressoUpload(0);

    try {
      await upload(
        pathname,
        arquivo,
        {
          access: "private",

          handleUploadUrl:
            `/api/admin/biblioteca/acervo/${itemId}/arquivos/upload`,

          clientPayload:
            JSON.stringify({
              nomeOriginal:
                arquivo.name,

              tamanhoBytes:
                arquivo.size,

              mimeType:
                arquivo.type || "",
            }),

          multipart: true,

          contentType:
            arquivo.type ||
            undefined,

          onUploadProgress(
            progresso
          ) {
            setProgressoUpload(
              Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    progresso.percentage
                  )
                )
              )
            );
          },
        }
      );

      setProgressoUpload(100);

      setToast({
        tipo: "sucesso",
        mensagem:
          "Arquivo enviado. O PHANYX está concluindo o registro no acervo.",
      });

      /*
       * O callback de conclusão
       * do Blob pode terminar
       * instantes depois do upload
       * do navegador.
       */
      window.setTimeout(
        () => {
          setAtualizacao(
            (valor) =>
              valor + 1
          );
        },
        1_500
      );
    } catch (falha) {
      setToast({
        tipo: "erro",
        mensagem:
          falha instanceof Error
            ? falha.message
            : "Não foi possível enviar o arquivo.",
      });
    } finally {
      setEnviandoArquivo(
        false
      );
    }
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!formulario || !podeEditar || salvando) {
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/acervo/${itemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formulario,
            palavrasChave: formulario.palavrasChave,
          }),
        }
      );
      const resultado =
        (await resposta.json()) as RespostaItem;

      if (!resposta.ok || !resultado.item) {
        throw new Error(
          obterMensagemErro(
            resultado,
            "Não foi possível salvar o item."
          )
        );
      }

      setItem(resultado.item);
      setFormulario(criarFormulario(resultado.item));
      setEditando(false);
      setToast({
        tipo: "sucesso",
        mensagem:
          resultado.mensagem ||
          "Item atualizado com sucesso.",
      });
    } catch (falha) {
      setToast({
        tipo: "erro",
        mensagem:
          falha instanceof Error
            ? falha.message
            : "Não foi possível salvar o item.",
      });
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="phanyx-biblioteca-acervo-page phanyx-biblioteca-item-page">
        <div className="bib-page-shell">
          <section className="bib-hero bib-detail-loading">
            <div>
              <p className="bib-eyebrow">
                Biblioteca Virtual PHANYX
              </p>
              <h1>Carregando item...</h1>
              <p className="bib-hero-description">
                Buscando os dados do acervo desta instituição.
              </p>
            </div>
          </section>
          <section className="bib-card bib-detail-loading-card" />
        </div>
      </main>
    );
  }

  if (erro || !item || !formulario) {
    return (
      <main className="phanyx-biblioteca-acervo-page phanyx-biblioteca-item-page">
        <div className="bib-page-shell">
          <section className="bib-card bib-detail-error">
            <div className="bib-empty-icon" aria-hidden="true">
              ⚠️
            </div>
            <h1>Não foi possível abrir o item</h1>
            <p>{erro || "Item não encontrado."}</p>
            <div className="bib-detail-error-actions">
              <Link
                href="/admin/biblioteca/acervo"
                className="bib-button bib-button-secondary"
              >
                ← Voltar ao acervo
              </Link>
              <button
                type="button"
                className="bib-button bib-button-primary"
                onClick={() =>
                  setAtualizacao((valor) => valor + 1)
                }
              >
                Tentar novamente
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const camposBloqueados = !editando || salvando;

  return (
    <main className="phanyx-biblioteca-acervo-page phanyx-biblioteca-item-page">
      <div className="bib-page-shell">
        <section className="bib-hero bib-item-detail-hero">
          <div className="bib-item-detail-heading">
            <div className="bib-detail-cover" aria-hidden="true">
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
            <div>
              <p className="bib-eyebrow">
                Biblioteca Virtual PHANYX · Item #{item.id}
              </p>
              <div className="bib-detail-title-line">
                <h1>{item.titulo}</h1>
                <span className={classeStatus(item.status)}>
                  {rotuloEnum(item.status)}
                </span>
              </div>
              <p className="bib-hero-description">
                Consulte e complete os dados bibliográficos, de
                classificação e de acesso deste material.
              </p>
            </div>
          </div>

          <div className="bib-hero-actions">
            <Link
              href="/admin/biblioteca/acervo"
              className="bib-button bib-button-secondary"
            >
              ← Voltar ao acervo
            </Link>
            {!editando && podeEditar ? (
              <button
                type="button"
                className="bib-button bib-button-primary"
                onClick={() => setEditando(true)}
              >
                ✏️ Editar item
              </button>
            ) : null}
          </div>
        </section>

        {impersonacao ? (
          <div className="bib-feedback bib-feedback-warning">
            <div>
              <strong>Sessão de suporte em andamento</strong>
              <p>
                Os dados podem ser consultados, mas alterações estão
                bloqueadas durante a impersonação.
              </p>
            </div>
          </div>
        ) : null}

        <section className="bib-detail-summary" aria-label="Resumo do item">
          <article className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              🏷️
            </span>
            <div>
              <span>Tipo</span>
              <strong>{rotuloEnum(item.tipo)}</strong>
            </div>
          </article>
          <article className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              🔐
            </span>
            <div>
              <span>Modalidade</span>
              <strong>{rotuloEnum(item.modalidade)}</strong>
            </div>
          </article>
          <article className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              📎
            </span>
            <div>
              <span>Arquivos</span>
              <strong>{item._count.arquivos}</strong>
            </div>
          </article>
          <article className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              📚
            </span>
            <div>
              <span>Exemplares</span>
              <strong>{item._count.exemplares}</strong>
            </div>
          </article>
        </section>

        <form onSubmit={salvar} className="bib-detail-form">
          <section className="bib-card bib-detail-section">
            <header className="bib-detail-section-heading">
              <div>
                <span aria-hidden="true">📝</span>
                <div>
                  <h2>Identificação do material</h2>
                  <p>
                    Informações usadas para apresentar e localizar a obra.
                  </p>
                </div>
              </div>
              <span className="bib-readonly-chip">
                Status: {rotuloEnum(item.status)}
              </span>
            </header>

            <div className="bib-detail-grid">
              <label className="bib-field bib-field-span-2">
                <span>
                  Título <b>*</b>
                </span>
                <input
                  className="bib-input"
                  value={formulario.titulo}
                  onChange={(evento) =>
                    alterar("titulo", evento.target.value)
                  }
                  maxLength={240}
                  required
                  disabled={camposBloqueados}
                />
              </label>

              <label className="bib-field">
                <span>Tipo</span>
                <select
                  className="bib-input"
                  value={formulario.tipo}
                  onChange={(evento) =>
                    alterar("tipo", evento.target.value)
                  }
                  disabled={camposBloqueados}
                >
                  {TIPOS_ITEM.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {rotuloEnum(tipo)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bib-field bib-field-span-2">
                <span>Subtítulo</span>
                <input
                  className="bib-input"
                  value={formulario.subtitulo}
                  onChange={(evento) =>
                    alterar("subtitulo", evento.target.value)
                  }
                  maxLength={240}
                  disabled={camposBloqueados}
                />
              </label>

              <label className="bib-field">
                <span>Título alternativo</span>
                <input
                  className="bib-input"
                  value={formulario.tituloAlternativo}
                  onChange={(evento) =>
                    alterar(
                      "tituloAlternativo",
                      evento.target.value
                    )
                  }
                  maxLength={240}
                  disabled={camposBloqueados}
                />
              </label>

              <label className="bib-field bib-field-span-3">
                <span>Sinopse</span>
                <textarea
                  className="bib-input bib-textarea"
                  value={formulario.sinopse}
                  onChange={(evento) =>
                    alterar("sinopse", evento.target.value)
                  }
                  maxLength={20_000}
                  disabled={camposBloqueados}
                />
              </label>

              <label className="bib-field bib-field-span-3">
                <span>Descrição complementar</span>
                <textarea
                  className="bib-input bib-textarea"
                  value={formulario.descricao}
                  onChange={(evento) =>
                    alterar("descricao", evento.target.value)
                  }
                  maxLength={20_000}
                  disabled={camposBloqueados}
                />
              </label>

              <label className="bib-field bib-field-span-3">
                <span>Palavras-chave</span>
                <input
                  className="bib-input"
                  value={formulario.palavrasChave}
                  onChange={(evento) =>
                    alterar("palavrasChave", evento.target.value)
                  }
                  placeholder="educação, gestão, pesquisa"
                  disabled={camposBloqueados}
                />
                <small>
                  Separe as palavras por vírgula. Máximo de 30 termos.
                </small>
              </label>
            </div>
          </section>

          <section className="bib-card bib-detail-section">
            <header className="bib-detail-section-heading">
              <div>
                <span aria-hidden="true">🔎</span>
                <div>
                  <h2>Publicação e identificadores</h2>
                  <p>
                    Dados técnicos para catalogação e pesquisa no acervo.
                  </p>
                </div>
              </div>
            </header>

            <div className="bib-detail-grid">
              <label className="bib-field">
                <span>ISBN-10</span>
                <input
                  className="bib-input"
                  value={formulario.isbn10}
                  onChange={(evento) =>
                    alterar("isbn10", evento.target.value)
                  }
                  maxLength={32}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>ISBN-13</span>
                <input
                  className="bib-input"
                  value={formulario.isbn13}
                  onChange={(evento) =>
                    alterar("isbn13", evento.target.value)
                  }
                  maxLength={32}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>ISSN</span>
                <input
                  className="bib-input"
                  value={formulario.issn}
                  onChange={(evento) =>
                    alterar("issn", evento.target.value)
                  }
                  maxLength={32}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field bib-field-span-2">
                <span>DOI</span>
                <input
                  className="bib-input"
                  value={formulario.doi}
                  onChange={(evento) =>
                    alterar("doi", evento.target.value)
                  }
                  maxLength={255}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Idioma</span>
                <input
                  className="bib-input"
                  value={formulario.idioma}
                  onChange={(evento) =>
                    alterar("idioma", evento.target.value)
                  }
                  maxLength={30}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>País de publicação</span>
                <input
                  className="bib-input"
                  value={formulario.paisPublicacao}
                  onChange={(evento) =>
                    alterar(
                      "paisPublicacao",
                      evento.target.value
                    )
                  }
                  maxLength={100}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Ano</span>
                <input
                  type="number"
                  className="bib-input"
                  value={formulario.anoPublicacao}
                  onChange={(evento) =>
                    alterar(
                      "anoPublicacao",
                      evento.target.value
                    )
                  }
                  min={1}
                  max={new Date().getFullYear() + 2}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Data de publicação</span>
                <input
                  type="date"
                  className="bib-input"
                  value={formulario.dataPublicacao}
                  onChange={(evento) =>
                    alterar(
                      "dataPublicacao",
                      evento.target.value
                    )
                  }
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Edição</span>
                <input
                  className="bib-input"
                  value={formulario.edicao}
                  onChange={(evento) =>
                    alterar("edicao", evento.target.value)
                  }
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Volume</span>
                <input
                  className="bib-input"
                  value={formulario.volume}
                  onChange={(evento) =>
                    alterar("volume", evento.target.value)
                  }
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Número</span>
                <input
                  className="bib-input"
                  value={formulario.numero}
                  onChange={(evento) =>
                    alterar("numero", evento.target.value)
                  }
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Número de páginas</span>
                <input
                  type="number"
                  className="bib-input"
                  value={formulario.numeroPaginas}
                  onChange={(evento) =>
                    alterar(
                      "numeroPaginas",
                      evento.target.value
                    )
                  }
                  min={1}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Duração em segundos</span>
                <input
                  type="number"
                  className="bib-input"
                  value={formulario.duracaoSegundos}
                  onChange={(evento) =>
                    alterar(
                      "duracaoSegundos",
                      evento.target.value
                    )
                  }
                  min={1}
                  disabled={camposBloqueados}
                />
              </label>
            </div>
          </section>

          <section className="bib-card bib-detail-section">
            <header className="bib-detail-section-heading">
              <div>
                <span aria-hidden="true">🗂️</span>
                <div>
                  <h2>Classificação e apresentação</h2>
                  <p>
                    Organização física, capa e classificação indicativa.
                  </p>
                </div>
              </div>
            </header>

            <div className="bib-detail-grid">
              <label className="bib-field">
                <span>Classificação bibliográfica</span>
                <input
                  className="bib-input"
                  value={formulario.classificacaoBibliografica}
                  onChange={(evento) =>
                    alterar(
                      "classificacaoBibliografica",
                      evento.target.value
                    )
                  }
                  maxLength={120}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Código de chamada</span>
                <input
                  className="bib-input"
                  value={formulario.codigoChamada}
                  onChange={(evento) =>
                    alterar(
                      "codigoChamada",
                      evento.target.value
                    )
                  }
                  maxLength={120}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>Classificação indicativa</span>
                <input
                  className="bib-input"
                  value={formulario.classificacaoIndicativa}
                  onChange={(evento) =>
                    alterar(
                      "classificacaoIndicativa",
                      evento.target.value
                    )
                  }
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>CDD</span>
                <input
                  className="bib-input"
                  value={formulario.cdd}
                  onChange={(evento) =>
                    alterar("cdd", evento.target.value)
                  }
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>CDU</span>
                <input
                  className="bib-input"
                  value={formulario.cdu}
                  onChange={(evento) =>
                    alterar("cdu", evento.target.value)
                  }
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <div className="bib-field" />
              <label className="bib-field bib-field-span-2">
                <span>URL da capa</span>
                <input
                  type="url"
                  className="bib-input"
                  value={formulario.capaUrl}
                  onChange={(evento) =>
                    alterar("capaUrl", evento.target.value)
                  }
                  maxLength={2_048}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>URL da miniatura</span>
                <input
                  type="url"
                  className="bib-input"
                  value={formulario.miniaturaUrl}
                  onChange={(evento) =>
                    alterar("miniaturaUrl", evento.target.value)
                  }
                  maxLength={2_048}
                  disabled={camposBloqueados}
                />
              </label>
            </div>
          </section>

          <section className="bib-card bib-detail-section">
            <header className="bib-detail-section-heading">
              <div>
                <span aria-hidden="true">🔐</span>
                <div>
                  <h2>Acesso e recursos</h2>
                  <p>
                    Regras aplicadas quando o material for publicado.
                  </p>
                </div>
              </div>
            </header>

            <div className="bib-detail-grid">
              <label className="bib-field bib-field-span-2">
                <span>Modalidade de acesso</span>
                <select
                  className="bib-input"
                  value={formulario.modalidade}
                  onChange={(evento) =>
                    alterar("modalidade", evento.target.value)
                  }
                  disabled={camposBloqueados}
                >
                  {MODALIDADES.map((modalidade) => (
                    <option key={modalidade} value={modalidade}>
                      {rotuloEnum(modalidade)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="bib-field">
                <span>Slug interno</span>
                <div className="bib-static-value">{item.slug}</div>
              </div>
            </div>

            <fieldset className="bib-options bib-detail-options">
              <legend>Recursos do item</legend>
              <label className="bib-check">
                <input
                  type="checkbox"
                  checked={formulario.destaque}
                  onChange={(evento) =>
                    alterar("destaque", evento.target.checked)
                  }
                  disabled={camposBloqueados}
                />
                <span>
                  <b>Destacar no catálogo</b>
                  <small>
                    Permite exibir a obra em áreas de destaque.
                  </small>
                </span>
              </label>
              <label className="bib-check">
                <input
                  type="checkbox"
                  checked={formulario.permitirAvaliacao}
                  onChange={(evento) =>
                    alterar(
                      "permitirAvaliacao",
                      evento.target.checked
                    )
                  }
                  disabled={camposBloqueados}
                />
                <span>
                  <b>Permitir avaliações</b>
                  <small>
                    Alunos e professores poderão avaliar o item.
                  </small>
                </span>
              </label>
              <label className="bib-check">
                <input
                  type="checkbox"
                  checked={formulario.acessoLivre}
                  onChange={(evento) =>
                    alterar("acessoLivre", evento.target.checked)
                  }
                  disabled={camposBloqueados}
                />
                <span>
                  <b>Acesso livre</b>
                  <small>
                    O acesso não exigirá empréstimo ou reserva.
                  </small>
                </span>
              </label>
              <label className="bib-check">
                <input
                  type="checkbox"
                  checked={formulario.permitirDownload}
                  onChange={(evento) =>
                    alterar(
                      "permitirDownload",
                      evento.target.checked
                    )
                  }
                  disabled={
                    camposBloqueados || !downloadPermitido
                  }
                />
                <span>
                  <b>Permitir download</b>
                  <small>
                    {downloadPermitido
                      ? "Autoriza o download conforme a licença da obra."
                      : "O download está desativado na configuração da biblioteca."}
                  </small>
                </span>
              </label>
            </fieldset>

            <label className="bib-field bib-detail-notes">
              <span>Observações internas</span>
              <textarea
                className="bib-input bib-textarea"
                value={formulario.observacoesInternas}
                onChange={(evento) =>
                  alterar(
                    "observacoesInternas",
                    evento.target.value
                  )
                }
                maxLength={20_000}
                disabled={camposBloqueados}
              />
              <small>
                Visível apenas para a equipe administrativa da
                biblioteca.
              </small>
            </label>
          </section>

          <section className="bib-card bib-detail-section">
            <header className="bib-detail-section-heading">
              <div>
                <span aria-hidden="true">👥</span>
                <div>
                  <h2>Responsáveis e classificação temática</h2>
                  <p>
                    Vínculos atuais com editora, autores e categorias.
                  </p>
                </div>
              </div>
              <span className="bib-readonly-chip">
                Gerenciamento em etapa própria
              </span>
            </header>

            <div className="bib-relationship-grid">
              <article className="bib-relationship-card">
                <h3>Editora</h3>
                {item.editora ? (
                  <span className="bib-tag">
                    🏢 {item.editora.nome}
                  </span>
                ) : (
                  <p>Nenhuma editora vinculada.</p>
                )}
              </article>
              <article className="bib-relationship-card">
                <h3>Autores e colaboradores</h3>
                {item.autores.length ? (
                  <div className="bib-tag-list">
                    {item.autores.map((vinculo) => (
                      <span
                        className="bib-tag"
                        key={`${vinculo.autor.id}-${vinculo.funcao}`}
                      >
                        {vinculo.autor.nome} · {rotuloEnum(vinculo.funcao)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>Nenhum autor vinculado.</p>
                )}
              </article>
              <article className="bib-relationship-card">
                <h3>Categorias</h3>
                {item.categorias.length ? (
                  <div className="bib-tag-list">
                    {item.categorias.map((vinculo) => (
                      <span
                        className="bib-tag"
                        key={vinculo.categoria.id}
                      >
                        {vinculo.categoria.icone || "🏷️"}{" "}
                        {vinculo.categoria.nome}
                        {vinculo.principal ? " · Principal" : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>Nenhuma categoria vinculada.</p>
                )}
              </article>
            </div>
          </section>

          <section className="bib-related-grid">
            <article className="bib-card bib-detail-section">
              <header className="bib-detail-section-heading">
                <div>
                  <span aria-hidden="true">
                    📎
                  </span>

                  <div>
                    <h2>
                      Arquivos digitais
                    </h2>

                    <p>
                      {item._count.arquivos}{" "}
                      arquivo(s) vinculado(s).
                    </p>

                    {armazenamento ? (
                      <small>
                        {formatarBytes(
                          armazenamento
                            .utilizadoBytes
                        )}{" "}
                        utilizados de{" "}
                        {formatarBytes(
                          armazenamento
                            .limiteBytes
                        )}
                        {" · "}
                        {formatarBytes(
                          armazenamento
                            .disponivelBytes
                        )}{" "}
                        disponíveis
                      </small>
                    ) : null}
                  </div>
                </div>

                {podeEnviarArquivo &&
                  !impersonacao ? (
                  <div>
                    <input
                      ref={arquivoInputRef}
                      type="file"
                      accept={
                        ACCEPT_UPLOAD_BIBLIOTECA
                      }
                      hidden
                      disabled={
                        enviandoArquivo
                      }
                      onChange={
                        enviarArquivo
                      }
                    />

                    <button
                      type="button"
                      className="bib-button bib-button-primary"
                      disabled={
                        enviandoArquivo
                      }
                      onClick={() =>
                        arquivoInputRef
                          .current
                          ?.click()
                      }
                    >
                      {enviandoArquivo
                        ? `Enviando ${progressoUpload}%`
                        : "⬆️ Enviar arquivo"}
                    </button>
                  </div>
                ) : null}
              </header>

              {enviandoArquivo ? (
                <div className="bib-feedback">
                  <div
                    style={{
                      width: "100%",
                    }}
                  >
                    <strong>
                      Enviando arquivo...
                    </strong>

                    <p>
                      {progressoUpload}% concluído
                    </p>

                    <progress
                      value={
                        progressoUpload
                      }
                      max={100}
                      style={{
                        width: "100%",
                        marginTop: "0.5rem",
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {item.arquivos.length ? (
                <div className="bib-related-list">
                  {item.arquivos.map((arquivo) => (
                    <div
                      className="bib-related-row"
                      key={arquivo.id}
                    >
                      <span aria-hidden="true">
                        {arquivo.tipo === "PDF"
                          ? "📄"
                          : arquivo.tipo === "EPUB"
                            ? "📘"
                            : arquivo.tipo === "AUDIO"
                              ? "🎧"
                              : arquivo.tipo === "VIDEO"
                                ? "🎬"
                                : "📎"}
                      </span>

                      <div className="bib-file-info">
                        <strong>
                          {arquivo.nomeOriginal}
                        </strong>

                        <small>
                          {rotuloEnum(
                            arquivo.tipo
                          )}{" "}
                          ·{" "}
                          {formatarBytes(
                            arquivo.tamanhoBytes
                          )}{" "}
                          ·{" "}
                          {rotuloEnum(
                            arquivo.status
                          )}
                        </small>

                        {arquivo.status ===
                          "DISPONIVEL" ? (
                          <div className="bib-file-actions">
                            <a
                              href={`/api/admin/biblioteca/arquivos/${arquivo.id}/conteudo`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bib-file-action"
                            >
                              👁 Visualizar
                            </a>

                            <a
                              href={`/api/admin/biblioteca/arquivos/${arquivo.id}/conteudo?download=1`}
                              className="bib-file-action"
                            >
                              ⬇ Baixar
                            </a>
                          </div>
                        ) : (
                          <small className="bib-file-unavailable">
                            O arquivo ainda não está
                            disponível para acesso.
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bib-compact-empty">
                  Nenhum arquivo enviado para este item.
                </div>
              )}
            </article>

            <article className="bib-card bib-detail-section">
              <header className="bib-detail-section-heading">
                <div>
                  <span aria-hidden="true">📚</span>
                  <div>
                    <h2>Exemplares</h2>
                    <p>{item._count.exemplares} exemplar(es) cadastrado(s).</p>
                  </div>
                </div>
              </header>
              {item.exemplares.length ? (
                <div className="bib-related-list">
                  {item.exemplares.map((exemplar) => (
                    <div className="bib-related-row" key={exemplar.id}>
                      <span aria-hidden="true">📕</span>
                      <div>
                        <strong>{exemplar.codigoInterno}</strong>
                        <small>
                          {rotuloEnum(exemplar.tipo)} ·{" "}
                          {rotuloEnum(exemplar.status)}
                          {exemplar.localizacaoCompleta
                            ? ` · ${exemplar.localizacaoCompleta}`
                            : ""}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bib-compact-empty">
                  Nenhum exemplar cadastrado para este item.
                </div>
              )}
            </article>
          </section>

          <section className="bib-card bib-detail-history">
            <div>
              <span>Criado em</span>
              <strong>{formatarData(item.criadoEm)}</strong>
            </div>
            <div>
              <span>Última atualização</span>
              <strong>{formatarData(item.atualizadoEm)}</strong>
            </div>
            <div>
              <span>Publicação</span>
              <strong>{formatarData(item.publicadoEm)}</strong>
            </div>
          </section>

          {editando ? (
            <div className="bib-detail-savebar">
              <div>
                <strong>
                  {alterado
                    ? "Existem alterações não salvas"
                    : "Nenhuma alteração realizada"}
                </strong>
                <span>
                  O status de publicação não será alterado por esta tela.
                </span>
              </div>
              <div>
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={salvando || !alterado}
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          ) : null}
        </form>
      </div>

      {toast ? (
        <div
          className={`bib-toast bib-toast-${toast.tipo}`}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">
            {toast.tipo === "sucesso" ? "✓" : "!"}
          </span>
          <p>{toast.mensagem}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      ) : null}
    </main>
  );
}