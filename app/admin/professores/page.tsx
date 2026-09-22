"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import withAuth from "@/components/auth/withAuth";
import BuscaBanco from "@/components/rh/BuscaBanco";

interface Polo {
  id: number;
  nome: string;
  codigo?: string | null;
}

interface DisciplinaOpcao {
  id: number;
  nome: string;
}

interface DepartamentoOpcao {
  id: number;
  nome: string;
}

type TipoRemuneracaoProfessor =
  | ""
  | "MENSAL"
  | "HORA_AULA"
  | "HORA_TRABALHADA"
  | "POR_AULA"
  | "POR_TURMA"
  | "POR_DISCIPLINA"
  | "MISTO"
  | "SEM_REMUNERACAO";

type DadosTrabalhistasProfessorForm = {
  departamentoId: string;

  cargo: string;
  setor: string;

  dataAdmissao: string;
  tipoContrato: string;
  jornadaTrabalho: string;

  cargaHorariaMensal: string;
  cargaHorariaSemanal: string;

  tipoRemuneracao: TipoRemuneracaoProfessor;

  salarioBase: string;
  valorHoraAula: string;
  valorHoraTrabalhada: string;
  valorPorAula: string;
  valorPorTurma: string;
  valorPorDisciplina: string;

  duracaoHoraAulaMinutos: string;

  codigoPonto: string;
  pisPasep: string;

  banco: string;
  agencia: string;
  conta: string;
  pix: string;

  observacoesRemuneracao: string;
};

const DADOS_TRABALHISTAS_PROFESSOR_INICIAIS:
  DadosTrabalhistasProfessorForm = {
  departamentoId: "",

  cargo: "Professor",
  setor: "Acadêmico",

  dataAdmissao: "",
  tipoContrato: "",
  jornadaTrabalho: "",

  cargaHorariaMensal: "",
  cargaHorariaSemanal: "",

  tipoRemuneracao: "",

  salarioBase: "",
  valorHoraAula: "",
  valorHoraTrabalhada: "",
  valorPorAula: "",
  valorPorTurma: "",
  valorPorDisciplina: "",

  duracaoHoraAulaMinutos: "50",

  codigoPonto: "",
  pisPasep: "",

  banco: "",
  agencia: "",
  conta: "",
  pix: "",

  observacoesRemuneracao: "",
};

function criarAssinaturaRemuneracao(
  dados: DadosTrabalhistasProfessorForm
) {
  return JSON.stringify({
    tipoRemuneracao: dados.tipoRemuneracao,
    salarioBase: dados.salarioBase,
    valorHoraAula: dados.valorHoraAula,
    valorHoraTrabalhada: dados.valorHoraTrabalhada,
    valorPorAula: dados.valorPorAula,
    valorPorTurma: dados.valorPorTurma,
    valorPorDisciplina: dados.valorPorDisciplina,
    duracaoHoraAulaMinutos:
      dados.duracaoHoraAulaMinutos,
    cargaHorariaSemanal:
      dados.cargaHorariaSemanal,
    cargaHorariaMensal:
      dados.cargaHorariaMensal,
  });
}

function obterDataHoraLocalAtual() {
  const agora = new Date();

  const compensado = new Date(
    agora.getTime() -
    agora.getTimezoneOffset() * 60 * 1000
  );

  return compensado.toISOString().slice(0, 16);
}

