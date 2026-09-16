"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import withAuth from "@/components/auth/withAuth";
import type {
  CountryCode,
} from "libphonenumber-js";
import CampoTelefoneInternacional from "@/components/internacionalizacao/CampoTelefoneInternacional";
import {
  normalizarTelefoneE164,
  prepararTelefoneParaFormulario,
  telefoneValidoInternacional,
} from "@/lib/internacionalizacao/telefone";
import {
  useTranslations,
} from "next-intl";

type StatusAluno =
  | "ATIVO"
  | "TRANCADO"
  | "SUSPENSO"
  | "INADIMPLENTE"
  | "TRANSFERIDO"
  | "DESLIGADO"
  | "FORMADO"
  | "CANCELADO"
  | "PAUSA_MEDICA"
  | "FALTANTE";

type SituacaoAcademicaFiltro =
  | "TODOS"
  | "MATRICULADOS"
  | "SEM_MATRICULA"
  | "AGUARDANDO"
  | "A_INICIAR"
  | "ATIVA"
  | "TRANCADA"
  | "SUSPENSA"
  | "INTERCAMBIO"
  | "TRANSFERIDA"
  | "CONCLUIDA"
  | "CANCELADA";

type FeedbackTipo = "sucesso" | "erro" | "";

interface Aluno {
  id: number;
  nome: string;
  nomeSocial?: string | null;
  genero?: string | null;
  matricula?: string | null;
  cpf?: string | null;
  rg?: string | null;
  telefone?: string | null;
  dataNascimento?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  documentoUrl?: string | null;
  fotoPerfil?: string | null;
  nomeResponsavel?: string | null;
  cpfResponsavel?: string | null;
  telefoneResponsavel?: string | null;
  emailResponsavel?: string | null;
  parentescoResponsavel?: string | null;
  statusAluno?: StatusAluno;
  possuiNecessidadeEspecial?: boolean;
  descricaoNecessidadeEspecial?: string | null;
  observacoesAcessibilidade?: string | null;
  poloId?: number | null;
  polo?: Polo | null;
  user: {
    email: string;
  };
}

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type TurmaOption = {
  id: number;
  nome: string;
  professorNome?: string | null;
  disciplinaNome?: string | null;
};

type MatriculaResumo = {
  id: number;
  status?: string;
  cursoNome?: string | null;
  semestre?: number | null;

  numeroMatricula?: string | null;
  dataMatricula?: string | null;

  modalidade?: string | null;
  periodoLetivo?: string | null;
  previsaoConclusao?: string | null;

  polo?: {
    id: number;
    nome: string;
    codigo?: string | null;
  } | null;

  turmas: Array<{
    turmaId: number;
    turmaNome: string;
    disciplinaNome?: string | null;
    professorNome?: string | null;
    status?: string | null;
  }>;
};

type DocumentoAlunoAdmin = {
  id: number;
  titulo: string;
  tipo: string;
  proprietario: "ALUNO" | "RESPONSAVEL" | string;
  arquivoUrl?: string | null;
  arquivoNome?: string | null;
  mimeType?: string | null;
  tamanho?: number | null;
  criadoEm?: string;
};

type AlunoComResumo = Aluno & {
  resumoMatricula?: MatriculaResumo | null;
};

type ConfirmacaoMenorCadastro = {
  idade: number;
  responsavelIncompleto: boolean;
  camposPendentes: string[];
} | null;

type AlunoExistenteConversao = {
  id: number;
  nome: string;
  statusAluno: string;
  campo: string;
} | null;

type LeadParaConversao = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  interesse?: string | null;
  instituicaoNome?: string | null;
  responsavelFuncionarioId?: number | null;
  responsavelNome?: string | null;
  status?: string | null;
};

