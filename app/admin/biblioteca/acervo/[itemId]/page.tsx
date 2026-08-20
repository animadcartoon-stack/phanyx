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
  versao: number;
  principal: boolean;
  enviadoEm: string;
  atualizadoEm: string;
};

type UsuarioHistoricoArquivo = {
  id: number;
  nome: string;
  email: string;
};

type ArquivoHistorico = {
  id: number;

  tipo: string;
  status: string;

  nomeOriginal: string;
  extensao: string | null;
  mimeType: string | null;

  tamanhoBytes: string;
  versao: number;

  principalAtual: boolean;
  eraPrincipal: boolean;

  disponivel: boolean;
  arquivado: boolean;

  enviadoEm: string;
  atualizadoEm: string;
  processadoEm: string | null;

  arquivadoEm: string | null;
  motivoArquivamento: string | null;

  enviadoPor:
  | UsuarioHistoricoArquivo
  | null;

  arquivadoPor:
  | UsuarioHistoricoArquivo
  | null;
};

type RespostaHistoricoArquivos = {
  ok?: boolean;

  item?: {
    id: number;
    titulo: string;
  };

  resumo?: {
    total: number;
    ativos: number;
    arquivados: number;
  };

  arquivos?: ArquivoHistorico[];

  error?: string;
  mensagem?: string;
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

  tipo: "FISICO" | "DIGITAL";
  status: string;

  codigoInterno: string;
  codigoBarras: string | null;
  numeroTombo: string | null;
  patrimonio: string | null;

  unidadeSnapshot: string | null;
  setor: string | null;
  sala: string | null;
  estante: string | null;
  prateleira: string | null;
  localizacaoCompleta: string | null;

  dataAquisicao: string | null;
  formaAquisicao: string | null;
  fornecedor: string | null;
  valorAquisicao: string | null;

  permiteEmprestimo: boolean;
  observacoes: string | null;

  baixadoEm: string | null;
  motivoBaixa: string | null;

  criadoEm: string;
  atualizadoEm: string;
};

type FormularioExemplar = {
  tipo: "FISICO" | "DIGITAL";

  codigoInterno: string;
  codigoBarras: string;
  numeroTombo: string;
  patrimonio: string;

  unidadeSnapshot: string;
  setor: string;
  sala: string;
  estante: string;
  prateleira: string;
  localizacaoCompleta: string;

  dataAquisicao: string;
  formaAquisicao: string;
  fornecedor: string;
  valorAquisicao: string;

  permiteEmprestimo: boolean;
  observacoes: string;
};

type RespostaExemplares = {
  ok?: boolean;

  item?: {
    id: number;
    titulo: string;
  };

  exemplares?: ExemplarItem[];

  total?: number;

  permissoes?: {
    podeGerenciar: boolean;
    podeBaixar: boolean;
    impersonacao: boolean;
  };

  exemplar?: ExemplarItem;

  mensagem?: string;
  error?: string;
  codigo?: string;
};

type UsuarioEmprestimo = {
  id: number;
  nome: string;
  email: string;
  role: string;

  tipo:
  | "ALUNO"
  | "PROFESSOR"
  | "FUNCIONARIO";

  identificador:
  | string
  | null;

  cpfMascarado:
  | string
  | null;

  alunoStatus:
  | string
  | null;

  professorStatus:
  | string
  | null;

  funcionarioStatus:
  | string
  | null;

  cargo:
  | string
  | null;
};