function formatarMoedaProfessor(
  valor: unknown,
  locale = "pt-BR"
) {
  const numero = Number(valor || 0);

  return numero.toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHoraProfessor(
  valor: unknown,
  locale = "pt-BR"
) {
  if (!valor) return "-";

  const data = new Date(String(valor));

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString(locale);
}

function obterDadosHistoricoProfessor(valor: unknown) {
  if (!valor) {
    return {} as Record<string, any>;
  }

  if (typeof valor === "string") {
    try {
      return JSON.parse(valor) as Record<string, any>;
    } catch {
      return {} as Record<string, any>;
    }
  }

  if (typeof valor === "object") {
    return valor as Record<string, any>;
  }

  return {} as Record<string, any>;
}

type TradutorAdminTeachers =
  (
    key: string,
    values?: Record<string, any>
  ) => string;

function traduzirTipoRemuneracaoProfessor(
  tipo: unknown,
  t: TradutorAdminTeachers
) {
  switch (String(tipo || "").toUpperCase()) {
    case "MENSAL":
      return t("rh.payTypes.monthly");

    case "HORA_AULA":
      return t("rh.payTypes.classHour");

    case "HORA_TRABALHADA":
      return t("rh.payTypes.workedHour");

    case "POR_AULA":
      return t("rh.payTypes.perClass");

    case "POR_TURMA":
      return t("rh.payTypes.perClassGroup");

    case "POR_DISCIPLINA":
      return t("rh.payTypes.perSubject");

    case "MISTO":
      return t("rh.payTypes.mixed");

    case "SEM_REMUNERACAO":
      return t("rh.payTypes.unpaid");

    default:
      return t("rh.payTypes.notProvided");
  }
}

function traduzirOrigemHistoricoProfessor(
  origem: unknown,
  t: TradutorAdminTeachers
) {
  switch (String(origem || "").toUpperCase()) {
    case "PROFESSORES_RH":
      return t("history.origins.teacherRecord");

    case "FUNCIONARIOS_RH_PROFESSOR":
      return t("history.origins.employeeRecord");

    case "FUNCIONARIOS_RH_CADASTRO":
      return t("history.origins.initialHire");

    case "FUNCIONARIOS_RH_EDICAO":
      return t("history.origins.hrChange");

    default:
      return (
        String(origem || "") ||
        t("history.origins.compensationChange")
      );
  }
}

function ResumoRemuneracaoProfessor({
  dados,
  t,
  locale,
}: {
  dados:
  | Record<string, unknown>
  | string;
  t: TradutorAdminTeachers;
  locale: string;
}) {
  const valores =
    obterDadosHistoricoProfessor(dados);

  const itens = [
    {
      label: t("history.summary.type"),
      valor:
        traduzirTipoRemuneracaoProfessor(
          valores.tipoRemuneracao,
          t
        ),
    },
    {
      label: t("history.summary.monthlySalary"),
      valor:
        valores.salarioBase !== null &&
          valores.salarioBase !== undefined
          ? formatarMoedaProfessor(
            valores.salarioBase,
            locale
          )
          : null,
    },
    {
      label: t("history.summary.classHour"),
      valor:
        valores.valorHoraAula !== null &&
          valores.valorHoraAula !== undefined
          ? formatarMoedaProfessor(
            valores.valorHoraAula,
            locale
          )
          : null,
    },
    {
      label: t("history.summary.workedHour"),
      valor:
        valores.valorHoraTrabalhada !== null &&
          valores.valorHoraTrabalhada !== undefined
          ? formatarMoedaProfessor(
            valores.valorHoraTrabalhada,
            locale
          )
          : null,
    },
    {
      label: t("history.summary.perClass"),
      valor:
        valores.valorPorAula !== null &&
          valores.valorPorAula !== undefined
          ? formatarMoedaProfessor(
            valores.valorPorAula,
            locale
          )
          : null,
    },
    {
      label: t("history.summary.perClassGroup"),
      valor:
        valores.valorPorTurma !== null &&
          valores.valorPorTurma !== undefined
          ? formatarMoedaProfessor(
            valores.valorPorTurma,
            locale
          )
          : null,
    },
    {
      label: t("history.summary.perSubject"),
      valor:
        valores.valorPorDisciplina !== null &&
          valores.valorPorDisciplina !== undefined
          ? formatarMoedaProfessor(
            valores.valorPorDisciplina,
            locale
          )
          : null,
    },
    {
      label: t("history.summary.classHourDuration"),
      valor:
        valores.duracaoHoraAulaMinutos !== null &&
          valores.duracaoHoraAulaMinutos !== undefined
          ? t("history.minutesValue", {
            value:
              valores.duracaoHoraAulaMinutos,
          })
          : null,
    },
    {
      label: t("history.summary.weeklyHours"),
      valor:
        valores.cargaHorariaSemanal !== null &&
          valores.cargaHorariaSemanal !== undefined
          ? t("history.hoursValue", {
            value:
              valores.cargaHorariaSemanal,
          })
          : null,
    },
    {
      label: t("history.summary.monthlyHours"),
      valor:
        valores.cargaHorariaMensal !== null &&
          valores.cargaHorariaMensal !== undefined
          ? t("history.hoursValue", {
            value:
              valores.cargaHorariaMensal,
          })
          : null,
    },
  ].filter(
    (item) => item.valor !== null
  );

  return (
    <div className="space-y-1 text-sm">
      {itens.map((item) => (
        <p key={item.label}>
          <span className="font-semibold">
            {item.label}:
          </span>{" "}
          {item.valor}
        </p>
      ))}
    </div>
  );
}

type HistoricoRemuneracaoProfessorRH = {
  id: number;

  origem: string;

  tipoAnterior?: TipoRemuneracaoProfessor | null;
  tipoNovo: TipoRemuneracaoProfessor;

  dadosAnteriores: Record<string, unknown> | string;
  dadosNovos: Record<string, unknown> | string;

  vigenciaInicio: string;
  motivo: string;
  alteradoEm: string;

  alteradoPorNomeSnapshot: string;
  alteradoPorRoleSnapshot?: string | null;

  funcionarioNomeSnapshot: string;
  professorNomeSnapshot?: string | null;
};

interface Professor {
  id: number;
  nome: string;
  cpf?: string | null;
  rg?: string | null;
  telefone?: string | null;
  dataNascimento?: string | null;
  titulacao?: string | null;
  especialidade?: string | null;
  formacao?: string | null;
  areaAtuacao?: string | null;
  miniBio?: string | null;
  codigoFuncionario?: string | null;
  fotoPerfil?: string | null;
  documentoUrl?: string | null;
  slug?: string | null;
  poloId?: number | null;
  polo?: Polo | null;
  funcionarioId?: number | null;

  funcionario?: {
    id: number;

    departamentoId?: number | null;
    departamento?: {
      id: number;
      nome: string;
    } | null;

    cargo?: string | null;
    setor?: string | null;

    dataAdmissao?: string | null;
    tipoContrato?: string | null;
    jornadaTrabalho?: string | null;

    cargaHorariaMensal?: number | null;
    cargaHorariaSemanal?: number | string | null;

    tipoRemuneracao?: TipoRemuneracaoProfessor | null;

    salarioBase?: number | string | null;
    valorHoraAula?: number | string | null;
    valorHoraTrabalhada?: number | string | null;
    valorPorAula?: number | string | null;
    valorPorTurma?: number | string | null;
    valorPorDisciplina?: number | string | null;

    duracaoHoraAulaMinutos?: number | null;

    codigoPonto?: string | null;
    pisPasep?: string | null;

    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
    pix?: string | null;

    observacoesRemuneracao?: string | null;
    statusFuncionario?: string | null;
  } | null;

  historicosRemuneracaoRH?:
  HistoricoRemuneracaoProfessorRH[];

  user: {
    email: string;
  };
}

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminProfessoresPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("AdminTeachers");
  const locale = useLocale();

  function nomeDocumentoProfessor(
    tipo: string,
    tituloOriginal: string
  ) {
    const chavePorTipo: Record<string, string> = {
      RG: "rg",
      CPF: "cpf",
      CNH: "cnh",
      COMPROVANTE_RESIDENCIA: "proofOfResidence",
      CURRICULO: "resume",
      PORTFOLIO: "portfolio",
      CERTIFICADOS: "certificates",
    };

    const chave = chavePorTipo[tipo];

    return chave
      ? t(`documents.types.${chave}`)
      : tituloOriginal;
  }

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [polos, setPolos] = useState<Polo[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaOpcao[]>([]);

  const [departamentos, setDepartamentos] =
    useState<DepartamentoOpcao[]>([]);

  const [possuiVinculoRH, setPossuiVinculoRH] =
    useState(false);

  const [dadosTrabalhistas, setDadosTrabalhistas] =
    useState<DadosTrabalhistasProfessorForm>(
      DADOS_TRABALHISTAS_PROFESSOR_INICIAIS
    );

  const [disciplinasAberto, setDisciplinasAberto] = useState(false);
  const [editDisciplinasAberto, setEditDisciplinasAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [titulacao, setTitulacao] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [formacao, setFormacao] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState("");
  const [miniBio, setMiniBio] = useState("");
  const [codigoFuncionario, setCodigoFuncionario] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [enviandoFotoPerfil, setEnviandoFotoPerfil] = useState(false);

  const inputFotoProfessorRef =
    useRef<HTMLInputElement | null>(null);

  const inputEditFotoProfessorRef =
    useRef<HTMLInputElement | null>(null);

  const [
    erroFotoProfessor,
    setErroFotoProfessor,
  ] = useState<{
    titulo: string;
    mensagem: string;
    modo: "CRIACAO" | "EDICAO";
  } | null>(null);

  const [slug, setSlug] = useState("");
  const [poloId, setPoloId] = useState("");

  const [documentosProfessor, setDocumentosProfessor] = useState<
    { tipo: string; titulo: string; arquivo: File | null }[]
  >([
    { tipo: "RG", titulo: "RG", arquivo: null },
    { tipo: "CPF", titulo: "CPF", arquivo: null },
    { tipo: "CNH", titulo: "CNH", arquivo: null },
    { tipo: "COMPROVANTE_RESIDENCIA", titulo: "Comprovante de residência", arquivo: null },
    { tipo: "CURRICULO", titulo: "Currículo", arquivo: null },
    { tipo: "PORTFOLIO", titulo: "Portfólio", arquivo: null },
    { tipo: "CERTIFICADOS", titulo: "Certificados", arquivo: null },
  ]);

  const [linksPortfolioProfessor, setLinksPortfolioProfessor] = useState([
    { tipo: "LinkedIn", url: "" },
  ]);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editRg, setEditRg] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editDataNascimento, setEditDataNascimento] = useState("");
  const [editTitulacao, setEditTitulacao] = useState("");
  const [editEspecialidade, setEditEspecialidade] = useState("");
  const [editFormacao, setEditFormacao] = useState("");
  const [editAreaAtuacao, setEditAreaAtuacao] = useState("");
  const [editMiniBio, setEditMiniBio] = useState("");
  const [editCodigoFuncionario, setEditCodigoFuncionario] = useState("");
  const [editFotoPerfil, setEditFotoPerfil] = useState("");
  const [editDocumentoUrl, setEditDocumentoUrl] = useState("");
  const [editEnviandoFotoPerfil, setEditEnviandoFotoPerfil] = useState(false);
  const [editSlug, setEditSlug] = useState("");
  const [editPoloId, setEditPoloId] = useState("");

  const [
    editPossuiVinculoRH,
    setEditPossuiVinculoRH,
  ] = useState(false);

  const [
    editDadosTrabalhistas,
    setEditDadosTrabalhistas,
  ] = useState<DadosTrabalhistasProfessorForm>({
    ...DADOS_TRABALHISTAS_PROFESSOR_INICIAIS,
  });

  const [
    editAssinaturaRemuneracaoOriginal,
    setEditAssinaturaRemuneracaoOriginal,
  ] = useState("");

  const [
    editMotivoAlteracaoRemuneracao,
    setEditMotivoAlteracaoRemuneracao,
  ] = useState("");

  const [
    editVigenciaInicioRemuneracao,
    setEditVigenciaInicioRemuneracao,
  ] = useState("");

  const houveAlteracaoRemuneracaoEdicao =
    editPossuiVinculoRH &&
    editAssinaturaRemuneracaoOriginal !== "" &&
    criarAssinaturaRemuneracao(
      editDadosTrabalhistas
    ) !== editAssinaturaRemuneracaoOriginal;

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [professorParaExcluir, setProfessorParaExcluir] =
    useState<Professor | null>(null);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    setFeedback("");
    setFeedbackTipo("");
    setErroFotoProfessor(null);
  }, [locale]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  function atualizarDadoTrabalhista<
    Campo extends keyof DadosTrabalhistasProfessorForm
  >(
    campo: Campo,
    valor: DadosTrabalhistasProfessorForm[Campo]
  ) {
    setDadosTrabalhistas((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function atualizarDadoTrabalhistaEdicao<
    Campo extends keyof DadosTrabalhistasProfessorForm
  >(
    campo: Campo,
    valor: DadosTrabalhistasProfessorForm[Campo]
  ) {
    setEditDadosTrabalhistas((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  const FORMATOS_FOTO_PROFESSOR_ACEITOS = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  const TAMANHO_MAXIMO_FOTO_PROFESSOR_MB = 2;
  const TAMANHO_MAXIMO_FOTO_PROFESSOR_BYTES =
    TAMANHO_MAXIMO_FOTO_PROFESSOR_MB * 1024 * 1024;

  async function enviarFotoOficialProfessor(
    arquivo: File | null,
    modo: "CRIACAO" | "EDICAO"
  ) {
    if (!arquivo) return;

    setErroFotoProfessor(null);

    const extensao =
      arquivo.name
        .split(".")
        .pop()
        ?.toUpperCase() || "desconhecido";

    if (
      !FORMATOS_FOTO_PROFESSOR_ACEITOS.includes(
        arquivo.type
      )
    ) {
      setErroFotoProfessor({
        titulo: t("photo.errors.invalidFormatTitle"),
        mensagem: t("photo.errors.invalidFormatMessage", {
          extension: extensao,
        }),
        modo,
      });

      return;
    }

    if (
      arquivo.size >
      TAMANHO_MAXIMO_FOTO_PROFESSOR_BYTES
    ) {
      const tamanhoMb = (
        arquivo.size /
        (1024 * 1024)
      )
        .toFixed(2)
        .replace(".", ",");

      setErroFotoProfessor({
        titulo: t("photo.errors.tooLargeTitle"),
        mensagem: t("photo.errors.tooLargeMessage", {
          size: tamanhoMb,
          max: TAMANHO_MAXIMO_FOTO_PROFESSOR_MB,
        }),
        modo,
      });

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

      const data =
        await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("photo.errors.uploadStatus", {
            status: res.status,
          })
        );
      }

      const url =
        data?.url ||
        data?.fileUrl ||
        data?.arquivoUrl ||
        data?.publicUrl;

      if (!url) {
        throw new Error(
          t("photo.errors.noUrl")
        );
      }

      if (modo === "CRIACAO") {
        setFotoPerfil(url);
      } else {
        setEditFotoPerfil(url);
      }

      mostrarFeedback(
        "sucesso",
        t("photo.feedback.uploaded")
      );
    } catch (error: any) {
      const motivo =
        error?.message ||
        t("photo.errors.serverFallback");

      setErroFotoProfessor({
        titulo: t("photo.errors.uploadTitle"),
        mensagem: t("photo.errors.uploadMessage", {
          reason: motivo,
        }),
        modo,
      });
    } finally {
      setEnviandoFotoPerfil(false);
      setEditEnviandoFotoPerfil(false);
    }
  }

  async function carregarProfessores() {
    const res = await fetch("/api/professor", {
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Erro ao buscar professores");
      setProfessores([]);
      return;
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      setProfessores(data);
    } else {
      console.error("Resposta inesperada:", data);
      setProfessores([]);
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

      /*
       * A API atual retorna:
       * {
       *   polos: [...],
       *   gestao: {...}
       * }
       *
       * Mantemos também compatibilidade caso alguma versão
       * antiga da API retorne o array diretamente.
       */
      const polosRecebidos = Array.isArray(data)
        ? data
        : Array.isArray(data?.polos)
          ? data.polos
          : [];

      const listaPolos: Polo[] = polosRecebidos
        .map((polo: any) => ({
          id: Number(polo?.id),
          nome: String(polo?.nome || "").trim(),
          codigo: polo?.codigo
            ? String(polo.codigo)
            : null,
        }))
        .filter(
          (polo: Polo) =>
            Number.isInteger(polo.id) &&
            polo.id > 0 &&
            polo.nome.length > 0
        );

      setPolos(listaPolos);
    } catch (error) {
      console.error("Erro ao carregar polos:", error);
      setPolos([]);
    }
  }

  async function carregarDepartamentos() {
    try {
      const res = await fetch("/api/departamento", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        console.error(
          "Erro ao buscar departamentos:",
          data?.error
        );

        setDepartamentos([]);
        return;
      }

      const lista: DepartamentoOpcao[] = (
        Array.isArray(data) ? data : []
      )
        .map((departamento: any) => ({
          id: Number(departamento?.id),
          nome: String(
            departamento?.nome || t("rh.fields.department")
          ),
        }))
        .filter(
          (departamento) =>
            Number.isFinite(departamento.id) &&
            departamento.id > 0
        );

      setDepartamentos(lista);
    } catch (error) {
      console.error(
        "Erro ao carregar departamentos:",
        error
      );

      setDepartamentos([]);
    }
  }

  async function carregarDisciplinas() {
    const res = await fetch("/api/disciplina", {
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Erro ao buscar disciplinas");
      setDisciplinas([]);
      return;
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      setDisciplinas(data);
    } else {
      setDisciplinas([]);
    }
  }

  async function handleCriarProfessor(e: React.FormEvent) {
    e.preventDefault();

    if (
      possuiVinculoRH &&
      !dadosTrabalhistas.tipoRemuneracao
    ) {
      mostrarFeedback(
        "erro",
        t("validation.selectPayType")
      );
      return;
    }

    if (
      possuiVinculoRH &&
      dadosTrabalhistas.tipoRemuneracao === "MENSAL" &&
      !dadosTrabalhistas.salarioBase
    ) {
      mostrarFeedback(
        "erro",
        t("validation.monthlySalary")
      );
      return;
    }

    if (
      possuiVinculoRH &&
      dadosTrabalhistas.tipoRemuneracao === "HORA_AULA" &&
      !dadosTrabalhistas.valorHoraAula
    ) {
      mostrarFeedback(
        "erro",
        t("validation.classHour")
      );
      return;
    }

    if (
      possuiVinculoRH &&
      dadosTrabalhistas.tipoRemuneracao ===
      "HORA_TRABALHADA" &&
      !dadosTrabalhistas.valorHoraTrabalhada
    ) {
      mostrarFeedback(
        "erro",
        t("validation.workedHour")
      );
      return;
    }

    if (
      possuiVinculoRH &&
      dadosTrabalhistas.tipoRemuneracao === "POR_AULA" &&
      !dadosTrabalhistas.valorPorAula
    ) {
      mostrarFeedback(
        "erro",
        t("validation.perClass")
      );
      return;
    }

    if (
      possuiVinculoRH &&
      dadosTrabalhistas.tipoRemuneracao === "POR_TURMA" &&
      !dadosTrabalhistas.valorPorTurma
    ) {
      mostrarFeedback(
        "erro",
        t("validation.perClassGroup")
      );
      return;
    }

    if (
      possuiVinculoRH &&
      dadosTrabalhistas.tipoRemuneracao ===
      "POR_DISCIPLINA" &&
      !dadosTrabalhistas.valorPorDisciplina
    ) {
      mostrarFeedback(
        "erro",
        t("validation.perSubject")
      );
      return;
    }

    if (
      possuiVinculoRH &&
      dadosTrabalhistas.tipoRemuneracao === "MISTO"
    ) {
      const possuiAlgumValor =
        Boolean(dadosTrabalhistas.salarioBase) ||
        Boolean(dadosTrabalhistas.valorHoraAula) ||
        Boolean(
          dadosTrabalhistas.valorHoraTrabalhada
        ) ||
        Boolean(dadosTrabalhistas.valorPorAula) ||
        Boolean(dadosTrabalhistas.valorPorTurma) ||
        Boolean(
          dadosTrabalhistas.valorPorDisciplina
        );

      if (!possuiAlgumValor) {
        mostrarFeedback(
          "erro",
          t("validation.mixedPay")
        );
        return;
      }
    }

    try {
      setCriando(true);

      const res = await fetch("/api/professor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          email,

          possuiVinculoRH,

          departamentoId:
            dadosTrabalhistas.departamentoId
              ? Number(dadosTrabalhistas.departamentoId)
              : null,

          cargo: dadosTrabalhistas.cargo,
          setor: dadosTrabalhistas.setor,

          dataAdmissao:
            dadosTrabalhistas.dataAdmissao || null,

          tipoContrato:
            dadosTrabalhistas.tipoContrato || null,

          jornadaTrabalho:
            dadosTrabalhistas.jornadaTrabalho || null,

          cargaHorariaMensal:
            dadosTrabalhistas.cargaHorariaMensal || null,

          cargaHorariaSemanal:
            dadosTrabalhistas.cargaHorariaSemanal || null,

          tipoRemuneracao:
            dadosTrabalhistas.tipoRemuneracao || null,

          salarioBase:
            dadosTrabalhistas.salarioBase || null,

          valorHoraAula:
            dadosTrabalhistas.valorHoraAula || null,

          valorHoraTrabalhada:
            dadosTrabalhistas.valorHoraTrabalhada || null,

          valorPorAula:
            dadosTrabalhistas.valorPorAula || null,

          valorPorTurma:
            dadosTrabalhistas.valorPorTurma || null,

          valorPorDisciplina:
            dadosTrabalhistas.valorPorDisciplina || null,

          duracaoHoraAulaMinutos:
            dadosTrabalhistas.duracaoHoraAulaMinutos ||
            null,

          codigoPonto:
            dadosTrabalhistas.codigoPonto || null,

          pisPasep:
            dadosTrabalhistas.pisPasep || null,

          banco: dadosTrabalhistas.banco || null,
          agencia: dadosTrabalhistas.agencia || null,
          conta: dadosTrabalhistas.conta || null,
          pix: dadosTrabalhistas.pix || null,

          observacoesRemuneracao:
            dadosTrabalhistas.observacoesRemuneracao ||
            null,

          cpf,
          rg,
          telefone,
          dataNascimento: dataNascimento || null,
          titulacao,
          especialidade,
          formacao,
          areaAtuacao,
          miniBio,
          codigoFuncionario,
          fotoPerfil,
          documentoUrl,
          slug,
          poloId: poloId ? Number(poloId) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("errors.create"));
      }

      const professorIdCriado = Number(data?.id);

      if (professorIdCriado) {
        for (const doc of documentosProfessor) {
          if (!doc.arquivo) continue;

          const formData = new FormData();
          formData.append("titulo", doc.titulo);
          formData.append("tipo", doc.tipo);
          formData.append("arquivo", doc.arquivo);

          await fetch(`/api/admin/professores/${professorIdCriado}/documentos`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });
        }

        for (const link of linksPortfolioProfessor) {
          if (!link.url.trim()) continue;

          await fetch(`/api/admin/professores/${professorIdCriado}/documentos`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tipo: link.tipo.toUpperCase(),
              titulo: link.tipo,
              url: link.url,
            }),
          });
        }
      }

      setNome("");
      setEmail("");
      setCpf("");
      setRg("");
      setTelefone("");
      setDataNascimento("");
      setTitulacao("");
      setEspecialidade("");
      setFormacao("");
      setAreaAtuacao("");
      setMiniBio("");
      setCodigoFuncionario("");
      setFotoPerfil("");
      setDocumentoUrl("");
      setSlug("");
      setPoloId("");
      setPossuiVinculoRH(false);

      setDadosTrabalhistas({
        ...DADOS_TRABALHISTAS_PROFESSOR_INICIAIS,
      });
      setDocumentosProfessor((prev) =>
        prev.map((doc) => ({ ...doc, arquivo: null }))
      );

      setLinksPortfolioProfessor([{ tipo: "LinkedIn", url: "" }]);

      await carregarProfessores();
      mostrarFeedback("sucesso", t("feedback.created"));
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || t("errors.create"));
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(professor: Professor) {
    setEditandoId(professor.id);
    const funcionarioRH = professor.funcionario ?? null;

    setEditPossuiVinculoRH(Boolean(funcionarioRH?.id));

    const dadosTrabalhistasCarregados:
      DadosTrabalhistasProfessorForm = {
      departamentoId:
        funcionarioRH?.departamentoId !== null &&
          funcionarioRH?.departamentoId !== undefined
          ? String(funcionarioRH.departamentoId)
          : "",

      cargo: funcionarioRH?.cargo || "Professor",
      setor: funcionarioRH?.setor || "Acadêmico",

      dataAdmissao: funcionarioRH?.dataAdmissao
        ? String(funcionarioRH.dataAdmissao).slice(0, 10)
        : "",

      tipoContrato:
        funcionarioRH?.tipoContrato || "",

      jornadaTrabalho:
        funcionarioRH?.jornadaTrabalho || "",

      cargaHorariaMensal:
        funcionarioRH?.cargaHorariaMensal !== null &&
          funcionarioRH?.cargaHorariaMensal !== undefined
          ? String(funcionarioRH.cargaHorariaMensal)
          : "",

      cargaHorariaSemanal:
        funcionarioRH?.cargaHorariaSemanal !== null &&
          funcionarioRH?.cargaHorariaSemanal !== undefined
          ? String(funcionarioRH.cargaHorariaSemanal)
          : "",

      tipoRemuneracao:
        funcionarioRH?.tipoRemuneracao || "",

      salarioBase:
        funcionarioRH?.salarioBase !== null &&
          funcionarioRH?.salarioBase !== undefined
          ? String(funcionarioRH.salarioBase)
          : "",

      valorHoraAula:
        funcionarioRH?.valorHoraAula !== null &&
          funcionarioRH?.valorHoraAula !== undefined
          ? String(funcionarioRH.valorHoraAula)
          : "",

      valorHoraTrabalhada:
        funcionarioRH?.valorHoraTrabalhada !== null &&
          funcionarioRH?.valorHoraTrabalhada !== undefined
          ? String(funcionarioRH.valorHoraTrabalhada)
          : "",

      valorPorAula:
        funcionarioRH?.valorPorAula !== null &&
          funcionarioRH?.valorPorAula !== undefined
          ? String(funcionarioRH.valorPorAula)
          : "",

      valorPorTurma:
        funcionarioRH?.valorPorTurma !== null &&
          funcionarioRH?.valorPorTurma !== undefined
          ? String(funcionarioRH.valorPorTurma)
          : "",

      valorPorDisciplina:
        funcionarioRH?.valorPorDisciplina !== null &&
          funcionarioRH?.valorPorDisciplina !== undefined
          ? String(funcionarioRH.valorPorDisciplina)
          : "",

      duracaoHoraAulaMinutos:
        funcionarioRH?.duracaoHoraAulaMinutos !== null &&
          funcionarioRH?.duracaoHoraAulaMinutos !== undefined
          ? String(funcionarioRH.duracaoHoraAulaMinutos)
          : "50",

      codigoPonto:
        funcionarioRH?.codigoPonto || "",

      pisPasep:
        funcionarioRH?.pisPasep || "",

      banco: funcionarioRH?.banco || "",
      agencia: funcionarioRH?.agencia || "",
      conta: funcionarioRH?.conta || "",
      pix: funcionarioRH?.pix || "",

      observacoesRemuneracao:
        funcionarioRH?.observacoesRemuneracao || "",
    };

    setEditDadosTrabalhistas(
      dadosTrabalhistasCarregados
    );

    setEditAssinaturaRemuneracaoOriginal(
      criarAssinaturaRemuneracao(
        dadosTrabalhistasCarregados
      )
    );

    setEditMotivoAlteracaoRemuneracao("");

    setEditVigenciaInicioRemuneracao(
      obterDataHoraLocalAtual()
    );
    setEditNome(professor.nome || "");
    setEditEmail(professor.user?.email || "");
    setEditCpf(professor.cpf || "");
    setEditRg(professor.rg || "");
    setEditTelefone(professor.telefone || "");
    setEditDataNascimento(
      professor.dataNascimento
        ? new Date(professor.dataNascimento).toISOString().slice(0, 10)
        : ""
    );
    setEditTitulacao(professor.titulacao || "");
    setEditEspecialidade(professor.especialidade || "");
    setEditFormacao(professor.formacao || "");
    setEditAreaAtuacao(professor.areaAtuacao || "");
    setEditMiniBio(professor.miniBio || "");
    setEditCodigoFuncionario(professor.codigoFuncionario || "");
    setEditFotoPerfil(professor.fotoPerfil || "");
    setEditDocumentoUrl(professor.documentoUrl || "");
    setEditSlug(professor.slug || "");
    setEditPoloId(
      professor.poloId !== null && professor.poloId !== undefined
        ? String(professor.poloId)
        : ""
    );
  }

  async function salvarEdicao(id: number) {
    if (
      houveAlteracaoRemuneracaoEdicao &&
      !editMotivoAlteracaoRemuneracao.trim()
    ) {
      mostrarFeedback(
        "erro",
        t("validation.payChangeReason")
      );

      return;
    }

    if (
      houveAlteracaoRemuneracaoEdicao &&
      !editVigenciaInicioRemuneracao
    ) {
      mostrarFeedback(
        "erro",
        t("validation.payChangeStart")
      );

      return;
    }
    try {
      setSalvandoId(id);

      const res = await fetch(`/api/professor/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: editNome,
          email: editEmail,

          motivoAlteracaoRemuneracao:
            houveAlteracaoRemuneracaoEdicao
              ? editMotivoAlteracaoRemuneracao.trim()
              : null,

          vigenciaInicioRemuneracao:
            houveAlteracaoRemuneracaoEdicao &&
              editVigenciaInicioRemuneracao
              ? new Date(
                editVigenciaInicioRemuneracao
              ).toISOString()
              : null,

          possuiVinculoRH: editPossuiVinculoRH,

          departamentoId:
            editDadosTrabalhistas.departamentoId
              ? Number(editDadosTrabalhistas.departamentoId)
              : null,

          cargo: editDadosTrabalhistas.cargo,
          setor: editDadosTrabalhistas.setor,

          dataAdmissao:
            editDadosTrabalhistas.dataAdmissao || null,

          tipoContrato:
            editDadosTrabalhistas.tipoContrato || null,

          jornadaTrabalho:
            editDadosTrabalhistas.jornadaTrabalho || null,

          cargaHorariaMensal:
            editDadosTrabalhistas.cargaHorariaMensal || null,

          cargaHorariaSemanal:
            editDadosTrabalhistas.cargaHorariaSemanal || null,

          tipoRemuneracao:
            editDadosTrabalhistas.tipoRemuneracao || null,

          salarioBase:
            editDadosTrabalhistas.salarioBase || null,

          valorHoraAula:
            editDadosTrabalhistas.valorHoraAula || null,

          valorHoraTrabalhada:
            editDadosTrabalhistas.valorHoraTrabalhada || null,

          valorPorAula:
            editDadosTrabalhistas.valorPorAula || null,

          valorPorTurma:
            editDadosTrabalhistas.valorPorTurma || null,

          valorPorDisciplina:
            editDadosTrabalhistas.valorPorDisciplina || null,

          duracaoHoraAulaMinutos:
            editDadosTrabalhistas.duracaoHoraAulaMinutos ||
            null,

          codigoPonto:
            editDadosTrabalhistas.codigoPonto || null,

          pisPasep:
            editDadosTrabalhistas.pisPasep || null,

          banco: editDadosTrabalhistas.banco || null,
          agencia: editDadosTrabalhistas.agencia || null,
          conta: editDadosTrabalhistas.conta || null,
          pix: editDadosTrabalhistas.pix || null,

          observacoesRemuneracao:
            editDadosTrabalhistas.observacoesRemuneracao ||
            null,

          cpf: editCpf,
          rg: editRg,
          telefone: editTelefone,
          dataNascimento: editDataNascimento || null,
          titulacao: editTitulacao,
          especialidade: editEspecialidade,
          formacao: editFormacao,
          areaAtuacao: editAreaAtuacao,
          miniBio: editMiniBio,
          codigoFuncionario: editCodigoFuncionario,
          fotoPerfil: editFotoPerfil,
          documentoUrl: editDocumentoUrl,
          slug: editSlug,
          poloId: editPoloId ? Number(editPoloId) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("errors.update"));
      }

      setEditandoId(null);
      setEditPossuiVinculoRH(false);
      setEditDisciplinasAberto(false);

      setEditAssinaturaRemuneracaoOriginal("");
      setEditMotivoAlteracaoRemuneracao("");
      setEditVigenciaInicioRemuneracao("");

      setEditDadosTrabalhistas({
        ...DADOS_TRABALHISTAS_PROFESSOR_INICIAIS,
      });

      await carregarProfessores();

      mostrarFeedback(
        "sucesso",
        t("feedback.updated")
      );
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || t("errors.update"));
    } finally {
      setSalvandoId(null);
    }
  }

  async function confirmarExclusaoProfessor() {
    if (!professorParaExcluir) return;

    try {
      setExcluindoId(professorParaExcluir.id);

      const res = await fetch(`/api/professor/${professorParaExcluir.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detalhe || data?.error || t("errors.delete"));
      }

      setProfessorParaExcluir(null);
      await carregarProfessores();
      mostrarFeedback("sucesso", t("feedback.deleted"));
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || t("errors.delete"));
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
    carregarProfessores();
    carregarPolos();
    carregarDisciplinas();
    carregarDepartamentos();
  }, []);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const professoresFiltrados = useMemo(() => {
    const termoTexto = busca.trim().toLowerCase();
    const termoNumerico = busca.replace(/\D/g, "");

    if (!termoTexto) return professores;

    return professores.filter((professor) => {
      const nomeTexto = String(professor.nome || "").toLowerCase().trim();
      const emailTexto = String(professor.user?.email || "")
        .toLowerCase()
        .trim();
      const cpfTexto = String(professor.cpf || "").toLowerCase().trim();
      const rgTexto = String(professor.rg || "").toLowerCase().trim();
      const telefoneTexto = String(professor.telefone || "")
        .toLowerCase()
        .trim();
      const titulacaoTexto = String(professor.titulacao || "")
        .toLowerCase()
        .trim();
      const especialidadeTexto = String(professor.especialidade || "")
        .toLowerCase()
        .trim();
      const formacaoTexto = String(professor.formacao || "")
        .toLowerCase()
        .trim();
      const areaAtuacaoTexto = String(professor.areaAtuacao || "")
        .toLowerCase()
        .trim();
      const codigoFuncionarioTexto = String(professor.codigoFuncionario || "")
        .toLowerCase()
        .trim();
      const slugTexto = String(professor.slug || "").toLowerCase().trim();
      const poloTexto = String(professor.polo?.nome || "").toLowerCase().trim();

      const cpfNumerico = cpfTexto.replace(/\D/g, "");
      const rgNumerico = rgTexto.replace(/\D/g, "");
      const telefoneNumerico = telefoneTexto.replace(/\D/g, "");
      const codigoNumerico = codigoFuncionarioTexto.replace(/\D/g, "");

      return (
        nomeTexto.includes(termoTexto) ||
        emailTexto.includes(termoTexto) ||
        cpfTexto.includes(termoTexto) ||
        rgTexto.includes(termoTexto) ||
        telefoneTexto.includes(termoTexto) ||
        titulacaoTexto.includes(termoTexto) ||
        especialidadeTexto.includes(termoTexto) ||
        formacaoTexto.includes(termoTexto) ||
        areaAtuacaoTexto.includes(termoTexto) ||
        codigoFuncionarioTexto.includes(termoTexto) ||
        slugTexto.includes(termoTexto) ||
        poloTexto.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (cpfNumerico.includes(termoNumerico) ||
            rgNumerico.includes(termoNumerico) ||
            telefoneNumerico.includes(termoNumerico) ||
            codigoNumerico.includes(termoNumerico)))
      );
    });
  }, [professores, busca]);

  return (
    <>
      <div className="max-w-5xl space-y-6">
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

        <h1 className="text-2xl font-bold">{t("header.title")}</h1>

        <form
          onSubmit={handleCriarProfessor}
          className="space-y-4 rounded-lg border bg-white dark:bg-slate-950 p-6"
        >
          <h2 className="font-semibold">{t("create.title")}</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              placeholder={t("fields.name")}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border p-2"
              required
            />

            <input
              placeholder={t("fields.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-2"
              required
            />

            <select
              value={poloId}
              onChange={(e) => setPoloId(e.target.value)}
              className="w-full rounded-lg border p-2"
            >
              <option value="">{t("fields.selectCampus")}</option>
              {polos.map((polo) => (
                <option key={polo.id} value={polo.id}>
                  {polo.nome}
                </option>
              ))}
            </select>

            <input
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <input
              placeholder="RG"
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <input
              placeholder={t("fields.phone")}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {t("fields.birthDate")}
              </label>

              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {t("fields.academicDegree")}
              </label>

              <input
                placeholder={t("fields.degreeExample")}
                value={titulacao}
                onChange={(e) => setTitulacao(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div className="rounded-lg border p-2 md:col-span-2">
              <button
                type="button"
                onClick={() => setDisciplinasAberto((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
              >
                <span>
                  {especialidade
                    ? t("disciplines.selected", { value: especialidade })
                    : t("disciplines.select")}
                </span>
                <span>{disciplinasAberto ? "▲" : "▼"}</span>
              </button>

              {disciplinasAberto && (
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
                  {disciplinas.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("disciplines.empty")}</p>
                  ) : (
                    disciplinas.map((disciplina) => {
                      const selecionadas = especialidade
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);

                      const checked = selecionadas.includes(disciplina.nome);

                      return (
                        <label
                          key={disciplina.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const novas = e.target.checked
                                ? [...selecionadas, disciplina.nome]
                                : selecionadas.filter((nome) => nome !== disciplina.nome);

                              setEspecialidade(novas.join(", "));
                            }}
                          />
                          {disciplina.nome}
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {t("fields.education")}
              </label>

              <input
                placeholder={t("fields.educationExample")}
                value={formacao}
                onChange={(e) => setFormacao(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {t("fields.area")}
              </label>

              <input
                placeholder={t("fields.areaExample")}
                value={areaAtuacao}
                onChange={(e) => setAreaAtuacao(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <input
              placeholder={t("fields.employeeCode")}
              value={codigoFuncionario}
              onChange={(e) => setCodigoFuncionario(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <input
              placeholder={t("fields.publicSlug")}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <div className="professores-vinculo-rh-card md:col-span-2 rounded-2xl border p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <input
                  id="professor-possui-vinculo-rh"
                  type="checkbox"
                  checked={possuiVinculoRH}
                  onChange={(e) => {
                    const marcado = e.target.checked;

                    setPossuiVinculoRH(marcado);

                    if (!marcado) {
                      setDadosTrabalhistas(
                        DADOS_TRABALHISTAS_PROFESSOR_INICIAIS
                      );
                    }
                  }}
                  className="mt-1 h-4 w-4"
                />

                <label
                  htmlFor="professor-possui-vinculo-rh"
                  className="cursor-pointer"
                >
                  <span className="professores-vinculo-rh-titulo block font-bold">
                    {t("employment.hasRelationship")}
                  </span>

                  <span className="professores-vinculo-rh-texto mt-1 block text-sm">
                    {t("employment.relationshipHelp")}
                  </span>
                </label>
              </div>

              {!possuiVinculoRH && (
                <div className="professores-vinculo-rh-aviso mt-4 rounded-xl border p-4 text-sm">
                  {t("employment.academicOnly")}
                </div>
              )}

              {possuiVinculoRH && (
                <div className="mt-5 space-y-5">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">
                      {t("rh.create.title")}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {t("rh.create.description")}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.department")}
                      </label>

                      <select
                        value={dadosTrabalhistas.departamentoId}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "departamentoId",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">
                          {t("rh.fields.selectDepartment")}
                        </option>

                        {departamentos.map((departamento) => (
                          <option
                            key={departamento.id}
                            value={String(departamento.id)}
                          >
                            {departamento.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.role")}
                      </label>

                      <input
                        value={dadosTrabalhistas.cargo === "Professor" ? t("rh.placeholders.role") : dadosTrabalhistas.cargo}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "cargo",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder={t("rh.placeholders.role")}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.sector")}
                      </label>

                      <input
                        value={dadosTrabalhistas.setor === "Acadêmico" ? t("rh.placeholders.sector") : dadosTrabalhistas.setor}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "setor",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder={t("rh.placeholders.sector")}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.hireDate")}
                      </label>

                      <input
                        type="date"
                        value={dadosTrabalhistas.dataAdmissao}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "dataAdmissao",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.contractType")}
                      </label>

                      <select
                        value={dadosTrabalhistas.tipoContrato}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "tipoContrato",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">{t("rh.fields.selectContractType")}</option>
                        <option value="CLT">CLT</option>
                        <option value="PJ">{t("rh.contractTypes.legalEntity")}</option>
                        <option value="AUTONOMO">{t("rh.contractTypes.selfEmployed")}</option>
                        <option value="TEMPORARIO">{t("rh.contractTypes.temporary")}</option>
                        <option value="ESTAGIO">{t("rh.contractTypes.internship")}</option>
                        <option value="VOLUNTARIO">{t("rh.contractTypes.volunteer")}</option>
                        <option value="OUTRO">{t("rh.contractTypes.other")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.workSchedule")}
                      </label>

                      <input
                        value={dadosTrabalhistas.jornadaTrabalho}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "jornadaTrabalho",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder={t("rh.placeholders.workSchedule")}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.weeklyHours")}
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={dadosTrabalhistas.cargaHorariaSemanal}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "cargaHorariaSemanal",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder="Ex.: 20"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.monthlyHours")}
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={dadosTrabalhistas.cargaHorariaMensal}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "cargaHorariaMensal",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder="Ex.: 80"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t("rh.fields.payType")}
                      </label>

                      <select
                        value={dadosTrabalhistas.tipoRemuneracao}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "tipoRemuneracao",
                            e.target
                              .value as TipoRemuneracaoProfessor
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        required={possuiVinculoRH}
                      >
                        <option value="">{t("rh.fields.selectPayType")}</option>
                        <option value="MENSAL">{t("rh.payTypes.monthly")}</option>
                        <option value="HORA_AULA">{t("rh.payTypes.classHour")}</option>
                        <option value="HORA_TRABALHADA">{t("rh.payTypes.workedHour")}</option>
                        <option value="POR_AULA">{t("rh.payTypes.perClass")}</option>
                        <option value="POR_TURMA">{t("rh.payTypes.perClassGroup")}</option>
                        <option value="POR_DISCIPLINA">{t("rh.payTypes.perSubject")}</option>
                        <option value="MISTO">{t("rh.payTypes.mixed")}</option>
                        <option value="SEM_REMUNERACAO">{t("rh.payTypes.unpaid")}</option>
                      </select>
                    </div>
                  </div>

                  {dadosTrabalhistas.tipoRemuneracao &&
                    dadosTrabalhistas.tipoRemuneracao !==
                    "SEM_REMUNERACAO" && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          {t("rh.compensation.valuesTitle")}
                        </h4>

                        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {(dadosTrabalhistas.tipoRemuneracao ===
                            "MENSAL" ||
                            dadosTrabalhistas.tipoRemuneracao ===
                            "MISTO") && (
                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.monthlySalary")}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={dadosTrabalhistas.salarioBase}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhista(
                                      "salarioBase",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder="0,00"
                                />
                              </div>
                            )}

                          {(dadosTrabalhistas.tipoRemuneracao ===
                            "HORA_AULA" ||
                            dadosTrabalhistas.tipoRemuneracao ===
                            "MISTO") && (
                              <>
                                <div>
                                  <label className="mb-1 block text-sm font-semibold">
                                    {t("rh.fields.classHourValue")}
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      dadosTrabalhistas.valorHoraAula
                                    }
                                    onChange={(e) =>
                                      atualizarDadoTrabalhista(
                                        "valorHoraAula",
                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded-lg border p-2"
                                    placeholder="0,00"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-sm font-semibold">
                                    {t("rh.fields.classHourDuration")}
                                  </label>

                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="1"
                                      step="1"
                                      value={
                                        dadosTrabalhistas.duracaoHoraAulaMinutos
                                      }
                                      onChange={(e) =>
                                        atualizarDadoTrabalhista(
                                          "duracaoHoraAulaMinutos",
                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border p-2 pr-20"
                                    />

                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                      {t("rh.units.minutes")}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}

                          {(dadosTrabalhistas.tipoRemuneracao ===
                            "HORA_TRABALHADA" ||
                            dadosTrabalhistas.tipoRemuneracao ===
                            "MISTO") && (
                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.workedHourValue")}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    dadosTrabalhistas.valorHoraTrabalhada
                                  }
                                  onChange={(e) =>
                                    atualizarDadoTrabalhista(
                                      "valorHoraTrabalhada",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder="0,00"
                                />
                              </div>
                            )}

                          {(dadosTrabalhistas.tipoRemuneracao ===
                            "POR_AULA" ||
                            dadosTrabalhistas.tipoRemuneracao ===
                            "MISTO") && (
                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.perClassValue")}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={dadosTrabalhistas.valorPorAula}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhista(
                                      "valorPorAula",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder="0,00"
                                />
                              </div>
                            )}

                          {(dadosTrabalhistas.tipoRemuneracao ===
                            "POR_TURMA" ||
                            dadosTrabalhistas.tipoRemuneracao ===
                            "MISTO") && (
                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.perClassGroupValue")}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={dadosTrabalhistas.valorPorTurma}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhista(
                                      "valorPorTurma",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder="0,00"
                                />
                              </div>
                            )}

                          {(dadosTrabalhistas.tipoRemuneracao ===
                            "POR_DISCIPLINA" ||
                            dadosTrabalhistas.tipoRemuneracao ===
                            "MISTO") && (
                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.perSubjectValue")}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    dadosTrabalhistas.valorPorDisciplina
                                  }
                                  onChange={(e) =>
                                    atualizarDadoTrabalhista(
                                      "valorPorDisciplina",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder="0,00"
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                  {dadosTrabalhistas.tipoRemuneracao ===
                    "SEM_REMUNERACAO" && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                        {t("rh.compensation.unpaidNotice")}
                      </div>
                    )}

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        {t("rh.fields.timeClockCode")}
                      </label>

                      <input
                        value={dadosTrabalhistas.codigoPonto}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "codigoPonto",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder={t("rh.placeholders.timeClockCode")}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        {t("rh.fields.pisPasep")}
                      </label>

                      <input
                        value={dadosTrabalhistas.pisPasep}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "pisPasep",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder={t("rh.placeholders.pisPasep")}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="banco-professor-cadastro"
                        className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {t("rh.fields.payrollBank")}
                      </label>

                      <BuscaBanco
                        id="banco-professor-cadastro"
                        value={dadosTrabalhistas.banco}
                        onChange={(valor) =>
                          atualizarDadoTrabalhista("banco", valor)
                        }
                        placeholder={t("rh.placeholders.bankSearch")}
                        ariaLabel={t("rh.placeholders.bankSearchAria")}
                      />

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t("rh.help.bankSearchExamples")}
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        {t("rh.fields.bankBranch")}
                      </label>

                      <input
                        value={dadosTrabalhistas.agencia}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "agencia",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder={t("rh.placeholders.bankBranch")}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        {t("rh.fields.bankAccount")}
                      </label>

                      <input
                        value={dadosTrabalhistas.conta}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "conta",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder={t("rh.placeholders.bankAccount")}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        {t("rh.fields.pixKey")}
                      </label>

                      <input
                        value={dadosTrabalhistas.pix}
                        onChange={(e) =>
                          atualizarDadoTrabalhista(
                            "pix",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder={t("rh.placeholders.pixKey")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      {t("rh.fields.compensationNotes")}
                    </label>

                    <textarea
                      value={
                        dadosTrabalhistas.observacoesRemuneracao
                      }
                      onChange={(e) =>
                        atualizarDadoTrabalhista(
                          "observacoesRemuneracao",
                          e.target.value
                        )
                      }
                      className="min-h-[100px] w-full rounded-lg border p-3"
                      placeholder={t("rh.placeholders.compensationNotes")}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="phanyx-foto-oficial-card md:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="phanyx-foto-oficial-preview">
                  {fotoPerfil ? (
                    <img
                      src={fotoPerfil}
                      alt={nome || t("photo.alt")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-slate-400">
                      {nome?.charAt(0)?.toUpperCase() || "P"}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="phanyx-foto-oficial-titulo">
                    {t("photo.title")}
                  </h3>

                  <p className="phanyx-foto-oficial-texto">
                    {t("photo.description")}
                  </p>

                  <p className="phanyx-foto-oficial-ajuda">
                    {t("photo.help")}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="phanyx-foto-oficial-botao">
                      {enviandoFotoPerfil ? t("actions.uploading") : t("actions.uploadPhoto")}
                      <input
                        ref={inputFotoProfessorRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        disabled={enviandoFotoPerfil}
                        onChange={(e) => {
                          const arquivo =
                            e.currentTarget.files?.[0] || null;

                          e.currentTarget.value = "";

                          void enviarFotoOficialProfessor(
                            arquivo,
                            "CRIACAO"
                          );
                        }}
                        className="hidden"
                      />
                    </label>

                    {fotoPerfil && (
                      <button
                        type="button"
                        onClick={() => setFotoPerfil("")}
                        className="phanyx-foto-oficial-remover"
                      >
                        {t("actions.removePhoto")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <input
              placeholder={t("documents.urlPlaceholder")}
              value={documentoUrl}
              onChange={(e) => setDocumentoUrl(e.target.value)}
              className="w-full rounded-lg border p-2"
            />

            <div className="phanyx-documentos-professor md:col-span-2 rounded-2xl border p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold">
                  {t("documents.title")}
                </h3>

                <p className="mt-2 text-sm font-medium">
                  {t("documents.description")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {documentosProfessor.map((doc, index) => (
                  <div
                    key={doc.tipo}
                    className="
    rounded-2xl
    border
    border-slate-300
    bg-white
    p-4
    shadow-sm

    dark:border-slate-700
    dark:bg-slate-900
  "
                  >
                    <label className="mb-3 block text-sm font-semibold">
                      {nomeDocumentoProfessor(doc.tipo, doc.titulo)}
                    </label>

                    <input
                      id={`arquivo-professor-${doc.tipo}`}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.psd,.ai,.eps,.svg,.blend,.fbx,.obj,.glb,.gltf,.ma,.mb,.max,.zip,.rar"
                      className="hidden"
                      onChange={(e) => {
                        const arquivo = e.target.files?.[0] || null;

                        setDocumentosProfessor((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, arquivo } : item
                          )
                        );
                      }}
                    />

                    <label
                      htmlFor={`arquivo-professor-${doc.tipo}`}
                      className="phanyx-upload-funcionario"
                    >
                      <span>📎</span>
                      <span>{t("actions.selectFile")}</span>
                    </label>

                    {doc.arquivo && (
                      <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {doc.arquivo.name}
                      </p>
                    )}

                    {doc.tipo === "PORTFOLIO" && (
                      <div className="mt-4 rounded-xl border border-blue-200 bg-slate-100 p-3 dark:border-blue-900/60 dark:bg-slate-800">
                        <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                          {t("portfolio.linksTitle")}
                        </h4>

                        <div className="space-y-3">
                          {linksPortfolioProfessor.map((link, linkIndex) => (
                            <div
                              key={linkIndex}
                              className="flex flex-col gap-2 md:flex-row md:items-center"
                            >
                              <select
                                value={link.tipo}
                                onChange={(e) =>
                                  setLinksPortfolioProfessor((prev) =>
                                    prev.map((item, i) =>
                                      i === linkIndex ? { ...item, tipo: e.target.value } : item
                                    )
                                  )
                                }
                                className="rounded-lg border border-slate-300 bg-white dark:bg-slate-950 p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-900 dark:text-white"
                              >
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Behance">Behance</option>
                                <option value="ArtStation">ArtStation</option>
                                <option value="Instagram">Instagram</option>
                                <option value="YouTube">YouTube</option>
                                <option value="Vimeo">Vimeo</option>
                                <option value="GitHub">GitHub</option>
                                <option value="Site">{t("portfolio.personalSite")}</option>
                                <option value="Outro">{t("common.other")}</option>
                              </select>

                              <input
                                type="url"
                                placeholder="https://..."
                                value={link.url}
                                onChange={(e) =>
                                  setLinksPortfolioProfessor((prev) =>
                                    prev.map((item, i) =>
                                      i === linkIndex ? { ...item, url: e.target.value } : item
                                    )
                                  )
                                }
                                className="rounded-lg border border-slate-300 bg-white dark:bg-slate-950 p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-900 dark:text-white"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setLinksPortfolioProfessor((prev) =>
                                    prev.length === 1
                                      ? prev
                                      : prev.filter((_, i) => i !== linkIndex)
                                  )
                                }
                                className="shrink-0 rounded-lg border border-red-300 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-800 dark:bg-slate-900 dark:text-red-300"
                              >
                                {t("actions.remove")}
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setLinksPortfolioProfessor((prev) => [
                              ...prev,
                              { tipo: "LinkedIn", url: "" },
                            ])
                          }
                          className="mt-3 rounded-lg border border-blue-300 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-bold text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
                        >
                          {t("actions.addLink")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          <textarea
            placeholder={t("fields.miniBio")}
            value={miniBio}
            onChange={(e) => setMiniBio(e.target.value)}
            className="min-h-[120px] w-full rounded-lg border p-2"
          />

          <button
            disabled={criando}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {criando ? t("actions.creating") : t("actions.create")}
          </button>
        </form>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-semibold">{t("list.title")}</h2>

            <input
              type="text"
              placeholder={t("list.searchPlaceholder")}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-lg border p-2 md:w-[460px]"
            />
          </div>

          {professoresFiltrados.length === 0 ? (
            <div className="rounded-lg border bg-white dark:bg-slate-950 p-4 text-sm text-gray-600">
              {t("list.empty")}
            </div>
          ) : (
            professoresFiltrados.map((p) => (
              <div key={p.id} className="rounded-lg border bg-white dark:bg-slate-950 p-4">
                {editandoId === p.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="rounded border p-2"
                        placeholder={t("fields.name")}
                      />
                      <input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="rounded border p-2"
                        placeholder={t("fields.email")}
                      />

                      <select
                        value={editPoloId}
                        onChange={(e) => setEditPoloId(e.target.value)}
                        className="rounded border p-2"
                      >
                        <option value="">{t("fields.selectCampus")}</option>
                        {polos.map((polo) => (
                          <option key={polo.id} value={polo.id}>
                            {polo.nome}
                          </option>
                        ))}
                      </select>

                      <input
                        value={editCpf}
                        onChange={(e) => setEditCpf(e.target.value)}
                        className="rounded border p-2"
                        placeholder="CPF"
                      />
                      <input
                        value={editRg}
                        onChange={(e) => setEditRg(e.target.value)}
                        className="rounded border p-2"
                        placeholder="RG"
                      />
                      <input
                        value={editTelefone}
                        onChange={(e) => setEditTelefone(e.target.value)}
                        className="rounded border p-2"
                        placeholder={t("fields.phone")}
                      />
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {t("fields.birthDate")}
                        </label>

                        <input
                          type="date"
                          value={editDataNascimento}
                          onChange={(e) => setEditDataNascimento(e.target.value)}
                          className="w-full rounded border p-2"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {t("fields.academicDegree")}
                        </label>

                        <input
                          value={editTitulacao}
                          onChange={(e) => setEditTitulacao(e.target.value)}
                          className="w-full rounded border p-2"
                          placeholder={t("fields.degreeExample")}
                        />
                      </div>
                      <div className="rounded border p-2 md:col-span-2">
                        <button
                          type="button"
                          onClick={() => setEditDisciplinasAberto((prev) => !prev)}
                          className="flex w-full items-center justify-between text-left"
                        >
                          <span>
                            {editEspecialidade
                              ? t("disciplines.selected", { value: editEspecialidade })
                              : t("disciplines.select")}
                          </span>
                          <span>{editDisciplinasAberto ? "▲" : "▼"}</span>
                        </button>

                        {editDisciplinasAberto && (
                          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
                            {disciplinas.length === 0 ? (
                              <p className="text-sm text-gray-500">{t("disciplines.empty")}</p>
                            ) : (
                              disciplinas.map((disciplina) => {
                                const selecionadas = editEspecialidade
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean);

                                const checked = selecionadas.includes(disciplina.nome);

                                return (
                                  <label
                                    key={disciplina.id}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const novas = e.target.checked
                                          ? [...selecionadas, disciplina.nome]
                                          : selecionadas.filter((nome) => nome !== disciplina.nome);

                                        setEditEspecialidade(novas.join(", "));
                                      }}
                                    />
                                    {disciplina.nome}
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {t("fields.education")}
                        </label>

                        <input
                          value={editFormacao}
                          onChange={(e) => setEditFormacao(e.target.value)}
                          className="w-full rounded border p-2"
                          placeholder={t("fields.educationExample")}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {t("fields.area")}
                        </label>

                        <input
                          value={editAreaAtuacao}
                          onChange={(e) => setEditAreaAtuacao(e.target.value)}
                          className="w-full rounded border p-2"
                          placeholder={t("fields.areaExample")}
                        />
                      </div>
                      <input
                        value={editCodigoFuncionario}
                        onChange={(e) => setEditCodigoFuncionario(e.target.value)}
                        className="rounded border p-2"
                        placeholder={t("fields.employeeCode")}
                      />
                      <input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="rounded border p-2"
                        placeholder={t("fields.publicSlug")}
                      />

                      <div className="professores-vinculo-rh-card md:col-span-2 rounded-2xl border p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <input
                            id={`editar-professor-vinculo-rh-${p.id}`}
                            type="checkbox"
                            checked={editPossuiVinculoRH}
                            disabled={Boolean(
                              p.funcionarioId || p.funcionario?.id
                            )}
                            onChange={(e) => {
                              const marcado = e.target.checked;

                              setEditPossuiVinculoRH(marcado);

                              if (!marcado) {
                                setEditDadosTrabalhistas({
                                  ...DADOS_TRABALHISTAS_PROFESSOR_INICIAIS,
                                });
                              }
                            }}
                            className="mt-1 h-4 w-4"
                          />

                          <label
                            htmlFor={`editar-professor-vinculo-rh-${p.id}`}
                            className={
                              p.funcionarioId || p.funcionario?.id
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            }
                          >
                            <span className="professores-vinculo-rh-titulo block font-bold">
                              {t("employment.hasRelationship")}
                            </span>

                            <span className="professores-vinculo-rh-texto mt-1 block text-sm">
                              {p.funcionarioId || p.funcionario?.id
                                ? t("rh.edit.alreadyLinked")
                                : t("rh.edit.markToInclude")}
                            </span>
                          </label>
                        </div>

                        {!editPossuiVinculoRH && (
                          <div className="professores-vinculo-rh-aviso mt-4 rounded-xl border p-4 text-sm">
                            {t("rh.edit.academicOnly")}
                          </div>
                        )}

                        {editPossuiVinculoRH && (
                          <div className="mt-5 space-y-5">
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                                {t("rh.edit.title")}
                              </h3>

                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {t("rh.edit.description")}
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.department")}
                                </label>

                                <select
                                  value={editDadosTrabalhistas.departamentoId}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "departamentoId",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                >
                                  <option value="">
                                    {t("rh.fields.selectDepartment")}
                                  </option>

                                  {departamentos.map((departamento) => (
                                    <option
                                      key={departamento.id}
                                      value={String(departamento.id)}
                                    >
                                      {departamento.nome}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.role")}
                                </label>

                                <input
                                  value={editDadosTrabalhistas.cargo === "Professor" ? t("rh.placeholders.role") : editDadosTrabalhistas.cargo}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "cargo",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder={t("rh.placeholders.role")}
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.sector")}
                                </label>

                                <input
                                  value={editDadosTrabalhistas.setor === "Acadêmico" ? t("rh.placeholders.sector") : editDadosTrabalhistas.setor}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "setor",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder={t("rh.placeholders.sector")}
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.hireDate")}
                                </label>

                                <input
                                  type="date"
                                  value={editDadosTrabalhistas.dataAdmissao}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "dataAdmissao",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.contractType")}
                                </label>

                                <select
                                  value={editDadosTrabalhistas.tipoContrato}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "tipoContrato",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                >
                                  <option value="">{t("rh.fields.selectContractType")}</option>
                                  <option value="CLT">CLT</option>
                                  <option value="PJ">{t("rh.contractTypes.legalEntity")}</option>
                                  <option value="AUTONOMO">{t("rh.contractTypes.selfEmployed")}</option>
                                  <option value="TEMPORARIO">{t("rh.contractTypes.temporary")}</option>
                                  <option value="ESTAGIO">{t("rh.contractTypes.internship")}</option>
                                  <option value="VOLUNTARIO">{t("rh.contractTypes.volunteer")}</option>
                                  <option value="OUTRO">{t("rh.contractTypes.other")}</option>
                                </select>
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.workSchedule")}
                                </label>

                                <input
                                  value={editDadosTrabalhistas.jornadaTrabalho}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "jornadaTrabalho",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder={t("rh.placeholders.workSchedule")}
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.weeklyHours")}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editDadosTrabalhistas.cargaHorariaSemanal}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "cargaHorariaSemanal",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder="Ex.: 20"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.monthlyHours")}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={editDadosTrabalhistas.cargaHorariaMensal}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "cargaHorariaMensal",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                  placeholder="Ex.: 80"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-sm font-semibold">
                                  {t("rh.fields.payType")}
                                </label>

                                <select
                                  value={editDadosTrabalhistas.tipoRemuneracao}
                                  onChange={(e) =>
                                    atualizarDadoTrabalhistaEdicao(
                                      "tipoRemuneracao",
                                      e.target.value as TipoRemuneracaoProfessor
                                    )
                                  }
                                  className="w-full rounded-lg border p-2"
                                >
                                  <option value="">{t("rh.fields.selectPayType")}</option>
                                  <option value="MENSAL">{t("rh.payTypes.monthly")}</option>
                                  <option value="HORA_AULA">{t("rh.payTypes.classHour")}</option>
                                  <option value="HORA_TRABALHADA">{t("rh.payTypes.workedHour")}</option>
                                  <option value="POR_AULA">{t("rh.payTypes.perClass")}</option>
                                  <option value="POR_TURMA">{t("rh.payTypes.perClassGroup")}</option>
                                  <option value="POR_DISCIPLINA">{t("rh.payTypes.perSubject")}</option>
                                  <option value="MISTO">{t("rh.payTypes.mixed")}</option>
                                  <option value="SEM_REMUNERACAO">{t("rh.payTypes.unpaid")}</option>
                                </select>
                              </div>
                            </div>

                            {editDadosTrabalhistas.tipoRemuneracao &&
                              editDadosTrabalhistas.tipoRemuneracao !==
                              "SEM_REMUNERACAO" && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                                  <h4 className="font-bold">
                                    {t("rh.compensation.valuesTitle")}
                                  </h4>

                                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {(editDadosTrabalhistas.tipoRemuneracao ===
                                      "MENSAL" ||
                                      editDadosTrabalhistas.tipoRemuneracao ===
                                      "MISTO") && (
                                        <div>
                                          <label className="mb-1 block text-sm font-semibold">
                                            {t("rh.fields.monthlySalary")}
                                          </label>

                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editDadosTrabalhistas.salarioBase}
                                            onChange={(e) =>
                                              atualizarDadoTrabalhistaEdicao(
                                                "salarioBase",
                                                e.target.value
                                              )
                                            }
                                            className="w-full rounded-lg border p-2"
                                            placeholder="0,00"
                                          />
                                        </div>
                                      )}

                                    {(editDadosTrabalhistas.tipoRemuneracao ===
                                      "HORA_AULA" ||
                                      editDadosTrabalhistas.tipoRemuneracao ===
                                      "MISTO") && (
                                        <>
                                          <div>
                                            <label className="mb-1 block text-sm font-semibold">
                                              {t("rh.fields.classHourValue")}
                                            </label>

                                            <input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={
                                                editDadosTrabalhistas.valorHoraAula
                                              }
                                              onChange={(e) =>
                                                atualizarDadoTrabalhistaEdicao(
                                                  "valorHoraAula",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full rounded-lg border p-2"
                                              placeholder="0,00"
                                            />
                                          </div>

                                          <div>
                                            <label className="mb-1 block text-sm font-semibold">
                                              {t("rh.fields.classHourDurationMinutes")}
                                            </label>

                                            <input
                                              type="number"
                                              min="1"
                                              step="1"
                                              value={
                                                editDadosTrabalhistas
                                                  .duracaoHoraAulaMinutos
                                              }
                                              onChange={(e) =>
                                                atualizarDadoTrabalhistaEdicao(
                                                  "duracaoHoraAulaMinutos",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full rounded-lg border p-2"
                                            />
                                          </div>
                                        </>
                                      )}

                                    {(editDadosTrabalhistas.tipoRemuneracao ===
                                      "HORA_TRABALHADA" ||
                                      editDadosTrabalhistas.tipoRemuneracao ===
                                      "MISTO") && (
                                        <div>
                                          <label className="mb-1 block text-sm font-semibold">
                                            {t("rh.fields.workedHourValue")}
                                          </label>

                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                              editDadosTrabalhistas.valorHoraTrabalhada
                                            }
                                            onChange={(e) =>
                                              atualizarDadoTrabalhistaEdicao(
                                                "valorHoraTrabalhada",
                                                e.target.value
                                              )
                                            }
                                            className="w-full rounded-lg border p-2"
                                            placeholder="0,00"
                                          />
                                        </div>
                                      )}

                                    {(editDadosTrabalhistas.tipoRemuneracao ===
                                      "POR_AULA" ||
                                      editDadosTrabalhistas.tipoRemuneracao ===
                                      "MISTO") && (
                                        <div>
                                          <label className="mb-1 block text-sm font-semibold">
                                            {t("rh.fields.perClassValue")}
                                          </label>

                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editDadosTrabalhistas.valorPorAula}
                                            onChange={(e) =>
                                              atualizarDadoTrabalhistaEdicao(
                                                "valorPorAula",
                                                e.target.value
                                              )
                                            }
                                            className="w-full rounded-lg border p-2"
                                            placeholder="0,00"
                                          />
                                        </div>
                                      )}

                                    {(editDadosTrabalhistas.tipoRemuneracao ===
                                      "POR_TURMA" ||
                                      editDadosTrabalhistas.tipoRemuneracao ===
                                      "MISTO") && (
                                        <div>
                                          <label className="mb-1 block text-sm font-semibold">
                                            {t("rh.fields.perClassGroupValue")}
                                          </label>

                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editDadosTrabalhistas.valorPorTurma}
                                            onChange={(e) =>
                                              atualizarDadoTrabalhistaEdicao(
                                                "valorPorTurma",
                                                e.target.value
                                              )
                                            }
                                            className="w-full rounded-lg border p-2"
                                            placeholder="0,00"
                                          />
                                        </div>
                                      )}

                                    {(editDadosTrabalhistas.tipoRemuneracao ===
                                      "POR_DISCIPLINA" ||
                                      editDadosTrabalhistas.tipoRemuneracao ===
                                      "MISTO") && (
                                        <div>
                                          <label className="mb-1 block text-sm font-semibold">
                                            {t("rh.fields.perSubjectValue")}
                                          </label>

                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                              editDadosTrabalhistas.valorPorDisciplina
                                            }
                                            onChange={(e) =>
                                              atualizarDadoTrabalhistaEdicao(
                                                "valorPorDisciplina",
                                                e.target.value
                                              )
                                            }
                                            className="w-full rounded-lg border p-2"
                                            placeholder="0,00"
                                          />
                                        </div>
                                      )}
                                  </div>
                                </div>
                              )}

                            {houveAlteracaoRemuneracaoEdicao && (
                              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
                                <h4 className="font-bold text-amber-950 dark:text-amber-100">
                                  {t("rh.change.title")}
                                </h4>

                                <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
                                  {t("rh.change.description")}
                                </p>

                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-sm font-semibold text-amber-950 dark:text-amber-100">
                                      {t("rh.change.effectiveFrom")}
                                    </label>

                                    <input
                                      type="datetime-local"
                                      value={
                                        editVigenciaInicioRemuneracao
                                      }
                                      onChange={(evento) =>
                                        setEditVigenciaInicioRemuneracao(
                                          evento.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-amber-300 bg-white p-2 text-slate-900 dark:border-amber-700 dark:bg-slate-950 dark:text-white"
                                      required
                                    />

                                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                                      {t("rh.change.effectiveHelp")}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-sm font-semibold text-amber-950 dark:text-amber-100">
                                      {t("rh.change.reason")}
                                    </label>

                                    <textarea
                                      value={
                                        editMotivoAlteracaoRemuneracao
                                      }
                                      onChange={(evento) =>
                                        setEditMotivoAlteracaoRemuneracao(
                                          evento.target.value
                                        )
                                      }
                                      className="min-h-[100px] w-full rounded-lg border border-amber-300 bg-white p-3 text-slate-900 dark:border-amber-700 dark:bg-slate-950 dark:text-white"
                                      placeholder={t("rh.change.reasonPlaceholder")}
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-slate-950/50 dark:text-amber-200">
                                  {t("rh.change.auditNotice")}
                                </div>
                              </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {[
                                ["codigoPonto", t("rh.fields.timeClockCode")],
                                ["pisPasep", t("rh.fields.pisPasep")],
                                ["banco", t("rh.fields.payrollBank")],
                                ["agencia", t("rh.fields.bankBranch")],
                                ["conta", t("rh.fields.bankAccount")],
                                ["pix", t("rh.fields.pixKey")],
                              ].map(([campo, titulo]) => {
                                if (campo === "banco") {
                                  return (
                                    <div key={campo}>
                                      <label
                                        htmlFor={`banco-professor-edicao-${editandoId ?? "atual"}`}
                                        className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                                      >
                                        {titulo}
                                      </label>

                                      <BuscaBanco
                                        id={`banco-professor-edicao-${editandoId ?? "atual"}`}
                                        value={editDadosTrabalhistas.banco}
                                        onChange={(valor) =>
                                          atualizarDadoTrabalhistaEdicao("banco", valor)
                                        }
                                        placeholder={t("rh.placeholders.bankSearch")}
                                        ariaLabel={t("rh.placeholders.bankSearchAria")}
                                      />

                                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        {t("rh.help.bankSearch")}
                                      </p>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={campo}>
                                    <label className="mb-1 block text-sm font-semibold">
                                      {titulo}
                                    </label>

                                    <input
                                      value={
                                        editDadosTrabalhistas[
                                        campo as keyof DadosTrabalhistasProfessorForm
                                        ]
                                      }
                                      onChange={(e) =>
                                        atualizarDadoTrabalhistaEdicao(
                                          campo as keyof DadosTrabalhistasProfessorForm,
                                          e.target.value as never
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-semibold">
                                {t("rh.fields.compensationNotes")}
                              </label>

                              <textarea
                                value={
                                  editDadosTrabalhistas.observacoesRemuneracao
                                }
                                onChange={(e) =>
                                  atualizarDadoTrabalhistaEdicao(
                                    "observacoesRemuneracao",
                                    e.target.value
                                  )
                                }
                                className="min-h-[100px] w-full rounded-lg border p-3"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="phanyx-foto-oficial-card md:col-span-2">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="phanyx-foto-oficial-preview">
                            {editFotoPerfil ? (
                              <img
                                src={editFotoPerfil}
                                alt={editNome || t("photo.alt")}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-3xl font-black text-slate-400">
                                {editNome?.charAt(0)?.toUpperCase() || "P"}
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="phanyx-foto-oficial-titulo">
                              {t("photo.title")}
                            </h3>

                            <p className="phanyx-foto-oficial-texto">
                              {t("photo.editDescription")}
                            </p>

                            <p className="phanyx-foto-oficial-ajuda">
                              {t("photo.help")}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <label className="phanyx-foto-oficial-botao">
                                {editEnviandoFotoPerfil ? t("actions.uploading") : t("actions.changePhoto")}
                                <input
                                  ref={inputEditFotoProfessorRef}
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/webp"
                                  disabled={editEnviandoFotoPerfil}
                                  onChange={(e) => {
                                    const arquivo =
                                      e.currentTarget.files?.[0] || null;

                                    e.currentTarget.value = "";

                                    void enviarFotoOficialProfessor(
                                      arquivo,
                                      "EDICAO"
                                    );
                                  }}
                                  className="hidden"
                                />
                              </label>

                              {editFotoPerfil && (
                                <button
                                  type="button"
                                  onClick={() => setEditFotoPerfil("")}
                                  className="phanyx-foto-oficial-remover"
                                >
                                  {t("actions.removePhoto")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <input
                        value={editDocumentoUrl}
                        onChange={(e) => setEditDocumentoUrl(e.target.value)}
                        className="rounded border p-2"
                        placeholder={t("documents.urlPlaceholder")}
                      />

                      <div
                        className="
    phanyx-documentos-professor
    md:col-span-2
    rounded-2xl
    border
    border-slate-300
    bg-white
    p-5
    shadow-sm
    dark:border-slate-700
    dark:bg-slate-900
  "
                      >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {t("documents.title")}
                        </h3>

                        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                          {t("documents.description")}
                        </p>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          {documentosProfessor.map((doc, index) => (
                            <div
                              key={doc.tipo}
                              className="rounded-2xl border p-4 shadow-sm"
                            >
                              <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {nomeDocumentoProfessor(doc.tipo, doc.titulo)}
                              </label>

                              <input
                                id={`edit-arquivo-professor-${doc.tipo}`}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.psd,.ai,.eps,.svg,.blend,.fbx,.obj,.glb,.gltf,.ma,.mb,.max,.zip,.rar"
                                className="hidden"
                                onChange={(e) => {
                                  const arquivo = e.target.files?.[0] || null;

                                  setDocumentosProfessor((prev) =>
                                    prev.map((item, i) =>
                                      i === index ? { ...item, arquivo } : item
                                    )
                                  );
                                }}
                              />

                              <label
                                htmlFor={`edit-arquivo-professor-${doc.tipo}`}
                                className="phanyx-upload-funcionario"
                              >
                                <span>📎</span>
                                <span>{t("actions.selectFile")}</span>
                              </label>

                              {doc.arquivo && (
                                <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                  {doc.arquivo.name}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    <textarea
                      value={editMiniBio}
                      onChange={(e) => setEditMiniBio(e.target.value)}
                      className="min-h-[120px] w-full rounded border p-2"
                      placeholder={t("fields.miniBio")}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => salvarEdicao(p.id)}
                        disabled={salvandoId === p.id}
                        className="rounded bg-green-600 px-3 py-1 text-slate-900 dark:text-white disabled:opacity-50"
                      >
                        {salvandoId === p.id ? t("actions.saving") : t("actions.save")}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditandoId(null);
                          setEditPossuiVinculoRH(false);
                          setEditDisciplinasAberto(false);

                          setEditAssinaturaRemuneracaoOriginal("");
                          setEditMotivoAlteracaoRemuneracao("");
                          setEditVigenciaInicioRemuneracao("");

                          setEditDadosTrabalhistas({
                            ...DADOS_TRABALHISTAS_PROFESSOR_INICIAIS,
                          });
                        }}
                        className="rounded bg-gray-400 px-3 py-1 text-slate-900 dark:text-white"
                      >
                        {t("actions.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium">{p.nome}</p>
                    <p className="text-sm text-gray-600">{p.user?.email}</p>
                    <p className="text-sm text-gray-600">
                      {t("list.campus")}: {p.polo?.nome || "-"}
                    </p>
                    <p className="text-sm text-gray-600">CPF: {p.cpf || "-"}</p>
                    <p className="text-sm text-gray-600">RG: {p.rg || "-"}</p>
                    <p className="text-sm text-gray-600">
                      {t("fields.phone")}: {p.telefone || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("fields.academicDegree")}: {p.titulacao || "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {t("fields.education")}: {p.formacao || "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {t("fields.area")}: {p.areaAtuacao || "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {t("disciplines.enabled")}: {p.especialidade || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("fields.code")}: {p.codigoFuncionario || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Slug: {p.slug || "-"}
                    </p>

                    {p.funcionarioId && (
                      <details className="professores-historico-remuneracao mt-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                        <summary className="cursor-pointer list-none px-4 py-3 font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center justify-between gap-3">
                            <span>
                              {t("history.title")}
                            </span>

                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {Array.isArray(
                                p.historicosRemuneracaoRH
                              )
                                ? t("history.count", {
                                  count:
                                    p.historicosRemuneracaoRH.length,
                                })
                                : t("history.count", {
                                  count: 0,
                                })}
                            </span>
                          </span>
                        </summary>

                        <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                          {!Array.isArray(
                            p.historicosRemuneracaoRH
                          ) ||
                            p.historicosRemuneracaoRH.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                              {t("history.empty")}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {p.historicosRemuneracaoRH.map(
                                (historico) => (
                                  <article
                                    key={historico.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950"
                                  >
                                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-700 md:flex-row md:items-start md:justify-between">
                                      <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">
                                          {traduzirOrigemHistoricoProfessor(
                                            historico.origem,
                                            t as any
                                          )}
                                        </h4>

                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                          {t("history.recordedAt")}{" "}
                                          {formatarDataHoraProfessor(
                                            historico.alteradoEm,
                                            locale
                                          )}
                                        </p>
                                      </div>

                                      <div className="text-sm md:text-right">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                          {
                                            historico.alteradoPorNomeSnapshot
                                          }
                                        </p>

                                        <p className="text-slate-600 dark:text-slate-400">
                                          {historico.alteradoPorRoleSnapshot ||
                                            t("history.roleNotProvided")}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-100">
                                        <h5 className="mb-3 font-bold">
                                          {t("history.previousCondition")}
                                        </h5>

                                        <ResumoRemuneracaoProfessor
                                          dados={
                                            historico.dadosAnteriores
                                          }
                                          t={t as any}
                                          locale={locale}
                                        />
                                      </div>

                                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100">
                                        <h5 className="mb-3 font-bold">
                                          {t("history.newCondition")}
                                        </h5>

                                        <ResumoRemuneracaoProfessor
                                          dados={
                                            historico.dadosNovos
                                          }
                                          t={t as any}
                                          locale={locale}
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                                        <p className="font-semibold">
                                          {t("history.effectiveFrom")}
                                        </p>

                                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                                          {formatarDataHoraProfessor(
                                            historico.vigenciaInicio,
                                            locale
                                          )}
                                        </p>
                                      </div>

                                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                                        <p className="font-semibold">
                                          {t("history.recordedDateTime")}
                                        </p>

                                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                                          {formatarDataHoraProfessor(
                                            historico.alteradoEm,
                                            locale
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                                      <p className="font-semibold">
                                        {t("history.reason")}
                                      </p>

                                      <p className="mt-1 whitespace-pre-wrap">
                                        {historico.motivo ||
                                          t("history.reasonNotProvided")}
                                      </p>
                                    </div>
                                  </article>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    <div className="mt-3 flex gap-4">
                      <button
                        onClick={() => iniciarEdicao(p)}
                        className="text-sm text-blue-600"
                      >
                        {t("actions.edit")}
                      </button>

                      <button
                        onClick={() => setProfessorParaExcluir(p)}
                        className="text-sm text-red-600"
                      >
                        {t("actions.delete")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {erroFotoProfessor && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-erro-foto-professor"
        >
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-950">
              🖼️
            </div>

            <h2
              id="titulo-erro-foto-professor"
              className="mt-4 text-xl font-bold text-slate-950 dark:text-white"
            >
              {erroFotoProfessor.titulo}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
              {erroFotoProfessor.mensagem}
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setErroFotoProfessor(null)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {t("actions.close")}
              </button>

              <button
                type="button"
                onClick={() => {
                  const modo =
                    erroFotoProfessor.modo;

                  setErroFotoProfessor(null);

                  window.setTimeout(() => {
                    if (modo === "EDICAO") {
                      inputEditFotoProfessorRef.current?.click();
                    } else {
                      inputFotoProfessorRef.current?.click();
                    }
                  }, 0);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
              >
                {t("actions.chooseAnotherPhoto")}
              </button>
            </div>
          </div>
        </div>
      )}

      {professorParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white dark:bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {t("deleteModal.title")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("deleteModal.questionBefore")}{" "}
                  <strong>&quot;{professorParaExcluir.nome}&quot;</strong>?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("deleteModal.irreversible")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProfessorParaExcluir(null)}
                disabled={excluindoId === professorParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("actions.cancel")}
              </button>

              <button
                type="button"
                onClick={confirmarExclusaoProfessor}
                disabled={excluindoId === professorParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === professorParaExcluir.id
                  ? t("actions.deleting")
                  : t("actions.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(AdminProfessoresPage, ["admin"]);