function AdminAlunosPage() {
  const t = useTranslations(
    "AdminStudents"
  );

  const tTelefone =
    useTranslations(
      "InternationalPhone"
    );

  function labelStatusMatricula(
    status?: string | null
  ) {
    switch (status) {
      case "AGUARDANDO":
        return t("filters.awaitingClass");

      case "A_INICIAR":
        return t("filters.toStart");

      case "ATIVA":
        return t("filters.activeEnrollment");

      case "TRANCADA":
        return t("filters.enrollmentOnHold");

      case "SUSPENSA":
        return t("filters.suspendedEnrollment");

      case "INTERCAMBIO":
        return t("filters.exchange");

      case "TRANSFERIDA":
        return t("filters.transferredEnrollment");

      case "CONCLUIDA":
        return t("filters.completedEnrollment");

      case "CANCELADA":
        return t("filters.canceledEnrollment");

      default:
        return t("table.withoutEnrollment");
    }
  }

  function classeStatusMatricula(
    status?: string | null
  ) {
    switch (status) {
      case "ATIVA":
        return "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200";

      case "A_INICIAR":
        return "border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200";

      case "AGUARDANDO":
        return "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200";

      case "TRANCADA":
        return "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-200";

      case "SUSPENSA":
        return "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200";

      case "INTERCAMBIO":
        return "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200";

      case "TRANSFERIDA":
        return "border-cyan-300 bg-cyan-100 text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200";

      case "CONCLUIDA":
        return "border-teal-300 bg-teal-100 text-teal-900 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-200";

      case "CANCELADA":
        return "border-red-300 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200";

      default:
        return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
    }
  }

  const router = useRouter();
  const searchParams = useSearchParams();

  const [leadParaConversao, setLeadParaConversao] =
    useState<LeadParaConversao | null>(null);

  const [
    carregandoLeadParaConversao,
    setCarregandoLeadParaConversao,
  ] = useState(false);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limitePorPagina = 20;

  const [turmas, setTurmas] = useState<TurmaOption[]>([]);
  const [polos, setPolos] = useState<Polo[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [filtroSituacaoAcademica, setFiltroSituacaoAcademica] =
    useState<SituacaoAcademicaFiltro>("TODOS");
  const [filtroTurmaId, setFiltroTurmaId] = useState<string>("TODAS");

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");

  const [criando, setCriando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [painelAlunoAberto, setPainelAlunoAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] =
    useState<AlunoComResumo | null>(null);

  const leadIdConversao = useMemo(() => {
    const valor = Number(
      searchParams.get("leadId")
    );

    return Number.isInteger(valor) &&
      valor > 0
      ? valor
      : null;
  }, [searchParams]);

  const [abaPainelAluno, setAbaPainelAluno] = useState<
    | "DADOS"
    | "DOCUMENTOS"
    | "MATRICULAS"
    | "DESEMPENHO"
    | "HISTORICO"
    | "CERTIFICADOS"
  >("DADOS");


  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
  const [modalAvisoTitulo, setModalAvisoTitulo] = useState("");
  const [modalAvisoMensagem, setModalAvisoMensagem] = useState("");
  const [modalAvisoTipo, setModalAvisoTipo] = useState<"sucesso" | "erro">(
    "erro"
  );

  const [
    alunoExistenteConversao,
    setAlunoExistenteConversao,
  ] = useState<AlunoExistenteConversao>(null);

  const [
    confirmacaoMenorCadastro,
    setConfirmacaoMenorCadastro,
  ] =
    useState<ConfirmacaoMenorCadastro>(
      null
    );

  const [
    cienteMenorCadastro,
    setCienteMenorCadastro,
  ] = useState(false);

  const [nome, setNome] = useState("");
  const [nomeSocial, setNomeSocial] = useState("");
  const [genero, setGenero] = useState("");
  const [email, setEmail] = useState("");
  const [matricula] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");

  const [
    paisTelefone,
    setPaisTelefone,
  ] = useState<CountryCode>("BR");

  const [dataNascimento, setDataNascimento] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [enviandoFotoPerfil, setEnviandoFotoPerfil] = useState(false);

  const [novoAlunoDocumentos, setNovoAlunoDocumentos] = useState<{
    proprietario: "ALUNO" | "RESPONSAVEL";
    tipo: string;
    arquivo: File;
  }[]>([]);

  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");

  const [
    paisTelefoneResponsavel,
    setPaisTelefoneResponsavel,
  ] = useState<CountryCode>("BR");

  const [emailResponsavel, setEmailResponsavel] = useState("");
  const [parentescoResponsavel, setParentescoResponsavel] = useState("");
  const [statusAluno, setStatusAluno] = useState<StatusAluno>("ATIVO");
  const [poloId, setPoloId] = useState("");
  const [possuiNecessidadeEspecial, setPossuiNecessidadeEspecial] =
    useState(false);
  const [descricaoNecessidadeEspecial, setDescricaoNecessidadeEspecial] =
    useState("");
  const [observacoesAcessibilidade, setObservacoesAcessibilidade] =
    useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editNomeSocial, setEditNomeSocial] = useState("");
  const [editGenero, setEditGenero] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMatricula] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editRg, setEditRg] = useState("");
  const [editTelefone, setEditTelefone] = useState("");

  const [
    editPaisTelefone,
    setEditPaisTelefone,
  ] = useState<CountryCode>("BR");

  const [editDataNascimento, setEditDataNascimento] = useState("");
  const [editCep, setEditCep] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editNumero, setEditNumero] = useState("");
  const [editComplemento, setEditComplemento] = useState("");
  const [editBairro, setEditBairro] = useState("");
  const [editCidade, setEditCidade] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editDocumentoUrl, setEditDocumentoUrl] = useState("");
  const [editFotoPerfil, setEditFotoPerfil] = useState("");
  const [editEnviandoFotoPerfil, setEditEnviandoFotoPerfil] = useState(false);
  const [editNomeResponsavel, setEditNomeResponsavel] = useState("");
  const [editCpfResponsavel, setEditCpfResponsavel] = useState("");
  const [editTelefoneResponsavel, setEditTelefoneResponsavel] = useState("");

  const [
    editPaisTelefoneResponsavel,
    setEditPaisTelefoneResponsavel,
  ] = useState<CountryCode>("BR");

  const [editEmailResponsavel, setEditEmailResponsavel] = useState("");
  const [editParentescoResponsavel, setEditParentescoResponsavel] =
    useState("");
  const [editStatusAluno, setEditStatusAluno] = useState<StatusAluno>("ATIVO");
  const [editPoloId, setEditPoloId] = useState("");
  const [editPossuiNecessidadeEspecial, setEditPossuiNecessidadeEspecial] =
    useState(false);
  const [editDescricaoNecessidadeEspecial, setEditDescricaoNecessidadeEspecial] =
    useState("");
  const [editObservacoesAcessibilidade, setEditObservacoesAcessibilidade] =
    useState("");

  const [desempenhoAluno, setDesempenhoAluno] = useState<any | null>(null);
  const [carregandoDesempenho, setCarregandoDesempenho] = useState(false);

  const [buscaDisciplina, setBuscaDisciplina] = useState("");
  const [paginaDisciplina, setPaginaDisciplina] = useState(1);
  const [alunoDesempenhoId, setAlunoDesempenhoId] = useState<number | null>(null);

  const [documentosAluno, setDocumentosAluno] = useState<DocumentoAlunoAdmin[]>([]);
  const [carregandoDocumentosAluno, setCarregandoDocumentosAluno] = useState(false);
  const [enviandoDocumentoAluno, setEnviandoDocumentoAluno] = useState(false);

  const [documentoProprietario, setDocumentoProprietario] = useState<"ALUNO" | "RESPONSAVEL">("ALUNO");
  const [documentoTipo, setDocumentoTipo] = useState("RG");
  const [documentoArquivo, setDocumentoArquivo] = useState<File | null>(null);

  const [documentosArquivadosAluno, setDocumentosArquivadosAluno] = useState<any[]>([]);
  const [carregandoArquivadosAluno, setCarregandoArquivadosAluno] = useState(false);

  const [buscaMatricula, setBuscaMatricula] = useState("");
  const [turmasMatriculaAbertas, setTurmasMatriculaAbertas] = useState<Record<number, boolean>>({});
  const [matriculaExpandida, setMatriculaExpandida] = useState(false);
  const [gerandoCertificado, setGerandoCertificado] = useState(false);
  const [baixandoCertificado, setBaixandoCertificado] = useState(false);

  const FORMATOS_FOTO_ALUNO_ACEITOS = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  const TAMANHO_MAXIMO_FOTO_ALUNO_MB = 2;
  const TAMANHO_MAXIMO_FOTO_ALUNO_BYTES =
    TAMANHO_MAXIMO_FOTO_ALUNO_MB * 1024 * 1024;

  function validarFotoOficialAluno(file: File) {
    if (!FORMATOS_FOTO_ALUNO_ACEITOS.includes(file.type)) {
      throw new Error(
        t("loadingAndPhotoFeedback.photoInvalidType")
      );
    }

    if (file.size > TAMANHO_MAXIMO_FOTO_ALUNO_BYTES) {
      throw new Error(
        t("loadingAndPhotoFeedback.photoTooLargeDescription")
      );
    }
  }

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!leadIdConversao) {
      setLeadParaConversao(null);
      return;
    }

    let requisicaoAtiva = true;

    async function carregarLeadParaConversao() {
      try {
        setCarregandoLeadParaConversao(true);

        const res = await fetch(
          `/api/admin/leads/${leadIdConversao}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await res
          .json()
          .catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.error ||
            t("loadingAndPhotoFeedback.leadLoadError")
          );
        }

        if (!requisicaoAtiva) return;

        const lead: LeadParaConversao = {
          id: Number(data.id),
          nome: String(data.nome || ""),
          email: String(data.email || ""),
          telefone: data.telefone || null,
          interesse: data.interesse || null,
          instituicaoNome:
            data.instituicaoNome || null,
          responsavelFuncionarioId:
            data.responsavelFuncionarioId ??
            null,
          responsavelNome:
            data.responsavelNome || null,
          status: data.status || null,
        };

        limparFormularioCriacao();

        setLeadParaConversao(lead);

        setNome(lead.nome);
        setEmail(lead.email);
        const telefoneLead =
          prepararTelefoneParaFormulario(
            lead.telefone,
            "BR"
          );

        setTelefone(
          telefoneLead.valor
        );

        setPaisTelefone(
          telefoneLead.pais
        );

        setAlunoExistenteConversao(null);
        setConfirmacaoMenorCadastro(null);
        setCienteMenorCadastro(false);

        window.setTimeout(() => {
          document
            .getElementById(
              "formulario-novo-aluno"
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
        }, 100);
      } catch (error: any) {
        if (!requisicaoAtiva) return;

        setLeadParaConversao(null);

        abrirModalAviso(
          "erro",
          t("loadingAndPhotoFeedback.conversionStartErrorTitle"),
          error?.message ||
          t("loadingAndPhotoFeedback.conversionLoadError")
        );
      } finally {
        if (requisicaoAtiva) {
          setCarregandoLeadParaConversao(
            false
          );
        }
      }
    }

    void carregarLeadParaConversao();

    return () => {
      requisicaoAtiva = false;
    };
  }, [leadIdConversao]);

  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    carregarAlunos();
  }, [paginaAtual, filtroStatus, busca, filtroSituacaoAcademica]);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  function calcularIdadeFormulario(
    valor: string
  ) {
    const partes = valor
      .split("-")
      .map(Number);

    if (
      partes.length !== 3 ||
      partes.some(
        (parte) =>
          !Number.isFinite(parte)
      )
    ) {
      return null;
    }

    const [ano, mes, dia] = partes;

    const nascimento =
      new Date(
        ano,
        mes - 1,
        dia
      );

    if (
      nascimento.getFullYear() !==
      ano ||
      nascimento.getMonth() !==
      mes - 1 ||
      nascimento.getDate() !== dia
    ) {
      return null;
    }

    const hoje = new Date();

    let idade =
      hoje.getFullYear() - ano;

    const aindaNaoFezAniversario =
      hoje.getMonth() <
      mes - 1 ||
      (hoje.getMonth() ===
        mes - 1 &&
        hoje.getDate() < dia);

    if (aindaNaoFezAniversario) {
      idade -= 1;
    }

    return idade;
  }

  function verificarResponsavelFormulario() {
    const pendentes: string[] = [];

    const cpfLimpo =
      cpfResponsavel.replace(
        /\D/g,
        ""
      );

    if (!nomeResponsavel.trim()) {
      pendentes.push(
        t("minorConfirmation.pendingGuardianName")
      );
    }

    if (cpfLimpo.length !== 11) {
      pendentes.push(
        t("minorConfirmation.pendingGuardianCpf")
      );
    }

    if (
      !telefoneResponsavel.trim() ||
      !telefoneValidoInternacional(
        telefoneResponsavel,
        paisTelefoneResponsavel
      )
    ) {
      pendentes.push(
        tTelefone(
          "guardianInvalid"
        )
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        emailResponsavel.trim()
      )
    ) {
      pendentes.push(
        t("minorConfirmation.pendingGuardianEmail")
      );
    }

    if (
      !parentescoResponsavel.trim()
    ) {
      pendentes.push(
        t("minorConfirmation.pendingGuardianRelationship")
      );
    }

    return pendentes;
  }

  function tocarSomAtencao() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as any)
          .webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const contexto =
        new AudioContextClass();

      const oscilador =
        contexto.createOscillator();

      const ganho =
        contexto.createGain();

      const agora =
        contexto.currentTime;

      oscilador.type = "sine";

      oscilador.frequency.setValueAtTime(
        720,
        agora
      );

      oscilador.frequency.setValueAtTime(
        520,
        agora + 0.18
      );

      ganho.gain.setValueAtTime(
        0.0001,
        agora
      );

      ganho.gain.exponentialRampToValueAtTime(
        0.16,
        agora + 0.03
      );

      ganho.gain.exponentialRampToValueAtTime(
        0.0001,
        agora + 0.42
      );

      oscilador.connect(ganho);
      ganho.connect(
        contexto.destination
      );

      oscilador.start(agora);
      oscilador.stop(
        agora + 0.45
      );

      oscilador.addEventListener(
        "ended",
        () => {
          void contexto.close();
        }
      );
    } catch {
      // O aviso visual continuarÃ¡ funcionando
      // caso o navegador bloqueie o Ã¡udio.
    }
  }

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  function abrirModalAviso(
    tipo: "sucesso" | "erro",
    titulo: string,
    mensagem: string
  ) {
    setModalAvisoTipo(tipo);
    setModalAvisoTitulo(titulo);
    setModalAvisoMensagem(mensagem);
    setModalAvisoAberto(true);
  }

  async function enviarFotoOficialAluno(
    arquivo: File | null,
    modo: "CRIACAO" | "EDICAO"
  ) {
    if (!arquivo) return;

    const tiposPermitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const tamanhoMaximoBytes = 2 * 1024 * 1024;

    if (!tiposPermitidos.includes(arquivo.type)) {
      abrirModalAviso(
        "erro",
        t("loadingAndPhotoFeedback.photoInvalidFormatTitle"),
        t("loadingAndPhotoFeedback.photoInvalidType")
      );
      return;
    }

    if (arquivo.size > tamanhoMaximoBytes) {
      abrirModalAviso(
        "erro",
        t("loadingAndPhotoFeedback.photoTooLargeTitle"),
        t("loadingAndPhotoFeedback.photoTooLargeDescription")
      );
      return;
    }

    try {
      if (modo === "CRIACAO") {
        setEnviandoFotoPerfil(true);
      } else {
        setEditEnviandoFotoPerfil(true);
      }

      const formData = new FormData();
      formData.append("file", arquivo);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          t("loadingAndPhotoFeedback.photoUrlMissing")
        );
      }

      const url =
        data?.url ||
        data?.fileUrl ||
        data?.arquivoUrl ||
        data?.publicUrl;

      if (!url) {
        throw new Error(
          t("loadingAndPhotoFeedback.photoUrlMissing")
        );
      }

      if (modo === "CRIACAO") {
        setFotoPerfil(url);
      } else {
        setEditFotoPerfil(url);

        setAlunoSelecionado((atual) =>
          atual
            ? {
              ...atual,
              fotoPerfil: url,
            }
            : atual
        );
      }

      mostrarFeedback(
        "sucesso",
        t("loadingAndPhotoFeedback.photoUploadSuccess")
      );
    } catch (error: any) {
      abrirModalAviso(
        "erro",
        t("loadingAndPhotoFeedback.photoUploadErrorTitle"),
        error?.message ||
        t("loadingAndPhotoFeedback.photoUploadErrorDescription")
      );
    } finally {
      setEnviandoFotoPerfil(false);
      setEditEnviandoFotoPerfil(false);
    }
  }

  async function carregarTudo() {
    await Promise.all([
      carregarAlunos(),
      carregarTurmas(),
      carregarPolos(),
    ]);
  }

  async function carregarAlunos() {
    try {
      setCarregandoAlunos(true);

      const params = new URLSearchParams();
      params.set("page", String(paginaAtual));
      params.set("limit", String(limitePorPagina));

      if (busca.trim()) {
        params.set("busca", busca.trim());
      }

      if (filtroStatus !== "TODOS") {
        params.set("status", filtroStatus);
      }

      params.set("situacaoMatricula", filtroSituacaoAcademica);

      const res = await fetch(`/api/aluno?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Erro ao buscar alunos:", data);
        mostrarFeedback(
          "erro",
          data?.error ||
          t("loadingAndPhotoFeedback.studentsLoadError")
        );
        setAlunos([]);
        setTotalAlunos(0);
        setTotalPaginas(1);
        return;
      }

      const lista = Array.isArray(data?.data)
        ? data.data.map((aluno: any) => ({
          ...aluno,
          resumoMatricula: aluno.resumoMatricula
            ? {
              id: aluno.resumoMatricula.id,
              status: aluno.resumoMatricula.status || null,

              cursoNome:
                aluno.resumoMatricula.curso?.nome ||
                aluno.resumoMatricula.cursoNome ||
                null,

              semestre: aluno.resumoMatricula.semestre ?? null,

              numeroMatricula:
                aluno.resumoMatricula.numeroMatricula || null,

              dataMatricula:
                aluno.resumoMatricula.dataMatricula || null,

              periodoLetivo:
                aluno.resumoMatricula.periodoLetivo || null,

              modalidade:
                aluno.resumoMatricula.modalidade || null,

              previsaoConclusao:
                aluno.resumoMatricula.previsaoConclusao || null,

              polo:
                aluno.resumoMatricula.polo || null,

              turmas: Array.isArray(aluno.resumoMatricula.turmas)
                ? aluno.resumoMatricula.turmas.map((turma: any) => ({
                  turmaId: Number(turma.turmaId || turma.id),
                  turmaNome: String(
                    turma.turmaNome || turma.nome || "Turma"
                  ),
                  disciplinaNome:
                    turma.disciplinaNome ||
                    turma.disciplina?.nome ||
                    null,
                  professorNome:
                    turma.professorNome ||
                    turma.professor?.nome ||
                    null,
                  status: turma.status || null,
                }))
                : [],
            }
            : null,
        }))
        : [];

      setAlunos(lista);
      setTotalAlunos(Number(data?.meta?.total || 0));
      setTotalPaginas(Number(data?.meta?.totalPages || 1));
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      mostrarFeedback(
        "erro",
        t("loadingAndPhotoFeedback.studentsLoadException")
      );
      setAlunos([]);
      setTotalAlunos(0);
      setTotalPaginas(1);
    } finally {
      setCarregandoAlunos(false);
    }
  }

  async function carregarTurmas() {
    try {
      const res = await fetch("/api/admin/turmas", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Erro ao buscar turmas");
        return;
      }

      const data = await res.json();

      const listaTurmas: TurmaOption[] = (Array.isArray(data) ? data : []).map(
        (t: any) => ({
          id: Number(t.id),
          nome: String(t.nome ?? "Turma"),
          professorNome: t?.professor?.nome ?? null,
          disciplinaNome: t?.disciplina?.nome ?? null,
        })
      );

      setTurmas(listaTurmas.filter((t) => Number.isFinite(t.id) && t.id > 0));
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    }
  }

  async function carregarPolos() {
    try {
      const res = await fetch("/api/admin/polos", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error(
          "Erro ao buscar polos:",
          data?.error || res.statusText
        );

        setPolos([]);
        return;
      }

      const listaPolos = Array.isArray(data)
        ? data
        : Array.isArray(data?.polos)
          ? data.polos
          : [];

      const polosValidos: Polo[] = listaPolos
        .map((polo: any) => ({
          id: Number(polo?.id),
          nome: String(
            polo?.nome ?? "Polo"
          ),
          codigo:
            polo?.codigo ?? null,
        }))
        .filter(
          (polo) =>
            Number.isFinite(polo.id) &&
            polo.id > 0
        );

      setPolos(polosValidos);
    } catch (error) {
      console.error(
        "Erro ao carregar polos:",
        error
      );

      setPolos([]);
    }
  }

  function limparFormularioCriacao() {
    setNome("");
    setNomeSocial("");
    setGenero("");
    setEmail("");
    setCpf("");
    setRg("");
    setTelefone("");
    setPaisTelefone("BR");
    setDataNascimento("");
    setCep("");
    setEndereco("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setDocumentoUrl("");
    setFotoPerfil("");
    setNomeResponsavel("");
    setCpfResponsavel("");
    setTelefoneResponsavel("");
    setPaisTelefoneResponsavel(
      "BR"
    );
    setEmailResponsavel("");
    setParentescoResponsavel("");
    setStatusAluno("ATIVO");
    setPoloId("");
    setPossuiNecessidadeEspecial(false);
    setDescricaoNecessidadeEspecial("");
    setObservacoesAcessibilidade("");
    setNovoAlunoDocumentos([]);
  }

  function adicionarDocumentoNovoAluno(
    proprietario: "ALUNO" | "RESPONSAVEL",
    tipo: string,
    arquivo: File | null
  ) {
    if (!arquivo) return;

    setNovoAlunoDocumentos((prev) => [
      ...prev,
      {
        proprietario,
        tipo,
        arquivo,
      },
    ]);
  }

  async function enviarDocumentosDepoisCriacao(alunoId: number) {
    for (const doc of novoAlunoDocumentos) {
      const formData = new FormData();

      formData.append(
        "titulo",
        `${doc.tipo} - ${doc.proprietario === "ALUNO"
          ? t("documentPanel.ownerStudent")
          : t("documentPanel.ownerGuardian")
        }`
      );
      formData.append("tipo", doc.tipo);
      formData.append("proprietario", doc.proprietario);
      formData.append("arquivo", doc.arquivo);

      await fetch(`/api/admin/alunos/${alunoId}/documentos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
    }
  }

  function continuarComAlunoExistente() {
    if (
      !alunoExistenteConversao ||
      !leadParaConversao
    ) {
      return;
    }

    const params = new URLSearchParams();

    params.set(
      "alunoId",
      String(alunoExistenteConversao.id)
    );

    params.set(
      "leadId",
      String(leadParaConversao.id)
    );

    if (
      leadParaConversao.responsavelFuncionarioId
    ) {
      params.set(
        "vendedorResponsavelId",
        String(
          leadParaConversao.responsavelFuncionarioId
        )
      );
    }

    setAlunoExistenteConversao(null);

    router.push(
      `/admin/matriculas?${params.toString()}`
    );
  }

  async function executarCriacaoAluno(
    confirmacaoMenorCadastroAceita: boolean
  ) {
    if (
      telefone.trim() &&
      !telefoneValidoInternacional(
        telefone,
        paisTelefone
      )
    ) {
      abrirModalAviso(
        "erro",
        tTelefone("invalidTitle"),
        tTelefone("studentInvalid")
      );

      return;
    }

    if (
      telefoneResponsavel.trim() &&
      !telefoneValidoInternacional(
        telefoneResponsavel,
        paisTelefoneResponsavel
      )
    ) {
      abrirModalAviso(
        "erro",
        tTelefone("invalidTitle"),
        tTelefone(
          "guardianInvalid"
        )
      );

      return;
    }

    const telefoneE164 =
      telefone.trim()
        ? normalizarTelefoneE164(
          telefone,
          paisTelefone
        )
        : "";

    const telefoneResponsavelE164 =
      telefoneResponsavel.trim()
        ? normalizarTelefoneE164(
          telefoneResponsavel,
          paisTelefoneResponsavel
        )
        : "";
    try {
      setCriando(true);

      const nomeFinalCadastro =
        leadParaConversao
          ? leadParaConversao.nome.trim()
          : nome.trim();

      const res = await fetch("/api/aluno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: nomeFinalCadastro,
          email,
          nomeSocial,
          genero,
          cpf,
          rg,
          telefone: telefoneE164,
          dataNascimento: dataNascimento || null,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          documentoUrl,
          fotoPerfil: fotoPerfil || null,
          nomeResponsavel,
          cpfResponsavel,
          telefoneResponsavel:
            telefoneResponsavelE164,
          emailResponsavel,
          parentescoResponsavel,
          statusAluno,
          poloId: poloId ? Number(poloId) : null,
          possuiNecessidadeEspecial,
          descricaoNecessidadeEspecial,
          observacoesAcessibilidade,
          confirmacaoMenorCadastroAceita,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (
          data?.codigo ===
          "CONFIRMACAO_MENOR_CADASTRO_NECESSARIA"
        ) {
          setConfirmacaoMenorCadastro({
            idade: Number(data.idade || 0),

            responsavelIncompleto:
              data.responsavelIncompleto === true,

            camposPendentes: Array.isArray(
              data.camposResponsavelPendentes
            )
              ? data.camposResponsavelPendentes
              : [],
          });

          setCienteMenorCadastro(false);
          tocarSomAtencao();

          return;
        }

        if (
          data?.codigo === "ALUNO_EXISTENTE" &&
          Number(data?.aluno?.id) > 0
        ) {
          if (!leadParaConversao) {
            const mensagem =
              data?.error ||
              t("existingStudentModal.alreadyRegisteredFallback");

            mostrarFeedback(
              "erro",
              mensagem
            );

            abrirModalAviso(
              "erro",
              t("existingStudentModal.title"),
              mensagem
            );

            return;
          }

          setModalAvisoAberto(false);
          setFeedback("");
          setFeedbackTipo("");

          setAlunoExistenteConversao({
            id: Number(data.aluno.id),

            nome: String(
              data.aluno.nome ||
              t("existingStudentModal.title")
            ),

            statusAluno: String(
              data.aluno.statusAluno ||
              "ATIVO"
            ),

            campo: String(
              data.campo || ""
            ),
          });

          return;
        }

        const mensagem =
          data?.error ||
          data?.detalhe ||
          t("registrationFeedback.createError");

        mostrarFeedback(
          "erro",
          mensagem
        );

        abrirModalAviso(
          "erro",
          t("registrationFeedback.createUnavailableTitle"),
          mensagem
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      if (data?.id) {
        setAlunos((prev) => [
          data,
          ...prev.filter((aluno) => aluno.id !== data.id),
        ]);
      }

      if (data?.id && novoAlunoDocumentos.length > 0) {
        await enviarDocumentosDepoisCriacao(data.id);
      }

      const alunoCriadoId = Number(data?.id);

      setConfirmacaoMenorCadastro(null);
      setCienteMenorCadastro(false);

      if (
        leadParaConversao &&
        Number.isInteger(alunoCriadoId) &&
        alunoCriadoId > 0
      ) {
        const paramsMatricula =
          new URLSearchParams();

        paramsMatricula.set(
          "alunoId",
          String(alunoCriadoId)
        );

        paramsMatricula.set(
          "leadId",
          String(leadParaConversao.id)
        );

        if (
          leadParaConversao
            .responsavelFuncionarioId
        ) {
          paramsMatricula.set(
            "vendedorResponsavelId",
            String(
              leadParaConversao
                .responsavelFuncionarioId
            )
          );
        }

        router.push(
          `/admin/matriculas?${paramsMatricula.toString()}`
        );

        return;
      }

      limparFormularioCriacao();

      await carregarTudo();

      mostrarFeedback(
        "sucesso",
        t("registrationFeedback.createSuccess")
      );

      abrirModalAviso(
        "sucesso",
        t("registrationFeedback.createdTitle"),
        t("registrationFeedback.createdDescription")
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (error: any) {


      const mensagem =
        error?.message ||
        t("registrationFeedback.createError");

      mostrarFeedback("erro", mensagem);

      abrirModalAviso(
        "erro",
        t("registrationFeedback.createError"),
        mensagem
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setCriando(false);
    }
  }

  async function handleCriarAluno(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const idade =
      calcularIdadeFormulario(
        dataNascimento
      );

    if (idade === null) {
      abrirModalAviso(
        "erro",
        t("registrationFeedback.birthDateRequiredTitle"),
        t("registrationFeedback.birthDateRequiredDescription")
      );

      return;
    }

    if (
      idade < 0 ||
      idade > 120
    ) {
      abrirModalAviso(
        "erro",
        t("registrationFeedback.birthDateInvalidTitle"),
        t("registrationFeedback.birthDateInvalidDescription")
      );

      return;
    }

    if (idade >= 18) {
      await executarCriacaoAluno(
        false
      );

      return;
    }

    const camposPendentes =
      verificarResponsavelFormulario();

    setConfirmacaoMenorCadastro({
      idade,

      responsavelIncompleto:
        camposPendentes.length > 0,

      camposPendentes,
    });

    setCienteMenorCadastro(false);
    tocarSomAtencao();
  }

  function iniciarEdicao(aluno: AlunoComResumo) {
    setEditandoId(aluno.id);
    setEditNome(aluno.nome || "");
    setEditNomeSocial(aluno.nomeSocial || "");
    setEditGenero(aluno.genero || "");
    setEditEmail(aluno.user?.email || "");
    setEditCpf(aluno.cpf || "");
    setEditRg(aluno.rg || "");
    const telefoneAluno =
      prepararTelefoneParaFormulario(
        aluno.telefone,
        "BR"
      );

    setEditTelefone(
      telefoneAluno.valor
    );

    setEditPaisTelefone(
      telefoneAluno.pais
    );
    setEditDataNascimento(
      aluno.dataNascimento
        ? new Date(aluno.dataNascimento).toISOString().slice(0, 10)
        : ""
    );
    setEditCep(aluno.cep || "");
    setEditEndereco(aluno.endereco || "");
    setEditNumero(aluno.numero || "");
    setEditComplemento(aluno.complemento || "");
    setEditBairro(aluno.bairro || "");
    setEditCidade(aluno.cidade || "");
    setEditEstado(aluno.estado || "");
    setEditDocumentoUrl(aluno.documentoUrl || "");
    setEditFotoPerfil(aluno.fotoPerfil || "");
    setEditNomeResponsavel(aluno.nomeResponsavel || "");
    setEditCpfResponsavel(aluno.cpfResponsavel || "");
    const telefoneDoResponsavel =
      prepararTelefoneParaFormulario(
        aluno.telefoneResponsavel,
        "BR"
      );

    setEditTelefoneResponsavel(
      telefoneDoResponsavel.valor
    );

    setEditPaisTelefoneResponsavel(
      telefoneDoResponsavel.pais
    );
    setEditEmailResponsavel(aluno.emailResponsavel || "");
    setEditParentescoResponsavel(aluno.parentescoResponsavel || "");
    setEditStatusAluno(aluno.statusAluno || "ATIVO");
    setEditPoloId(
      aluno.poloId !== null && aluno.poloId !== undefined
        ? String(aluno.poloId)
        : ""
    );
    setEditPossuiNecessidadeEspecial(!!aluno.possuiNecessidadeEspecial);
    setEditDescricaoNecessidadeEspecial(
      aluno.descricaoNecessidadeEspecial || ""
    );
    setEditObservacoesAcessibilidade(
      aluno.observacoesAcessibilidade || ""
    );
  }

  async function salvarEdicao(id: number) {
    if (
      editTelefone.trim() &&
      !telefoneValidoInternacional(
        editTelefone,
        editPaisTelefone
      )
    ) {
      abrirModalAviso(
        "erro",
        tTelefone("invalidTitle"),
        tTelefone("studentInvalid")
      );

      return;
    }

    if (
      editTelefoneResponsavel.trim() &&
      !telefoneValidoInternacional(
        editTelefoneResponsavel,
        editPaisTelefoneResponsavel
      )
    ) {
      abrirModalAviso(
        "erro",
        tTelefone("invalidTitle"),
        tTelefone(
          "guardianInvalid"
        )
      );

      return;
    }

    const editTelefoneE164 =
      editTelefone.trim()
        ? normalizarTelefoneE164(
          editTelefone,
          editPaisTelefone
        )
        : "";

    const editTelefoneResponsavelE164 =
      editTelefoneResponsavel.trim()
        ? normalizarTelefoneE164(
          editTelefoneResponsavel,
          editPaisTelefoneResponsavel
        )
        : "";
    try {
      setSalvandoId(id);

      const res = await fetch(`/api/aluno/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: editNome,
          email: editEmail,
          nomeSocial: editNomeSocial,
          genero: editGenero,
          cpf: editCpf,
          rg: editRg,
          telefone:
            editTelefoneE164,
          dataNascimento: editDataNascimento || null,
          cep: editCep,
          endereco: editEndereco,
          numero: editNumero,
          complemento: editComplemento,
          bairro: editBairro,
          cidade: editCidade,
          estado: editEstado,
          documentoUrl: editDocumentoUrl,
          fotoPerfil: editFotoPerfil || null,
          nomeResponsavel: editNomeResponsavel,
          cpfResponsavel: editCpfResponsavel,
          telefoneResponsavel:
            editTelefoneResponsavelE164,
          emailResponsavel: editEmailResponsavel,
          parentescoResponsavel: editParentescoResponsavel,
          statusAluno: editStatusAluno,
          poloId: editPoloId ? Number(editPoloId) : null,
          possuiNecessidadeEspecial: editPossuiNecessidadeEspecial,
          descricaoNecessidadeEspecial: editDescricaoNecessidadeEspecial,
          observacoesAcessibilidade: editObservacoesAcessibilidade,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
          t("studentActionFeedback.updateError")
        );
      }

      const alunoAtualizado: AlunoComResumo = {
        ...(alunoSelecionado || ({} as AlunoComResumo)),
        ...data,
        id,
        nome: data?.nome ?? editNome,
        nomeSocial: data?.nomeSocial ?? editNomeSocial,
        genero: data?.genero ?? editGenero,
        cpf: data?.cpf ?? editCpf,
        rg: data?.rg ?? editRg,
        telefone:
          data?.telefone ??
          editTelefoneE164,
        dataNascimento: data?.dataNascimento ?? editDataNascimento,
        cep: data?.cep ?? editCep,
        endereco: data?.endereco ?? editEndereco,
        numero: data?.numero ?? editNumero,
        complemento: data?.complemento ?? editComplemento,
        bairro: data?.bairro ?? editBairro,
        cidade: data?.cidade ?? editCidade,
        estado: data?.estado ?? editEstado,
        documentoUrl: data?.documentoUrl ?? editDocumentoUrl,
        fotoPerfil: data?.fotoPerfil ?? editFotoPerfil,
        nomeResponsavel: data?.nomeResponsavel ?? editNomeResponsavel,
        cpfResponsavel: data?.cpfResponsavel ?? editCpfResponsavel,
        telefoneResponsavel:
          data?.telefoneResponsavel ??
          editTelefoneResponsavelE164,
        emailResponsavel: data?.emailResponsavel ?? editEmailResponsavel,
        parentescoResponsavel: data?.parentescoResponsavel ?? editParentescoResponsavel,
        statusAluno: data?.statusAluno ?? editStatusAluno,
        poloId: data?.poloId ?? (editPoloId ? Number(editPoloId) : null),
        possuiNecessidadeEspecial:
          data?.possuiNecessidadeEspecial ?? editPossuiNecessidadeEspecial,
        descricaoNecessidadeEspecial:
          data?.descricaoNecessidadeEspecial ?? editDescricaoNecessidadeEspecial,
        observacoesAcessibilidade:
          data?.observacoesAcessibilidade ?? editObservacoesAcessibilidade,
        user: {
          ...(alunoSelecionado?.user || { email: "" }),
          ...(data?.user || {}),
          email: data?.user?.email ?? editEmail,
        },
      };

      setAlunoSelecionado(alunoAtualizado);

      setAlunos((atuais) =>
        atuais.map((aluno) =>
          aluno.id === id
            ? {
              ...aluno,
              ...alunoAtualizado,
            }
            : aluno
        )
      );

      setPainelAlunoAberto(true);
      setAbaPainelAluno("DADOS");
      setEditandoId(null);

      await carregarTudo();

      mostrarFeedback(
        "sucesso",
        t("studentActionFeedback.updateSuccess")
      );

      abrirModalAviso(
        "sucesso",
        t("studentActionFeedback.updatedTitle"),
        t("studentActionFeedback.updatedDescription")
      );
    } catch (error: any) {
      const mensagem =
        error?.message ||
        t("studentActionFeedback.updateError");

      mostrarFeedback("erro", mensagem);

      abrirModalAviso(
        "erro",
        t("studentActionFeedback.updateError"),
        mensagem
      );
    } finally {
      setSalvandoId(null);
    }
  }

  async function cancelarAluno(id: number) {
    try {
      const res = await fetch(`/api/aluno/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          statusAluno: "CANCELADO",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const mensagem =
          data?.error ||
          t("studentActionFeedback.cancelError");

        mostrarFeedback("erro", mensagem);

        abrirModalAviso(
          "erro",
          t("studentActionFeedback.cancelUnavailableTitle"),
          mensagem
        );

        return;
      }

      await carregarTudo();

      mostrarFeedback(
        "sucesso",
        t("studentActionFeedback.cancelSuccess")
      );

      abrirModalAviso(
        "sucesso",
        t("studentActionFeedback.cancelledTitle"),
        t("studentActionFeedback.cancelledDescription")
      );
    } catch (error: any) {
      const mensagem =
        error?.message ||
        t("studentActionFeedback.cancelError");

      mostrarFeedback("erro", mensagem);

      abrirModalAviso(
        "erro",
        t("studentActionFeedback.cancelExceptionTitle"),
        mensagem
      );
    }
  }

  async function reativarAluno(id: number) {
    try {
      const res = await fetch(`/api/aluno/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          statusAluno: "ATIVO",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const mensagem =
          data?.error ||
          t("studentActionFeedback.reactivateError");

        mostrarFeedback("erro", mensagem);

        abrirModalAviso(
          "erro",
          t("studentActionFeedback.reactivateUnavailableTitle"),
          mensagem
        );

        return;
      }
      await carregarTudo();

      mostrarFeedback(
        "sucesso",
        t("studentActionFeedback.reactivateSuccess")
      );

      abrirModalAviso(
        "sucesso",
        t("studentActionFeedback.reactivatedTitle"),
        t("studentActionFeedback.reactivatedDescription")
      );
    } catch (error: any) {
      const mensagem =
        error?.message ||
        t("studentActionFeedback.reactivateError");

      mostrarFeedback("erro", mensagem);

      abrirModalAviso(
        "erro",
        t("studentActionFeedback.reactivateExceptionTitle"),
        mensagem
      );
    }
  }

  function labelStatusAluno(
    status?: StatusAluno
  ) {
    switch (status) {
      case "ATIVO":
        return t("statuses.active");

      case "TRANCADO":
        return t("statuses.locked");

      case "SUSPENSO":
        return t("statuses.suspended");

      case "INADIMPLENTE":
        return t("statuses.delinquent");

      case "TRANSFERIDO":
        return t("statuses.transferred");

      case "DESLIGADO":
        return t("statuses.inactive");

      case "FORMADO":
        return t("statuses.graduated");

      case "CANCELADO":
        return t("statuses.canceled");

      case "PAUSA_MEDICA":
        return t("statuses.medicalLeave");

      case "FALTANTE":
        return t("statuses.absent");

      default:
        return "-";
    }
  }
  function classeStatusAluno(status?: StatusAluno) {
    switch (status) {
      case "ATIVO":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELADO":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "TRANCADO":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "INADIMPLENTE":
        return "bg-red-50 text-red-700 border-red-200";
      case "SUSPENSO":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "FORMADO":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";

    try {
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return data;
    }
  }

  async function buscarEnderecoPorCep(valorCep: string) {
    const cepLimpo = valorCep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data?.erro) {
        mostrarFeedback(
          "erro",
          t("studentActionFeedback.addressLookupError")
        );
        return;
      }

      setEndereco(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setEstado(data.uf || "");
    } catch {
      mostrarFeedback(
        "erro",
        t("studentActionFeedback.addressLookupError")
      );
    }
  }

  async function buscarEnderecoEdicaoPorCep(valorCep: string) {
    const cepLimpo = valorCep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data?.erro) {
        mostrarFeedback(
          "erro",
          t("studentActionFeedback.addressLookupError")
        );
        return;
      }

      setEditEndereco(data.logradouro || "");
      setEditBairro(data.bairro || "");
      setEditCidade(data.localidade || "");
      setEditEstado(data.uf || "");
    } catch {
      mostrarFeedback(
        "erro",
        t("studentActionFeedback.addressLookupError")
      );
    }
  }

  const alunosComResumo = useMemo<AlunoComResumo[]>(() => {
    return alunos as AlunoComResumo[];
  }, [alunos]);

  const alunosFiltrados = useMemo(() => {
    const termoTexto = busca.trim().toLowerCase();
    const termoNumerico = busca.replace(/\D/g, "");

    return alunosComResumo.filter((aluno) => {
      const resumo = aluno.resumoMatricula;

      const nome = String(aluno.nome || "").toLowerCase().trim();
      const email = String(aluno.user?.email || "").toLowerCase().trim();
      const matriculaAluno = String(aluno.matricula || "").toLowerCase().trim();
      const cpfAluno = String(aluno.cpf || "").toLowerCase().trim();
      const telefoneAluno = String(aluno.telefone || "")
        .toLowerCase()
        .trim();
      const statusAlunoTexto = String(aluno.statusAluno || "")
        .toLowerCase()
        .trim();
      const cursoNome = String(resumo?.cursoNome || "").toLowerCase().trim();
      const turmasTexto = (resumo?.turmas || [])
        .map((t) =>
          [t.turmaNome, t.disciplinaNome || "", t.professorNome || ""].join(" ")
        )
        .join(" ")
        .toLowerCase();

      const matriculaNumerica = matriculaAluno.replace(/\D/g, "");
      const cpfNumerico = cpfAluno.replace(/\D/g, "");
      const telefoneNumerico = telefoneAluno.replace(/\D/g, "");

      const bateBusca =
        !termoTexto ||
        nome.includes(termoTexto) ||
        email.includes(termoTexto) ||
        matriculaAluno.includes(termoTexto) ||
        cpfAluno.includes(termoTexto) ||
        telefoneAluno.includes(termoTexto) ||
        statusAlunoTexto.includes(termoTexto) ||
        cursoNome.includes(termoTexto) ||
        turmasTexto.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (matriculaNumerica.includes(termoNumerico) ||
            cpfNumerico.includes(termoNumerico) ||
            telefoneNumerico.includes(termoNumerico)));

      const bateStatus =
        filtroStatus === "TODOS" || aluno.statusAluno === filtroStatus;

      const matriculado = !!resumo;

      const bateSituacaoAcademica =
        filtroSituacaoAcademica === "TODOS" ||
        (filtroSituacaoAcademica === "MATRICULADOS" && matriculado) ||
        (filtroSituacaoAcademica === "SEM_MATRICULA" && !matriculado) ||
        (matriculado && resumo?.status === filtroSituacaoAcademica);

      const bateTurma =
        filtroTurmaId === "TODAS" ||
        (resumo?.turmas || []).some(
          (t) => Number(t.turmaId) === Number(filtroTurmaId)
        );

      return (
        bateBusca && bateStatus && bateSituacaoAcademica && bateTurma
      );
    });
  }, [
    alunosComResumo,
    busca,
    filtroStatus,
    filtroSituacaoAcademica,
    filtroTurmaId,
  ]);

  const totais = useMemo(() => {
    const total = alunosComResumo.length;
    const matriculados = alunosComResumo.filter((a) => !!a.resumoMatricula).length;
    const cancelados = alunosComResumo.filter(
      (a) => a.statusAluno === "CANCELADO"
    ).length;
    const inadimplentes = alunosComResumo.filter(
      (a) => a.statusAluno === "INADIMPLENTE"
    ).length;
    const semMatricula = alunosComResumo.filter((a) => !a.resumoMatricula).length;

    return {
      total,
      matriculados,
      cancelados,
      inadimplentes,
      semMatricula,
    };
  }, [alunosComResumo]);

  async function carregarDocumentosArquivadosAluno(alunoId: number) {
    try {
      setCarregandoArquivadosAluno(true);

      const res = await fetch(
        `/api/admin/alunos/${alunoId}/documentos/arquivados`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("documentOperations.archivedLoadError"));
      }

      setDocumentosArquivadosAluno(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setDocumentosArquivadosAluno([]);
      mostrarFeedback(
        "erro",
        error?.message || t("documentOperations.archivedLoadError")
      );
    } finally {
      setCarregandoArquivadosAluno(false);
    }
  }

  async function carregarDocumentosAluno(alunoId: number) {
    try {
      setCarregandoDocumentosAluno(true);

      const res = await fetch(`/api/admin/alunos/${alunoId}/documentos`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("documentOperations.activeLoadError"));
      }

      setDocumentosAluno(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setDocumentosAluno([]);
      mostrarFeedback("erro", error?.message || t("documentOperations.activeLoadError"));
    } finally {
      setCarregandoDocumentosAluno(false);
    }
  }

  async function restaurarDocumentoAluno(documentoId: number) {
    if (!alunoSelecionado) return;

    try {
      const res = await fetch(
        `/api/admin/alunos/${alunoSelecionado.id}/documentos/arquivados`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            documentoId,
            motivo: "Documento restaurado pelo administrador.",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("documentOperations.restoreError"));
      }

      await carregarDocumentosAluno(alunoSelecionado.id);
      await carregarDocumentosArquivadosAluno(alunoSelecionado.id);

      abrirModalAviso(
        "sucesso",
        t("documentOperations.restoredTitle"),
        t("documentOperations.restoredDescription")
      );
    } catch (error: any) {
      abrirModalAviso(
        "erro",
        t("documentOperations.restoreErrorTitle"),
        error?.message ||
        t("documentOperations.restoreUnavailable")
      );
    }
  }

  async function arquivarDocumentoAluno(documentoId: number) {
    if (!alunoSelecionado) return;

    try {
      const res = await fetch(
        `/api/admin/alunos/${alunoSelecionado.id}/documentos`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            documentoId,
            motivo: "Arquivado pelo administrador.",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("documentOperations.archiveError"));
      }

      await carregarDocumentosAluno(alunoSelecionado.id);

      mostrarFeedback(
        "sucesso",
        t("documentOperations.archiveSuccess")
      );
      abrirModalAviso(
        "sucesso",
        t("documentOperations.archivedTitle"),
        t("documentOperations.archivedDescription")
      );
    } catch (error: any) {
      abrirModalAviso(
        "erro",
        t("documentOperations.archiveErrorTitle"),
        error?.message ||
        t("documentOperations.archiveUnavailable")
      );
    }
  }

  async function enviarDocumentoAluno() {
    if (!alunoSelecionado) return;

    if (!documentoArquivo) {
      abrirModalAviso(
        "erro",
        t("documentOperations.fileRequiredTitle"),
        t("documentOperations.fileRequiredDescription")
      );
      return;
    }

    try {
      setEnviandoDocumentoAluno(true);

      const formData = new FormData();
      formData.append(
        "titulo",
        `${documentoTipo} - ${documentoProprietario === "ALUNO"
          ? t("documentPanel.ownerStudent")
          : t("documentPanel.ownerGuardian")
        }`
      );
      formData.append("tipo", documentoTipo);
      formData.append("proprietario", documentoProprietario);
      formData.append("arquivo", documentoArquivo);

      const res = await fetch(
        `/api/admin/alunos/${alunoSelecionado.id}/documentos`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("documentOperations.uploadError")
        );
      }

      setDocumentoArquivo(null);
      await carregarDocumentosAluno(alunoSelecionado.id);

      mostrarFeedback(
        "sucesso",
        t("documentOperations.uploadSuccess")
      );
      abrirModalAviso(
        "sucesso",
        t("documentOperations.uploadedTitle"),
        t("documentOperations.uploadedDescription")
      );
    } catch (error: any) {
      abrirModalAviso(
        "erro",
        t("documentOperations.uploadErrorTitle"),
        error?.message ||
        t("documentOperations.uploadUnavailable")
      );
    } finally {
      setEnviandoDocumentoAluno(false);
    }
  }

  async function carregarDesempenhoAluno(
    alunoId: number,
    busca = "",
    page = 1
  ) {
    try {
      setCarregandoDesempenho(true);
      setDesempenhoAluno(null);

      const params = new URLSearchParams({
        busca,
        page: String(page),
        limit: "10",
      });

      const res = await fetch(
        `/api/admin/alunos/${alunoId}/desempenho?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ||
          t("documentOperations.performanceLoadError"));
      }

      setDesempenhoAluno(data);
    } catch (error: any) {
      setDesempenhoAluno(null);
      mostrarFeedback(
        "erro",
        error?.message ||
        t("documentOperations.performanceLoadError")
      );
    } finally {
      setCarregandoDesempenho(false);
    }
  }

  function abrirDetalhesAluno(aluno: AlunoComResumo) {
    setAlunoSelecionado(aluno);
    setPainelAlunoAberto(true);
    setAbaPainelAluno("DADOS");
    setAlunoDesempenhoId(aluno.id);

    carregarDocumentosAluno(aluno.id);
    carregarDocumentosArquivadosAluno(aluno.id);

    carregarDesempenhoAluno(
      aluno.id,
      buscaDisciplina,
      paginaDisciplina
    );
  }

  async function gerarCertificadoAlunoSelecionado() {
    if (!alunoSelecionado) return;

    try {
      setGerandoCertificado(true);

      const res = await fetch("/api/admin/certificados/gerar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          alunoId: alunoSelecionado.id,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.sucesso) {
        const mensagem =
          data?.detalhe ||
          data?.error ||
          t("certificatePanel.generateUnavailable");

        mostrarFeedback("erro", mensagem);
        abrirModalAviso("erro", t("certificatePanel.generateErrorTitle"), mensagem);
        return;
      }

      mostrarFeedback(
        "sucesso",
        t("certificatePanel.generatedSuccess")
      );
      abrirModalAviso(
        "sucesso",
        t("certificatePanel.generatedTitle"),
        t("certificatePanel.generatedDescription")
      );
    } catch (error: any) {
      console.error("Erro ao gerar certificado do aluno:", error);

      const mensagem =
        error?.message ||
        t("certificatePanel.generateException");

      mostrarFeedback("erro", mensagem);
      abrirModalAviso(
        "erro",
        t("certificatePanel.generateErrorTitle"),
        mensagem
      );
    } finally {
      setGerandoCertificado(false);
    }
  }

  async function baixarCertificadoAlunoSelecionado() {
    if (!alunoSelecionado) return;

    try {
      setBaixandoCertificado(true);

      const res = await fetch("/api/admin/certificados/gerar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          alunoId: alunoSelecionado.id,
          baixar: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const mensagem =
          data?.error ||
          data?.detalhe ||
          t("certificatePanel.downloadUnavailable");

        mostrarFeedback("erro", mensagem);
        abrirModalAviso("erro", t("certificatePanel.downloadErrorTitle"), mensagem);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `certificado-${alunoSelecionado.nome}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      mostrarFeedback(
        "sucesso",
        t("certificatePanel.downloadedSuccess")
      );
    } catch (error: any) {
      const mensagem =
        error?.message ||
        t("certificatePanel.downloadException");

      mostrarFeedback("erro", mensagem);
      abrirModalAviso(
        "erro",
        t("certificatePanel.downloadErrorTitle"),
        mensagem
      );
    } finally {
      setBaixandoCertificado(false);
    }
  }

  const turmaNomeSelecionada = useMemo(() => {
    if (filtroTurmaId === "TODAS") {
      return t("filters.allClasses");
    }

    const turma = turmas.find(
      (item) =>
        item.id === Number(filtroTurmaId)
    );

    return turma
      ? turma.nome
      : t("filters.classFallback");
  }, [filtroTurmaId, turmas, t]);
  return (
    <div className="phanyx-admin-alunos-page">
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">

        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              feedbackTipo === "sucesso"
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
            }`}
          >
            {feedback}
          </div>
        )}

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {t("registration.title")}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t("registration.description")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin/alunos")}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("actions.backToStudents")}
            </button>
          </div>
        </section>

<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <form
              id="formulario-novo-aluno"
              onSubmit={handleCriarAluno}
              autoComplete="off"
              className="space-y-4"
            >
              {leadParaConversao && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <strong className="block text-base">
                    {t("lead.title")}
                  </strong>

                  <p className="mt-1 leading-6">
                    {t("lead.description", {
                      name: leadParaConversao.nome,
                    })}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    <span>
                      Lead #{leadParaConversao.id}
                    </span>

                    {leadParaConversao.responsavelNome ? (
                      <span>
                        {t("lead.commercialOwner", {
                          name: leadParaConversao.responsavelNome,
                        })}
                      </span>
                    ) : null}

                    {leadParaConversao.interesse ? (
                      <span>
                        {t("lead.interest", {
                          interest: leadParaConversao.interesse,
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                    {fotoPerfil ? (
                      <img
                        src={fotoPerfil}
                        alt={nome || t("photo.alt")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-slate-400">
                        {nome?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {t("photo.title")}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {t("photo.description")}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                        {enviandoFotoPerfil
                          ? t("photo.uploading")
                          : t("photo.upload")}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          disabled={enviandoFotoPerfil}
                          onChange={(e) =>
                            enviarFotoOficialAluno(e.target.files?.[0] || null, "CRIACAO")
                          }
                          className="hidden"
                        />
                      </label>

                      {fotoPerfil && (
                        <button
                          type="button"
                          onClick={() => setFotoPerfil("")}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {t("photo.remove")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  placeholder={t("fields.name")}
                  name="nome-aluno-cadastro-phanyx"
                  autoComplete="off"
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  readOnly={Boolean(
                    leadParaConversao
                  )}
                  className={`w-full rounded-xl border p-2.5 ${leadParaConversao
                    ? "cursor-not-allowed bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-white"
                    : ""
                    }`}
                  required
                />

                <input
                  placeholder={t("fields.socialName")}
                  value={nomeSocial}
                  onChange={(e) => setNomeSocial(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                >
                  <option value="">
                    {t("fields.gender")}
                  </option>
                  <option value="FEMININO">
                    {t("fields.female")}
                  </option>
                  <option value="MASCULINO">
                    {t("fields.male")}
                  </option>
                  <option value="NAO_BINARIO">
                    {t("fields.nonBinary")}
                  </option>
                  <option value="OUTRO">
                    {t("fields.other")}
                  </option>
                  <option value="PREFIRO_NAO_INFORMAR">
                    {t("fields.preferNotSay")}
                  </option>
                </select>

                <input
                  placeholder={t("fields.email")}
                  type="email"
                  name="email-aluno-phanyx"
                  autoComplete="new-password"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                  required
                />

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  <strong>
                    {t("fields.enrollmentNumber")}
                  </strong>
                  <br />
                  {t("fields.enrollmentGenerated")}
                </div>

                <input
                  placeholder="CPF"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder="RG"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <CampoTelefoneInternacional
                  id="telefone-aluno"
                  name="telefone"
                  value={telefone}
                  pais={paisTelefone}
                  onChange={(
                    novoTelefone,
                    novoPais
                  ) => {
                    setTelefone(
                      novoTelefone
                    );

                    setPaisTelefone(
                      novoPais
                    );
                  }}
                />

                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <select
                  value={statusAluno}
                  onChange={(e) => setStatusAluno(e.target.value as StatusAluno)}
                  className="w-full rounded-xl border p-2.5"
                >
                  <option value="ATIVO">
                    {t("statuses.active")}
                  </option>
                  <option value="TRANCADO">
                    {t("statuses.locked")}
                  </option>
                  <option value="SUSPENSO">
                    {t("statuses.suspended")}
                  </option>
                  <option value="INADIMPLENTE">
                    {t("statuses.delinquent")}
                  </option>
                  <option value="TRANSFERIDO">
                    {t("statuses.transferred")}
                  </option>
                  <option value="DESLIGADO">
                    {t("statuses.inactive")}
                  </option>
                  <option value="FORMADO">
                    {t("statuses.graduated")}
                  </option>
                  <option value="CANCELADO">
                    {t("statuses.canceled")}
                  </option>
                  <option value="PAUSA_MEDICA">
                    {t("statuses.medicalLeave")}
                  </option>
                  <option value="FALTANTE">
                    {t("statuses.absent")}
                  </option>
                </select>

                <select
                  value={poloId}
                  onChange={(e) => setPoloId(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                >
                  <option value="">
                    {t("fields.selectCampus")}
                  </option>
                  {polos.map((polo) => (
                    <option key={polo.id} value={polo.id}>
                      {polo.nome}
                    </option>
                  ))}
                </select>

                <input
                  placeholder={t("fields.postalCode")}
                  value={cep}
                  onChange={(e) => {
                    const valor = e.target.value;

                    setCep(valor);

                    if (valor.replace(/\D/g, "").length === 8) {
                      void buscarEnderecoPorCep(valor);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;

                    e.preventDefault();
                    e.stopPropagation();

                    void buscarEnderecoPorCep(e.currentTarget.value);
                  }}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder={t("fields.address")}
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder={t("fields.number")}
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder={t("fields.complement")}
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder={t("fields.district")}
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder={t("fields.city")}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder={t("fields.state")}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {t("documents.studentTitle")}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t("documents.studentDescription")}
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {["RG", "CPF", "CNH", "HISTORICO_ESCOLAR", "COMPROVANTE_RESIDENCIA", "TITULO_ELEITOR"].map((tipo) => (
                      <label
                        key={`aluno-${tipo}`}
                        className="rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <span className="mb-2 block font-semibold">
                          {(
                            {
                              RG: t("documentPanel.typeRg"),
                              CPF: t("documentPanel.typeCpf"),
                              CNH: t("documentPanel.typeCnh"),
                              HISTORICO_ESCOLAR: t("documentPanel.typeSchoolRecord"),
                              COMPROVANTE_RESIDENCIA: t(
                                "documentPanel.typeResidenceProof"
                              ),
                              TITULO_ELEITOR: t(
                                "documentPanel.typeVoterRegistration"
                              ),
                            } as Record<string, string>
                          )[tipo] ?? tipo.replaceAll("_", " ")}
                        </span>

                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                          onChange={(e) =>
                            adicionarDocumentoNovoAluno(
                              "ALUNO",
                              tipo,
                              e.target.files?.[0] || null
                            )
                          }
                          className="w-full text-xs"
                        />
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="border-t pt-4">
                <h3 className="mb-3 font-semibold text-slate-900">
                  {t("accessibility.title")}
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={possuiNecessidadeEspecial}
                      onChange={(e) =>
                        setPossuiNecessidadeEspecial(e.target.checked)
                      }
                    />
                    {t("accessibility.hasSpecialNeed")}
                  </label>

                  <div className="grid grid-cols-1 gap-4">
                    <textarea
                      placeholder={t("accessibility.specialNeedPlaceholder")}
                      value={descricaoNecessidadeEspecial}
                      onChange={(e) =>
                        setDescricaoNecessidadeEspecial(e.target.value)
                      }
                      className="min-h-[100px] w-full rounded-xl border p-2.5"
                    />

                    <textarea
                      placeholder={t("accessibility.notesPlaceholder")}
                      value={observacoesAcessibilidade}
                      onChange={(e) =>
                        setObservacoesAcessibilidade(e.target.value)
                      }
                      className="min-h-[100px] w-full rounded-xl border p-2.5"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-3 font-semibold text-slate-900">
                  {t("guardian.title")}
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    placeholder={t("guardian.name")}
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5"
                  />

                  <input
                    placeholder={t("guardian.cpf")}
                    value={cpfResponsavel}
                    onChange={(e) => setCpfResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5"
                  />

                  <CampoTelefoneInternacional
                    id="telefone-responsavel"
                    name="telefoneResponsavel"
                    value={telefoneResponsavel}
                    pais={
                      paisTelefoneResponsavel
                    }
                    onChange={(
                      novoTelefone,
                      novoPais
                    ) => {
                      setTelefoneResponsavel(
                        novoTelefone
                      );

                      setPaisTelefoneResponsavel(
                        novoPais
                      );
                    }}
                  />

                  <input
                    placeholder={t("guardian.email")}
                    type="email"
                    value={emailResponsavel}
                    onChange={(e) => setEmailResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5"
                  />

                  <input
                    placeholder={t("guardian.relationship")}
                    value={parentescoResponsavel}
                    onChange={(e) => setParentescoResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5 md:col-span-2"
                  />

                  <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {t("guardian.documentsTitle")}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {t("guardian.documentsDescription")}
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {["RG", "CPF", "CNH", "COMPROVANTE_RESIDENCIA", "TITULO_ELEITOR"].map((tipo) => (
                        <label
                          key={`responsavel-${tipo}`}
                          className="rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          <span className="mb-2 block font-semibold">
                            {(
                              {
                                RG: t("documentPanel.typeRg"),
                                CPF: t("documentPanel.typeCpf"),
                                CNH: t("documentPanel.typeCnh"),
                                HISTORICO_ESCOLAR: t("documentPanel.typeSchoolRecord"),
                                COMPROVANTE_RESIDENCIA: t(
                                  "documentPanel.typeResidenceProof"
                                ),
                                TITULO_ELEITOR: t(
                                  "documentPanel.typeVoterRegistration"
                                ),
                              } as Record<string, string>
                            )[tipo] ?? tipo.replaceAll("_", " ")}
                          </span>

                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                            onChange={(e) =>
                              adicionarDocumentoNovoAluno(
                                "RESPONSAVEL",
                                tipo,
                                e.target.files?.[0] || null
                              )
                            }
                            className="w-full text-xs"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <button
                type="submit"
                disabled={
                  criando ||
                  carregandoLeadParaConversao
                }
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {carregandoLeadParaConversao
                  ? t("registration.loadingLead")
                  : criando
                    ? t("registration.creating")
                    : leadParaConversao
                      ? t("registration.createAndContinue")
                      : t("registration.create")}
              </button>
            </form>
          </section>

{confirmacaoMenorCadastro && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-amber-300 bg-white shadow-2xl dark:border-amber-700 dark:bg-slate-900">
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-5 dark:border-amber-800 dark:bg-amber-950/40">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-amber-200 text-2xl dark:bg-amber-900">
                  {"\u26A0\uFE0F"}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                    {t("minorConfirmation.attention")}
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                    {confirmacaoMenorCadastro
                      .responsavelIncompleto
                      ? t("minorConfirmation.incompleteGuardianTitle")
                      : t("minorConfirmation.minorTitle")}
                  </h2>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5 text-slate-700 dark:text-slate-200">
              <p className="text-sm leading-6">
                {t("minorConfirmation.ageDescription", {
                  age: confirmacaoMenorCadastro.idade,
                })}
              </p>

              {confirmacaoMenorCadastro
                .responsavelIncompleto ? (
                <>
                  <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                    <strong className="block">
                      {t("minorConfirmation.incompleteWarningTitle")}
                    </strong>

                    <p className="mt-2">
                      {t("minorConfirmation.incompleteWarningDescription")}
                    </p>
                  </div>

                  <ul className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
                    {confirmacaoMenorCadastro
                      .camposPendentes.map(
                        (campo) => (
                          <li
                            key={campo}
                            className="flex items-center gap-2"
                          >
                            <span className="font-black text-red-600">
                              {"\u2022"}
                            </span>

                            {campo}
                          </li>
                        )
                      )}
                  </ul>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {t("minorConfirmation.confirmationQuestion")}
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                <input
                  type="checkbox"
                  checked={
                    cienteMenorCadastro
                  }
                  onChange={(e) =>
                    setCienteMenorCadastro(
                      e.target.checked
                    )
                  }
                  className="mt-1 h-5 w-5 accent-blue-600"
                />

                <span className="text-sm font-semibold leading-6">
                  {t("minorConfirmation.acknowledgement")}
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={criando}
                onClick={() => {
                  setConfirmacaoMenorCadastro(
                    null
                  );

                  setCienteMenorCadastro(
                    false
                  );
                }}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {confirmacaoMenorCadastro
                  .responsavelIncompleto
                  ? t("minorConfirmation.backAndComplete")
                  : t("minorConfirmation.back")}
              </button>

              <button
                type="button"
                disabled={
                  !cienteMenorCadastro ||
                  criando
                }
                onClick={() =>
                  void executarCriacaoAluno(
                    true
                  )
                }
                className={`rounded-2xl border px-5 py-3 text-sm font-bold transition ${!cienteMenorCadastro || criando
                  ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500 opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  : "cursor-pointer border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                {criando
                  ? t("minorConfirmation.creating")
                  : confirmacaoMenorCadastro
                    .responsavelIncompleto
                    ? t("minorConfirmation.createAnyway")
                    : t("minorConfirmation.confirmRegistration")}
              </button>
            </div>
          </div>
        </div>
      )}

      {alunoExistenteConversao && (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-aluno-existente"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl dark:bg-amber-950/50">
                  {"\uD83D\uDC64"}
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    id="titulo-aluno-existente"
                    className="text-xl font-black text-slate-950 dark:text-white"
                  >
                    {t("existingStudentModal.title")}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t("existingStudentModal.description", {
                      name: alunoExistenteConversao.nome,
                    })}
                  </p>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-slate-700 dark:text-slate-200">
                      {t("existingStudentModal.locatedBy", {
                        field:
                          alunoExistenteConversao.campo === "CPF"
                            ? t("existingStudentModal.cpf")
                            : t("existingStudentModal.email"),
                      })}
                    </p>

                    <p className="mt-1 text-slate-700 dark:text-slate-200">
                      {t("existingStudentModal.currentStatus", {
                        status: alunoExistenteConversao.statusAluno,
                      })}
                    </p>
                  </div>

                  {alunoExistenteConversao.statusAluno ===
                    "ATIVO" ? (
                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {t("existingStudentModal.activeDescription")}
                    </p>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 text-sm font-semibold leading-6 text-slate-900 shadow-sm dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                      {t("existingStudentModal.inactiveDescription")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setAlunoExistenteConversao(null)
                }
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                {alunoExistenteConversao.statusAluno ===
                  "ATIVO"
                  ? t("existingStudentModal.backToRegistration")
                  : t("existingStudentModal.understood")}
              </button>

              {alunoExistenteConversao.statusAluno ===
                "ATIVO" && (
                  <button
                    type="button"
                    onClick={continuarComAlunoExistente}
                    className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    {t("existingStudentModal.useAndContinue")}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {modalAvisoAberto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${modalAvisoTipo === "sucesso"
                  ? "bg-emerald-100"
                  : "bg-red-100"
                  }`}
              >
                {modalAvisoTipo === "sucesso" ? "\u2705" : "\u26A0\uFE0F"}
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {modalAvisoTitulo}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {modalAvisoMensagem}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalAvisoAberto(false);

                  if (
                    modalAvisoTipo === "sucesso"
                  ) {
                    router.push(
                      "/admin/alunos"
                    );
                  }
                }}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${modalAvisoTipo === "sucesso"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {t("registrationFeedback.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default withAuth(AdminAlunosPage, ["admin"]);
