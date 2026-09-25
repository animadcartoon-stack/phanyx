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

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  const [
    exportandoAlunos,
    setExportandoAlunos,
  ] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [estatisticas, setEstatisticas] =
    useState({
      total: 0,
      matriculados: 0,
      semMatricula: 0,
      aguardando: 0,
      cancelados: 0,
      inadimplentes: 0,
    });
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
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [enviandoFotoPerfil, setEnviandoFotoPerfil] = useState(false);

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
    if (!leadIdConversao) return;

    router.replace(
      `/admin/alunos/novo?leadId=${leadIdConversao}`
    );
  }, [leadIdConversao, router]);


  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    carregarAlunos();
  }, [
    paginaAtual,
    filtroStatus,
    busca,
    filtroSituacaoAcademica,
    filtroTurmaId,
  ]);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

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
      // O aviso visual continuará funcionando
      // caso o navegador bloqueie o áudio.
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

  async function exportarAlunos() {
    try {
      setExportandoAlunos(true);

      const params =
        new URLSearchParams();

      if (busca.trim()) {
        params.set(
          "busca",
          busca.trim()
        );
      }

      if (filtroStatus !== "TODOS") {
        params.set(
          "status",
          filtroStatus
        );
      }

      params.set(
        "situacaoMatricula",
        filtroSituacaoAcademica
      );

      if (filtroTurmaId !== "TODAS") {
        params.set(
          "turmaId",
          filtroTurmaId
        );
      }

      const localeAtual =
        typeof document !== "undefined" &&
        document.documentElement.lang
          ? document.documentElement.lang
          : "pt-BR";

      params.set(
        "locale",
        localeAtual
      );

      const resposta =
        await fetch(
          `/api/admin/alunos/exportar?${params.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

      if (!resposta.ok) {
        const erro =
          await resposta
            .json()
            .catch(() => null);

        throw new Error(
          erro?.error ||
          t(
            "actions.exportStudentsError"
          )
        );
      }

      const blob =
        await resposta.blob();

      const disposition =
        resposta.headers.get(
          "content-disposition"
        ) || "";

      const match =
        disposition.match(
          /filename="?([^"]+)"?/i
        );

      const filename =
        match?.[1] ||
        "alunos.xlsx";

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      window.setTimeout(
        () => {
          URL.revokeObjectURL(url);
        },
        1000
      );

      mostrarFeedback(
        "sucesso",
        t(
          "actions.exportStudentsSuccess"
        )
      );
    } catch (error) {
      console.error(
        "Erro ao exportar alunos:",
        error
      );

      mostrarFeedback(
        "erro",
        error instanceof Error
          ? error.message
          : t(
              "actions.exportStudentsError"
            )
      );
    } finally {
      setExportandoAlunos(false);
    }
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

      if (filtroTurmaId !== "TODAS") {
        params.set(
          "turmaId",
          filtroTurmaId
        );
      }

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

      const estatisticasApi =
        data?.meta?.estatisticas || {};

      setEstatisticas({
        total: Number(
          estatisticasApi.total || 0
        ),
        matriculados: Number(
          estatisticasApi.matriculados || 0
        ),
        semMatricula: Number(
          estatisticasApi.semMatricula || 0
        ),
        aguardando: Number(
          estatisticasApi.aguardando || 0
        ),
        cancelados: Number(
          estatisticasApi.cancelados || 0
        ),
        inadimplentes: Number(
          estatisticasApi.inadimplentes || 0
        ),
      });
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

  const totais = estatisticas;

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
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${feedbackTipo === "sucesso"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            {feedback}
          </div>
        )}

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                {t("eyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {t("description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
  type="button"
  onClick={() =>
    router.push("/admin/alunos/novo")
  }
  className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:bg-blue-950/60"
>
  {t("actions.newStudent")}
</button>

              <button
                type="button"
                onClick={exportarAlunos}
                disabled={exportandoAlunos}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60"
              >
                {exportandoAlunos
                  ? t(
                      "actions.exportingStudents"
                    )
                  : t(
                      "actions.exportStudents"
                    )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setFiltroStatus("TODOS");
                  setFiltroSituacaoAcademica("TODOS");
                  setFiltroTurmaId("TODAS");
                  setPaginaAtual(1);
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("actions.clearFilters")}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {t("stats.total")}
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {totais.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {t("stats.enrolled")}
            </p>
            <p className="mt-3 text-3xl font-bold text-blue-700">
              {totais.matriculados}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {t("stats.withoutEnrollment")}
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-700">
              {totais.semMatricula}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t("stats.awaiting")}
            </p>
            <p className="mt-3 text-3xl font-bold text-amber-600 dark:text-amber-300">
              {totais.aguardando}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {t("stats.canceled")}
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-600">
              {totais.cancelados}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {t("stats.delinquent")}
            </p>
            <p className="mt-3 text-3xl font-bold text-red-600">
              {totais.inadimplentes}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {t("filters.title")}
              </h2>

              <p className="text-sm text-slate-500">
                {t("filters.description")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <input
                type="text"
                placeholder={t("filters.searchPlaceholder")}
                autoComplete="off"
                name="busca-alunos-phanyx"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                className="rounded-xl border px-3 py-2.5"
              />


              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value);
                  setPaginaAtual(1);
                }}
                aria-label={t("filters.studentStatus")}
                title={t("filters.studentStatus")}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="TODOS">
                  {t("filters.allStudentStatuses")}
                </option>

                <option value="ATIVO">
                  {t("filters.active")}
                </option>

                <option value="TRANCADO">
                  {t("filters.studentOnHold")}
                </option>

                <option value="SUSPENSO">
                  {t("filters.studentSuspended")}
                </option>

                <option value="INADIMPLENTE">
                  {t("filters.delinquent")}
                </option>

                <option value="TRANSFERIDO">
                  {t("filters.transferredStudent")}
                </option>

                <option value="DESLIGADO">
                  {t("filters.disconnectedStudent")}
                </option>

                <option value="FORMADO">
                  {t("filters.graduated")}
                </option>

                <option value="CANCELADO">
                  {t("filters.canceled")}
                </option>

                <option value="PAUSA_MEDICA">
                  {t("filters.medicalLeave")}
                </option>

                <option value="FALTANTE">
                  {t("filters.missingStudent")}
                </option>
              </select>

              <select
                value={filtroSituacaoAcademica}
                onChange={(e) => {
                  setFiltroSituacaoAcademica(
                    e.target.value as SituacaoAcademicaFiltro
                  );
                  setPaginaAtual(1);
                }}
                aria-label={t("filters.enrollmentStatus")}
                title={t("filters.enrollmentStatus")}
                className="min-w-[260px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="TODOS">
                  {t("filters.allEnrollmentStatuses")}
                </option>

                <optgroup label={t("filters.groupGeneral")}>
                  <option value="MATRICULADOS">
                    {t("filters.enrolled")}
                  </option>
                  <option value="SEM_MATRICULA">
                    {t("filters.withoutEnrollment")}
                  </option>
                </optgroup>

                <optgroup label={t("filters.groupPreStart")}>
                  <option value="AGUARDANDO">
                    {t("filters.awaitingClass")}
                  </option>
                  <option value="A_INICIAR">
                    {t("filters.toStart")}
                  </option>
                </optgroup>

                <optgroup label={t("filters.groupInProgress")}>
                  <option value="ATIVA">
                    {t("filters.activeEnrollment")}
                  </option>
                  <option value="TRANCADA">
                    {t("filters.enrollmentOnHold")}
                  </option>
                  <option value="SUSPENSA">
                    {t("filters.suspendedEnrollment")}
                  </option>
                  <option value="INTERCAMBIO">
                    {t("filters.exchange")}
                  </option>
                </optgroup>

                <optgroup label={t("filters.groupClosed")}>
                  <option value="TRANSFERIDA">
                    {t("filters.transferredEnrollment")}
                  </option>
                  <option value="CONCLUIDA">
                    {t("filters.completedEnrollment")}
                  </option>
                  <option value="CANCELADA">
                    {t("filters.canceledEnrollment")}
                  </option>
                </optgroup>
              </select>

              <select
                value={filtroTurmaId}
                onChange={(e) => {
                  setFiltroTurmaId(e.target.value);
                  setPaginaAtual(1);
                }}
                className="rounded-xl border px-3 py-2.5"
              >
                <option value="TODAS">
                  {t("filters.allClasses")}
                </option>

                {turmas.map((turma) => (
                  <option
                    key={turma.id}
                    value={String(turma.id)}
                  >
                    {turma.nome}
                    {turma.disciplinaNome
                      ? ` • ${turma.disciplinaNome}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {t("filters.resultSummary", {
                displayed: alunosFiltrados.length,
                total: totalAlunos,
                currentFilter: turmaNomeSelecionada,
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">
                    {t("table.student")}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {t("table.status")}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {t("table.course")}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {t("table.classes")}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {t("table.enrollment")}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      {t("table.empty")}
                    </td>
                  </tr>
                ) : (
                  alunosFiltrados.map((a) => {
                    const resumo = a.resumoMatricula;

                    return (
                      <tr
                        key={a.id}
                        className={`border-t ${a.statusAluno === "CANCELADO"
                          ? "bg-slate-50/70"
                          : "bg-white"
                          }`}
                      >
                        <td className="px-4 py-4 align-top">
                          <button
                            type="button"
                            onClick={() => abrirDetalhesAluno(a)}
                            className="text-left"
                          >
                            <div className="font-semibold text-blue-700 hover:underline">
                              {a.nome}
                            </div>
                          </button>
                          <div className="mt-1 text-slate-500">
                            {a.user?.email || "-"}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            CPF: {a.cpf || "-"}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classeStatusAluno(
                              a.statusAluno
                            )}`}
                          >
                            {labelStatusAluno(a.statusAluno)}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top text-slate-700">
                          {resumo?.cursoNome || t("table.withoutEnrollment")}
                        </td>

                        <td className="px-4 py-4 align-top text-slate-700">
                          {resumo?.turmas?.length ? (
                            <div className="space-y-1">
                              {resumo.turmas.slice(0, 2).map((turma) => (
                                <div key={`${a.id}-${turma.turmaId}`}>
                                  <div className="font-medium">
                                    {turma.turmaNome}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {turma.disciplinaNome || "-"}
                                  </div>
                                </div>
                              ))}
                              {resumo.turmas.length > 2 && (
                                <div className="text-xs text-slate-500">
                                  {t("table.moreClasses", {
                                    count: resumo.turmas.length - 2,
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            "\u2014"
                          )}
                        </td>

                                                <td className="px-4 py-4 align-top text-slate-700 dark:text-slate-200">
                          {resumo ? (
                            <>
                              <div className="font-medium">
                                {resumo.numeroMatricula ||
                                  a.matricula ||
                                  "\u2014"}
                              </div>

                              <div className="mt-2">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatusMatricula(
                                    resumo.status
                                  )}`}
                                >
                                  {labelStatusMatricula(
                                    resumo.status
                                  )}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-slate-400 dark:text-slate-500">
                                {"\u2014"}
                              </div>

                              <div className="mt-2">
                                <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                  {t("table.withoutEnrollment")}
                                </span>
                              </div>
                            </>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => abrirDetalhesAluno(a)}
                              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              {t("table.view")}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `/api/admin/contratos/pdf?alunoId=${a.id}`,
                                  "_blank"
                                )
                              }
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                            >
                              {t("table.contract")}
                            </button>

                            {a.statusAluno === "CANCELADO" ? (
                              <button
                                type="button"
                                onClick={() => reativarAluno(a.id)}
                                className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                              >
                                {t("table.reactivate")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => cancelarAluno(a.id)}
                                className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
                              >
                                {t("table.cancel")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            {t("pagination.summary", {
              current: paginaAtual,
              pages: totalPaginas,
              total: totalAlunos,
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={paginaAtual <= 1 || carregandoAlunos}
              onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("pagination.previous")}
            </button>

            <button
              type="button"
              disabled={paginaAtual >= totalPaginas || carregandoAlunos}
              onClick={() =>
                setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
              }
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("pagination.next")}
            </button>
          </div>
        </section>

      </div>

      {painelAlunoAberto && alunoSelecionado && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/45">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                    {t("drawer.title")}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {alunoSelecionado.nome}
                  </h2>
                  <div className="mt-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classeStatusAluno(
                        alunoSelecionado.statusAluno
                      )}`}
                    >
                      {labelStatusAluno(alunoSelecionado.statusAluno)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPainelAlunoAberto(false);
                    setAlunoSelecionado(null);
                    setEditandoId(null);
                  }}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("drawer.close")}
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">

              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                {[
                  {
                    id: "DADOS",
                    label: t("drawer.tabs.data"),
                  },
                  {
                    id: "DOCUMENTOS",
                    label: t("drawer.tabs.documents"),
                  },
                  {
                    id: "MATRICULAS",
                    label: t("drawer.tabs.enrollments"),
                  },
                  {
                    id: "DESEMPENHO",
                    label: t("drawer.tabs.performance"),
                  },
                  {
                    id: "HISTORICO",
                    label: t("drawer.tabs.history"),
                  },
                  {
                    id: "CERTIFICADOS",
                    label: t("drawer.tabs.certificates"),
                  },
                ].map((aba) => (
                  <button
                    key={aba.id}
                    type="button"
                    onClick={() => setAbaPainelAluno(aba.id as any)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${abaPainelAluno === aba.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                  >
                    {aba.label}
                  </button>
                ))}
              </div>

              {abaPainelAluno === "DADOS" && (
                <>
                  {editandoId === alunoSelecionado.id ? (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 text-lg font-semibold text-slate-900">
                        {t("drawer.editTitle")}
                      </h3>

                      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                            {editFotoPerfil ? (
                              <img
                                src={editFotoPerfil}
                                alt={editNome || t("photo.alt")}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-3xl font-black text-slate-400">
                                {editNome?.charAt(0)?.toUpperCase() || "A"}
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                              {t("photo.title")}
                            </h4>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {t("drawer.institutionalPhoto")}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">
                              {t("photo.formats")} {t("photo.maxSize")}
                              {t("photo.recommendation")}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <label className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                                {editEnviandoFotoPerfil
                                  ? t("photo.uploading")
                                  : t("drawer.changePhoto")}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  disabled={editEnviandoFotoPerfil}
                                  onChange={(e) =>
                                    enviarFotoOficialAluno(e.target.files?.[0] || null, "EDICAO")
                                  }
                                  className="hidden"
                                />
                              </label>

                              {editFotoPerfil && (
                                <button
                                  type="button"
                                  onClick={() => setEditFotoPerfil("")}
                                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                >
                                  {t("photo.remove")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("drawer.labels.name")}
                        />
                        <input
                          value={editNomeSocial}
                          onChange={(e) => setEditNomeSocial(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.socialName")}
                        />
                        <select
                          value={editGenero}
                          onChange={(e) => setEditGenero(e.target.value)}
                          className="rounded-xl border p-2.5"
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
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.email")}
                          type="email"
                          name="edit-email-aluno-phanyx"
                          autoComplete="off"
                        />
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                          {t("drawer.automaticEnrollment")}
                        </div>
                        <input
                          value={editCpf}
                          onChange={(e) => setEditCpf(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder="CPF"
                        />
                        <input
                          value={editRg}
                          onChange={(e) => setEditRg(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder="RG"
                        />
                        <CampoTelefoneInternacional
                          id="edit-telefone-aluno"
                          name="editTelefone"
                          value={editTelefone}
                          pais={editPaisTelefone}
                          onChange={(
                            novoTelefone,
                            novoPais
                          ) => {
                            setEditTelefone(
                              novoTelefone
                            );

                            setEditPaisTelefone(
                              novoPais
                            );
                          }}
                        />
                        <input
                          type="date"
                          value={editDataNascimento}
                          onChange={(e) => setEditDataNascimento(e.target.value)}
                          className="rounded-xl border p-2.5"
                        />
                        <select
                          value={editStatusAluno}
                          onChange={(e) =>
                            setEditStatusAluno(e.target.value as StatusAluno)
                          }
                          className="rounded-xl border p-2.5"
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
                          value={editPoloId}
                          onChange={(e) => setEditPoloId(e.target.value)}
                          className="rounded-xl border p-2.5"
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
                          value={editCep}
                          onChange={(e) => {
                            const valor = e.target.value;

                            setEditCep(valor);

                            if (valor.replace(/\D/g, "").length === 8) {
                              void buscarEnderecoEdicaoPorCep(valor);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;

                            e.preventDefault();
                            e.stopPropagation();

                            void buscarEnderecoEdicaoPorCep(e.currentTarget.value);
                          }}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.postalCode")}
                        />
                        <input
                          value={editEndereco}
                          onChange={(e) => setEditEndereco(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.address")}
                        />
                        <input
                          value={editNumero}
                          onChange={(e) => setEditNumero(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.number")}
                        />
                        <input
                          value={editComplemento}
                          onChange={(e) => setEditComplemento(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.complement")}
                        />
                        <input
                          value={editBairro}
                          onChange={(e) => setEditBairro(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.district")}
                        />
                        <input
                          value={editCidade}
                          onChange={(e) => setEditCidade(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.city")}
                        />
                        <input
                          value={editEstado}
                          onChange={(e) => setEditEstado(e.target.value)}
                          className="rounded-xl border p-2.5"
                          placeholder={t("fields.state")}
                        />
                        <input
                          value={editDocumentoUrl}
                          onChange={(e) => setEditDocumentoUrl(e.target.value)}
                          className="rounded-xl border p-2.5 md:col-span-2"
                          placeholder={t("drawer.documentUrl")}
                        />
                      </div>

                      <div className="mt-5 border-t pt-4">
                        <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">
                          {t("accessibility.title")}
                        </h4>

                        <div className="space-y-4">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={editPossuiNecessidadeEspecial}
                              onChange={(e) =>
                                setEditPossuiNecessidadeEspecial(e.target.checked)
                              }
                            />
                            {t("accessibility.hasSpecialNeed")}
                          </label>

                          <textarea
                            value={editDescricaoNecessidadeEspecial}
                            onChange={(e) =>
                              setEditDescricaoNecessidadeEspecial(e.target.value)
                            }
                            className="min-h-[100px] w-full rounded-xl border p-2.5"
                            placeholder={t("accessibility.specialNeedPlaceholder")}
                          />

                          <textarea
                            value={editObservacoesAcessibilidade}
                            onChange={(e) =>
                              setEditObservacoesAcessibilidade(e.target.value)
                            }
                            className="min-h-[100px] w-full rounded-xl border p-2.5"
                            placeholder={t("accessibility.notesPlaceholder")}
                          />
                        </div>
                      </div>

                      <div className="mt-5 border-t pt-4">
                        <h4 className="mb-3 font-semibold text-slate-900">
                          {t("drawer.guardianTitle")}
                        </h4>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <input
                            value={editNomeResponsavel}
                            onChange={(e) => setEditNomeResponsavel(e.target.value)}
                            className="rounded-xl border p-2.5"
                            placeholder={t("guardian.name")}
                          />
                          <input
                            value={editCpfResponsavel}
                            onChange={(e) => setEditCpfResponsavel(e.target.value)}
                            className="rounded-xl border p-2.5"
                            placeholder={t("guardian.cpf")}
                          />
                          <CampoTelefoneInternacional
                            id="edit-telefone-responsavel"
                            name="editTelefoneResponsavel"
                            value={
                              editTelefoneResponsavel
                            }
                            pais={
                              editPaisTelefoneResponsavel
                            }
                            onChange={(
                              novoTelefone,
                              novoPais
                            ) => {
                              setEditTelefoneResponsavel(
                                novoTelefone
                              );

                              setEditPaisTelefoneResponsavel(
                                novoPais
                              );
                            }}
                          />
                          <input
                            value={editEmailResponsavel}
                            onChange={(e) =>
                              setEditEmailResponsavel(e.target.value)
                            }
                            className="rounded-xl border p-2.5"
                            placeholder={t("guardian.email")}
                          />
                          <input
                            value={editParentescoResponsavel}
                            onChange={(e) =>
                              setEditParentescoResponsavel(e.target.value)
                            }
                            className="rounded-xl border p-2.5 md:col-span-2"
                            placeholder={t("guardian.relationship")}
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={() => salvarEdicao(alunoSelecionado.id)}
                          disabled={salvandoId === alunoSelecionado.id}
                          className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                        >
                          {salvandoId === alunoSelecionado.id
                            ? t("drawer.saving")
                            : t("drawer.saveChanges")}
                        </button>

                        <button
                          onClick={() => setEditandoId(null)}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {t("drawer.cancelEditing")}
                        </button>
                      </div>
                    </section>
                  ) : (
                    <>
                      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap gap-3">

                          <button
                            onClick={() =>
                              window.open(
                                `/api/admin/contratos/pdf?alunoId=${alunoSelecionado.id}`,
                                "_blank"
                              )
                            }
                            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            {t("drawer.downloadContract")}
                          </button>

                          {alunoSelecionado.statusAluno === "CANCELADO" ? (
                            <button
                              onClick={() => reativarAluno(alunoSelecionado.id)}
                              className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                              {t("drawer.reactivateStudent")}
                            </button>

                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!alunoSelecionado) return;
                                  iniciarEdicao(alunoSelecionado);
                                  setAbaPainelAluno("DADOS");
                                  setPainelAlunoAberto(true);
                                }}
                                className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
                              >
                                {t("drawer.editRegistration")}
                              </button>
                              <button
                                onClick={() => cancelarAluno(alunoSelecionado.id)}
                                className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                              >
                                {t("drawer.cancelStudent")}
                              </button>
                            </>
                          )}
                        </div>
                      </section>

                      <section className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {t("drawer.mainData")}
                          </h3>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p>
                              <strong>{t("drawer.labels.name")}:</strong> {alunoSelecionado.nome || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.socialName")}:</strong>{" "}
                              {alunoSelecionado.nomeSocial || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.email")}:</strong>{" "}
                              {alunoSelecionado.user?.email || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.gender")}:</strong>{" "}
                              {alunoSelecionado.genero || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.birthDate")}:</strong>{" "}
                              {formatarData(alunoSelecionado.dataNascimento)}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.enrollment")}:</strong>{" "}
                              {alunoSelecionado.matricula || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.cpf")}:</strong> {alunoSelecionado.cpf || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.rg")}:</strong> {alunoSelecionado.rg || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.phone")}:</strong>{" "}
                              {alunoSelecionado.telefone || "-"}
                            </p>

                            <p>
                              <strong>{t("drawer.labels.campus")}:</strong>{" "}
                              {alunoSelecionado.polo?.nome || "-"}
                            </p>

                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {t("drawer.addressTitle")}
                          </h3>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p>
                              <strong>
                                {t("drawer.labels.postalCode")}:
                              </strong>{" "}
                              {alunoSelecionado.cep || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.address")}:</strong>{" "}
                              {alunoSelecionado.endereco || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.number")}:</strong>{" "}
                              {alunoSelecionado.numero || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.complement")}:</strong>{" "}
                              {alunoSelecionado.complemento || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.district")}:</strong>{" "}
                              {alunoSelecionado.bairro || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.city")}:</strong>{" "}
                              {alunoSelecionado.cidade || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.state")}:</strong>{" "}
                              {alunoSelecionado.estado || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {t("drawer.guardianTitle")}
                          </h3>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p>
                              <strong>{t("drawer.labels.name")}:</strong>{" "}
                              {alunoSelecionado.nomeResponsavel || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.cpf")}:</strong>{" "}
                              {alunoSelecionado.cpfResponsavel || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.phone")}:</strong>{" "}
                              {alunoSelecionado.telefoneResponsavel || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.email")}:</strong>{" "}
                              {alunoSelecionado.emailResponsavel || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.relationship")}:</strong>{" "}
                              {alunoSelecionado.parentescoResponsavel || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {t("drawer.accessibilityTitle")}
                          </h3>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p>
                              <strong>{t("drawer.labels.hasSpecialNeed")}:</strong>{" "}
                              {alunoSelecionado.possuiNecessidadeEspecial
                                ? t("drawer.yes")
                                : t("drawer.no")}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.specialNeed")}:</strong>{" "}
                              {alunoSelecionado.descricaoNecessidadeEspecial || "-"}
                            </p>
                            <p>
                              <strong>{t("drawer.labels.notes")}:</strong>{" "}
                              {alunoSelecionado.observacoesAcessibilidade || "-"}
                            </p>
                          </div>
                        </div>

                      </section>

                    </>
                  )}
                </>
              )}

              {abaPainelAluno === "DOCUMENTOS" && (
                <div className="space-y-6">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t("documentPanel.studentTitle")}
                    </h3>

                    <div className="mt-4 space-y-2">
                      {documentosAluno.filter((doc) => doc.proprietario !== "RESPONSAVEL").length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          {t("documentPanel.studentEmpty")}
                        </p>
                      ) : (
                        documentosAluno
                          .filter((doc) => doc.proprietario !== "RESPONSAVEL")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {doc.titulo}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {doc.arquivoNome || t("documentPanel.fileFallback")}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {doc.arquivoUrl && (
                                  <a
                                    href={doc.arquivoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-700"
                                  >
                                    {t("documentPanel.open")}
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => arquivarDocumentoAluno(doc.id)}
                                  className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-center text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
                                >
                                  {t("documentPanel.archive")}
                                </button>
                              </div>

                            </div>
                          ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t("documentPanel.guardianTitle")}
                    </h3>

                    <div className="mt-4 space-y-2">
                      {documentosAluno.filter((doc) => doc.proprietario === "RESPONSAVEL").length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          {t("documentPanel.guardianEmpty")}
                        </p>
                      ) : (
                        documentosAluno
                          .filter((doc) => doc.proprietario === "RESPONSAVEL")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {doc.titulo}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {doc.arquivoNome || t("documentPanel.fileFallback")}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {doc.arquivoUrl && (
                                  <a
                                    href={doc.arquivoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-700"
                                  >
                                    {t("documentPanel.open")}
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => arquivarDocumentoAluno(doc.id)}
                                  className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-center text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
                                >
                                  {t("documentPanel.archive")}
                                </button>
                              </div>

                            </div>
                          ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t("documentPanel.uploadTitle")}
                    </h3>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {t("documentPanel.archivedTitle")}
                      </h3>

                      <div className="mt-4 space-y-2">
                        {carregandoArquivadosAluno ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t("documentPanel.archivedLoading")}
                          </p>
                        ) : documentosArquivadosAluno.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            {t("documentPanel.archivedEmpty")}
                          </p>
                        ) : (
                          documentosArquivadosAluno.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {doc.titulo}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {t("documentPanel.archivedMeta", {
                                    owner:
                                      doc.proprietario === "RESPONSAVEL"
                                        ? t("documentPanel.ownerGuardian")
                                        : t("documentPanel.ownerStudent"),
                                    date: doc.arquivadoEm
                                      ? formatarData(doc.arquivadoEm)
                                      : "-",
                                  })}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => restaurarDocumentoAluno(doc.id)}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              >
                                {t("documentPanel.restore")}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {t("documentPanel.uploadDescription")}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <select
                        value={documentoProprietario}
                        onChange={(e) =>
                          setDocumentoProprietario(e.target.value as "ALUNO" | "RESPONSAVEL")
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="ALUNO">
                          {t("documentPanel.ownerStudent")}
                        </option>
                        <option value="RESPONSAVEL">
                          {t("documentPanel.ownerGuardian")}
                        </option>
                      </select>

                      <select
                        value={documentoTipo}
                        onChange={(e) => setDocumentoTipo(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="RG">
                          {t("documentPanel.typeRg")}
                        </option>
                        <option value="CPF">
                          {t("documentPanel.typeCpf")}
                        </option>
                        <option value="CNH">
                          {t("documentPanel.typeCnh")}
                        </option>
                        <option value="HISTORICO_ESCOLAR">
                          {t("documentPanel.typeSchoolRecord")}
                        </option>
                        <option value="COMPROVANTE_RESIDENCIA">
                          {t("documentPanel.typeResidenceProof")}
                        </option>
                        <option value="TITULO_ELEITOR">
                          {t("documentPanel.typeVoterRegistration")}
                        </option>
                        <option value="OUTRO">
                          {t("documentPanel.typeOther")}
                        </option>
                      </select>

                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        onChange={(e) => setDocumentoArquivo(e.target.files?.[0] || null)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={enviarDocumentoAluno}
                      disabled={enviandoDocumentoAluno}
                      className="mt-4 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {enviandoDocumentoAluno
                        ? t("documentPanel.uploading")
                        : t("documentPanel.upload")}
                    </button>
                  </section>
                </div>
              )}

              {abaPainelAluno === "MATRICULAS" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {t("enrollmentPanel.title")}
                  </h3>

                  {alunoSelecionado.resumoMatricula ? (
                    <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <p>
                          <strong>{t("enrollmentPanel.course")}:</strong>{" "}
                          {alunoSelecionado.resumoMatricula.cursoNome || "-"}
                        </p>

                        <p>
                          <strong>{t("enrollmentPanel.status")}:</strong>{" "}
                          {alunoSelecionado.resumoMatricula.status || "-"}
                        </p>

                        <p>
                          <strong>{t("enrollmentPanel.semester")}:</strong>{" "}
                          {alunoSelecionado.resumoMatricula.semestre || "-"}
                        </p>

                        <p>
                          <strong>{t("enrollmentPanel.enrollmentNumber")}:</strong>{" "}
                          {alunoSelecionado.resumoMatricula?.numeroMatricula ||
                            alunoSelecionado.matricula ||
                            "-"}
                        </p>

                        <p>
                          <strong>{t("enrollmentPanel.enrollmentDate")}:</strong>{" "}
                          {formatarData(alunoSelecionado.resumoMatricula?.dataMatricula)}
                        </p>

                        <p>
                          <strong>{t("enrollmentPanel.campus")}:</strong>{" "}
                          {alunoSelecionado.resumoMatricula?.polo?.nome ||
                            alunoSelecionado.polo?.nome ||
                            "-"}
                        </p>

                        <p>
                          <strong>{t("enrollmentPanel.modality")}:</strong>{" "}
                          {alunoSelecionado.resumoMatricula?.modalidade || "-"}
                        </p>

                        <p>
                          <strong>{t("enrollmentPanel.academicPeriod")}:</strong>{" "}
                          {alunoSelecionado.resumoMatricula?.periodoLetivo || "-"}
                        </p>

                        <p>
                          <strong>{t("enrollmentPanel.expectedCompletion")}:</strong>{" "}
                          {formatarData(alunoSelecionado.resumoMatricula?.previsaoConclusao)}
                        </p>
                      </div>

                      <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setMatriculaExpandida((prev) => !prev)}
                          className="flex w-full items-center justify-between rounded-xl border border-slate-700 px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100"
                        >
                          <span>
                            {t("enrollmentPanel.classesAndSubjects", {
                              count:
                                alunoSelecionado.resumoMatricula.turmas?.length ||
                                0,
                            })}
                          </span>

                          <span>{matriculaExpandida ? "⌃" : "⌄"}</span>
                        </button>

                        {matriculaExpandida && (
                          <div className="mt-4">
                            <input
                              type="text"
                              placeholder={t("enrollmentPanel.searchPlaceholder")}
                              value={buscaMatricula}
                              onChange={(e) => setBuscaMatricula(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />

                            <div className="mt-3 space-y-2">
                              {alunoSelecionado.resumoMatricula.turmas
                                .filter((turma) => {
                                  const termo = buscaMatricula
                                    .normalize("NFD")
                                    .replace(/[\u0300-\u036f]/g, "")
                                    .toLowerCase()
                                    .trim();

                                  if (!termo) return true;

                                  const texto = [
                                    turma.turmaNome,
                                    turma.disciplinaNome,
                                    turma.professorNome,
                                    turma.status,
                                  ]
                                    .join(" ")
                                    .normalize("NFD")
                                    .replace(/[\u0300-\u036f]/g, "")
                                    .toLowerCase();

                                  return texto.includes(termo);
                                })
                                .map((turma) => (
                                  <div
                                    key={turma.turmaId}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
                                  >
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                      {turma.turmaNome}
                                    </p>

                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                      {t("enrollmentPanel.subject")}:{" "}
                                      {turma.disciplinaNome || "-"}
                                    </p>

                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      {t("enrollmentPanel.teacher")}:{" "}
                                      {turma.professorNome || "-"}
                                    </p>

                                    <p className="text-xs text-slate-400">
                                      {t("enrollmentPanel.subjectStatus")}:{" "}
                                      {turma.status || "-"}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {t("enrollmentPanel.empty")}
                    </div>
                  )}
                </section>
              )}

              {abaPainelAluno === "DESEMPENHO" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {t("performancePanel.title")}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t("performancePanel.description")}
                  </p>

                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder={t("performancePanel.searchPlaceholder")}
                      value={buscaDisciplina}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setBuscaDisciplina(valor);
                        setPaginaDisciplina(1);

                        if (alunoSelecionado?.id) {
                          carregarDesempenhoAluno(alunoSelecionado.id, valor, 1);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  {carregandoDesempenho ? (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      {t("performancePanel.loading")}
                    </p>
                  ) : desempenhoAluno ? (
                    <div className="mt-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t("performancePanel.overallAverage")}
                          </p>
                          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {desempenhoAluno.mediaGeral ?? "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t("performancePanel.subjects")}
                          </p>
                          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {desempenhoAluno.totalDisciplinas ?? 0}
                          </p>
                        </div>
                      </div>

                      {desempenhoAluno.disciplinas?.length ? (
                        desempenhoAluno.disciplinas.map((disciplina: any) => (
                          <div
                            key={disciplina.disciplinaId}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {disciplina.disciplinaNome}
                              </p>

                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {t("performancePanel.average", {
                                  value: disciplina.media ?? "-",
                                })}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              {disciplina.avaliacoes?.length ? (
                                disciplina.avaliacoes.map((avaliacao: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                                  >
                                    <p className="font-medium text-slate-900 dark:text-slate-100">
                                      {avaliacao.titulo}
                                    </p>

                                    <p className="text-slate-600 dark:text-slate-300">
                                      {t("performancePanel.grade", {
                                        grade: avaliacao.nota,
                                        maximum: avaliacao.notaMaxima,
                                      })}
                                    </p>

                                    {avaliacao.feedback && (
                                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                                        {t("performancePanel.feedback", {
                                          feedback: avaliacao.feedback,
                                        })}
                                      </p>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {t("performancePanel.noAssessments")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          {t("performancePanel.noSubjects")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      {t("performancePanel.noData")}
                    </p>
                  )}
                </section>
              )}

              {abaPainelAluno === "HISTORICO" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {t("historyPanel.title")}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t("historyPanel.description")}
                  </p>

                  {carregandoDesempenho ? (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      {t("historyPanel.loading")}
                    </p>
                  ) : !desempenhoAluno?.disciplinas?.length ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {t("historyPanel.empty")}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {desempenhoAluno.disciplinas.map((disciplina: any) => (
                        <div
                          key={disciplina.disciplinaId}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {disciplina.disciplinaNome}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t("historyPanel.subjectDescription")}
                              </p>
                            </div>

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {t("historyPanel.average", {
                                value: disciplina.media ?? "-",
                              })}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
                            <p>
                              <strong>{t("historyPanel.status")}:</strong>{" "}
                              {Number(disciplina.media || 0) >= 7
                                ? t("historyPanel.approved")
                                : t("historyPanel.inProgress")}
                            </p>
                            <p>
                              <strong>{t("historyPanel.attendance")}:</strong> -
                            </p>

                            <p>
                              <strong>{t("historyPanel.workload")}:</strong> -
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {abaPainelAluno === "CERTIFICADOS" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {t("certificatePanel.title")}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {t("certificatePanel.description")}
                  </p>

                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
                    <p className="font-semibold">
                      {t("certificatePanel.ruleTitle")}
                    </p>

                    <p className="mt-1 leading-6">
                      {t("certificatePanel.ruleDescription")}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("certificatePanel.student")}
                      </p>

                      <p className="mt-2 font-bold text-slate-900 dark:text-slate-100">
                        {alunoSelecionado.nome}
                      </p>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {alunoSelecionado.user?.email ||
                          t("certificatePanel.noEmail")}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("certificatePanel.enrollmentAndCourse")}
                      </p>

                      <p className="mt-2 font-bold text-slate-900 dark:text-slate-100">
                        {alunoSelecionado.resumoMatricula?.cursoNome ||
                          t("certificatePanel.noEnrollment")}
                      </p>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {alunoSelecionado.resumoMatricula?.numeroMatricula ||
                          alunoSelecionado.matricula ||
                          t("certificatePanel.enrollmentNotProvided")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={gerandoCertificado}
                      onClick={gerarCertificadoAlunoSelecionado}
                      className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {gerandoCertificado
                        ? t("certificatePanel.generating")
                        : t("certificatePanel.generate")}
                    </button>

                    <button
                      type="button"
                      disabled={baixandoCertificado}
                      onClick={baixarCertificadoAlunoSelecionado}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {baixandoCertificado
                        ? t("certificatePanel.downloading")
                        : t("certificatePanel.download")}
                    </button>
                  </div>

                </section>
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
                {modalAvisoTipo === "sucesso" ? "✅" : "⚠️"}
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
                onClick={() => setModalAvisoAberto(false)}
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
  );
}

export default withAuth(AdminAlunosPage, ["admin"]);
