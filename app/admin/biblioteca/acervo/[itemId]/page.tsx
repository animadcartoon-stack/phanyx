"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ChangeEvent, FormEvent } from "react";

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

  enviadoPor: UsuarioHistoricoArquivo | null;

  arquivadoPor: UsuarioHistoricoArquivo | null;
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

type ManutencaoAbertaExemplar = {
  id: number;

  status: "ABERTA";
  resultado: string | null;

  motivo: string;
  observacaoEntrada: string | null;

  fornecedor: string | null;
  custoEstimado: string | null;
  custoFinal: string | null;

  iniciadaEm: string;
  previsaoRetornoEm: string | null;
  concluidaEm: string | null;
  canceladaEm: string | null;

  observacaoConclusao: string | null;

  iniciadoPorId: number | null;
  concluidoPorId: number | null;
  canceladoPorId: number | null;
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
  manutencaoAberta?: ManutencaoAbertaExemplar | null;

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
    podeGerenciarManutencao: boolean;
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

  tipo: "ALUNO" | "PROFESSOR" | "FUNCIONARIO";

  identificador: string | null;

  cpfMascarado: string | null;

  alunoStatus: string | null;

  professorStatus: string | null;

  funcionarioStatus: string | null;

  cargo: string | null;
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

const EXTENSOES_UPLOAD_BIBLIOTECA = new Set([
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

function obterExtensaoUpload(nomeArquivo: string) {
  const nome = String(nomeArquivo || "").trim();

  const ultimaParte = nome.split(".").pop()?.toLowerCase() || "";

  if (!ultimaParte || ultimaParte === nome.toLowerCase()) {
    return "";
  }

  return ultimaParte;
}

function limparNomeArquivoUpload(nomeArquivo: string) {
  const nomeOriginal = String(nomeArquivo || "").trim();

  const extensao = obterExtensaoUpload(nomeOriginal);

  const semExtensao = extensao
    ? nomeOriginal.slice(0, -(extensao.length + 1))
    : nomeOriginal;

  const nomeSeguro =
    semExtensao
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120) || "arquivo";

  if (!extensao) {
    return nomeSeguro;
  }

  return `${nomeSeguro}.${extensao}`;
}

function rotuloEnum(valor?: string | null) {
  if (!valor) return "—";

  const locale =
    typeof document !== "undefined"
      ? document.documentElement.lang || "pt-BR"
      : "pt-BR";

  return valor
    .replaceAll("_", " ")
    .toLocaleLowerCase(locale)
    .replace(/(^|\s)\p{L}/gu, (letra) => letra.toLocaleUpperCase(locale));
}

function formatarData(valor?: string | null) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  const locale =
    typeof document !== "undefined"
      ? document.documentElement.lang || "pt-BR"
      : "pt-BR";

  return new Intl.DateTimeFormat(locale, {
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
    unidades.length - 1,
  );
  const quantidade = bytes / 1024 ** indice;

  const locale =
    typeof document !== "undefined"
      ? document.documentElement.lang || "pt-BR"
      : "pt-BR";

  return `${new Intl.NumberFormat(locale, {
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

  if (status === "ARQUIVADO" || status === "INDISPONIVEL") {
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
    anoPublicacao: item.anoPublicacao ? String(item.anoPublicacao) : "",
    dataPublicacao: dataParaInput(item.dataPublicacao),
    edicao: item.edicao || "",
    volume: item.volume || "",
    numero: item.numero || "",
    numeroPaginas: item.numeroPaginas ? String(item.numeroPaginas) : "",
    duracaoSegundos: item.duracaoSegundos ? String(item.duracaoSegundos) : "",
    classificacaoBibliografica: item.classificacaoBibliografica || "",
    codigoChamada: item.codigoChamada || "",
    cdd: item.cdd || "",
    cdu: item.cdu || "",
    capaUrl: item.capaUrl || "",
    miniaturaUrl: item.miniaturaUrl || "",
    classificacaoIndicativa: item.classificacaoIndicativa || "",
    observacoesInternas: item.observacoesInternas || "",
    destaque: item.destaque,
    permitirDownload: item.permitirDownload,
    permitirAvaliacao: item.permitirAvaliacao,
    acessoLivre: item.acessoLivre,
  };
}

function obterMensagemErro(resposta: RespostaItem, padrao: string) {
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
  const t = useTranslations("AdminLibraryItem");
  const ui = useTranslations("AdminLibraryItemUi");
  const tCollection = useTranslations("AdminLibraryCollection");
  const tDashboard = useTranslations("AdminLibraryDashboard");
  const locale = useLocale();
  const params = useParams<{ itemId: string }>();
  const itemId = Number(params.itemId);

  function rotuloTipoItem(valor: string) {
    switch (valor) {
      case "LIVRO":
        return tDashboard("types.book");
      case "EBOOK":
        return tDashboard("types.ebook");
      case "ARTIGO_CIENTIFICO":
        return tDashboard("types.scientificArticle");
      case "REVISTA":
        return tDashboard("types.magazine");
      case "PERIODICO":
        return tDashboard("types.journal");
      case "APOSTILA":
        return tDashboard("types.handout");
      case "TCC":
        return tDashboard("types.finalPaper");
      case "MONOGRAFIA":
        return tDashboard("types.monograph");
      case "DISSERTACAO":
        return tDashboard("types.dissertation");
      case "TESE":
        return tDashboard("types.thesis");
      case "PESQUISA":
        return tDashboard("types.research");
      case "DOCUMENTO":
        return tDashboard("types.document");
      case "VIDEO":
        return tDashboard("types.video");
      case "DOCUMENTARIO":
        return tDashboard("types.documentary");
      case "AUDIO":
        return tDashboard("types.audio");
      case "AUDIOLIVRO":
        return tDashboard("types.audiobook");
      case "PODCAST":
        return tDashboard("types.podcast");
      case "LINK_EXTERNO":
        return tDashboard("types.externalLink");
      case "OUTRO":
        return tDashboard("types.other");
      default:
        return valor;
    }
  }

  function rotuloStatusItem(valor: string) {
    switch (valor) {
      case "RASCUNHO":
        return tDashboard("itemStatus.draft");
      case "EM_REVISAO":
        return tDashboard("itemStatus.inReview");
      case "PUBLICADO":
        return tDashboard("itemStatus.published");
      case "RESTRITO":
        return tDashboard("itemStatus.restricted");
      case "INDISPONIVEL":
        return tDashboard("itemStatus.unavailable");
      case "ARQUIVADO":
        return tDashboard("itemStatus.archived");
      default:
        return valor;
    }
  }

  function rotuloModalidade(valor: string) {
    switch (valor) {
      case "LEITURA_INTERNA":
        return tCollection("modalities.internalReading");
      case "ACESSO_LIVRE":
        return tCollection("modalities.openAccess");
      case "DOWNLOAD_AUTORIZADO":
        return tCollection("modalities.authorizedDownload");
      case "EMPRESTIMO_DIGITAL":
        return tCollection("modalities.digitalLoan");
      case "EMPRESTIMO_FISICO":
        return tCollection("modalities.physicalLoan");
      case "STREAMING":
        return tCollection("modalities.streaming");
      case "LINK_EXTERNO":
        return tCollection("modalities.externalLink");
      default:
        return valor;
    }
  }

  function rotuloEnumLocalizado(valor?: string | null) {
    switch (valor) {
      case "DISPONIVEL":
        return ui("enumAvailable");
      case "PROCESSANDO":
        return ui("enumProcessing");
      case "ERRO":
        return ui("enumError");
      case "EXCLUIDO":
        return ui("enumDeleted");
      case "FISICO":
        return ui("physical");
      case "DIGITAL":
        return ui("digital");
      case "EMPRESTADO":
        return ui("enumLoaned");
      case "RESERVADO":
        return ui("enumReserved");
      case "MANUTENCAO":
        return ui("enumMaintenance");
      case "DANIFICADO":
        return ui("enumDamaged");
      case "INDISPONIVEL":
        return ui("enumUnavailable");
      case "EXTRAVIADO":
        return ui("enumLost");
      case "BAIXADO":
        return ui("enumWrittenOff");
      case "AUTOR":
        return ui("enumAuthor");
      case "COAUTOR":
        return ui("enumCoauthor");
      case "ORGANIZADOR":
        return ui("enumOrganizer");
      case "TRADUTOR":
        return ui("enumTranslator");
      case "REVISOR":
        return ui("enumReviewer");
      case "ILUSTRADOR":
        return ui("enumIllustrator");
      case "ALUNO":
        return ui("enumStudent");
      case "PROFESSOR":
        return ui("enumTeacher");
      case "FUNCIONARIO":
        return ui("enumEmployee");
      default:
        return rotuloEnum(valor);
    }
  }

  const [item, setItem] = useState<ItemDetalhe | null>(null);
  const [formulario, setFormulario] = useState<FormularioItem | null>(null);
  const [podeEditar, setPodeEditar] = useState(false);
  const [impersonacao, setImpersonacao] = useState(false);
  const [downloadPermitido, setDownloadPermitido] = useState(false);

  const [instituicaoId, setInstituicaoId] = useState<number | null>(null);

  const [podeEnviarArquivo, setPodeEnviarArquivo] = useState(false);

  const [armazenamento, setArmazenamento] =
    useState<ArmazenamentoBiblioteca | null>(null);

  const [enviandoArquivo, setEnviandoArquivo] = useState(false);

  const [progressoUpload, setProgressoUpload] = useState(0);

  const arquivoInputRef = useRef<HTMLInputElement | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [atualizacao, setAtualizacao] = useState(0);

  const [exemplares, setExemplares] = useState<ExemplarItem[]>([]);

  const [podeGerenciarExemplares, setPodeGerenciarExemplares] = useState(false);

  const [podeBaixarExemplares, setPodeBaixarExemplares] = useState(false);

  const [podeGerenciarManutencao, setPodeGerenciarManutencao] = useState(false);

  const [podeGerenciarEmprestimos, setPodeGerenciarEmprestimos] =
    useState(false);

  const [exemplarParaEmprestimo, setExemplarParaEmprestimo] =
    useState<ExemplarItem | null>(null);

  const [buscaUsuarioEmprestimo, setBuscaUsuarioEmprestimo] = useState("");

  const [usuariosEmprestimo, setUsuariosEmprestimo] = useState<
    UsuarioEmprestimo[]
  >([]);

  const [usuarioEmprestimoSelecionado, setUsuarioEmprestimoSelecionado] =
    useState<UsuarioEmprestimo | null>(null);

  const [buscandoUsuariosEmprestimo, setBuscandoUsuariosEmprestimo] =
    useState(false);

  const [erroBuscaUsuariosEmprestimo, setErroBuscaUsuariosEmprestimo] =
    useState<string | null>(null);

  const [vencimentoEmprestimo, setVencimentoEmprestimo] = useState("");

  const [observacaoRetirada, setObservacaoRetirada] = useState("");

  const [registrandoEmprestimo, setRegistrandoEmprestimo] = useState(false);

  const [exemplarParaDevolucao, setExemplarParaDevolucao] =
    useState<ExemplarItem | null>(null);

  const [condicaoDevolucao, setCondicaoDevolucao] = useState("NORMAL");

  const [observacaoDevolucao, setObservacaoDevolucao] = useState("");

  const [devolvendoExemplar, setDevolvendoExemplar] = useState(false);

  const [exemplarParaManutencao, setExemplarParaManutencao] =
    useState<ExemplarItem | null>(null);

  const [motivoManutencao, setMotivoManutencao] = useState("");

  const [observacaoEntradaManutencao, setObservacaoEntradaManutencao] =
    useState("");

  const [fornecedorManutencao, setFornecedorManutencao] = useState("");

  const [custoEstimadoManutencao, setCustoEstimadoManutencao] = useState("");

  const [previsaoRetornoManutencao, setPrevisaoRetornoManutencao] =
    useState("");

  const [enviandoParaManutencao, setEnviandoParaManutencao] = useState(false);

  const [exemplarParaConclusaoManutencao, setExemplarParaConclusaoManutencao] =
    useState<ExemplarItem | null>(null);

  const [resultadoManutencao, setResultadoManutencao] = useState<
    "REPARADO" | "IRRECUPERAVEL"
  >("REPARADO");

  const [observacaoConclusaoManutencao, setObservacaoConclusaoManutencao] =
    useState("");

  const [custoFinalManutencao, setCustoFinalManutencao] = useState("");

  const [concluindoManutencao, setConcluindoManutencao] = useState(false);

  const [
    exemplarParaCancelamentoManutencao,
    setExemplarParaCancelamentoManutencao,
  ] = useState<ExemplarItem | null>(null);

  const [motivoCancelamentoManutencao, setMotivoCancelamentoManutencao] =
    useState("");

  const [
    statusRetornoCancelamentoManutencao,
    setStatusRetornoCancelamentoManutencao,
  ] = useState<"DANIFICADO" | "INDISPONIVEL">("DANIFICADO");

  const [cancelandoManutencao, setCancelandoManutencao] = useState(false);

  const [carregandoExemplares, setCarregandoExemplares] = useState(false);

  const [modalExemplarAberto, setModalExemplarAberto] = useState(false);

  const [exemplarEmEdicao, setExemplarEmEdicao] = useState<ExemplarItem | null>(
    null,
  );

  const [salvandoExemplar, setSalvandoExemplar] = useState(false);

  const [formularioExemplar, setFormularioExemplar] =
    useState<FormularioExemplar>({
      ...FORMULARIO_EXEMPLAR_INICIAL,
    });

  const [exemplarParaBaixa, setExemplarParaBaixa] =
    useState<ExemplarItem | null>(null);

  const [motivoBaixaExemplar, setMotivoBaixaExemplar] = useState("");

  const [baixandoExemplar, setBaixandoExemplar] = useState(false);

  const carregarItem = useCallback(
    async (signal?: AbortSignal) => {
      if (!Number.isInteger(itemId) || itemId <= 0) {
        setErro(ui("invalidItemId"));
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro(null);

      try {
        const resposta = await fetch(`/api/admin/biblioteca/acervo/${itemId}`, {
          method: "GET",
          cache: "no-store",
          signal,
        });
        const resultado = (await resposta.json()) as RespostaItem;

        if (!resposta.ok || !resultado.item) {
          throw new Error(obterMensagemErro(resultado, ui("loadItemError")));
        }

        setItem(resultado.item);
        setFormulario(criarFormulario(resultado.item));
        setPodeEditar(resultado.permissoes?.podeEditar === true);
        setImpersonacao(resultado.permissoes?.impersonacao === true);
        setDownloadPermitido(resultado.configuracao?.permitirDownload === true);
        setInstituicaoId(
          Number.isInteger(resultado.instituicaoId)
            ? resultado.instituicaoId!
            : null,
        );

        setPodeEnviarArquivo(resultado.permissoes?.podeEnviarArquivo === true);

        setPodeExcluirArquivo(
          resultado.permissoes?.podeExcluirArquivo === true,
        );

        setPodeGerenciarArquivo(
          resultado.permissoes?.podeGerenciarArquivo === true,
        );

        setArmazenamento(resultado.armazenamento || null);
      } catch (falha) {
        if (falha instanceof DOMException && falha.name === "AbortError") {
          return;
        }

        setErro(falha instanceof Error ? falha.message : ui("loadItemError"));
      } finally {
        if (!signal?.aborted) {
          setCarregando(false);
        }
      }
    },
    [itemId],
  );

  const carregarExemplares = useCallback(
    async (signal?: AbortSignal) => {
      if (!Number.isInteger(itemId) || itemId <= 0) {
        return;
      }

      setCarregandoExemplares(true);

      try {
        const resposta = await fetch(
          `/api/admin/biblioteca/acervo/${itemId}/exemplares`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const resultado = (await resposta.json()) as RespostaExemplares;

        if (!resposta.ok) {
          throw new Error(
            resultado.error || resultado.mensagem || ui("loadCopiesError"),
          );
        }

        setExemplares(
          Array.isArray(resultado.exemplares) ? resultado.exemplares : [],
        );

        setPodeGerenciarExemplares(
          resultado.permissoes?.podeGerenciar === true,
        );

        setPodeBaixarExemplares(resultado.permissoes?.podeBaixar === true);
        setPodeGerenciarManutencao(
          resultado.permissoes?.podeGerenciarManutencao === true,
        );
      } catch (falha) {
        if (falha instanceof DOMException && falha.name === "AbortError") {
          return;
        }

        setExemplares([]);

        setPodeGerenciarExemplares(false);

        setPodeBaixarExemplares(false);

        setPodeGerenciarManutencao(false);

        setToast({
          tipo: "erro",

          mensagem:
            falha instanceof Error ? falha.message : ui("loadCopiesError"),
        });
      } finally {
        if (!signal?.aborted) {
          setCarregandoExemplares(false);
        }
      }
    },
    [itemId],
  );

  const [podeExcluirArquivo, setPodeExcluirArquivo] = useState(false);

  const [arquivoParaExcluir, setArquivoParaExcluir] =
    useState<ArquivoItem | null>(null);

  const [motivoExclusao, setMotivoExclusao] = useState("");

  const [excluindoArquivo, setExcluindoArquivo] = useState(false);

  const [podeGerenciarArquivo, setPodeGerenciarArquivo] = useState(false);

  const [definindoPrincipalId, setDefinindoPrincipalId] = useState<
    number | null
  >(null);

  const [historicoArquivosAberto, setHistoricoArquivosAberto] = useState(false);

  const [historicoArquivos, setHistoricoArquivos] = useState<
    ArquivoHistorico[]
  >([]);

  const [resumoHistoricoArquivos, setResumoHistoricoArquivos] = useState({
    total: 0,
    ativos: 0,
    arquivados: 0,
  });

  const [carregandoHistoricoArquivos, setCarregandoHistoricoArquivos] =
    useState(false);

  const [erroHistoricoArquivos, setErroHistoricoArquivos] = useState<
    string | null
  >(null);

  useEffect(() => {
    const controle = new AbortController();

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
        const resposta = await fetch(
          "/api/admin/biblioteca/circulacao/usuarios?q=",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            signal: controle.signal,
          },
        );

        if (controle.signal.aborted) {
          return;
        }

        setPodeGerenciarEmprestimos(resposta.ok);
      } catch (falha) {
        if (falha instanceof DOMException && falha.name === "AbortError") {
          return;
        }

        setPodeGerenciarEmprestimos(false);
      }
    }

    void verificarPermissaoEmprestimos();

    return () => controle.abort();
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    void carregarItem(controlador.signal);

    return () => controlador.abort();
  }, [carregarItem, atualizacao]);

  useEffect(() => {
    const controlador = new AbortController();

    void carregarExemplares(controlador.signal);

    return () => controlador.abort();
  }, [carregarExemplares, atualizacao]);

  useEffect(() => {
    if (!toast) return;

    const temporizador = window.setTimeout(() => setToast(null), 5_000);

    return () => window.clearTimeout(temporizador);
  }, [toast]);

  useEffect(() => {
    if (!exemplarParaEmprestimo) {
      return;
    }

    const termo = buscaUsuarioEmprestimo.trim();

    if (termo.length < 2) {
      setUsuariosEmprestimo([]);
      setBuscandoUsuariosEmprestimo(false);
      setErroBuscaUsuariosEmprestimo(null);

      return;
    }

    const controle = new AbortController();

    const temporizador = window.setTimeout(async () => {
      setBuscandoUsuariosEmprestimo(true);

      setErroBuscaUsuariosEmprestimo(null);

      try {
        const resposta = await fetch(
          `/api/admin/biblioteca/circulacao/usuarios?q=${encodeURIComponent(
            termo,
          )}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            signal: controle.signal,
          },
        );

        const resultado = (await resposta.json()) as RespostaUsuariosEmprestimo;

        if (!resposta.ok) {
          throw new Error(
            resultado.error || resultado.mensagem || ui("searchUsersError"),
          );
        }

        if (controle.signal.aborted) {
          return;
        }

        setUsuariosEmprestimo(
          Array.isArray(resultado.usuarios) ? resultado.usuarios : [],
        );
      } catch (falha) {
        if (falha instanceof DOMException && falha.name === "AbortError") {
          return;
        }

        setUsuariosEmprestimo([]);

        setErroBuscaUsuariosEmprestimo(
          falha instanceof Error ? falha.message : ui("searchUsersError"),
        );
      } finally {
        if (!controle.signal.aborted) {
          setBuscandoUsuariosEmprestimo(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(temporizador);

      controle.abort();
    };
  }, [buscaUsuarioEmprestimo, exemplarParaEmprestimo]);

  const alterado = useMemo(() => {
    if (!item || !formulario) return false;

    return JSON.stringify(formulario) !== JSON.stringify(criarFormulario(item));
  }, [formulario, item]);

  function alterar<K extends keyof FormularioItem>(
    campo: K,
    valor: FormularioItem[K],
  ) {
    setFormulario((atual) =>
      atual
        ? {
            ...atual,
            [campo]: valor,
          }
        : atual,
    );
  }

  function cancelarEdicao() {
    if (item) {
      setFormulario(criarFormulario(item));
    }

    setEditando(false);
  }

  async function enviarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];

    /*
     * Permite escolher novamente
     * o mesmo arquivo depois.
     */
    evento.target.value = "";

    if (!arquivo) {
      return;
    }

    if (enviandoArquivo || !podeEnviarArquivo) {
      return;
    }

    if (!instituicaoId || !Number.isInteger(instituicaoId)) {
      setToast({
        tipo: "erro",
        mensagem: ui("identifyInstitutionError"),
      });

      return;
    }

    if (!armazenamento) {
      setToast({
        tipo: "erro",
        mensagem: ui("storageQueryError"),
      });

      return;
    }

    const extensao = obterExtensaoUpload(arquivo.name);

    if (!EXTENSOES_UPLOAD_BIBLIOTECA.has(extensao)) {
      setToast({
        tipo: "erro",
        mensagem: ui("invalidFileFormat"),
      });

      return;
    }

    let disponivel = 0n;

    try {
      disponivel = BigInt(armazenamento.disponivelBytes || "0");
    } catch {
      disponivel = 0n;
    }

    const tamanhoArquivo = BigInt(arquivo.size);

    if (tamanhoArquivo > disponivel) {
      setToast({
        tipo: "erro",
        mensagem: ui("insufficientStorage", {
          fileSize: formatarBytes(String(arquivo.size)),
          available: formatarBytes(armazenamento.disponivelBytes),
        }),
      });

      return;
    }

    const nomeSeguro = limparNomeArquivoUpload(arquivo.name);

    const pathname = [
      "biblioteca",
      `instituicao-${instituicaoId}`,
      `item-${itemId}`,
      nomeSeguro,
    ].join("/");

    setEnviandoArquivo(true);
    setProgressoUpload(0);

    try {
      await upload(pathname, arquivo, {
        access: "private",

        handleUploadUrl: `/api/admin/biblioteca/acervo/${itemId}/arquivos/upload`,

        clientPayload: JSON.stringify({
          nomeOriginal: arquivo.name,

          tamanhoBytes: arquivo.size,

          mimeType: arquivo.type || "",
        }),

        multipart: true,

        contentType: arquivo.type || undefined,

        onUploadProgress(progresso) {
          setProgressoUpload(
            Math.max(0, Math.min(100, Math.round(progresso.percentage))),
          );
        },
      });

      setProgressoUpload(100);

      setToast({
        tipo: "sucesso",
        mensagem: ui("uploadSuccess"),
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
      const temposAtualizacao = [800, 2_000, 4_000];

      temposAtualizacao.forEach((tempo) => {
        window.setTimeout(() => {
          setAtualizacao((valor) => valor + 1);
        }, tempo);
      });
    } catch (falha) {
      setToast({
        tipo: "erro",
        mensagem: falha instanceof Error ? falha.message : ui("uploadError"),
      });
    } finally {
      setEnviandoArquivo(false);
    }
  }

  function abrirExclusaoArquivo(arquivo: ArquivoItem) {
    if (!podeExcluirArquivo || impersonacao) {
      return;
    }

    setArquivoParaExcluir(arquivo);

    setMotivoExclusao("");
  }

  function fecharExclusaoArquivo() {
    if (excluindoArquivo) {
      return;
    }

    setArquivoParaExcluir(null);

    setMotivoExclusao("");
  }

  async function excluirArquivo() {
    if (!arquivoParaExcluir || excluindoArquivo || !podeExcluirArquivo) {
      return;
    }

    setExcluindoArquivo(true);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/arquivos/${arquivoParaExcluir.id}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            motivo: motivoExclusao.trim() || ui("defaultFileRemovalReason"),
          }),
        },
      );

      const resultado = (await resposta.json()) as {
        ok?: boolean;
        mensagem?: string;
        error?: string;
        armazenamentoLiberadoBytes?: string;
      };

      if (!resposta.ok) {
        throw new Error(resultado.error || ui("deleteFileError"));
      }

      const liberado = resultado.armazenamentoLiberadoBytes
        ? formatarBytes(resultado.armazenamentoLiberadoBytes)
        : null;

      setToast({
        tipo: "sucesso",

        mensagem:
          liberado && liberado !== "0 B"
            ? ui("storageReleased", { size: liberado })
            : resultado.mensagem || ui("deleteFileSuccess"),
      });

      setArquivoParaExcluir(null);

      setMotivoExclusao("");

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error ? falha.message : ui("deleteFileError"),
      });
    } finally {
      setExcluindoArquivo(false);
    }
  }

  async function definirArquivoPrincipal(arquivo: ArquivoItem) {
    if (
      arquivo.principal ||
      definindoPrincipalId !== null ||
      !podeGerenciarArquivo ||
      impersonacao
    ) {
      return;
    }

    setDefinindoPrincipalId(arquivo.id);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/arquivos/${arquivo.id}/principal`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const resultado = (await resposta.json()) as {
        ok?: boolean;
        mensagem?: string;
        error?: string;
      };

      if (!resposta.ok) {
        throw new Error(resultado.error || ui("setPrimaryError"));
      }

      setToast({
        tipo: "sucesso",

        mensagem: resultado.mensagem || ui("setPrimarySuccess"),
      });

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error ? falha.message : ui("setPrimaryError"),
      });
    } finally {
      setDefinindoPrincipalId(null);
    }
  }

  async function abrirHistoricoArquivos() {
    if (!podeGerenciarArquivo || impersonacao || carregandoHistoricoArquivos) {
      return;
    }

    setHistoricoArquivosAberto(true);
    setCarregandoHistoricoArquivos(true);
    setErroHistoricoArquivos(null);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/acervo/${itemId}/arquivos/historico`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const resultado = (await resposta.json()) as RespostaHistoricoArquivos;

      if (!resposta.ok) {
        throw new Error(
          resultado.error || resultado.mensagem || ui("loadFileHistoryError"),
        );
      }

      setHistoricoArquivos(resultado.arquivos || []);

      setResumoHistoricoArquivos(
        resultado.resumo || {
          total: 0,
          ativos: 0,
          arquivados: 0,
        },
      );
    } catch (falha) {
      setErroHistoricoArquivos(
        falha instanceof Error ? falha.message : ui("loadFileHistoryError"),
      );
    } finally {
      setCarregandoHistoricoArquivos(false);
    }
  }

  function fecharHistoricoArquivos() {
    if (carregandoHistoricoArquivos) {
      return;
    }

    setHistoricoArquivosAberto(false);

    setErroHistoricoArquivos(null);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!formulario || !podeEditar || salvando) {
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(`/api/admin/biblioteca/acervo/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formulario,
          palavrasChave: formulario.palavrasChave,
        }),
      });
      const resultado = (await resposta.json()) as RespostaItem;

      if (!resposta.ok || !resultado.item) {
        throw new Error(obterMensagemErro(resultado, ui("saveItemError")));
      }

      setItem(resultado.item);
      setFormulario(criarFormulario(resultado.item));
      setEditando(false);
      setToast({
        tipo: "sucesso",
        mensagem: resultado.mensagem || ui("saveItemSuccess"),
      });
    } catch (falha) {
      setToast({
        tipo: "erro",
        mensagem: falha instanceof Error ? falha.message : ui("saveItemError"),
      });
    } finally {
      setSalvando(false);
    }
  }

  const estilos = (
    <style jsx global>{`
      html[data-theme="system"] .phanyx-biblioteca-item-page {
        background: #242424 !important;
        color: #ffffff !important;
        color-scheme: dark;
      }

      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-hero,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-card,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-summary-card,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-modal,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-related-row,
      html[data-theme="system"]
        .phanyx-biblioteca-item-page
        .bib-detail-savebar,
      html[data-theme="system"]
        .phanyx-biblioteca-item-page
        .bib-detail-history {
        background: #2d2d2d !important;
        border-color: #505050 !important;
        color: #ffffff !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-input,
      html[data-theme="system"] .phanyx-biblioteca-item-page select,
      html[data-theme="system"] .phanyx-biblioteca-item-page textarea,
      html[data-theme="system"] .phanyx-biblioteca-item-page option,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-options,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-detail-cover,
      html[data-theme="system"]
        .phanyx-biblioteca-item-page
        .bib-compact-empty {
        background: #383838 !important;
        border-color: #606060 !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-item-page h1,
      html[data-theme="system"] .phanyx-biblioteca-item-page h2,
      html[data-theme="system"] .phanyx-biblioteca-item-page h3,
      html[data-theme="system"] .phanyx-biblioteca-item-page label,
      html[data-theme="system"] .phanyx-biblioteca-item-page strong {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-item-page p,
      html[data-theme="system"] .phanyx-biblioteca-item-page small,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-subtitle,
      html[data-theme="system"]
        .phanyx-biblioteca-item-page
        .bib-readonly-chip {
        color: #d1d5db !important;
        -webkit-text-fill-color: #d1d5db !important;
      }

      html[data-theme="system"]
        .phanyx-biblioteca-item-page
        .bib-button-secondary,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-button-ghost,
      html[data-theme="system"] .phanyx-biblioteca-item-page .bib-file-action {
        background: #383838 !important;
        border-color: #666666 !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
    `}</style>
  );

  if (carregando) {
    return (
      <main
        className="phanyx-biblioteca-acervo-page phanyx-biblioteca-item-page"
        data-locale={locale}
      >
        {estilos}
        <div className="bib-page-shell">
          <section className="bib-hero bib-detail-loading">
            <div>
              <p className="bib-eyebrow">{t("eyebrow")}</p>
              <h1>{t("loading.title")}</h1>
              <p className="bib-hero-description">{t("loading.description")}</p>
            </div>
          </section>
          <section className="bib-card bib-detail-loading-card" />
        </div>
      </main>
    );
  }

  if (erro || !item || !formulario) {
    return (
      <main
        className="phanyx-biblioteca-acervo-page phanyx-biblioteca-item-page"
        data-locale={locale}
      >
        {estilos}
        <div className="bib-page-shell">
          <section className="bib-card bib-detail-error">
            <div className="bib-empty-icon" aria-hidden="true">
              ⚠️
            </div>
            <h1>{t("errors.openTitle")}</h1>
            <p>{erro || t("errors.notFound")}</p>
            <div className="bib-detail-error-actions">
              <Link
                href="/admin/biblioteca/acervo"
                className="bib-button bib-button-secondary"
              >
                {t("backToCollection")}
              </Link>
              <button
                type="button"
                className="bib-button bib-button-primary"
                onClick={() => setAtualizacao((valor) => valor + 1)}
              >
                {t("retry")}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const camposBloqueados = !editando || salvando;

  function abrirEmprestimo(exemplar: ExemplarItem) {
    if (
      !podeGerenciarEmprestimos ||
      impersonacao ||
      exemplar.tipo !== "FISICO" ||
      !(exemplar.status === "DISPONIVEL" || exemplar.status === "RESERVADO") ||
      !exemplar.permiteEmprestimo ||
      exemplar.baixadoEm
    ) {
      return;
    }

    setBuscaUsuarioEmprestimo("");
    setUsuariosEmprestimo([]);
    setVencimentoEmprestimo("");
    setObservacaoRetirada("");
    setUsuarioEmprestimoSelecionado(null);
    setErroBuscaUsuariosEmprestimo(null);

    setExemplarParaEmprestimo(exemplar);
  }

  function fecharEmprestimo() {
    if (buscandoUsuariosEmprestimo || registrandoEmprestimo) {
      return;
    }

    setExemplarParaEmprestimo(null);

    setBuscaUsuarioEmprestimo("");
    setUsuariosEmprestimo([]);
    setVencimentoEmprestimo("");
    setObservacaoRetirada("");
    setUsuarioEmprestimoSelecionado(null);
    setErroBuscaUsuariosEmprestimo(null);
  }

  function abrirCadastroExemplar() {
    if (!podeGerenciarExemplares || impersonacao) {
      return;
    }

    setExemplarEmEdicao(null);

    setFormularioExemplar({
      ...FORMULARIO_EXEMPLAR_INICIAL,
    });

    setModalExemplarAberto(true);
  }

  function abrirEdicaoExemplar(exemplar: ExemplarItem) {
    if (!podeGerenciarExemplares || impersonacao || exemplar.baixadoEm) {
      return;
    }

    setExemplarEmEdicao(exemplar);

    setFormularioExemplar({
      tipo: exemplar.tipo,

      codigoInterno: exemplar.codigoInterno,

      codigoBarras: exemplar.codigoBarras || "",

      numeroTombo: exemplar.numeroTombo || "",

      patrimonio: exemplar.patrimonio || "",

      unidadeSnapshot: exemplar.unidadeSnapshot || "",

      setor: exemplar.setor || "",

      sala: exemplar.sala || "",

      estante: exemplar.estante || "",

      prateleira: exemplar.prateleira || "",

      localizacaoCompleta: exemplar.localizacaoCompleta || "",

      dataAquisicao: exemplar.dataAquisicao
        ? exemplar.dataAquisicao.slice(0, 10)
        : "",

      formaAquisicao: exemplar.formaAquisicao || "",

      fornecedor: exemplar.fornecedor || "",

      valorAquisicao: exemplar.valorAquisicao || "",

      permiteEmprestimo: exemplar.permiteEmprestimo,

      observacoes: exemplar.observacoes || "",
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

  function abrirBaixaExemplar(exemplar: ExemplarItem) {
    if (!podeBaixarExemplares || impersonacao || exemplar.baixadoEm) {
      return;
    }

    setExemplarParaBaixa(exemplar);

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

    const motivo = motivoBaixaExemplar.trim();

    if (!motivo) {
      setToast({
        tipo: "erro",
        mensagem: ui("writeOffReasonRequired"),
      });

      return;
    }

    setBaixandoExemplar(true);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/exemplares/${exemplarParaBaixa.id}/baixa`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            motivo,
          }),
        },
      );

      const resultado = (await resposta.json()) as RespostaExemplares;

      if (!resposta.ok) {
        throw new Error(
          resultado.error || resultado.mensagem || ui("writeOffError"),
        );
      }

      setExemplarParaBaixa(null);
      setMotivoBaixaExemplar("");

      setToast({
        tipo: "sucesso",
        mensagem: resultado.mensagem || ui("writeOffSuccess"),
      });

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem: falha instanceof Error ? falha.message : ui("writeOffError"),
      });
    } finally {
      setBaixandoExemplar(false);
    }
  }

  function alterarExemplar<K extends keyof FormularioExemplar>(
    campo: K,
    valor: FormularioExemplar[K],
  ) {
    setFormularioExemplar((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarExemplar() {
    if (salvandoExemplar || !podeGerenciarExemplares || impersonacao) {
      return;
    }

    const codigoInterno = formularioExemplar.codigoInterno.trim();

    if (!codigoInterno) {
      setToast({
        tipo: "erro",
        mensagem: ui("internalCodeRequired"),
      });

      return;
    }

    const editandoExemplar = exemplarEmEdicao !== null;

    setSalvandoExemplar(true);

    try {
      const url = editandoExemplar
        ? `/api/admin/biblioteca/exemplares/${exemplarEmEdicao.id}`
        : `/api/admin/biblioteca/acervo/${itemId}/exemplares`;

      const resposta = await fetch(url, {
        method: editandoExemplar ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          tipo: formularioExemplar.tipo,

          codigoInterno,

          codigoBarras: formularioExemplar.codigoBarras.trim() || null,

          numeroTombo: formularioExemplar.numeroTombo.trim() || null,

          patrimonio: formularioExemplar.patrimonio.trim() || null,

          unidadeSnapshot: formularioExemplar.unidadeSnapshot.trim() || null,

          setor: formularioExemplar.setor.trim() || null,

          sala: formularioExemplar.sala.trim() || null,

          estante: formularioExemplar.estante.trim() || null,

          prateleira: formularioExemplar.prateleira.trim() || null,

          localizacaoCompleta:
            formularioExemplar.localizacaoCompleta.trim() || null,

          dataAquisicao: formularioExemplar.dataAquisicao || null,

          formaAquisicao: formularioExemplar.formaAquisicao.trim() || null,

          fornecedor: formularioExemplar.fornecedor.trim() || null,

          valorAquisicao: formularioExemplar.valorAquisicao.trim() || null,

          permiteEmprestimo: formularioExemplar.permiteEmprestimo,

          observacoes: formularioExemplar.observacoes.trim() || null,
        }),
      });

      const resultado = (await resposta.json()) as RespostaExemplares;

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            resultado.mensagem ||
            (editandoExemplar ? ui("updateCopyError") : ui("createCopyError")),
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
            ? ui("updateCopySuccess")
            : ui("createCopySuccess")),
      });

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem: falha instanceof Error ? falha.message : ui("saveCopyError"),
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
        mensagem: ui("dueDateRequired"),
      });

      return;
    }

    const dataVencimento = new Date(`${vencimentoEmprestimo}T23:59:00`);

    if (
      Number.isNaN(dataVencimento.getTime()) ||
      dataVencimento.getTime() <= Date.now()
    ) {
      setToast({
        tipo: "erro",
        mensagem: ui("futureDueDate"),
      });

      return;
    }

    setRegistrandoEmprestimo(true);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/exemplares/${exemplarParaEmprestimo.id}/emprestar`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            usuarioId: usuarioEmprestimoSelecionado.id,

            vencimentoEm: dataVencimento.toISOString(),

            observacaoRetirada: observacaoRetirada.trim() || null,
          }),
        },
      );

      const resultado = (await resposta.json()) as {
        ok?: boolean;
        mensagem?: string;
        error?: string;
      };

      if (!resposta.ok) {
        throw new Error(
          resultado.error || resultado.mensagem || ui("loanError"),
        );
      }

      setExemplarParaEmprestimo(null);

      setBuscaUsuarioEmprestimo("");

      setUsuariosEmprestimo([]);

      setUsuarioEmprestimoSelecionado(null);

      setVencimentoEmprestimo("");

      setObservacaoRetirada("");

      setToast({
        tipo: "sucesso",

        mensagem: ui("loanSuccess"),
      });

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem: falha instanceof Error ? falha.message : ui("loanError"),
      });
    } finally {
      setRegistrandoEmprestimo(false);
    }
  }

  function abrirDevolucao(exemplar: ExemplarItem) {
    if (
      !podeGerenciarEmprestimos ||
      impersonacao ||
      exemplar.tipo !== "FISICO" ||
      exemplar.status !== "EMPRESTADO" ||
      exemplar.baixadoEm
    ) {
      return;
    }

    setExemplarParaDevolucao(exemplar);

    setCondicaoDevolucao("NORMAL");

    setObservacaoDevolucao("");
  }

  function fecharDevolucao() {
    if (devolvendoExemplar) {
      return;
    }

    setExemplarParaDevolucao(null);

    setCondicaoDevolucao("NORMAL");

    setObservacaoDevolucao("");
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

    setDevolvendoExemplar(true);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/exemplares/${exemplarParaDevolucao.id}/devolver`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            condicao: condicaoDevolucao,

            observacaoDevolucao: observacaoDevolucao.trim() || null,
          }),
        },
      );

      const resultado = (await resposta.json()) as {
        ok?: boolean;
        mensagem?: string;
        error?: string;

        multa?: {
          diasAtraso?: number;
          diasAtrasoCobrados?: number;
          valorMultaCalculado?: number | null;
          gerada?: boolean;
          lancamentoFinanceiroId?: number | null;
        };
        reserva?: {
          disponibilizada?: boolean;
          reservaId?: number | null;
        };
      };

      if (!resposta.ok) {
        throw new Error(
          resultado.error || resultado.mensagem || ui("returnError"),
        );
      }

      const valorMulta = Number(resultado.multa?.valorMultaCalculado ?? 0);

      const multaGerada =
        resultado.multa?.gerada === true &&
        Number.isFinite(valorMulta) &&
        valorMulta > 0;
      const reservaDisponibilizada =
        resultado.reserva?.disponibilizada === true;

      const valorMultaFormatado = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(valorMulta);

      setExemplarParaDevolucao(null);

      setCondicaoDevolucao("NORMAL");

      setObservacaoDevolucao("");

      setToast({
        tipo: "sucesso",

        mensagem:
          multaGerada && reservaDisponibilizada
            ? ui("returnSuccessWithFineAndReservation", {
                amount: valorMultaFormatado,
              })
            : multaGerada
              ? ui("returnSuccessWithFine", {
                  amount: valorMultaFormatado,
                })
              : reservaDisponibilizada
                ? ui("returnSuccessWithReservation")
                : ui("returnSuccess"),
      });

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem: falha instanceof Error ? falha.message : ui("returnError"),
      });
    } finally {
      setDevolvendoExemplar(false);
    }
  }

  function abrirManutencao(exemplar: ExemplarItem) {
    if (
      !podeGerenciarManutencao ||
      impersonacao ||
      exemplar.tipo !== "FISICO" ||
      (exemplar.status !== "DANIFICADO" &&
        exemplar.status !== "INDISPONIVEL") ||
      exemplar.baixadoEm ||
      exemplar.manutencaoAberta
    ) {
      return;
    }

    setExemplarParaManutencao(exemplar);

    setMotivoManutencao("");
    setObservacaoEntradaManutencao("");
    setFornecedorManutencao("");
    setCustoEstimadoManutencao("");
    setPrevisaoRetornoManutencao("");
  }

  function fecharManutencao() {
    if (enviandoParaManutencao) {
      return;
    }

    setExemplarParaManutencao(null);

    setMotivoManutencao("");
    setObservacaoEntradaManutencao("");
    setFornecedorManutencao("");
    setCustoEstimadoManutencao("");
    setPrevisaoRetornoManutencao("");
  }

  async function iniciarManutencao() {
    if (
      !exemplarParaManutencao ||
      enviandoParaManutencao ||
      !podeGerenciarManutencao ||
      impersonacao
    ) {
      return;
    }

    if (!motivoManutencao.trim()) {
      setToast({
        tipo: "erro",
        mensagem: ui("maintenanceReasonRequired"),
      });

      return;
    }

    setEnviandoParaManutencao(true);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/exemplares/${exemplarParaManutencao.id}/manutencoes`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            motivo: motivoManutencao.trim(),

            observacaoEntrada: observacaoEntradaManutencao.trim() || null,

            fornecedor: fornecedorManutencao.trim() || null,

            custoEstimado: custoEstimadoManutencao.trim() || null,

            previsaoRetornoEm: previsaoRetornoManutencao || null,
          }),
        },
      );

      const resultado = (await resposta.json()) as {
        ok?: boolean;
        mensagem?: string;
        error?: string;
      };

      if (!resposta.ok) {
        throw new Error(
          resultado.error || resultado.mensagem || ui("maintenanceSendError"),
        );
      }

      setExemplarParaManutencao(null);

      setMotivoManutencao("");
      setObservacaoEntradaManutencao("");
      setFornecedorManutencao("");
      setCustoEstimadoManutencao("");
      setPrevisaoRetornoManutencao("");

      setToast({
        tipo: "sucesso",

        mensagem: resultado.mensagem || ui("maintenanceSendSuccess"),
      });

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",

        mensagem:
          falha instanceof Error ? falha.message : ui("maintenanceSendError"),
      });
    } finally {
      setEnviandoParaManutencao(false);
    }
  }

  function abrirConclusaoManutencao(exemplar: ExemplarItem) {
    if (!exemplar.manutencaoAberta) {
      setToast({
        tipo: "erro",
        mensagem: ui("noOpenMaintenance"),
      });

      return;
    }

    setExemplarParaConclusaoManutencao(exemplar);

    setResultadoManutencao("REPARADO");
    setObservacaoConclusaoManutencao("");
    setCustoFinalManutencao("");
  }

  function fecharConclusaoManutencao() {
    if (concluindoManutencao) {
      return;
    }

    setExemplarParaConclusaoManutencao(null);

    setResultadoManutencao("REPARADO");
    setObservacaoConclusaoManutencao("");
    setCustoFinalManutencao("");
  }

  async function concluirManutencao() {
    const manutencao = exemplarParaConclusaoManutencao?.manutencaoAberta;

    if (
      !exemplarParaConclusaoManutencao ||
      !manutencao ||
      concluindoManutencao ||
      !podeGerenciarManutencao ||
      impersonacao
    ) {
      return;
    }

    if (
      resultadoManutencao === "IRRECUPERAVEL" &&
      !observacaoConclusaoManutencao.trim()
    ) {
      setToast({
        tipo: "erro",
        mensagem: ui("irreparableDescriptionRequired"),
      });

      return;
    }

    setConcluindoManutencao(true);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/manutencoes/${manutencao.id}/concluir`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            resultado: resultadoManutencao,

            observacaoConclusao: observacaoConclusaoManutencao.trim() || null,

            custoFinal: custoFinalManutencao.trim() || null,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        mensagem?: string;
        error?: string;
      };

      if (!resposta.ok) {
        throw new Error(
          dados.error || dados.mensagem || ui("maintenanceCompleteError"),
        );
      }

      setExemplarParaConclusaoManutencao(null);

      setResultadoManutencao("REPARADO");
      setObservacaoConclusaoManutencao("");
      setCustoFinalManutencao("");

      setToast({
        tipo: "sucesso",
        mensagem: dados.mensagem || ui("maintenanceCompleteSuccess"),
      });

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",
        mensagem:
          falha instanceof Error
            ? falha.message
            : ui("maintenanceCompleteError"),
      });
    } finally {
      setConcluindoManutencao(false);
    }
  }

  function abrirCancelamentoManutencao(exemplar: ExemplarItem) {
    if (!exemplar.manutencaoAberta) {
      setToast({
        tipo: "erro",
        mensagem: ui("noOpenMaintenance"),
      });

      return;
    }

    setExemplarParaCancelamentoManutencao(exemplar);

    setMotivoCancelamentoManutencao("");

    setStatusRetornoCancelamentoManutencao("DANIFICADO");
  }

  function fecharCancelamentoManutencao() {
    if (cancelandoManutencao) {
      return;
    }

    setExemplarParaCancelamentoManutencao(null);

    setMotivoCancelamentoManutencao("");

    setStatusRetornoCancelamentoManutencao("DANIFICADO");
  }

  async function cancelarManutencao() {
    const manutencao = exemplarParaCancelamentoManutencao?.manutencaoAberta;

    if (
      !exemplarParaCancelamentoManutencao ||
      !manutencao ||
      cancelandoManutencao ||
      !podeGerenciarManutencao ||
      impersonacao
    ) {
      return;
    }

    if (!motivoCancelamentoManutencao.trim()) {
      setToast({
        tipo: "erro",
        mensagem: ui("maintenanceCancelReasonRequired"),
      });

      return;
    }

    setCancelandoManutencao(true);

    try {
      const resposta = await fetch(
        `/api/admin/biblioteca/manutencoes/${manutencao.id}/cancelar`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            motivoCancelamento: motivoCancelamentoManutencao.trim(),

            statusRetorno: statusRetornoCancelamentoManutencao,
          }),
        },
      );

      const dados = (await resposta.json()) as {
        ok?: boolean;
        mensagem?: string;
        error?: string;
      };

      if (!resposta.ok) {
        throw new Error(
          dados.error || dados.mensagem || ui("maintenanceCancelError"),
        );
      }

      setExemplarParaCancelamentoManutencao(null);

      setMotivoCancelamentoManutencao("");

      setStatusRetornoCancelamentoManutencao("DANIFICADO");

      setToast({
        tipo: "sucesso",
        mensagem: dados.mensagem || ui("maintenanceCancelSuccess"),
      });

      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setToast({
        tipo: "erro",
        mensagem:
          falha instanceof Error ? falha.message : ui("maintenanceCancelError"),
      });
    } finally {
      setCancelandoManutencao(false);
    }
  }

  return (
    <main
      className="phanyx-biblioteca-acervo-page phanyx-biblioteca-item-page"
      data-locale={locale}
    >
      {estilos}
      <div className="bib-page-shell">
        <section className="bib-hero bib-item-detail-hero">
          <div className="bib-item-detail-heading">
            <div className="bib-detail-cover" aria-hidden="true">
              {item.capaUrl || item.miniaturaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.capaUrl || item.miniaturaUrl || ""} alt="" />
              ) : (
                <span>📘</span>
              )}
            </div>
            <div>
              <p className="bib-eyebrow">
                {t("eyebrowWithItem", { id: item.id })}
              </p>
              <div className="bib-detail-title-line">
                <h1>{item.titulo}</h1>
                <span className={classeStatus(item.status)}>
                  {rotuloStatusItem(item.status)}
                </span>
              </div>
              <p className="bib-hero-description">{t("description")}</p>
            </div>
          </div>

          <div className="bib-hero-actions">
            <Link
              href="/admin/biblioteca/acervo"
              className="bib-button bib-button-secondary"
            >
              {t("backToCollection")}
            </Link>
            {!editando && podeEditar ? (
              <button
                type="button"
                className="bib-button bib-button-primary"
                onClick={() => setEditando(true)}
              >
                {t("editItem")}
              </button>
            ) : null}
          </div>
        </section>

        {impersonacao ? (
          <div className="bib-feedback bib-feedback-warning">
            <div>
              <strong>{ui("supportTitle")}</strong>
              <p>{ui("supportDescription")}</p>
            </div>
          </div>
        ) : null}

        <section className="bib-detail-summary" aria-label={ui("summaryLabel")}>
          <article className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              🏷️
            </span>
            <div>
              <span>{ui("type")}</span>
              <strong>{rotuloTipoItem(item.tipo)}</strong>
            </div>
          </article>
          <article className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              🔐
            </span>
            <div>
              <span>{ui("modality")}</span>
              <strong>{rotuloModalidade(item.modalidade)}</strong>
            </div>
          </article>
          <article className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              📎
            </span>
            <div>
              <span>{ui("files")}</span>
              <strong>{item._count.arquivos}</strong>
            </div>
          </article>
          <article className="bib-summary-card">
            <span className="bib-summary-icon" aria-hidden="true">
              📚
            </span>
            <div>
              <span>{ui("copies")}</span>
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
                  <h2>{ui("identificationTitle")}</h2>
                  <p>{ui("identificationDescription")}</p>
                </div>
              </div>
              <span className="bib-readonly-chip">
                {t("statusLabel")}: {rotuloStatusItem(item.status)}
              </span>
            </header>

            <div className="bib-detail-grid">
              <label className="bib-field bib-field-span-2">
                <span>
                  {ui("title")} <b>*</b>
                </span>
                <input
                  className="bib-input"
                  value={formulario.titulo}
                  onChange={(evento) => alterar("titulo", evento.target.value)}
                  maxLength={240}
                  required
                  disabled={camposBloqueados}
                />
              </label>

              <label className="bib-field">
                <span>{ui("type")}</span>
                <select
                  className="bib-input"
                  value={formulario.tipo}
                  onChange={(evento) => alterar("tipo", evento.target.value)}
                  disabled={camposBloqueados}
                >
                  {TIPOS_ITEM.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {rotuloTipoItem(tipo)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bib-field bib-field-span-2">
                <span>{ui("subtitle")}</span>
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
                <span>{ui("alternativeTitle")}</span>
                <input
                  className="bib-input"
                  value={formulario.tituloAlternativo}
                  onChange={(evento) =>
                    alterar("tituloAlternativo", evento.target.value)
                  }
                  maxLength={240}
                  disabled={camposBloqueados}
                />
              </label>

              <label className="bib-field bib-field-span-3">
                <span>{ui("synopsis")}</span>
                <textarea
                  className="bib-input bib-textarea"
                  value={formulario.sinopse}
                  onChange={(evento) => alterar("sinopse", evento.target.value)}
                  maxLength={20_000}
                  disabled={camposBloqueados}
                />
              </label>

              <label className="bib-field bib-field-span-3">
                <span>{ui("additionalDescription")}</span>
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
                <span>{ui("keywords")}</span>
                <input
                  className="bib-input"
                  value={formulario.palavrasChave}
                  onChange={(evento) =>
                    alterar("palavrasChave", evento.target.value)
                  }
                  placeholder={ui("keywordsPlaceholder")}
                  disabled={camposBloqueados}
                />
                <small>{ui("keywordsHelp")}</small>
              </label>
            </div>
          </section>

          <section className="bib-card bib-detail-section">
            <header className="bib-detail-section-heading">
              <div>
                <span aria-hidden="true">🔎</span>
                <div>
                  <h2>{ui("publicationTitle")}</h2>
                  <p>{ui("publicationDescription")}</p>
                </div>
              </div>
            </header>

            <div className="bib-detail-grid">
              <label className="bib-field">
                <span>ISBN-10</span>
                <input
                  className="bib-input"
                  value={formulario.isbn10}
                  onChange={(evento) => alterar("isbn10", evento.target.value)}
                  maxLength={32}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>ISBN-13</span>
                <input
                  className="bib-input"
                  value={formulario.isbn13}
                  onChange={(evento) => alterar("isbn13", evento.target.value)}
                  maxLength={32}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>ISSN</span>
                <input
                  className="bib-input"
                  value={formulario.issn}
                  onChange={(evento) => alterar("issn", evento.target.value)}
                  maxLength={32}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field bib-field-span-2">
                <span>DOI</span>
                <input
                  className="bib-input"
                  value={formulario.doi}
                  onChange={(evento) => alterar("doi", evento.target.value)}
                  maxLength={255}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("language")}</span>
                <input
                  className="bib-input"
                  value={formulario.idioma}
                  onChange={(evento) => alterar("idioma", evento.target.value)}
                  maxLength={30}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("publicationCountry")}</span>
                <input
                  className="bib-input"
                  value={formulario.paisPublicacao}
                  onChange={(evento) =>
                    alterar("paisPublicacao", evento.target.value)
                  }
                  maxLength={100}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("year")}</span>
                <input
                  type="number"
                  className="bib-input"
                  value={formulario.anoPublicacao}
                  onChange={(evento) =>
                    alterar("anoPublicacao", evento.target.value)
                  }
                  min={1}
                  max={new Date().getFullYear() + 2}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("publicationDate")}</span>
                <input
                  type="date"
                  className="bib-input"
                  value={formulario.dataPublicacao}
                  onChange={(evento) =>
                    alterar("dataPublicacao", evento.target.value)
                  }
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("edition")}</span>
                <input
                  className="bib-input"
                  value={formulario.edicao}
                  onChange={(evento) => alterar("edicao", evento.target.value)}
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("volume")}</span>
                <input
                  className="bib-input"
                  value={formulario.volume}
                  onChange={(evento) => alterar("volume", evento.target.value)}
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("number")}</span>
                <input
                  className="bib-input"
                  value={formulario.numero}
                  onChange={(evento) => alterar("numero", evento.target.value)}
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("pageCount")}</span>
                <input
                  type="number"
                  className="bib-input"
                  value={formulario.numeroPaginas}
                  onChange={(evento) =>
                    alterar("numeroPaginas", evento.target.value)
                  }
                  min={1}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("durationSeconds")}</span>
                <input
                  type="number"
                  className="bib-input"
                  value={formulario.duracaoSegundos}
                  onChange={(evento) =>
                    alterar("duracaoSegundos", evento.target.value)
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
                  <h2>{ui("classificationTitle")}</h2>
                  <p>{ui("classificationDescription")}</p>
                </div>
              </div>
            </header>

            <div className="bib-detail-grid">
              <label className="bib-field">
                <span>{ui("bibliographicClassification")}</span>
                <input
                  className="bib-input"
                  value={formulario.classificacaoBibliografica}
                  onChange={(evento) =>
                    alterar("classificacaoBibliografica", evento.target.value)
                  }
                  maxLength={120}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("callNumber")}</span>
                <input
                  className="bib-input"
                  value={formulario.codigoChamada}
                  onChange={(evento) =>
                    alterar("codigoChamada", evento.target.value)
                  }
                  maxLength={120}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("contentRating")}</span>
                <input
                  className="bib-input"
                  value={formulario.classificacaoIndicativa}
                  onChange={(evento) =>
                    alterar("classificacaoIndicativa", evento.target.value)
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
                  onChange={(evento) => alterar("cdd", evento.target.value)}
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>CDU</span>
                <input
                  className="bib-input"
                  value={formulario.cdu}
                  onChange={(evento) => alterar("cdu", evento.target.value)}
                  maxLength={80}
                  disabled={camposBloqueados}
                />
              </label>
              <div className="bib-field" />
              <label className="bib-field bib-field-span-2">
                <span>{ui("coverUrl")}</span>
                <input
                  type="url"
                  className="bib-input"
                  value={formulario.capaUrl}
                  onChange={(evento) => alterar("capaUrl", evento.target.value)}
                  maxLength={2_048}
                  disabled={camposBloqueados}
                />
              </label>
              <label className="bib-field">
                <span>{ui("thumbnailUrl")}</span>
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
                  <h2>{ui("accessTitle")}</h2>
                  <p>{ui("accessDescription")}</p>
                </div>
              </div>
            </header>

            <div className="bib-detail-grid">
              <label className="bib-field bib-field-span-2">
                <span>{ui("accessMode")}</span>
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
                      {rotuloModalidade(modalidade)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="bib-field">
                <span>{ui("internalSlug")}</span>
                <div className="bib-static-value">{item.slug}</div>
              </div>
            </div>

            <fieldset className="bib-options bib-detail-options">
              <legend>{ui("itemResources")}</legend>
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
                  <b>{ui("featureCatalog")}</b>
                  <small>{ui("featureCatalogHelp")}</small>
                </span>
              </label>
              <label className="bib-check">
                <input
                  type="checkbox"
                  checked={formulario.permitirAvaliacao}
                  onChange={(evento) =>
                    alterar("permitirAvaliacao", evento.target.checked)
                  }
                  disabled={camposBloqueados}
                />
                <span>
                  <b>{ui("allowReviews")}</b>
                  <small>{ui("allowReviewsHelp")}</small>
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
                  <b>{ui("openAccess")}</b>
                  <small>{ui("openAccessHelp")}</small>
                </span>
              </label>
              <label className="bib-check">
                <input
                  type="checkbox"
                  checked={formulario.permitirDownload}
                  onChange={(evento) =>
                    alterar("permitirDownload", evento.target.checked)
                  }
                  disabled={camposBloqueados || !downloadPermitido}
                />
                <span>
                  <b>{ui("allowDownload")}</b>
                  <small>
                    {downloadPermitido
                      ? ui("downloadAllowedHelp")
                      : ui("downloadDisabledHelp")}
                  </small>
                </span>
              </label>
            </fieldset>

            <label className="bib-field bib-detail-notes">
              <span>{ui("internalNotes")}</span>
              <textarea
                className="bib-input bib-textarea"
                value={formulario.observacoesInternas}
                onChange={(evento) =>
                  alterar("observacoesInternas", evento.target.value)
                }
                maxLength={20_000}
                disabled={camposBloqueados}
              />
              <small>{ui("internalNotesHelp")}</small>
            </label>
          </section>

          <section className="bib-card bib-detail-section">
            <header className="bib-detail-section-heading">
              <div>
                <span aria-hidden="true">👥</span>
                <div>
                  <h2>{ui("relationshipsTitle")}</h2>
                  <p>{ui("relationshipsDescription")}</p>
                </div>
              </div>
              <span className="bib-readonly-chip">
                {ui("separateManagement")}
              </span>
            </header>

            <div className="bib-relationship-grid">
              <article className="bib-relationship-card">
                <h3>{ui("publisher")}</h3>
                {item.editora ? (
                  <span className="bib-tag">🏢 {item.editora.nome}</span>
                ) : (
                  <p>{ui("noPublisher")}</p>
                )}
              </article>
              <article className="bib-relationship-card">
                <h3>{ui("authors")}</h3>
                {item.autores.length ? (
                  <div className="bib-tag-list">
                    {item.autores.map((vinculo) => (
                      <span
                        className="bib-tag"
                        key={`${vinculo.autor.id}-${vinculo.funcao}`}
                      >
                        {vinculo.autor.nome} ·{" "}
                        {rotuloEnumLocalizado(vinculo.funcao)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>{ui("noAuthors")}</p>
                )}
              </article>
              <article className="bib-relationship-card">
                <h3>{ui("categories")}</h3>
                {item.categorias.length ? (
                  <div className="bib-tag-list">
                    {item.categorias.map((vinculo) => (
                      <span className="bib-tag" key={vinculo.categoria.id}>
                        {vinculo.categoria.icone || "🏷️"}{" "}
                        {vinculo.categoria.nome}
                        {vinculo.principal ? ui("principalSuffix") : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>{ui("noCategories")}</p>
                )}
              </article>
            </div>
          </section>

          <section className="bib-related-grid">
            <article className="bib-card bib-detail-section">
              <header className="bib-detail-section-heading">
                <div>
                  <span aria-hidden="true">📎</span>

                  <div>
                    <h2>{ui("digitalFiles")}</h2>

                    <p>
                      {ui("linkedFiles", {
                        count: item._count.arquivos,
                      })}
                    </p>

                    {armazenamento ? (
                      <small>
                        {formatarBytes(armazenamento.utilizadoBytes)}{" "}
                        {ui("usedOf")}{" "}
                        {formatarBytes(armazenamento.limiteBytes)}
                        {" · "}
                        {formatarBytes(armazenamento.disponivelBytes)}{" "}
                        {ui("storageAvailable")}
                      </small>
                    ) : null}
                  </div>
                </div>

                <div className="bib-file-header-actions">
                  {podeGerenciarArquivo && !impersonacao ? (
                    <button
                      type="button"
                      className="bib-button bib-button-secondary"
                      onClick={() => void abrirHistoricoArquivos()}
                    >
                      {ui("history")}
                    </button>
                  ) : null}

                  {podeEnviarArquivo && !impersonacao ? (
                    <>
                      <input
                        ref={arquivoInputRef}
                        type="file"
                        accept={ACCEPT_UPLOAD_BIBLIOTECA}
                        hidden
                        disabled={enviandoArquivo}
                        onChange={enviarArquivo}
                      />

                      <button
                        type="button"
                        className="bib-button bib-button-primary"
                        disabled={enviandoArquivo}
                        onClick={() => arquivoInputRef.current?.click()}
                      >
                        {enviandoArquivo
                          ? ui("uploadProgress", { progress: progressoUpload })
                          : ui("uploadFile")}
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
                    <strong>{ui("uploadingFile")}</strong>

                    <p>{ui("uploadProgress", { progress: progressoUpload })}</p>

                    <progress
                      value={progressoUpload}
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
                    <div className="bib-related-row" key={arquivo.id}>
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
                        <strong>{arquivo.nomeOriginal}</strong>

                        <small>
                          {rotuloEnumLocalizado(arquivo.tipo)}
                          {" · "}
                          {formatarBytes(arquivo.tamanhoBytes)}
                          {" · "}
                          {ui("version")} {arquivo.versao}
                          {" · "}
                          {rotuloEnumLocalizado(arquivo.status)}
                        </small>

                        {arquivo.principal ? (
                          <span className="bib-file-primary-badge">
                            {ui("primary")}
                          </span>
                        ) : null}

                        {arquivo.status === "DISPONIVEL" ? (
                          <div className="bib-file-actions">
                            <a
                              href={`/api/admin/biblioteca/arquivos/${arquivo.id}/conteudo`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bib-file-action"
                            >
                              {ui("view")}
                            </a>

                            <a
                              href={`/api/admin/biblioteca/arquivos/${arquivo.id}/conteudo?download=1`}
                              className="bib-file-action"
                            >
                              {ui("download")}
                            </a>

                            {arquivo.status === "DISPONIVEL" &&
                            !arquivo.principal &&
                            podeGerenciarArquivo &&
                            !impersonacao ? (
                              <button
                                type="button"
                                className="bib-file-action bib-file-action-primary"
                                disabled={definindoPrincipalId !== null}
                                onClick={() =>
                                  void definirArquivoPrincipal(arquivo)
                                }
                              >
                                {definindoPrincipalId === arquivo.id
                                  ? ui("settingPrimary")
                                  : ui("setPrimary")}
                              </button>
                            ) : null}

                            {podeExcluirArquivo && !impersonacao ? (
                              <button
                                type="button"
                                className="bib-file-action bib-file-action-danger"
                                onClick={() => abrirExclusaoArquivo(arquivo)}
                              >
                                {ui("delete")}
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <small className="bib-file-unavailable">
                            {ui("fileUnavailable")}
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bib-compact-empty">{ui("noFiles")}</div>
              )}
            </article>

            <article className="bib-card bib-detail-section">
              <header className="bib-detail-section-heading">
                <div>
                  <span aria-hidden="true">📚</span>

                  <div>
                    <h2>{ui("copies")}</h2>

                    <p>
                      {carregandoExemplares
                        ? ui("loadingCopies")
                        : ui("copiesRegistered", { count: exemplares.length })}
                    </p>
                  </div>
                </div>

                <div className="bib-exemplar-actions"></div>

                {podeGerenciarExemplares && !impersonacao ? (
                  <button
                    type="button"
                    className="bib-button bib-button-primary"
                    onClick={abrirCadastroExemplar}
                  >
                    {ui("registerCopy")}
                  </button>
                ) : null}
              </header>

              {carregandoExemplares ? (
                <div className="bib-compact-empty">{ui("loadingCopies")}</div>
              ) : exemplares.length ? (
                <div className="bib-related-list">
                  {exemplares.map((exemplar) => (
                    <div
                      className="bib-related-row bib-exemplar-row"
                      key={exemplar.id}
                    >
                      <span aria-hidden="true">
                        {exemplar.tipo === "DIGITAL" ? "💻" : "📕"}
                      </span>

                      <div className="bib-exemplar-info">
                        <strong>{exemplar.codigoInterno}</strong>

                        <small>
                          {rotuloEnumLocalizado(exemplar.tipo)}

                          {" · "}

                          {rotuloEnumLocalizado(exemplar.status)}

                          {exemplar.numeroTombo
                            ? ui("tombSuffix", { number: exemplar.numeroTombo })
                            : ""}

                          {exemplar.localizacaoCompleta
                            ? ` · ${exemplar.localizacaoCompleta}`
                            : ""}
                        </small>

                        {exemplar.baixadoEm ? (
                          <small>
                            {ui("writtenOffAt", {
                              date: formatarData(exemplar.baixadoEm),
                            })}

                            {exemplar.motivoBaixa
                              ? ui("reasonSuffix", {
                                  reason: exemplar.motivoBaixa,
                                })
                              : ""}
                          </small>
                        ) : null}
                      </div>

                      <div className="bib-exemplar-actions">
                        {podeGerenciarExemplares &&
                        !impersonacao &&
                        !exemplar.baixadoEm ? (
                          <button
                            type="button"
                            className="bib-button bib-button-secondary"
                            onClick={() => abrirEdicaoExemplar(exemplar)}
                          >
                            {ui("edit")}
                          </button>
                        ) : null}

                        {podeGerenciarManutencao &&
                        !impersonacao &&
                        exemplar.tipo === "FISICO" &&
                        exemplar.status === "MANUTENCAO" &&
                        exemplar.manutencaoAberta ? (
                          <button
                            type="button"
                            className="bib-button bib-button-primary"
                            onClick={() => abrirConclusaoManutencao(exemplar)}
                          >
                            {ui("completeMaintenance")}
                          </button>
                        ) : null}

                        {podeGerenciarManutencao &&
                        !impersonacao &&
                        exemplar.tipo === "FISICO" &&
                        exemplar.status === "MANUTENCAO" &&
                        exemplar.manutencaoAberta ? (
                          <button
                            type="button"
                            className="bib-button bib-button-secondary bib-button-maintenance"
                            onClick={() =>
                              abrirCancelamentoManutencao(exemplar)
                            }
                          >
                            {ui("cancelMaintenance")}
                          </button>
                        ) : null}

                        {podeGerenciarEmprestimos &&
                        !impersonacao &&
                        exemplar.tipo === "FISICO" &&
                        (exemplar.status === "DISPONIVEL" ||
                          exemplar.status === "RESERVADO") &&
                        exemplar.permiteEmprestimo &&
                        !exemplar.baixadoEm ? (
                          <button
                            type="button"
                            className="bib-button bib-button-primary"
                            onClick={() => abrirEmprestimo(exemplar)}
                          >
                            {ui("loan")}
                          </button>
                        ) : null}

                        {podeGerenciarEmprestimos &&
                        !impersonacao &&
                        exemplar.tipo === "FISICO" &&
                        exemplar.status === "EMPRESTADO" &&
                        !exemplar.baixadoEm ? (
                          <button
                            type="button"
                            className="bib-button bib-button-primary"
                            onClick={() => abrirDevolucao(exemplar)}
                          >
                            {ui("registerReturn")}
                          </button>
                        ) : null}

                        {podeGerenciarManutencao &&
                        !impersonacao &&
                        exemplar.tipo === "FISICO" &&
                        (exemplar.status === "DANIFICADO" ||
                          exemplar.status === "INDISPONIVEL") &&
                        !exemplar.baixadoEm &&
                        !exemplar.manutencaoAberta ? (
                          <button
                            type="button"
                            className="bib-button bib-button-secondary bib-button-maintenance"
                            onClick={() => abrirManutencao(exemplar)}
                          >
                            {ui("sendMaintenance")}
                          </button>
                        ) : null}

                        {podeBaixarExemplares &&
                        !impersonacao &&
                        !exemplar.baixadoEm &&
                        exemplar.status !== "EMPRESTADO" &&
                        exemplar.status !== "RESERVADO" &&
                        exemplar.status !== "MANUTENCAO" ? (
                          <button
                            type="button"
                            className="bib-button bib-button-danger"
                            onClick={() => abrirBaixaExemplar(exemplar)}
                          >
                            {ui("writeOff")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bib-compact-empty">{ui("noCopies")}</div>
              )}
            </article>
          </section>

          <section className="bib-card bib-detail-history">
            <div>
              <span>{ui("createdAt")}</span>
              <strong>{formatarData(item.criadoEm)}</strong>
            </div>
            <div>
              <span>{ui("updatedAt")}</span>
              <strong>{formatarData(item.atualizadoEm)}</strong>
            </div>
            <div>
              <span>{ui("publication")}</span>
              <strong>{formatarData(item.publicadoEm)}</strong>
            </div>
          </section>

          {editando ? (
            <div className="bib-detail-savebar">
              <div>
                <strong>
                  {alterado ? ui("unsavedChanges") : ui("noChanges")}
                </strong>
                <span>{ui("publicationStatusUnchanged")}</span>
              </div>
              <div>
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  {ui("cancel")}
                </button>
                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={salvando || !alterado}
                >
                  {salvando ? ui("saving") : ui("saveChanges")}
                </button>
              </div>
            </div>
          ) : null}
        </form>

        {historicoArquivosAberto ? (
          <div className="bib-modal-backdrop" role="presentation">
            <section
              className="bib-modal bib-file-history-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-historico-arquivos"
            >
              <header className="bib-modal-header">
                <div>
                  <span className="bib-modal-kicker">
                    {ui("virtualLibrary")}
                  </span>

                  <h2 id="titulo-historico-arquivos">
                    {ui("fileHistoryTitle")}
                  </h2>

                  <p>{ui("fileHistoryDescription")}</p>
                </div>

                <button
                  type="button"
                  className="bib-modal-close"
                  onClick={fecharHistoricoArquivos}
                  disabled={carregandoHistoricoArquivos}
                  aria-label={ui("close")}
                >
                  ×
                </button>
              </header>

              <div className="bib-modal-body bib-file-history-body">
                <div className="bib-history-summary">
                  <div>
                    <small>{ui("totalVersions")}</small>
                    <strong>{resumoHistoricoArquivos.total}</strong>
                  </div>

                  <div>
                    <small>{ui("active")}</small>
                    <strong>{resumoHistoricoArquivos.ativos}</strong>
                  </div>

                  <div>
                    <small>{ui("deleted")}</small>
                    <strong>{resumoHistoricoArquivos.arquivados}</strong>
                  </div>
                </div>

                {carregandoHistoricoArquivos ? (
                  <div className="bib-history-loading">
                    <strong>{ui("loadingHistory")}</strong>

                    <p>{ui("loadingHistoryDescription")}</p>
                  </div>
                ) : erroHistoricoArquivos ? (
                  <div className="bib-feedback bib-feedback-error">
                    <div>
                      <strong>{ui("historyLoadError")}</strong>

                      <p>{erroHistoricoArquivos}</p>
                    </div>

                    <button
                      type="button"
                      className="bib-button bib-button-secondary"
                      onClick={() => void abrirHistoricoArquivos()}
                    >
                      {ui("retry")}
                    </button>
                  </div>
                ) : historicoArquivos.length ? (
                  <div className="bib-file-history-list">
                    {historicoArquivos.map((arquivo) => (
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
                                {ui("version")} {arquivo.versao}
                              </span>

                              {arquivo.principalAtual ? (
                                <span className="bib-history-badge bib-history-badge-primary">
                                  {ui("currentPrimary")}
                                </span>
                              ) : arquivo.arquivado ? (
                                <span className="bib-history-badge bib-history-badge-archived">
                                  {ui("deletedBadge")}
                                </span>
                              ) : (
                                <span className="bib-history-badge bib-history-badge-active">
                                  {ui("activeBadge")}
                                </span>
                              )}
                            </div>

                            <small>#{arquivo.id}</small>
                          </div>

                          <strong className="bib-history-file-name">
                            {arquivo.nomeOriginal}
                          </strong>

                          <div className="bib-history-file-meta">
                            <span>{rotuloEnumLocalizado(arquivo.tipo)}</span>

                            <span>{formatarBytes(arquivo.tamanhoBytes)}</span>

                            <span>{rotuloEnumLocalizado(arquivo.status)}</span>
                          </div>

                          <div className="bib-history-event-grid">
                            <div>
                              <small>{ui("sentAt")}</small>

                              <strong>{formatarData(arquivo.enviadoEm)}</strong>
                            </div>

                            <div>
                              <small>{ui("sentBy")}</small>

                              <strong>
                                {arquivo.enviadoPor?.nome?.trim() ||
                                  arquivo.enviadoPor?.email?.trim() ||
                                  ui("userUnavailable")}
                              </strong>
                            </div>

                            {arquivo.arquivado ? (
                              <>
                                <div>
                                  <small>{ui("deletedAt")}</small>

                                  <strong>
                                    {formatarData(arquivo.arquivadoEm)}
                                  </strong>
                                </div>

                                <div>
                                  <small>{ui("deletedBy")}</small>

                                  <strong>
                                    {arquivo.arquivadoPor?.nome?.trim() ||
                                      arquivo.arquivadoPor?.email?.trim() ||
                                      ui("userUnavailable")}
                                  </strong>
                                </div>
                              </>
                            ) : null}
                          </div>

                          {arquivo.arquivado && arquivo.motivoArquivamento ? (
                            <div className="bib-history-reason">
                              <small>{ui("deletionReason")}</small>

                              <p>{arquivo.motivoArquivamento}</p>
                            </div>
                          ) : null}

                          {!arquivo.arquivado && arquivo.disponivel ? (
                            <div className="bib-file-actions">
                              <a
                                href={`/api/admin/biblioteca/arquivos/${arquivo.id}/conteudo`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bib-file-action"
                              >
                                {ui("view")}
                              </a>

                              <a
                                href={`/api/admin/biblioteca/arquivos/${arquivo.id}/conteudo?download=1`}
                                className="bib-file-action"
                              >
                                {ui("download")}
                              </a>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="bib-history-empty">
                    <span aria-hidden="true">🕘</span>

                    <strong>{ui("noVersions")}</strong>

                    <p>{ui("noVersionsDescription")}</p>
                  </div>
                )}
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharHistoricoArquivos}
                  disabled={carregandoHistoricoArquivos}
                >
                  {ui("close")}
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </div>

      {arquivoParaExcluir ? (
        <div className="bib-modal-backdrop" role="presentation">
          <section
            className="bib-modal bib-delete-file-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-exclusao-arquivo"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">{ui("virtualLibrary")}</span>

                <h2 id="titulo-exclusao-arquivo">{ui("deleteFileTitle")}</h2>

                <p>{ui("deleteFileDescription")}</p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharExclusaoArquivo}
                disabled={excluindoArquivo}
                aria-label={ui("close")}
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
                  <span aria-hidden="true">🗑</span>

                  <div>
                    <strong>{arquivoParaExcluir.nomeOriginal}</strong>

                    <small>
                      {rotuloEnumLocalizado(arquivoParaExcluir.tipo)}
                      {" · "}
                      {formatarBytes(arquivoParaExcluir.tamanhoBytes)}
                    </small>
                  </div>
                </div>

                <div className="bib-delete-warning">
                  <strong>{ui("storageReturned")}</strong>

                  <p>
                    {ui("storageReleaseAudit", {
                      size: formatarBytes(arquivoParaExcluir.tamanhoBytes),
                    })}
                  </p>
                </div>

                <label className="bib-field">
                  <span>{ui("deletionReason")}</span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={motivoExclusao}
                    onChange={(evento) =>
                      setMotivoExclusao(evento.target.value)
                    }
                    maxLength={2000}
                    disabled={excluindoArquivo}
                    placeholder={ui("deleteReasonPlaceholder")}
                  />

                  <small>{ui("reasonRecorded")}</small>
                </label>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharExclusaoArquivo}
                  disabled={excluindoArquivo}
                >
                  {ui("cancel")}
                </button>

                <button
                  type="button"
                  className="bib-button bib-button-danger"
                  onClick={() => void excluirArquivo()}
                  disabled={excluindoArquivo}
                >
                  {excluindoArquivo
                    ? ui("deleting")
                    : `🗑 ${ui("deleteFileTitle")}`}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {exemplarParaEmprestimo ? (
        <div className="bib-modal-backdrop" role="presentation">
          <section
            className="bib-modal bib-emprestimo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-emprestimo-biblioteca"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">{ui("virtualLibrary")}</span>

                <h2 id="titulo-emprestimo-biblioteca">{ui("loanTitle")}</h2>

                <p>{ui("loanDescription")}</p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharEmprestimo}
                aria-label={ui("close")}
              >
                ×
              </button>
            </header>

            <div className="bib-modal-body">
              <div className="bib-feedback">
                <div>
                  <strong>{exemplarParaEmprestimo.codigoInterno}</strong>

                  <p>
                    {item?.titulo || ui("collectionItem")}

                    {exemplarParaEmprestimo.numeroTombo
                      ? ui("tombSuffix", {
                          number: exemplarParaEmprestimo.numeroTombo,
                        })
                      : ""}
                  </p>
                </div>
              </div>

              <label className="bib-field">
                <span>{ui("searchPerson")}</span>

                <input
                  type="search"
                  className="bib-input"
                  value={buscaUsuarioEmprestimo}
                  onChange={(evento) => {
                    setBuscaUsuarioEmprestimo(evento.target.value);

                    setUsuarioEmprestimoSelecionado(null);
                  }}
                  placeholder={ui("searchPersonPlaceholder")}
                  autoComplete="off"
                  autoFocus
                />

                <small>{ui("searchMinChars")}</small>
              </label>

              {usuarioEmprestimoSelecionado ? (
                <div className="bib-feedback bib-feedback-success">
                  <div>
                    <strong>{ui("selectedBorrower")}</strong>

                    <p>
                      {usuarioEmprestimoSelecionado.nome}

                      {" · "}

                      {rotuloEnumLocalizado(usuarioEmprestimoSelecionado.tipo)}

                      {usuarioEmprestimoSelecionado.identificador
                        ? ` · ${
                            usuarioEmprestimoSelecionado.tipo === "ALUNO"
                              ? ui("enrollment")
                              : ui("code")
                          } ${usuarioEmprestimoSelecionado.identificador}`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : null}

              {usuarioEmprestimoSelecionado ? (
                <>
                  <label className="bib-field">
                    <span>
                      {ui("expectedReturnDate")} <b>*</b>
                    </span>

                    <input
                      type="date"
                      className="bib-input"
                      value={vencimentoEmprestimo}
                      onChange={(evento) =>
                        setVencimentoEmprestimo(evento.target.value)
                      }
                      disabled={registrandoEmprestimo}
                    />

                    <small>{ui("dueDateHelp")}</small>
                  </label>

                  <label className="bib-field">
                    <span>{ui("checkoutNotes")}</span>

                    <textarea
                      className="bib-input bib-textarea"
                      value={observacaoRetirada}
                      onChange={(evento) =>
                        setObservacaoRetirada(evento.target.value)
                      }
                      maxLength={5_000}
                      disabled={registrandoEmprestimo}
                      placeholder={ui("checkoutNotesPlaceholder")}
                    />

                    <small>{ui("optionalLoanNote")}</small>
                  </label>
                </>
              ) : null}

              {buscandoUsuariosEmprestimo ? (
                <div className="bib-compact-empty">{ui("searchingPeople")}</div>
              ) : null}

              {erroBuscaUsuariosEmprestimo ? (
                <div className="bib-feedback bib-feedback-danger">
                  <div>
                    <strong>{ui("searchFailed")}</strong>

                    <p>{erroBuscaUsuariosEmprestimo}</p>
                  </div>
                </div>
              ) : null}

              {!buscandoUsuariosEmprestimo &&
              buscaUsuarioEmprestimo.trim().length >= 2 &&
              !erroBuscaUsuariosEmprestimo &&
              usuariosEmprestimo.length === 0 ? (
                <div className="bib-compact-empty">{ui("noPeopleFound")}</div>
              ) : null}

              {!buscandoUsuariosEmprestimo && usuariosEmprestimo.length > 0 ? (
                <div className="bib-related-list">
                  {usuariosEmprestimo.map((usuarioBusca) => (
                    <div className="bib-related-row" key={usuarioBusca.id}>
                      <span aria-hidden="true">
                        {usuarioBusca.tipo === "ALUNO"
                          ? "🎓"
                          : usuarioBusca.tipo === "PROFESSOR"
                            ? "👨‍🏫"
                            : "👤"}
                      </span>

                      <div>
                        <strong>{usuarioBusca.nome}</strong>

                        <small>
                          {rotuloEnumLocalizado(usuarioBusca.tipo)}

                          {usuarioBusca.identificador
                            ? ` · ${
                                usuarioBusca.tipo === "ALUNO"
                                  ? ui("enrollment")
                                  : ui("code")
                              } ${usuarioBusca.identificador}`
                            : ""}

                          {usuarioBusca.cpfMascarado
                            ? ` · CPF ${usuarioBusca.cpfMascarado}`
                            : ""}
                        </small>

                        <small>
                          {usuarioBusca.email}

                          {usuarioBusca.cargo ? ` · ${usuarioBusca.cargo}` : ""}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="bib-button bib-button-secondary"
                        onClick={() =>
                          setUsuarioEmprestimoSelecionado(usuarioBusca)
                        }
                      >
                        {usuarioEmprestimoSelecionado?.id === usuarioBusca.id
                          ? ui("selected")
                          : ui("select")}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <footer className="bib-modal-footer">
              <button
                type="button"
                className="bib-button bib-button-secondary"
                onClick={fecharEmprestimo}
                disabled={registrandoEmprestimo}
              >
                {ui("cancel")}
              </button>

              <button
                type="button"
                className="bib-button bib-button-primary"
                onClick={() => void registrarEmprestimo()}
                disabled={
                  registrandoEmprestimo ||
                  !usuarioEmprestimoSelecionado ||
                  !vencimentoEmprestimo
                }
              >
                {registrandoEmprestimo
                  ? ui("registering")
                  : ui("registerLoanAction")}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {exemplarParaDevolucao ? (
        <div className="bib-modal-backdrop" role="presentation">
          <section
            className="bib-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-devolucao-biblioteca"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">{ui("virtualLibrary")}</span>

                <h2 id="titulo-devolucao-biblioteca">{ui("returnTitle")}</h2>

                <p>{ui("returnDescription")}</p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharDevolucao}
                disabled={devolvendoExemplar}
                aria-label={ui("close")}
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
                    <strong>{exemplarParaDevolucao.codigoInterno}</strong>

                    <p>
                      {item.titulo}

                      {exemplarParaDevolucao.numeroTombo
                        ? ui("tombSuffix", {
                            number: exemplarParaDevolucao.numeroTombo,
                          })
                        : ""}
                    </p>
                  </div>
                </div>

                <label className="bib-field">
                  <span>
                    {ui("returnCondition")} <b>*</b>
                  </span>

                  <select
                    className="bib-input"
                    value={condicaoDevolucao}
                    onChange={(evento) =>
                      setCondicaoDevolucao(evento.target.value)
                    }
                    disabled={devolvendoExemplar}
                  >
                    <option value="NORMAL">{ui("conditionNormal")}</option>

                    <option value="DESGASTE">{ui("conditionWear")}</option>

                    <option value="DANIFICADO">{ui("conditionDamaged")}</option>

                    <option value="INCOMPLETO">
                      {ui("conditionIncomplete")}
                    </option>

                    <option value="PERDIDO">{ui("conditionLost")}</option>
                  </select>

                  <small>{ui("conditionHelp")}</small>
                </label>

                {condicaoDevolucao === "NORMAL" ? (
                  <div className="bib-feedback bib-feedback-success">
                    <div>
                      <strong>{ui("availableAgain")}</strong>

                      <p>{ui("availableAgainHelp")}</p>
                    </div>
                  </div>
                ) : null}

                {condicaoDevolucao === "DESGASTE" ? (
                  <div className="bib-feedback bib-feedback-warning">
                    <div>
                      <strong>{ui("wearRecorded")}</strong>

                      <p>{ui("wearRecordedHelp")}</p>
                    </div>
                  </div>
                ) : null}

                {condicaoDevolucao === "DANIFICADO" ? (
                  <div className="bib-feedback bib-feedback-warning">
                    <div>
                      <strong>{ui("markedDamaged")}</strong>

                      <p>{ui("markedDamagedHelp")}</p>
                    </div>
                  </div>
                ) : null}

                {condicaoDevolucao === "INCOMPLETO" ? (
                  <div className="bib-feedback bib-feedback-warning">
                    <div>
                      <strong>{ui("markedUnavailable")}</strong>

                      <p>{ui("markedUnavailableHelp")}</p>
                    </div>
                  </div>
                ) : null}

                {condicaoDevolucao === "PERDIDO" ? (
                  <div className="bib-feedback bib-feedback-danger">
                    <div>
                      <strong>{ui("markedLost")}</strong>

                      <p>{ui("markedLostHelp")}</p>
                    </div>
                  </div>
                ) : null}

                <label className="bib-field">
                  <span>{ui("returnNotes")}</span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={observacaoDevolucao}
                    onChange={(evento) =>
                      setObservacaoDevolucao(evento.target.value)
                    }
                    maxLength={5_000}
                    disabled={devolvendoExemplar}
                    placeholder={ui("returnNotesPlaceholder")}
                  />

                  <small>{ui("optionalReturnNote")}</small>
                </label>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharDevolucao}
                  disabled={devolvendoExemplar}
                >
                  {ui("cancel")}
                </button>

                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={devolvendoExemplar}
                >
                  {devolvendoExemplar
                    ? ui("registering")
                    : ui("registerReturn")}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {exemplarParaCancelamentoManutencao &&
      exemplarParaCancelamentoManutencao.manutencaoAberta ? (
        <div className="bib-modal-backdrop" role="presentation">
          <section
            className="bib-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cancelamento-manutencao"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">{ui("virtualLibrary")}</span>

                <h2 id="titulo-cancelamento-manutencao">
                  {ui("maintenanceCancelTitle")}
                </h2>

                <p>{ui("maintenanceCancelDescription")}</p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharCancelamentoManutencao}
                disabled={cancelandoManutencao}
                aria-label={ui("close")}
              >
                ×
              </button>
            </header>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                void cancelarManutencao();
              }}
            >
              <div className="bib-modal-body">
                <div className="bib-feedback">
                  <div>
                    <strong>
                      {exemplarParaCancelamentoManutencao.codigoInterno}
                    </strong>

                    <p>
                      {item.titulo}

                      {exemplarParaCancelamentoManutencao.numeroTombo
                        ? ui("tombSuffix", {
                            number:
                              exemplarParaCancelamentoManutencao.numeroTombo,
                          })
                        : ""}
                    </p>

                    <p>
                      {ui("currentMaintenance", {
                        reason:
                          exemplarParaCancelamentoManutencao.manutencaoAberta
                            .motivo,
                      })}
                    </p>
                  </div>
                </div>

                <label className="bib-field">
                  <span>
                    {ui("cancellationReason")} <b aria-hidden="true">*</b>
                  </span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={motivoCancelamentoManutencao}
                    onChange={(evento) =>
                      setMotivoCancelamentoManutencao(evento.target.value)
                    }
                    placeholder={ui("serviceCancelPlaceholder")}
                    maxLength={5000}
                    required
                    autoFocus
                    disabled={cancelandoManutencao}
                  />
                </label>

                <label className="bib-field">
                  <span>
                    {ui("statusAfterCancellation")} <b aria-hidden="true">*</b>
                  </span>

                  <select
                    className="bib-input"
                    value={statusRetornoCancelamentoManutencao}
                    onChange={(evento) =>
                      setStatusRetornoCancelamentoManutencao(
                        evento.target.value as "DANIFICADO" | "INDISPONIVEL",
                      )
                    }
                    disabled={cancelandoManutencao}
                  >
                    <option value="DANIFICADO">{ui("conditionDamaged")}</option>

                    <option value="INDISPONIVEL">{ui("unavailable")}</option>
                  </select>

                  <small>{ui("cancelNoAvailability")}</small>
                </label>

                <div className="bib-feedback bib-feedback-warning">
                  <div>
                    <strong>{ui("remainOut")}</strong>

                    <p>{ui("remainOutHelp")}</p>
                  </div>
                </div>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharCancelamentoManutencao}
                  disabled={cancelandoManutencao}
                >
                  {ui("back")}
                </button>

                <button
                  type="submit"
                  className="bib-button bib-button-danger"
                  disabled={
                    cancelandoManutencao || !motivoCancelamentoManutencao.trim()
                  }
                >
                  {cancelandoManutencao
                    ? ui("canceling")
                    : ui("cancelMaintenance")}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {exemplarParaConclusaoManutencao &&
      exemplarParaConclusaoManutencao.manutencaoAberta ? (
        <div className="bib-modal-backdrop" role="presentation">
          <section
            className="bib-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-conclusao-manutencao"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">{ui("virtualLibrary")}</span>

                <h2 id="titulo-conclusao-manutencao">
                  {ui("maintenanceCompleteTitle")}
                </h2>

                <p>{ui("maintenanceCompleteDescription")}</p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharConclusaoManutencao}
                disabled={concluindoManutencao}
                aria-label={ui("close")}
              >
                ×
              </button>
            </header>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                void concluirManutencao();
              }}
            >
              <div className="bib-modal-body">
                <div className="bib-feedback">
                  <div>
                    <strong>
                      {exemplarParaConclusaoManutencao.codigoInterno}
                    </strong>

                    <p>
                      {item.titulo}

                      {exemplarParaConclusaoManutencao.numeroTombo
                        ? ui("tombSuffix", {
                            number: exemplarParaConclusaoManutencao.numeroTombo,
                          })
                        : ""}
                    </p>

                    <p>
                      {ui("maintenanceReasonValue", {
                        reason:
                          exemplarParaConclusaoManutencao.manutencaoAberta
                            .motivo,
                      })}
                    </p>
                  </div>
                </div>

                <label className="bib-field">
                  <span>
                    {ui("maintenanceResult")} <b aria-hidden="true">*</b>
                  </span>

                  <select
                    className="bib-input"
                    value={resultadoManutencao}
                    onChange={(evento) =>
                      setResultadoManutencao(
                        evento.target.value as "REPARADO" | "IRRECUPERAVEL",
                      )
                    }
                    disabled={concluindoManutencao}
                  >
                    <option value="REPARADO">{ui("repaired")}</option>

                    <option value="IRRECUPERAVEL">{ui("irreparable")}</option>
                  </select>

                  <small>{ui("resultHelp")}</small>
                </label>

                {resultadoManutencao === "REPARADO" ? (
                  <div className="bib-feedback bib-feedback-success">
                    <div>
                      <strong>{ui("availableAgain")}</strong>

                      <p>{ui("availableAgainHelp")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bib-feedback bib-feedback-danger">
                    <div>
                      <strong>{ui("remainUnavailable")}</strong>

                      <p>{ui("irreparableHelp")}</p>
                    </div>
                  </div>
                )}

                <label className="bib-field">
                  <span>
                    {ui("completionNotes")}

                    {resultadoManutencao === "IRRECUPERAVEL" ? (
                      <>
                        {" "}
                        <b aria-hidden="true">*</b>
                      </>
                    ) : null}
                  </span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={observacaoConclusaoManutencao}
                    onChange={(evento) =>
                      setObservacaoConclusaoManutencao(evento.target.value)
                    }
                    placeholder={
                      resultadoManutencao === "IRRECUPERAVEL"
                        ? ui("irreparablePlaceholder")
                        : ui("repairPlaceholder")
                    }
                    maxLength={5000}
                    required={resultadoManutencao === "IRRECUPERAVEL"}
                    disabled={concluindoManutencao}
                  />
                </label>

                <label className="bib-field">
                  <span>{ui("finalCost")}</span>

                  <input
                    className="bib-input"
                    type="text"
                    inputMode="decimal"
                    value={custoFinalManutencao}
                    onChange={(evento) =>
                      setCustoFinalManutencao(evento.target.value)
                    }
                    placeholder="0,00"
                    disabled={concluindoManutencao}
                  />
                </label>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharConclusaoManutencao}
                  disabled={concluindoManutencao}
                >
                  {ui("cancel")}
                </button>

                <button
                  type="submit"
                  className={`bib-button ${
                    resultadoManutencao === "IRRECUPERAVEL"
                      ? "bib-button-danger"
                      : "bib-button-primary"
                  }`}
                  disabled={
                    concluindoManutencao ||
                    (resultadoManutencao === "IRRECUPERAVEL" &&
                      !observacaoConclusaoManutencao.trim())
                  }
                >
                  {concluindoManutencao
                    ? ui("completing")
                    : resultadoManutencao === "IRRECUPERAVEL"
                      ? ui("declareIrreparable")
                      : `🛠️ ${ui("completeAsRepaired")}`}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {exemplarParaManutencao ? (
        <div className="bib-modal-backdrop">
          <section
            className="bib-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-manutencao-biblioteca"
          >
            <header className="bib-modal-header">
              <div>
                <span>{ui("virtualLibrary")}</span>

                <h2 id="titulo-manutencao-biblioteca">
                  {ui("maintenanceSendTitle")}
                </h2>

                <p>{ui("maintenanceSendDescription")}</p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                aria-label={ui("close")}
                onClick={fecharManutencao}
                disabled={enviandoParaManutencao}
              >
                ×
              </button>
            </header>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                void iniciarManutencao();
              }}
            >
              <div className="bib-modal-body">
                <div className="bib-feedback">
                  <div>
                    <strong>{exemplarParaManutencao.codigoInterno}</strong>

                    <p>
                      {item.titulo}

                      {exemplarParaManutencao.numeroTombo
                        ? ui("tombSuffix", {
                            number: exemplarParaManutencao.numeroTombo,
                          })
                        : ""}
                    </p>

                    <p>
                      {ui("currentStatus", {
                        status: rotuloEnumLocalizado(
                          exemplarParaManutencao.status,
                        ),
                      })}
                    </p>
                  </div>
                </div>

                <label className="bib-field">
                  <span>
                    {ui("maintenanceReason")} <b aria-hidden="true">*</b>
                  </span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={motivoManutencao}
                    onChange={(evento) =>
                      setMotivoManutencao(evento.target.value)
                    }
                    placeholder={ui("maintenanceReasonPlaceholder")}
                    maxLength={1000}
                    autoFocus
                    required
                  />
                </label>

                <label className="bib-field">
                  <span>{ui("intakeNotes")}</span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={observacaoEntradaManutencao}
                    onChange={(evento) =>
                      setObservacaoEntradaManutencao(evento.target.value)
                    }
                    placeholder={ui("intakePlaceholder")}
                    maxLength={5000}
                  />
                </label>

                <label className="bib-field">
                  <span>{ui("providerResponsible")}</span>

                  <input
                    className="bib-input"
                    type="text"
                    value={fornecedorManutencao}
                    onChange={(evento) =>
                      setFornecedorManutencao(evento.target.value)
                    }
                    placeholder={ui("providerPlaceholder")}
                    maxLength={200}
                  />
                </label>

                <label className="bib-field">
                  <span>{ui("estimatedCost")}</span>

                  <input
                    className="bib-input"
                    type="text"
                    inputMode="decimal"
                    value={custoEstimadoManutencao}
                    onChange={(evento) =>
                      setCustoEstimadoManutencao(evento.target.value)
                    }
                    placeholder="0,00"
                  />
                </label>

                <label className="bib-field">
                  <span>{ui("expectedReturn")}</span>

                  <input
                    className="bib-input"
                    type="date"
                    value={previsaoRetornoManutencao}
                    onChange={(evento) =>
                      setPrevisaoRetornoManutencao(evento.target.value)
                    }
                  />
                </label>

                <div className="bib-feedback bib-feedback-warning">
                  <div>
                    <strong>{ui("inMaintenance")}</strong>

                    <p>{ui("inMaintenanceHelp")}</p>
                  </div>
                </div>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharManutencao}
                  disabled={enviandoParaManutencao}
                >
                  {ui("cancel")}
                </button>

                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={enviandoParaManutencao || !motivoManutencao.trim()}
                >
                  {enviandoParaManutencao
                    ? ui("sending")
                    : ui("sendMaintenance")}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {modalExemplarAberto ? (
        <div className="bib-modal-backdrop" role="presentation">
          <section
            className="bib-modal bib-exemplar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cadastro-exemplar"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">{ui("virtualLibrary")}</span>

                <h2 id="titulo-cadastro-exemplar">
                  {exemplarEmEdicao ? ui("editCopy") : ui("createCopy")}
                </h2>
                <p>
                  {exemplarEmEdicao
                    ? ui("editCopyDescription")
                    : ui("createCopyDescription")}
                </p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharCadastroExemplar}
                disabled={salvandoExemplar}
                aria-label={ui("close")}
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
                      {ui("type")} <b>*</b>
                    </span>

                    <select
                      className="bib-input"
                      value={formularioExemplar.tipo}
                      onChange={(evento) =>
                        alterarExemplar(
                          "tipo",
                          evento.target.value as "FISICO" | "DIGITAL",
                        )
                      }
                      disabled={salvandoExemplar}
                    >
                      <option value="FISICO">{ui("physical")}</option>

                      <option value="DIGITAL">{ui("digital")}</option>
                    </select>
                  </label>

                  <label className="bib-field">
                    <span>
                      {ui("internalCode")} <b>*</b>
                    </span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.codigoInterno}
                      onChange={(evento) =>
                        alterarExemplar("codigoInterno", evento.target.value)
                      }
                      maxLength={120}
                      disabled={salvandoExemplar}
                      placeholder={ui("internalCodePlaceholder")}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("barcode")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.codigoBarras}
                      onChange={(evento) =>
                        alterarExemplar("codigoBarras", evento.target.value)
                      }
                      maxLength={120}
                      disabled={salvandoExemplar}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("accessionNumber")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.numeroTombo}
                      onChange={(evento) =>
                        alterarExemplar("numeroTombo", evento.target.value)
                      }
                      maxLength={120}
                      disabled={salvandoExemplar}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("assetNumber")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.patrimonio}
                      onChange={(evento) =>
                        alterarExemplar("patrimonio", evento.target.value)
                      }
                      maxLength={120}
                      disabled={salvandoExemplar}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("unitCampus")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.unidadeSnapshot}
                      onChange={(evento) =>
                        alterarExemplar("unidadeSnapshot", evento.target.value)
                      }
                      maxLength={200}
                      disabled={salvandoExemplar}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("department")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.setor}
                      onChange={(evento) =>
                        alterarExemplar("setor", evento.target.value)
                      }
                      maxLength={160}
                      disabled={salvandoExemplar}
                      placeholder={ui("libraryPlaceholder")}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("room")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.sala}
                      onChange={(evento) =>
                        alterarExemplar("sala", evento.target.value)
                      }
                      maxLength={120}
                      disabled={salvandoExemplar}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("shelfUnit")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.estante}
                      onChange={(evento) =>
                        alterarExemplar("estante", evento.target.value)
                      }
                      maxLength={120}
                      disabled={salvandoExemplar}
                      placeholder={ui("shelfUnitPlaceholder")}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("shelf")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.prateleira}
                      onChange={(evento) =>
                        alterarExemplar("prateleira", evento.target.value)
                      }
                      maxLength={120}
                      disabled={salvandoExemplar}
                      placeholder={ui("shelfPlaceholder")}
                    />
                  </label>

                  <label className="bib-field bib-field-span-3">
                    <span>{ui("fullLocation")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.localizacaoCompleta}
                      onChange={(evento) =>
                        alterarExemplar(
                          "localizacaoCompleta",
                          evento.target.value,
                        )
                      }
                      maxLength={500}
                      disabled={salvandoExemplar}
                      placeholder={ui("locationPlaceholder")}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("acquisitionDate")}</span>

                    <input
                      className="bib-input"
                      type="date"
                      value={formularioExemplar.dataAquisicao}
                      onChange={(evento) =>
                        alterarExemplar("dataAquisicao", evento.target.value)
                      }
                      disabled={salvandoExemplar}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("acquisitionMethod")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.formaAquisicao}
                      onChange={(evento) =>
                        alterarExemplar("formaAquisicao", evento.target.value)
                      }
                      maxLength={160}
                      disabled={salvandoExemplar}
                      placeholder={ui("acquisitionPlaceholder")}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("provider")}</span>

                    <input
                      className="bib-input"
                      value={formularioExemplar.fornecedor}
                      onChange={(evento) =>
                        alterarExemplar("fornecedor", evento.target.value)
                      }
                      maxLength={240}
                      disabled={salvandoExemplar}
                      placeholder={ui("providerInputPlaceholder")}
                    />
                  </label>

                  <label className="bib-field">
                    <span>{ui("acquisitionValue")}</span>

                    <input
                      className="bib-input"
                      inputMode="decimal"
                      value={formularioExemplar.valorAquisicao}
                      onChange={(evento) =>
                        alterarExemplar("valorAquisicao", evento.target.value)
                      }
                      disabled={salvandoExemplar}
                      placeholder="0,00"
                    />
                  </label>

                  <label className="bib-field bib-field-span-3">
                    <span>{ui("notes")}</span>

                    <textarea
                      className="bib-input bib-textarea"
                      value={formularioExemplar.observacoes}
                      onChange={(evento) =>
                        alterarExemplar("observacoes", evento.target.value)
                      }
                      maxLength={10_000}
                      disabled={salvandoExemplar}
                      placeholder={ui("copyNotesPlaceholder")}
                    />
                  </label>
                </div>
                <fieldset className="bib-options">
                  <legend>{ui("circulation")}</legend>

                  <label className="bib-check">
                    <input
                      type="checkbox"
                      checked={formularioExemplar.permiteEmprestimo}
                      onChange={(evento) =>
                        alterarExemplar(
                          "permiteEmprestimo",
                          evento.target.checked,
                        )
                      }
                      disabled={salvandoExemplar}
                    />

                    <span>
                      <b>{ui("allowLoan")}</b>

                      <small>{ui("allowLoanHelp")}</small>
                    </span>
                  </label>
                </fieldset>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharCadastroExemplar}
                  disabled={salvandoExemplar}
                >
                  {ui("cancel")}
                </button>

                <button
                  type="submit"
                  className="bib-button bib-button-primary"
                  disabled={
                    salvandoExemplar || !formularioExemplar.codigoInterno.trim()
                  }
                >
                  {salvandoExemplar
                    ? exemplarEmEdicao
                      ? ui("saving")
                      : ui("registeringCopy")
                    : exemplarEmEdicao
                      ? ui("saveChanges")
                      : ui("createCopy")}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {exemplarParaBaixa ? (
        <div className="bib-modal-backdrop" role="presentation">
          <section
            className="bib-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-baixa-exemplar"
          >
            <header className="bib-modal-header">
              <div>
                <span className="bib-modal-kicker">{ui("virtualLibrary")}</span>

                <h2 id="titulo-baixa-exemplar">{ui("writeOffTitle")}</h2>

                <p>{ui("writeOffDescription")}</p>
              </div>

              <button
                type="button"
                className="bib-modal-close"
                onClick={fecharBaixaExemplar}
                disabled={baixandoExemplar}
                aria-label={ui("close")}
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
                    <strong>{exemplarParaBaixa.codigoInterno}</strong>

                    <p>
                      {rotuloEnumLocalizado(exemplarParaBaixa.tipo)}

                      {" · "}

                      {rotuloEnumLocalizado(exemplarParaBaixa.status)}

                      {exemplarParaBaixa.numeroTombo
                        ? ui("tombSuffix", {
                            number: exemplarParaBaixa.numeroTombo,
                          })
                        : ""}
                    </p>
                  </div>
                </div>

                <label className="bib-field">
                  <span>
                    {ui("writeOffReason")} <b>*</b>
                  </span>

                  <textarea
                    className="bib-input bib-textarea"
                    value={motivoBaixaExemplar}
                    onChange={(evento) =>
                      setMotivoBaixaExemplar(evento.target.value)
                    }
                    maxLength={5_000}
                    disabled={baixandoExemplar}
                    placeholder={ui("writeOffPlaceholder")}
                    autoFocus
                  />

                  <small>{ui("writeOffReasonHelp")}</small>
                </label>
              </div>

              <footer className="bib-modal-footer">
                <button
                  type="button"
                  className="bib-button bib-button-secondary"
                  onClick={fecharBaixaExemplar}
                  disabled={baixandoExemplar}
                >
                  {ui("cancel")}
                </button>

                <button
                  type="submit"
                  className="bib-button bib-button-danger"
                  disabled={baixandoExemplar || !motivoBaixaExemplar.trim()}
                >
                  {baixandoExemplar
                    ? ui("writingOff")
                    : `⬇ ${ui("writeOffTitle")}`}
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
          <span aria-hidden="true">{toast.tipo === "sucesso" ? "✓" : "!"}</span>
          <p>{toast.mensagem}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label={ui("closeNotice")}
          >
            ×
          </button>
        </div>
      ) : null}
    </main>
  );
}