type RespostaUsuariosEmprestimo = {
  ok?: boolean;

  usuarios?: UsuarioEmprestimo[];

  mensagem?: string;
  error?: string;
  codigo?: string;
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
    podeGerenciarArquivo: boolean;
    impersonacao: boolean;
    podeExcluirArquivo: boolean;
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

const FORMULARIO_EXEMPLAR_INICIAL: FormularioExemplar = {
  tipo: "FISICO",

  codigoInterno: "",
  codigoBarras: "",
  numeroTombo: "",
  patrimonio: "",

  unidadeSnapshot: "",
  setor: "",
  sala: "",
  estante: "",
  prateleira: "",
  localizacaoCompleta: "",

  dataAquisicao: "",
  formaAquisicao: "",
  fornecedor: "",
  valorAquisicao: "",

  permiteEmprestimo: true,
  observacoes: "",
};

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

  const [
    exemplares,
    setExemplares,
  ] = useState<ExemplarItem[]>([]);

  const [
    podeGerenciarExemplares,
    setPodeGerenciarExemplares,
  ] = useState(false);

  const [
    podeBaixarExemplares,
    setPodeBaixarExemplares,
  ] = useState(false);

  const [
    podeGerenciarEmprestimos,
    setPodeGerenciarEmprestimos,
  ] = useState(false);

  const [
    exemplarParaEmprestimo,
    setExemplarParaEmprestimo,
  ] = useState<ExemplarItem | null>(
    null
  );

  const [
    buscaUsuarioEmprestimo,
    setBuscaUsuarioEmprestimo,
  ] = useState("");

  const [
    usuariosEmprestimo,
    setUsuariosEmprestimo,
  ] = useState<
    UsuarioEmprestimo[]
  >([]);

  const [
    usuarioEmprestimoSelecionado,
    setUsuarioEmprestimoSelecionado,
  ] =
    useState<UsuarioEmprestimo | null>(
      null
    );

  const [
    buscandoUsuariosEmprestimo,
    setBuscandoUsuariosEmprestimo,
  ] = useState(false);

  const [
    erroBuscaUsuariosEmprestimo,
    setErroBuscaUsuariosEmprestimo,
  ] = useState<string | null>(
    null
  );

  const [
    vencimentoEmprestimo,
    setVencimentoEmprestimo,
  ] = useState("");

  const [
    observacaoRetirada,
    setObservacaoRetirada,
  ] = useState("");

  const [
    registrandoEmprestimo,
    setRegistrandoEmprestimo,
  ] = useState(false);

  const [
    exemplarParaDevolucao,
    setExemplarParaDevolucao,
  ] = useState<ExemplarItem | null>(
    null
  );

  const [
    condicaoDevolucao,
    setCondicaoDevolucao,
  ] = useState("NORMAL");

  const [
    observacaoDevolucao,
    setObservacaoDevolucao,
  ] = useState("");

  const [
    devolvendoExemplar,
    setDevolvendoExemplar,
  ] = useState(false);

  const [
    carregandoExemplares,
    setCarregandoExemplares,
  ] = useState(false);

  const [
    modalExemplarAberto,
    setModalExemplarAberto,
  ] = useState(false);

  const [
    exemplarEmEdicao,
    setExemplarEmEdicao,
  ] = useState<ExemplarItem | null>(
    null
  );

  const [
    salvandoExemplar,
    setSalvandoExemplar,
  ] = useState(false);

  const [
    formularioExemplar,
    setFormularioExemplar,
  ] = useState<FormularioExemplar>({
    ...FORMULARIO_EXEMPLAR_INICIAL,
  });

  const [
    exemplarParaBaixa,
    setExemplarParaBaixa,
  ] = useState<ExemplarItem | null>(
    null
  );

  const [
    motivoBaixaExemplar,
    setMotivoBaixaExemplar,
  ] = useState("");

  const [
    baixandoExemplar,
    setBaixandoExemplar,
  ] = useState(false);

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

        setPodeExcluirArquivo(
          resultado.permissoes
            ?.podeExcluirArquivo === true
        );

        setPodeGerenciarArquivo(
          resultado.permissoes
            ?.podeGerenciarArquivo === true
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

  const carregarExemplares =
    useCallback(
      async (
        signal?: AbortSignal
      ) => {
        if (
          !Number.isInteger(itemId) ||
          itemId <= 0
        ) {
          return;
        }

        setCarregandoExemplares(true);

        try {
          const resposta =
            await fetch(
              `/api/admin/biblioteca/acervo/${itemId}/exemplares`,
              {
                method: "GET",
                cache: "no-store",
                signal,
              }
            );

          const resultado =
            (await resposta.json()) as
            RespostaExemplares;

          if (!resposta.ok) {
            throw new Error(
              resultado.error ||
              resultado.mensagem ||
              "Não foi possível carregar os exemplares."
            );
          }

          setExemplares(
            Array.isArray(
              resultado.exemplares
            )
              ? resultado.exemplares
              : []
          );

          setPodeGerenciarExemplares(
            resultado.permissoes
              ?.podeGerenciar === true
          );

          setPodeBaixarExemplares(
            resultado.permissoes
              ?.podeBaixar === true
          );
        } catch (falha) {
          if (
            falha instanceof
            DOMException &&
            falha.name ===
            "AbortError"
          ) {
            return;
          }

          setExemplares([]);

          setPodeGerenciarExemplares(
            false
          );

          setPodeBaixarExemplares(
            false
          );

          setToast({
            tipo: "erro",

            mensagem:
              falha instanceof Error
                ? falha.message
                : "Não foi possível carregar os exemplares.",
          });
        } finally {
          if (!signal?.aborted) {
            setCarregandoExemplares(
              false
            );
          }
        }
      },
      [itemId]
    );

  const [
    podeExcluirArquivo,
    setPodeExcluirArquivo,
  ] = useState(false);

  const [
    arquivoParaExcluir,
    setArquivoParaExcluir,
  ] = useState<ArquivoItem | null>(
    null
  );

  const [
    motivoExclusao,
    setMotivoExclusao,
  ] = useState("");

  const [
    excluindoArquivo,
    setExcluindoArquivo,
  ] = useState(false);

  const [
    podeGerenciarArquivo,
    setPodeGerenciarArquivo,
  ] = useState(false);

  const [
    definindoPrincipalId,
    setDefinindoPrincipalId,
  ] = useState<number | null>(null);

  const [
    historicoArquivosAberto,
    setHistoricoArquivosAberto,
  ] = useState(false);

  const [
    historicoArquivos,
    setHistoricoArquivos,
  ] = useState<ArquivoHistorico[]>([]);

  const [
    resumoHistoricoArquivos,
    setResumoHistoricoArquivos,
  ] = useState({
    total: 0,
    ativos: 0,
    arquivados: 0,
  });

  const [
    carregandoHistoricoArquivos,
    setCarregandoHistoricoArquivos,
  ] = useState(false);

  const [
    erroHistoricoArquivos,
    setErroHistoricoArquivos,
  ] = useState<string | null>(null);

  useEffect(() => {
    const controle =
      new AbortController();

    async function verificarPermissaoEmprestimos() {
      try {
        /*
         * Consulta sem termo.
         *
         * A API primeiro valida a permissão
         * biblioteca.emprestimos.gerenciar
         * e, como não existem 2 caracteres
         * de busca, não carrega pessoas.
         */
        const resposta =
          await fetch(
            "/api/admin/biblioteca/circulacao/usuarios?q=",
            {
              method: "GET",
              cache: "no-store",
              credentials: "include",
              signal:
                controle.signal,
            }
          );

        if (
          controle.signal.aborted
        ) {
          return;
        }

        setPodeGerenciarEmprestimos(
          resposta.ok
        );
      } catch (falha) {
        if (
          falha instanceof
          DOMException &&
          falha.name ===
          "AbortError"
        ) {
          return;
        }

        setPodeGerenciarEmprestimos(
          false
        );
      }
    }

    void verificarPermissaoEmprestimos();

    return () =>
      controle.abort();
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    void carregarItem(controlador.signal);

    return () => controlador.abort();
  }, [carregarItem, atualizacao]);

  useEffect(() => {
    const controlador =
      new AbortController();

    void carregarExemplares(
      controlador.signal
    );

    return () =>
      controlador.abort();
  }, [
    carregarExemplares,
    atualizacao,
  ]);

  useEffect(() => {
    if (!toast) return;

    const temporizador = window.setTimeout(
      () => setToast(null),
      5_000
    );

    return () => window.clearTimeout(temporizador);
  }, [toast]);

  useEffect(() => {
    if (!exemplarParaEmprestimo) {
      return;
    }

    const termo =
      buscaUsuarioEmprestimo.trim();

    if (termo.length < 2) {
      setUsuariosEmprestimo([]);
      setBuscandoUsuariosEmprestimo(
        false
      );
      setErroBuscaUsuariosEmprestimo(
        null
      );

      return;
    }

    const controle =
      new AbortController();

    const temporizador =
      window.setTimeout(
        async () => {
          setBuscandoUsuariosEmprestimo(
            true
          );

          setErroBuscaUsuariosEmprestimo(
            null
          );

          try {
            const resposta =
              await fetch(
                `/api/admin/biblioteca/circulacao/usuarios?q=${encodeURIComponent(
                  termo
                )}`,
                {
                  method: "GET",
                  cache: "no-store",
                  credentials:
                    "include",
                  signal:
                    controle.signal,
                }
              );

            const resultado =
              (await resposta.json()) as
              RespostaUsuariosEmprestimo;

            if (!resposta.ok) {
              throw new Error(
                resultado.error ||
                resultado.mensagem ||
                "Não foi possível pesquisar usuários."
              );
            }

            if (
              controle.signal.aborted
            ) {
              return;
            }

            setUsuariosEmprestimo(
              Array.isArray(
                resultado.usuarios
              )
                ? resultado.usuarios
                : []
            );
          } catch (falha) {
            if (
              falha instanceof
              DOMException &&
              falha.name ===
              "AbortError"
            ) {
              return;
            }

            setUsuariosEmprestimo(
              []
            );

            setErroBuscaUsuariosEmprestimo(
              falha instanceof Error
                ? falha.message
                : "Não foi possível pesquisar usuários."
            );
          } finally {
            if (
              !controle.signal.aborted
            ) {
              setBuscandoUsuariosEmprestimo(
                false
              );
            }
          }
        },
        350
      );

    return () => {
      window.clearTimeout(
        temporizador
      );

      controle.abort();
    };
  }, [
    buscaUsuarioEmprestimo,
    exemplarParaEmprestimo,
  ]);

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
 * O callback de conclusão do Vercel Blob
 * pode terminar alguns instantes depois
 * que o navegador conclui o envio.
 *
 * Fazemos mais de uma atualização para
 * refletir o arquivo e o consumo sem
 * depender de um único tempo fixo.
 */
      const temposAtualizacao = [
        800,
        2_000,
        4_000,
      ];

      temposAtualizacao.forEach(
        (tempo) => {
          window.setTimeout(
            () => {
              setAtualizacao(
                (valor) =>
                  valor + 1
              );
            },
            tempo
          );
        }
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

  function abrirExclusaoArquivo(
    arquivo: ArquivoItem
  ) {
    if (
      !podeExcluirArquivo ||
      impersonacao
    ) {
      return;
    }

    setArquivoParaExcluir(
      arquivo
    );

    setMotivoExclusao("");
  }

  function fecharExclusaoArquivo() {
    if (excluindoArquivo) {
      return;
    }

    setArquivoParaExcluir(
      null
    );

    setMotivoExclusao("");
  }

  async function excluirArquivo() {
    if (
      !arquivoParaExcluir ||
      excluindoArquivo ||
      !podeExcluirArquivo
    ) {
      return;
    }

    setExcluindoArquivo(true);

    try {
      const resposta =
        await fetch(
          `/api/admin/biblioteca/arquivos/${arquivoParaExcluir.id}`,
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              motivo:
                motivoExclusao.trim() ||
                "Arquivo removido pelo operador da Biblioteca Virtual.",
            }),
          }
        );

      const resultado =
        (await resposta.json()) as {
          ok?: boolean;
          mensagem?: string;
          error?: string;
          armazenamentoLiberadoBytes?: string;
        };

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
          "Não foi possível excluir o arquivo."
        );
      }

      const liberado =
        resultado.armazenamentoLiberadoBytes
          ? formatarBytes(
            resultado.armazenamentoLiberadoBytes
          )
          : null;

      setToast({
        tipo: "sucesso",

        mensagem:
          liberado &&
            liberado !== "0 B"
            ? `Arquivo removido. ${liberado} foram liberados do armazenamento.`
            : resultado.mensagem ||
            "Arquivo removido com sucesso.",
      });

      setArquivoParaExcluir(
        null
      );

      setMotivoExclusao("");

      setAtualizacao(
        (valor) =>
          valor + 1
      );
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error
            ? falha.message
            : "Não foi possível excluir o arquivo.",
      });
    } finally {
      setExcluindoArquivo(
        false
      );
    }
  }

  async function definirArquivoPrincipal(
    arquivo: ArquivoItem
  ) {
    if (
      arquivo.principal ||
      definindoPrincipalId !== null ||
      !podeGerenciarArquivo ||
      impersonacao
    ) {
      return;
    }

    setDefinindoPrincipalId(
      arquivo.id
    );

    try {
      const resposta =
        await fetch(
          `/api/admin/biblioteca/arquivos/${arquivo.id}/principal`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const resultado =
        (await resposta.json()) as {
          ok?: boolean;
          mensagem?: string;
          error?: string;
        };

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
          "Não foi possível definir o arquivo principal."
        );
      }

      setToast({
        tipo: "sucesso",

        mensagem:
          resultado.mensagem ||
          "Arquivo definido como principal.",
      });

      setAtualizacao(
        (valor) =>
          valor + 1
      );
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error
            ? falha.message
            : "Não foi possível definir o arquivo principal.",
      });
    } finally {
      setDefinindoPrincipalId(
        null
      );
    }
  }

  async function abrirHistoricoArquivos() {
    if (
      !podeGerenciarArquivo ||
      impersonacao ||
      carregandoHistoricoArquivos
    ) {
      return;
    }

    setHistoricoArquivosAberto(true);
    setCarregandoHistoricoArquivos(true);
    setErroHistoricoArquivos(null);

    try {
      const resposta =
        await fetch(
          `/api/admin/biblioteca/acervo/${itemId}/arquivos/historico`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const resultado =
        (await resposta.json()) as
        RespostaHistoricoArquivos;

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
          resultado.mensagem ||
          "Não foi possível carregar o histórico dos arquivos."
        );
      }

      setHistoricoArquivos(
        resultado.arquivos || []
      );

      setResumoHistoricoArquivos(
        resultado.resumo || {
          total: 0,
          ativos: 0,
          arquivados: 0,
        }
      );
    } catch (falha) {
      setErroHistoricoArquivos(
        falha instanceof Error
          ? falha.message
          : "Não foi possível carregar o histórico dos arquivos."
      );
    } finally {
      setCarregandoHistoricoArquivos(
        false
      );
    }
  }

  function fecharHistoricoArquivos() {
    if (
      carregandoHistoricoArquivos
    ) {
      return;
    }

    setHistoricoArquivosAberto(
      false
    );

    setErroHistoricoArquivos(
      null
    );
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

  function abrirEmprestimo(
    exemplar: ExemplarItem
  ) {
    if (
      !podeGerenciarEmprestimos ||
      impersonacao ||
      exemplar.tipo !== "FISICO" ||
      exemplar.status !==
      "DISPONIVEL" ||
      !exemplar.permiteEmprestimo ||
      exemplar.baixadoEm
    ) {
      return;
    }

    setBuscaUsuarioEmprestimo("");
    setUsuariosEmprestimo([]);
    setVencimentoEmprestimo("");
    setObservacaoRetirada("");
    setUsuarioEmprestimoSelecionado(
      null
    );
    setErroBuscaUsuariosEmprestimo(
      null
    );

    setExemplarParaEmprestimo(
      exemplar
    );
  }

  function fecharEmprestimo() {
    if (
      buscandoUsuariosEmprestimo ||
      registrandoEmprestimo
    ) {
      return;
    }

    setExemplarParaEmprestimo(
      null
    );

    setBuscaUsuarioEmprestimo("");
    setUsuariosEmprestimo([]);
    setVencimentoEmprestimo("");
    setObservacaoRetirada("");
    setUsuarioEmprestimoSelecionado(
      null
    );
    setErroBuscaUsuariosEmprestimo(
      null
    );
  }

  function abrirCadastroExemplar() {
    if (
      !podeGerenciarExemplares ||
      impersonacao
    ) {
      return;
    }

    setExemplarEmEdicao(null);

    setFormularioExemplar({
      ...FORMULARIO_EXEMPLAR_INICIAL,
    });

    setModalExemplarAberto(true);
  }

  function abrirEdicaoExemplar(
    exemplar: ExemplarItem
  ) {
    if (
      !podeGerenciarExemplares ||
      impersonacao ||
      exemplar.baixadoEm
    ) {
      return;
    }

    setExemplarEmEdicao(
      exemplar
    );

    setFormularioExemplar({
      tipo:
        exemplar.tipo,

      codigoInterno:
        exemplar.codigoInterno,

      codigoBarras:
        exemplar.codigoBarras || "",

      numeroTombo:
        exemplar.numeroTombo || "",

      patrimonio:
        exemplar.patrimonio || "",

      unidadeSnapshot:
        exemplar.unidadeSnapshot || "",

      setor:
        exemplar.setor || "",

      sala:
        exemplar.sala || "",

      estante:
        exemplar.estante || "",

      prateleira:
        exemplar.prateleira || "",

      localizacaoCompleta:
        exemplar.localizacaoCompleta || "",

      dataAquisicao:
        exemplar.dataAquisicao
          ? exemplar.dataAquisicao.slice(
            0,
            10
          )
          : "",

      formaAquisicao:
        exemplar.formaAquisicao || "",

      fornecedor:
        exemplar.fornecedor || "",

      valorAquisicao:
        exemplar.valorAquisicao || "",

      permiteEmprestimo:
        exemplar.permiteEmprestimo,

      observacoes:
        exemplar.observacoes || "",
    });

    setModalExemplarAberto(true);
  }

  function fecharCadastroExemplar() {
    if (salvandoExemplar) {
      return;
    }

    setModalExemplarAberto(false);

    setExemplarEmEdicao(null);

    setFormularioExemplar({
      ...FORMULARIO_EXEMPLAR_INICIAL,
    });
  }

  function abrirBaixaExemplar(
    exemplar: ExemplarItem
  ) {
    if (
      !podeBaixarExemplares ||
      impersonacao ||
      exemplar.baixadoEm
    ) {
      return;
    }

    setExemplarParaBaixa(
      exemplar
    );

    setMotivoBaixaExemplar("");
  }

  function fecharBaixaExemplar() {
    if (baixandoExemplar) {
      return;
    }

    setExemplarParaBaixa(null);
    setMotivoBaixaExemplar("");
  }

  async function darBaixaExemplar() {
    if (
      !exemplarParaBaixa ||
      baixandoExemplar ||
      !podeBaixarExemplares ||
      impersonacao
    ) {
      return;
    }

    const motivo =
      motivoBaixaExemplar.trim();

    if (!motivo) {
      setToast({
        tipo: "erro",
        mensagem:
          "Informe o motivo da baixa do exemplar.",
      });

      return;
    }

    setBaixandoExemplar(true);

    try {
      const resposta =
        await fetch(
          `/api/admin/biblioteca/exemplares/${exemplarParaBaixa.id}/baixa`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              motivo,
            }),
          }
        );

      const resultado =
        (await resposta.json()) as
        RespostaExemplares;

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
          resultado.mensagem ||
          "Não foi possível realizar a baixa do exemplar."
        );
      }

      setExemplarParaBaixa(null);
      setMotivoBaixaExemplar("");

      setToast({
        tipo: "sucesso",
        mensagem:
          resultado.mensagem ||
          "Baixa do exemplar realizada com sucesso.",
      });

      setAtualizacao(
        (valor) => valor + 1
      );
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error
            ? falha.message
            : "Não foi possível realizar a baixa do exemplar.",
      });
    } finally {
      setBaixandoExemplar(false);
    }
  }

  function alterarExemplar<
    K extends keyof FormularioExemplar
  >(
    campo: K,
    valor: FormularioExemplar[K]
  ) {
    setFormularioExemplar(
      (atual) => ({
        ...atual,
        [campo]: valor,
      })
    );
  }

  async function salvarExemplar() {
    if (
      salvandoExemplar ||
      !podeGerenciarExemplares ||
      impersonacao
    ) {
      return;
    }

    const codigoInterno =
      formularioExemplar
        .codigoInterno
        .trim();

    if (!codigoInterno) {
      setToast({
        tipo: "erro",
        mensagem:
          "Informe o código interno do exemplar.",
      });

      return;
    }

    const editandoExemplar =
      exemplarEmEdicao !== null;

    setSalvandoExemplar(true);

    try {
      const url =
        editandoExemplar
          ? `/api/admin/biblioteca/exemplares/${exemplarEmEdicao.id}`
          : `/api/admin/biblioteca/acervo/${itemId}/exemplares`;

      const resposta =
        await fetch(
          url,
          {
            method:
              editandoExemplar
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              tipo:
                formularioExemplar.tipo,

              codigoInterno,

              codigoBarras:
                formularioExemplar
                  .codigoBarras
                  .trim() ||
                null,

              numeroTombo:
                formularioExemplar
                  .numeroTombo
                  .trim() ||
                null,

              patrimonio:
                formularioExemplar
                  .patrimonio
                  .trim() ||
                null,

              unidadeSnapshot:
                formularioExemplar
                  .unidadeSnapshot
                  .trim() ||
                null,

              setor:
                formularioExemplar
                  .setor
                  .trim() ||
                null,

              sala:
                formularioExemplar
                  .sala
                  .trim() ||
                null,

              estante:
                formularioExemplar
                  .estante
                  .trim() ||
                null,

              prateleira:
                formularioExemplar
                  .prateleira
                  .trim() ||
                null,

              localizacaoCompleta:
                formularioExemplar
                  .localizacaoCompleta
                  .trim() ||
                null,

              dataAquisicao:
                formularioExemplar
                  .dataAquisicao ||
                null,

              formaAquisicao:
                formularioExemplar
                  .formaAquisicao
                  .trim() ||
                null,

              fornecedor:
                formularioExemplar
                  .fornecedor
                  .trim() ||
                null,

              valorAquisicao:
                formularioExemplar
                  .valorAquisicao
                  .trim() ||
                null,

              permiteEmprestimo:
                formularioExemplar
                  .permiteEmprestimo,

              observacoes:
                formularioExemplar
                  .observacoes
                  .trim() ||
                null,
            }),
          }
        );

      const resultado =
        (await resposta.json()) as
        RespostaExemplares;

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
          resultado.mensagem ||
          (editandoExemplar
            ? "Não foi possível atualizar o exemplar."
            : "Não foi possível cadastrar o exemplar.")
        );
      }

      setModalExemplarAberto(false);

      setExemplarEmEdicao(null);

      setFormularioExemplar({
        ...FORMULARIO_EXEMPLAR_INICIAL,
      });

      setToast({
        tipo: "sucesso",

        mensagem:
          resultado.mensagem ||
          (editandoExemplar
            ? "Exemplar atualizado com sucesso."
            : "Exemplar cadastrado com sucesso."),
      });

      setAtualizacao(
        (valor) => valor + 1
      );
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error
            ? falha.message
            : "Não foi possível salvar o exemplar.",
      });
    } finally {
      setSalvandoExemplar(false);
    }
  }

  async function registrarEmprestimo() {
    if (
      !exemplarParaEmprestimo ||
      !usuarioEmprestimoSelecionado ||
      registrandoEmprestimo ||
      !podeGerenciarEmprestimos ||
      impersonacao
    ) {
      return;
    }

    if (!vencimentoEmprestimo) {
      setToast({
        tipo: "erro",
        mensagem:
          "Informe a data prevista para devolução.",
      });

      return;
    }

    const dataVencimento =
      new Date(
        `${vencimentoEmprestimo}T23:59:00`
      );

    if (
      Number.isNaN(
        dataVencimento.getTime()
      ) ||
      dataVencimento.getTime() <=
      Date.now()
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          "A data prevista para devolução deve ser futura.",
      });

      return;
    }

    setRegistrandoEmprestimo(
      true
    );

    try {
      const resposta =
        await fetch(
          `/api/admin/biblioteca/exemplares/${exemplarParaEmprestimo.id}/emprestar`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              usuarioId:
                usuarioEmprestimoSelecionado.id,

              vencimentoEm:
                dataVencimento.toISOString(),

              observacaoRetirada:
                observacaoRetirada
                  .trim() ||
                null,
            }),
          }
        );

      const resultado =
        (await resposta.json()) as {
          ok?: boolean;
          mensagem?: string;
          error?: string;
        };

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
          resultado.mensagem ||
          "Não foi possível registrar o empréstimo."
        );
      }

      setExemplarParaEmprestimo(
        null
      );

      setBuscaUsuarioEmprestimo(
        ""
      );

      setUsuariosEmprestimo([]);

      setUsuarioEmprestimoSelecionado(
        null
      );

      setVencimentoEmprestimo(
        ""
      );

      setObservacaoRetirada(
        ""
      );

      setToast({
        tipo: "sucesso",

        mensagem:
          resultado.mensagem ||
          "Empréstimo registrado com sucesso.",
      });

      setAtualizacao(
        (valor) => valor + 1
      );
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error
            ? falha.message
            : "Não foi possível registrar o empréstimo.",
      });
    } finally {
      setRegistrandoEmprestimo(
        false
      );
    }
  }

  function abrirDevolucao(
    exemplar: ExemplarItem
  ) {
    if (
      !podeGerenciarEmprestimos ||
      impersonacao ||
      exemplar.tipo !== "FISICO" ||
      exemplar.status !== "EMPRESTADO" ||
      exemplar.baixadoEm
    ) {
      return;
    }

    setExemplarParaDevolucao(
      exemplar
    );

    setCondicaoDevolucao(
      "NORMAL"
    );

    setObservacaoDevolucao(
      ""
    );
  }

  function fecharDevolucao() {
    if (devolvendoExemplar) {
      return;
    }

    setExemplarParaDevolucao(
      null
    );

    setCondicaoDevolucao(
      "NORMAL"
    );

    setObservacaoDevolucao(
      ""
    );
  }

  async function registrarDevolucao() {
    if (
      !exemplarParaDevolucao ||
      devolvendoExemplar ||
      !podeGerenciarEmprestimos ||
      impersonacao
    ) {
      return;
    }

    setDevolvendoExemplar(
      true
    );

    try {
      const resposta =
        await fetch(
          `/api/admin/biblioteca/exemplares/${exemplarParaDevolucao.id}/devolver`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              condicao:
                condicaoDevolucao,

              observacaoDevolucao:
                observacaoDevolucao
                  .trim() ||
                null,
            }),
          }
        );

      const resultado =
        (await resposta.json()) as {
          ok?: boolean;
          mensagem?: string;
          error?: string;
        };

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
          resultado.mensagem ||
          "Não foi possível registrar a devolução."
        );
      }

      setExemplarParaDevolucao(
        null
      );

      setCondicaoDevolucao(
        "NORMAL"
      );

      setObservacaoDevolucao(
        ""
      );

      setToast({
        tipo: "sucesso",

        mensagem:
          resultado.mensagem ||
          "Devolução registrada com sucesso.",
      });

      setAtualizacao(
        (valor) => valor + 1
      );
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error
            ? falha.message
            : "Não foi possível registrar a devolução.",
      });
    } finally {
      setDevolvendoExemplar(
        false
      );
    }
  }

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

                <div className="bib-file-header-actions">
                  {podeGerenciarArquivo &&
                    !impersonacao ? (
                    <button
                      type="button"
                      className="bib-button bib-button-secondary"
                      onClick={() =>
                        void abrirHistoricoArquivos()
                      }
                    >
                      🕘 Histórico
                    </button>
                  ) : null}

                  {podeEnviarArquivo &&
                    !impersonacao ? (
                    <>
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
                    </>
                  ) : null}
                </div>
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
                          )}
                          {" · "}
                          {formatarBytes(
                            arquivo.tamanhoBytes
                          )}
                          {" · "}
                          Versão {arquivo.versao}
                          {" · "}
                          {rotuloEnum(
                            arquivo.status
                          )}
                        </small>

                        {arquivo.principal ? (
                          <span className="bib-file-primary-badge">
                            ⭐ Principal
                          </span>
                        ) : null}

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

                            {arquivo.status ===
                              "DISPONIVEL" &&
                              !arquivo.principal &&
                              podeGerenciarArquivo &&
                              !impersonacao ? (
                              <button
                                type="button"
                                className="bib-file-action bib-file-action-primary"
                                disabled={
                                  definindoPrincipalId !==
                                  null
                                }
                                onClick={() =>
                                  void definirArquivoPrincipal(
                                    arquivo
                                  )
                                }
                              >
                                {definindoPrincipalId ===
                                  arquivo.id
                                  ? "Definindo..."
                                  : "☆ Definir como principal"}
                              </button>
                            ) : null}

                            {podeExcluirArquivo &&
                              !impersonacao ? (
                              <button
                                type="button"
                                className="bib-file-action bib-file-action-danger"
                                onClick={() =>
                                  abrirExclusaoArquivo(
                                    arquivo
                                  )
                                }
                              >
                                🗑 Excluir
                              </button>
                            ) : null}

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
                  <span aria-hidden="true">
                    📚
                  </span>

                  <div>
                    <h2>Exemplares</h2>

                    <p>
                      {carregandoExemplares
                        ? "Carregando exemplares..."
                        : `${exemplares.length} exemplar(es) cadastrado(s).`}
                    </p>
                  </div>
                </div>
                {podeGerenciarExemplares &&
                  !impersonacao ? (
                  <button
                    type="button"
                    className="bib-button bib-button-primary"
                    onClick={
                      abrirCadastroExemplar
                    }
                  >
                    ＋ Cadastrar exemplar
                  </button>
                ) : null}
              </header>

              {carregandoExemplares ? (
                <div className="bib-compact-empty">
                  Carregando exemplares...
                </div>
              ) : exemplares.length ? (
                <div className="bib-related-list">
                  {exemplares.map(
                    (exemplar) => (
                      <div
                        className="bib-related-row"
                        key={exemplar.id}
                      >
                        <span
                          aria-hidden="true"
                        >
                          {exemplar.tipo ===
                            "DIGITAL"
                            ? "💻"
                            : "📕"}
                        </span>

                        <div>
                          <strong>
                            {
                              exemplar.codigoInterno
                            }
                          </strong>

                          <small>
                            {rotuloEnum(
                              exemplar.tipo
                            )}

                            {" · "}

                            {rotuloEnum(
                              exemplar.status
                            )}

                            {exemplar
                              .numeroTombo
                              ? ` · Tombo ${exemplar.numeroTombo}`
                              : ""}

                            {exemplar
                              .localizacaoCompleta
                              ? ` · ${exemplar.localizacaoCompleta}`
                              : ""}
                          </small>

                          {exemplar.baixadoEm ? (
                            <small>
                              Baixado em{" "}
                              {formatarData(
                                exemplar.baixadoEm
                              )}

                              {exemplar.motivoBaixa
                                ? ` · Motivo: ${exemplar.motivoBaixa}`
                                : ""}
                            </small>
                          ) : null}
                        </div>

                        {podeGerenciarExemplares &&
                          !impersonacao &&
                          !exemplar.baixadoEm ? (
                          <button
                            type="button"
                            className="bib-button bib-button-secondary"
                            onClick={() =>
                              abrirEdicaoExemplar(
                                exemplar
                              )
                            }
                          >
                            ✏️ Editar
                          </button>
                        ) : null}

                        {podeGerenciarEmprestimos &&
                          !impersonacao &&
                          exemplar.tipo ===
                          "FISICO" &&
                          exemplar.status ===
                          "DISPONIVEL" &&
                          exemplar.permiteEmprestimo &&
                          !exemplar.baixadoEm ? (
                          <button
                            type="button"
                            className="bib-button bib-button-primary"
                            onClick={() =>
                              abrirEmprestimo(
                                exemplar
                              )
                            }
                          >
                            📤 Emprestar
                          </button>
                        ) : null}

                        {podeGerenciarEmprestimos &&
                          !impersonacao &&
                          exemplar.tipo ===
                          "FISICO" &&
                          exemplar.status ===
                          "EMPRESTADO" &&
                          !exemplar.baixadoEm ? (
                          <button
                            type="button"
                            className="bib-button bib-button-primary"
                            onClick={() =>
                              abrirDevolucao(
                                exemplar
                              )
                            }
                          >
                            📥 Registrar devolução
                          </button>
                        ) : null}

                        {podeBaixarExemplares &&
                          !impersonacao &&
                          !exemplar.baixadoEm &&
                          exemplar.status !== "EMPRESTADO" &&
                          exemplar.status !== "RESERVADO" ? (
                          <button
                            type="button"
                            className="bib-button bib-button-danger"
                            onClick={() =>
                              abrirBaixaExemplar(
                                exemplar
                              )
                            }
                          >
                            ⬇ Dar baixa
                          </button>
                        ) : null}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="bib-compact-empty">
                  Nenhum exemplar cadastrado
                  para este item.
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

        {historicoArquivosAberto ? (
          <div
            className="bib-modal-backdrop"
            role="presentation"
          >
            <section
              className="bib-modal bib-file-history-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-historico-arquivos"
            >
              <header className="bib-modal-header">
                <div>
                  <span className="bib-modal-kicker">
                    Biblioteca Virtual
                  </span>

                  <h2
                    id="titulo-historico-arquivos"
                  >
                    Histórico de arquivos
                  </h2>

                  <p>
                    Consulte todas as versões
                    enviadas para este item,
                    inclusive arquivos já
                    removidos.
                  </p>
                </div>

                <button
                  type="button"
                  className="bib-modal-close"
                  onClick={
                    fecharHistoricoArquivos
                  }
                  disabled={
                    carregandoHistoricoArquivos
                  }
                  aria-label="Fechar"
                >
                  ×
                </button>
              </header>

              <div className="bib-modal-body bib-file-history-body">
                <div className="bib-history-summary">
                  <div>
                    <small>
                      Total de versões
                    </small>
                    <strong>
                      {
                        resumoHistoricoArquivos
                          .total
                      }
                    </strong>
                  </div>

                  <div>
                    <small>
                      Ativas
                    </small>
                    <strong>
                      {
                        resumoHistoricoArquivos
                          .ativos
                      }
                    </strong>
                  </div>

                  <div>
                    <small>
                      Excluídas
                    </small>
                    <strong>
                      {
                        resumoHistoricoArquivos
                          .arquivados
                      }
                    </strong>
                  </div>
                </div>

                {carregandoHistoricoArquivos ? (
                  <div className="bib-history-loading">
                    <strong>
                      Carregando histórico...
                    </strong>

                    <p>
                      Consultando as versões
                      deste item.
                    </p>
                  </div>
                ) : erroHistoricoArquivos ? (
                  <div className="bib-feedback bib-feedback-error">
                    <div>
                      <strong>
                        Não foi possível carregar
                        o histórico
                      </strong>

                      <p>
                        {
                          erroHistoricoArquivos
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      className="bib-button bib-button-secondary"
                      onClick={() =>
                        void abrirHistoricoArquivos()
                      }
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : historicoArquivos.length ? (
                  <div className="bib-file-history-list">
                    {historicoArquivos.map(
                      (arquivo) => (
                        <article
                          key={arquivo.id}
                          className={[
                            "bib-file-history-entry",

                            arquivo.arquivado
                              ? "bib-file-history-entry-archived"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <div className="bib-file-history-marker">
                            <span>
                              {arquivo.arquivado
                                ? "🗑️"
                                : arquivo.principalAtual
                                  ? "⭐"
                                  : "📄"}
                            </span>
                          </div>

                          <div className="bib-file-history-content">
                            <div className="bib-file-history-top">
                              <div>
                                <span className="bib-history-version">
                                  Versão{" "}
                                  {
                                    arquivo.versao
                                  }
                                </span>

                                {arquivo.principalAtual ? (
                                  <span className="bib-history-badge bib-history-badge-primary">
                                    ⭐ Principal atual
                                  </span>
                                ) : arquivo.arquivado ? (
                                  <span className="bib-history-badge bib-history-badge-archived">
                                    🗑 Excluído
                                  </span>
                                ) : (
                                  <span className="bib-history-badge bib-history-badge-active">
                                    Ativo
                                  </span>
                                )}
                              </div>

                              <small>
                                #
                                {
                                  arquivo.id
                                }
                              </small>
                            </div>

                            <strong className="bib-history-file-name">
                              {
                                arquivo.nomeOriginal
                              }
                            </strong>

                            <div className="bib-history-file-meta">
                              <span>
                                {rotuloEnum(
                                  arquivo.tipo
                                )}
                              </span>

                              <span>
                                {formatarBytes(
                                  arquivo.tamanhoBytes
                                )}
                              </span>

                              <span>
                                {rotuloEnum(
                                  arquivo.status
                                )}
                              </span>
                            </div>

                            <div className="bib-history-event-grid">
                              <div>
                                <small>
                                  Enviado em
                                </small>

                                <strong>
                                  {formatarData(
                                    arquivo.enviadoEm
                                  )}
                                </strong>
                              </div>

                              <div>
                                <small>
                                  Enviado por
                                </small>

                                <strong>
                                  {arquivo.enviadoPor?.nome?.trim() ||
                                    arquivo.enviadoPor?.email?.trim() ||
                                    "Usuário não disponível"}
                                </strong>
                              </div>

                              {arquivo.arquivado ? (
                                <>
                                  <div>
                                    <small>
                                      Excluído em
                                    </small>

                                    <strong>
                                      {formatarData(
                                        arquivo.arquivadoEm
                                      )}
                                    </strong>
                                  </div>

                                  <div>
                                    <small>
                                      Excluído por
                                    </small>

                                    <strong>
                                      {arquivo.arquivadoPor?.nome?.trim() ||
                                        arquivo.arquivadoPor?.email?.trim() ||
                                        "Usuário não disponível"}
                                    </strong>
                                  </div>
                                </>
                              ) : null}
                            </div>

                            {arquivo.arquivado &&
                              arquivo.motivoArquivamento ? (
                              <div className="bib-history-reason">
                                <small>
                                  Motivo da exclusão
                                </small>

                                <p>
                                  {
                                    arquivo.motivoArquivamento
                                  }
                                </p>
                              </div>
                            ) : null}

                            {!arquivo.arquivado &&
                              arquivo.disponivel ? (
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
                            ) : null}
                          </div>
                        </article>
                      )
                    )}
                  </div>
                ) : (
                  <div className="bib-history-empty">
                    <span aria-hidden="true">
                      🕘
                    </span>

                    <strong>
                      Nenhuma versão registrada
                    </strong>

                    <p>
                      Este item ainda não possui
                      histórico de arquivos.
                    </p>
                  </div>
                )}
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={
                    fecharHistoricoArquivos
                  }
                  disabled={
                    carregandoHistoricoArquivos
                  }
                >
                  Fechar
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </div>

      {arquivoParaExcluir ? (
        <div
          className="bib-modal-backdrop"
          role="presentation"
        >
          <section
            className="bib-modal bib-delete-file-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-exclusao-arquivo"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">
                  Biblioteca Virtual
                </span>

                <h2
                  id="titulo-exclusao-arquivo"
                >
                  Excluir arquivo
                </h2>

                <p>
                  O arquivo será removido do
                  armazenamento privado e deixará
                  de aparecer no acervo.
                </p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={
                  fecharExclusaoArquivo
                }
                disabled={
                  excluindoArquivo
                }
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                void excluirArquivo();
              }}
            >
              <div className="bib-modal-body">
                <div className="bib-delete-file-summary">
                  <span
                    aria-hidden="true"
                  >
                    🗑
                  </span>

                  <div>
                    <strong>
                      {
                        arquivoParaExcluir
                          .nomeOriginal
                      }
                    </strong>

                    <small>
                      {rotuloEnum(
                        arquivoParaExcluir
                          .tipo
                      )}
                      {" · "}
                      {formatarBytes(
                        arquivoParaExcluir
                          .tamanhoBytes
                      )}
                    </small>
                  </div>
                </div>

                <div className="bib-delete-warning">
                  <strong>
                    O espaço será devolvido à
                    instituição.
                  </strong>

                  <p>
                    Serão liberados{" "}
                    <b>
                      {formatarBytes(
                        arquivoParaExcluir
                          .tamanhoBytes
                      )}
                    </b>{" "}
                    do armazenamento contratado.
                    O registro da operação será
                    preservado para auditoria.
                  </p>
                </div>

                <label className="bib-field">
                  <span>
                    Motivo da exclusão
                  </span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={
                      motivoExclusao
                    }
                    onChange={(evento) =>
                      setMotivoExclusao(
                        evento.target.value
                      )
                    }
                    maxLength={2000}
                    disabled={
                      excluindoArquivo
                    }
                    placeholder="Opcional. Ex.: arquivo enviado por engano."
                  />

                  <small>
                    O motivo ficará registrado no
                    histórico da Biblioteca Virtual.
                  </small>
                </label>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={
                    fecharExclusaoArquivo
                  }
                  disabled={
                    excluindoArquivo
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="bib-button bib-button-danger"
                  onClick={() =>
                    void excluirArquivo()
                  }
                  disabled={
                    excluindoArquivo
                  }
                >
                  {excluindoArquivo
                    ? "Excluindo..."
                    : "🗑 Excluir arquivo"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {exemplarParaEmprestimo ? (
        <div
          className="bib-modal-backdrop"
          role="presentation"
        >
          <section
            className="bib-modal bib-emprestimo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-emprestimo-biblioteca"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">
                  Biblioteca Virtual
                </span>

                <h2
                  id="titulo-emprestimo-biblioteca"
                >
                  Registrar empréstimo
                </h2>

                <p>
                  Selecione quem receberá
                  este exemplar.
                </p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={
                  fecharEmprestimo
                }
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="bib-modal-body">
              <div className="bib-feedback">
                <div>
                  <strong>
                    {
                      exemplarParaEmprestimo
                        .codigoInterno
                    }
                  </strong>

                  <p>
                    {item?.titulo ||
                      "Item do acervo"}

                    {exemplarParaEmprestimo
                      .numeroTombo
                      ? ` · Tombo ${exemplarParaEmprestimo.numeroTombo}`
                      : ""}
                  </p>
                </div>
              </div>

              <label className="bib-field">
                <span>
                  Pesquisar pessoa
                </span>

                <input
                  type="search"
                  className="bib-input"
                  value={
                    buscaUsuarioEmprestimo
                  }
                  onChange={(evento) => {
                    setBuscaUsuarioEmprestimo(
                      evento.target.value
                    );

                    setUsuarioEmprestimoSelecionado(
                      null
                    );
                  }}
                  placeholder="Nome, e-mail, matrícula, CPF ou código funcional"
                  autoComplete="off"
                  autoFocus
                />

                <small>
                  Digite pelo menos 2
                  caracteres.
                </small>
              </label>

              {usuarioEmprestimoSelecionado ? (
                <div className="bib-feedback bib-feedback-success">
                  <div>
                    <strong>
                      Tomador selecionado
                    </strong>

                    <p>
                      {
                        usuarioEmprestimoSelecionado.nome
                      }

                      {" · "}

                      {rotuloEnum(
                        usuarioEmprestimoSelecionado.tipo
                      )}

                      {usuarioEmprestimoSelecionado
                        .identificador
                        ? ` · ${usuarioEmprestimoSelecionado.tipo ===
                          "ALUNO"
                          ? "Matrícula"
                          : "Código"
                        } ${usuarioEmprestimoSelecionado.identificador
                        }`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : null}

              {usuarioEmprestimoSelecionado ? (
                <>
                  <label className="bib-field">
                    <span>
                      Data prevista para devolução{" "}
                      <b>*</b>
                    </span>

                    <input
                      type="date"
                      className="bib-input"
                      value={
                        vencimentoEmprestimo
                      }
                      onChange={(evento) =>
                        setVencimentoEmprestimo(
                          evento.target.value
                        )
                      }
                      disabled={
                        registrandoEmprestimo
                      }
                    />

                    <small>
                      Informe o último dia
                      previsto para devolução
                      deste exemplar.
                    </small>
                  </label>

                  <label className="bib-field">
                    <span>
                      Observação da retirada
                    </span>

                    <textarea
                      className="bib-input bib-textarea"
                      value={
                        observacaoRetirada
                      }
                      onChange={(evento) =>
                        setObservacaoRetirada(
                          evento.target.value
                        )
                      }
                      maxLength={5_000}
                      disabled={
                        registrandoEmprestimo
                      }
                      placeholder="Ex.: exemplar entregue em bom estado, acompanhado de material complementar..."
                    />

                    <small>
                      Campo opcional. A informação
                      ficará registrada no empréstimo.
                    </small>
                  </label>
                </>
              ) : null}

              {buscandoUsuariosEmprestimo ? (
                <div className="bib-compact-empty">
                  Pesquisando pessoas...
                </div>
              ) : null}

              {erroBuscaUsuariosEmprestimo ? (
                <div className="bib-feedback bib-feedback-danger">
                  <div>
                    <strong>
                      Não foi possível
                      pesquisar
                    </strong>

                    <p>
                      {
                        erroBuscaUsuariosEmprestimo
                      }
                    </p>
                  </div>
                </div>
              ) : null}

              {!buscandoUsuariosEmprestimo &&
                buscaUsuarioEmprestimo
                  .trim()
                  .length >= 2 &&
                !erroBuscaUsuariosEmprestimo &&
                usuariosEmprestimo.length ===
                0 ? (
                <div className="bib-compact-empty">
                  Nenhuma pessoa encontrada
                  com essa pesquisa.
                </div>
              ) : null}

              {!buscandoUsuariosEmprestimo &&
                usuariosEmprestimo.length >
                0 ? (
                <div className="bib-related-list">
                  {usuariosEmprestimo.map(
                    (usuarioBusca) => (
                      <div
                        className="bib-related-row"
                        key={usuarioBusca.id}
                      >
                        <span
                          aria-hidden="true"
                        >
                          {usuarioBusca.tipo ===
                            "ALUNO"
                            ? "🎓"
                            : usuarioBusca.tipo ===
                              "PROFESSOR"
                              ? "👨‍🏫"
                              : "👤"}
                        </span>

                        <div>
                          <strong>
                            {
                              usuarioBusca.nome
                            }
                          </strong>

                          <small>
                            {rotuloEnum(
                              usuarioBusca.tipo
                            )}

                            {usuarioBusca
                              .identificador
                              ? ` · ${usuarioBusca.tipo ===
                                "ALUNO"
                                ? "Matrícula"
                                : "Código"
                              } ${usuarioBusca.identificador
                              }`
                              : ""}

                            {usuarioBusca
                              .cpfMascarado
                              ? ` · CPF ${usuarioBusca.cpfMascarado}`
                              : ""}
                          </small>

                          <small>
                            {
                              usuarioBusca.email
                            }

                            {usuarioBusca.cargo
                              ? ` · ${usuarioBusca.cargo}`
                              : ""}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="bib-button bib-button-secondary"
                          onClick={() =>
                            setUsuarioEmprestimoSelecionado(
                              usuarioBusca
                            )
                          }
                        >
                          {usuarioEmprestimoSelecionado
                            ?.id ===
                            usuarioBusca.id
                            ? "✓ Selecionado"
                            : "Selecionar"}
                        </button>
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </div>

            <footer className="bib-modal-footer">
              <button
                type="button"
                className="bib-button bib-button-secondary"
                onClick={
                  fecharEmprestimo
                }
                disabled={
                  registrandoEmprestimo
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="bib-button bib-button-primary"
                onClick={() =>
                  void registrarEmprestimo()
                }
                disabled={
                  registrandoEmprestimo ||
                  !usuarioEmprestimoSelecionado ||
                  !vencimentoEmprestimo
                }
              >
                {registrandoEmprestimo
                  ? "Registrando..."
                  : "📤 Registrar empréstimo"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {exemplarParaDevolucao ? (
        <div
          className="bib-modal-backdrop"
          role="presentation"
        >
          <section
            className="bib-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-devolucao-biblioteca"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">
                  Biblioteca Virtual
                </span>

                <h2
                  id="titulo-devolucao-biblioteca"
                >
                  Registrar devolução
                </h2>

                <p>
                  Informe como o exemplar
                  retornou à biblioteca.
                </p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={
                  fecharDevolucao
                }
                disabled={
                  devolvendoExemplar
                }
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();

                void registrarDevolucao();
              }}
            >
              <div className="bib-modal-body">
                <div className="bib-feedback">
                  <div>
                    <strong>
                      {
                        exemplarParaDevolucao
                          .codigoInterno
                      }
                    </strong>

                    <p>
                      {item.titulo}

                      {exemplarParaDevolucao
                        .numeroTombo
                        ? ` · Tombo ${exemplarParaDevolucao.numeroTombo}`
                        : ""}
                    </p>
                  </div>
                </div>

                <label className="bib-field">
                  <span>
                    Condição na devolução{" "}
                    <b>*</b>
                  </span>

                  <select
                    className="bib-input"
                    value={
                      condicaoDevolucao
                    }
                    onChange={(evento) =>
                      setCondicaoDevolucao(
                        evento.target.value
                      )
                    }
                    disabled={
                      devolvendoExemplar
                    }
                  >
                    <option value="NORMAL">
                      Normal
                    </option>

                    <option value="DESGASTE">
                      Desgaste de uso
                    </option>

                    <option value="DANIFICADO">
                      Danificado
                    </option>

                    <option value="INCOMPLETO">
                      Incompleto
                    </option>

                    <option value="PERDIDO">
                      Perdido
                    </option>
                  </select>

                  <small>
                    A condição informada define
                    se o exemplar voltará à
                    circulação.
                  </small>
                </label>

                {condicaoDevolucao ===
                  "NORMAL" ? (
                  <div className="bib-feedback bib-feedback-success">
                    <div>
                      <strong>
                        Voltará a ficar disponível
                      </strong>

                      <p>
                        O exemplar poderá ser
                        emprestado novamente.
                      </p>
                    </div>
                  </div>
                ) : null}

                {condicaoDevolucao ===
                  "DESGASTE" ? (
                  <div className="bib-feedback bib-feedback-warning">
                    <div>
                      <strong>
                        Desgaste registrado
                      </strong>

                      <p>
                        O exemplar continuará
                        disponível para circulação.
                      </p>
                    </div>
                  </div>
                ) : null}

                {condicaoDevolucao ===
                  "DANIFICADO" ? (
                  <div className="bib-feedback bib-feedback-warning">
                    <div>
                      <strong>
                        Exemplar será marcado como
                        danificado
                      </strong>

                      <p>
                        Ele não ficará disponível
                        para novo empréstimo.
                      </p>
                    </div>
                  </div>
                ) : null}

                {condicaoDevolucao ===
                  "INCOMPLETO" ? (
                  <div className="bib-feedback bib-feedback-warning">
                    <div>
                      <strong>
                        Exemplar ficará indisponível
                      </strong>

                      <p>
                        Será necessária análise
                        antes de retornar à
                        circulação.
                      </p>
                    </div>
                  </div>
                ) : null}

                {condicaoDevolucao ===
                  "PERDIDO" ? (
                  <div className="bib-feedback bib-feedback-danger">
                    <div>
                      <strong>
                        Exemplar será marcado como
                        extraviado
                      </strong>

                      <p>
                        O empréstimo será encerrado
                        como perdido e o exemplar
                        sairá da circulação.
                      </p>
                    </div>
                  </div>
                ) : null}

                <label className="bib-field">
                  <span>
                    Observação da devolução
                  </span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={
                      observacaoDevolucao
                    }
                    onChange={(evento) =>
                      setObservacaoDevolucao(
                        evento.target.value
                      )
                    }
                    maxLength={5_000}
                    disabled={
                      devolvendoExemplar
                    }
                    placeholder="Ex.: exemplar devolvido em bom estado."
                  />

                  <small>
                    Campo opcional. A informação
                    ficará registrada no histórico
                    do empréstimo.
                  </small>
                </label>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={
                    fecharDevolucao
                  }
                  disabled={
                    devolvendoExemplar
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={
                    devolvendoExemplar
                  }
                >
                  {devolvendoExemplar
                    ? "Registrando..."
                    : "📥 Registrar devolução"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {modalExemplarAberto ? (
        <div
          className="bib-modal-backdrop"
          role="presentation"
        >
          <section
            className="bib-modal bib-exemplar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cadastro-exemplar"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">
                  Biblioteca Virtual
                </span>

                <h2
                  id="titulo-cadastro-exemplar"
                >
                  {exemplarEmEdicao
                    ? "Editar exemplar"
                    : "Cadastrar exemplar"}
                </h2>
                <p>
                  {exemplarEmEdicao
                    ? "Atualize os dados deste exemplar do acervo."
                    : "Registre a unidade física ou digital vinculada a este item do acervo."}
                </p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={
                  fecharCadastroExemplar
                }
                disabled={
                  salvandoExemplar
                }
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                void salvarExemplar();
              }}
            >
              <div className="bib-modal-body">
                <div className="bib-detail-grid">
                  <label className="bib-field">
                    <span>
                      Tipo <b>*</b>
                    </span>

                    <select
                      className="bib-input"
                      value={
                        formularioExemplar.tipo
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "tipo",
                          evento.target
                            .value as
                          | "FISICO"
                          | "DIGITAL"
                        )
                      }
                      disabled={
                        salvandoExemplar
                      }
                    >
                      <option value="FISICO">
                        Físico
                      </option>

                      <option value="DIGITAL">
                        Digital
                      </option>
                    </select>
                  </label>

                  <label className="bib-field">
                    <span>
                      Código interno <b>*</b>
                    </span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .codigoInterno
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "codigoInterno",
                          evento.target.value
                        )
                      }
                      maxLength={120}
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="Ex.: LIV-0001"
                    />
                  </label>

                  <label className="bib-field">
                    <span>
                      Código de barras
                    </span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .codigoBarras
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "codigoBarras",
                          evento.target.value
                        )
                      }
                      maxLength={120}
                      disabled={
                        salvandoExemplar
                      }
                    />
                  </label>

                  <label className="bib-field">
                    <span>Número de tombo</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .numeroTombo
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "numeroTombo",
                          evento.target.value
                        )
                      }
                      maxLength={120}
                      disabled={
                        salvandoExemplar
                      }
                    />
                  </label>

                  <label className="bib-field">
                    <span>Patrimônio</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .patrimonio
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "patrimonio",
                          evento.target.value
                        )
                      }
                      maxLength={120}
                      disabled={
                        salvandoExemplar
                      }
                    />
                  </label>

                  <label className="bib-field">
                    <span>Unidade / Polo</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .unidadeSnapshot
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "unidadeSnapshot",
                          evento.target.value
                        )
                      }
                      maxLength={200}
                      disabled={
                        salvandoExemplar
                      }
                    />
                  </label>

                  <label className="bib-field">
                    <span>Setor</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar.setor
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "setor",
                          evento.target.value
                        )
                      }
                      maxLength={160}
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="Ex.: Biblioteca"
                    />
                  </label>

                  <label className="bib-field">
                    <span>Sala</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar.sala
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "sala",
                          evento.target.value
                        )
                      }
                      maxLength={120}
                      disabled={
                        salvandoExemplar
                      }
                    />
                  </label>

                  <label className="bib-field">
                    <span>Estante</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .estante
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "estante",
                          evento.target.value
                        )
                      }
                      maxLength={120}
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="Ex.: A"
                    />
                  </label>

                  <label className="bib-field">
                    <span>Prateleira</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .prateleira
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "prateleira",
                          evento.target.value
                        )
                      }
                      maxLength={120}
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="Ex.: 03"
                    />
                  </label>

                  <label className="bib-field bib-field-span-3">
                    <span>
                      Localização completa
                    </span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .localizacaoCompleta
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "localizacaoCompleta",
                          evento.target.value
                        )
                      }
                      maxLength={500}
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="Ex.: Biblioteca central · Estante A · Prateleira 03"
                    />
                  </label>

                  <label className="bib-field">
                    <span>Data de aquisição</span>

                    <input
                      className="bib-input"
                      type="date"
                      value={
                        formularioExemplar
                          .dataAquisicao
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "dataAquisicao",
                          evento.target.value
                        )
                      }
                      disabled={
                        salvandoExemplar
                      }
                    />
                  </label>

                  <label className="bib-field">
                    <span>Forma de aquisição</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .formaAquisicao
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "formaAquisicao",
                          evento.target.value
                        )
                      }
                      maxLength={160}
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="Ex.: Compra, doação"
                    />
                  </label>

                  <label className="bib-field">
                    <span>Fornecedor</span>

                    <input
                      className="bib-input"
                      value={
                        formularioExemplar
                          .fornecedor
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "fornecedor",
                          evento.target.value
                        )
                      }
                      maxLength={240}
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="Editora, livraria ou fornecedor"
                    />
                  </label>

                  <label className="bib-field">
                    <span>Valor de aquisição</span>

                    <input
                      className="bib-input"
                      inputMode="decimal"
                      value={
                        formularioExemplar
                          .valorAquisicao
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "valorAquisicao",
                          evento.target.value
                        )
                      }
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="0,00"
                    />
                  </label>

                  <label className="bib-field bib-field-span-3">
                    <span>Observações</span>

                    <textarea
                      className="bib-input bib-textarea"
                      value={
                        formularioExemplar
                          .observacoes
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "observacoes",
                          evento.target.value
                        )
                      }
                      maxLength={10_000}
                      disabled={
                        salvandoExemplar
                      }
                      placeholder="Informações adicionais sobre este exemplar."
                    />
                  </label>
                </div>
                <fieldset className="bib-options">
                  <legend>Circulação</legend>

                  <label className="bib-check">
                    <input
                      type="checkbox"
                      checked={
                        formularioExemplar
                          .permiteEmprestimo
                      }
                      onChange={(evento) =>
                        alterarExemplar(
                          "permiteEmprestimo",
                          evento.target.checked
                        )
                      }
                      disabled={
                        salvandoExemplar
                      }
                    />

                    <span>
                      <b>Permitir empréstimo</b>

                      <small>
                        Este exemplar poderá participar
                        da circulação da biblioteca.
                      </small>
                    </span>
                  </label>
                </fieldset>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={
                    fecharCadastroExemplar
                  }
                  disabled={
                    salvandoExemplar
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={
                    salvandoExemplar ||
                    !formularioExemplar
                      .codigoInterno
                      .trim()
                  }
                >
                  {salvandoExemplar
                    ? exemplarEmEdicao
                      ? "Salvando..."
                      : "Cadastrando..."
                    : exemplarEmEdicao
                      ? "Salvar alterações"
                      : "Cadastrar exemplar"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {exemplarParaBaixa ? (
        <div
          className="bib-modal-backdrop"
          role="presentation"
        >
          <section
            className="bib-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-baixa-exemplar"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">
                  Biblioteca Virtual
                </span>

                <h2
                  id="titulo-baixa-exemplar"
                >
                  Dar baixa no exemplar
                </h2>

                <p>
                  O exemplar será retirado da
                  circulação, mas permanecerá
                  registrado no histórico do
                  acervo.
                </p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={
                  fecharBaixaExemplar
                }
                disabled={
                  baixandoExemplar
                }
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                void darBaixaExemplar();
              }}
            >
              <div className="bib-modal-body">
                <div className="bib-feedback bib-feedback-warning">
                  <div>
                    <strong>
                      {
                        exemplarParaBaixa
                          .codigoInterno
                      }
                    </strong>

                    <p>
                      {rotuloEnum(
                        exemplarParaBaixa.tipo
                      )}

                      {" · "}

                      {rotuloEnum(
                        exemplarParaBaixa.status
                      )}

                      {exemplarParaBaixa
                        .numeroTombo
                        ? ` · Tombo ${exemplarParaBaixa.numeroTombo}`
                        : ""}
                    </p>
                  </div>
                </div>

                <label className="bib-field">
                  <span>
                    Motivo da baixa <b>*</b>
                  </span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={
                      motivoBaixaExemplar
                    }
                    onChange={(evento) =>
                      setMotivoBaixaExemplar(
                        evento.target.value
                      )
                    }
                    maxLength={5_000}
                    disabled={
                      baixandoExemplar
                    }
                    placeholder="Ex.: exemplar extraviado, dano irreparável, descarte patrimonial..."
                    autoFocus
                  />

                  <small>
                    O motivo ficará registrado
                    na auditoria e no histórico
                    deste exemplar.
                  </small>
                </label>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={
                    fecharBaixaExemplar
                  }
                  disabled={
                    baixandoExemplar
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bib-button bib-button-danger"
                  disabled={
                    baixandoExemplar ||
                    !motivoBaixaExemplar
                      .trim()
                  }
                >
                  {baixandoExemplar
                    ? "Realizando baixa..."
                    : "⬇ Dar baixa no exemplar"}
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