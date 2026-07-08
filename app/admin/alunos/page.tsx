"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";

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

type SituacaoAcademicaFiltro = "TODOS" | "MATRICULADOS" | "SEM_MATRICULA";

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
  const searchParams = useSearchParams();

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

const [abaPainelAluno, setAbaPainelAluno] = useState<
  | "DADOS"
  | "DOCUMENTOS"
  | "MATRICULAS"
  | "DESEMPENHO"
  | "HISTORICO"
  | "CERTIFICADOS"
>("DADOS");

  const [mostrarFormulario, setMostrarFormulario] = useState(true);

  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
  const [modalAvisoTitulo, setModalAvisoTitulo] = useState("");
  const [modalAvisoMensagem, setModalAvisoMensagem] = useState("");
  const [modalAvisoTipo, setModalAvisoTipo] = useState<"sucesso" | "erro">(
    "erro"
  );

  const [nome, setNome] = useState("");
  const [nomeSocial, setNomeSocial] = useState("");
  const [genero, setGenero] = useState("");
  const [email, setEmail] = useState("");
  const [matricula] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");

  const [novoAlunoDocumentos, setNovoAlunoDocumentos] = useState<{
  proprietario: "ALUNO" | "RESPONSAVEL";
  tipo: string;
  arquivo: File;
}[]>([]);

  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");
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
  const [editDataNascimento, setEditDataNascimento] = useState("");
  const [editCep, setEditCep] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editNumero, setEditNumero] = useState("");
  const [editComplemento, setEditComplemento] = useState("");
  const [editBairro, setEditBairro] = useState("");
  const [editCidade, setEditCidade] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editDocumentoUrl, setEditDocumentoUrl] = useState("");
  const [editNomeResponsavel, setEditNomeResponsavel] = useState("");
  const [editCpfResponsavel, setEditCpfResponsavel] = useState("");
  const [editTelefoneResponsavel, setEditTelefoneResponsavel] = useState("");
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

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
  carregarTudo();
}, []);

useEffect(() => {
  carregarAlunos();
}, [paginaAtual, filtroStatus, busca]);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

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

    const res = await fetch(`/api/aluno?${params.toString()}`, {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Erro ao buscar alunos:", data);
      mostrarFeedback(
        "erro",
        data?.error || "Não foi possível carregar a lista de alunos."
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
    mostrarFeedback("erro", "Erro ao carregar alunos.");
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

    if (!res.ok) {
      console.error("Erro ao buscar polos");
      return;
    }

    const data = await res.json();
    setPolos(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro ao carregar polos:", error);
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
    setDataNascimento("");
    setCep("");
    setEndereco("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setDocumentoUrl("");
    setNomeResponsavel("");
    setCpfResponsavel("");
    setTelefoneResponsavel("");
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
      `${doc.tipo} - ${doc.proprietario === "ALUNO" ? "Aluno" : "Responsável"}`
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

  async function handleCriarAluno(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

      const res = await fetch("/api/aluno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          email,
          nomeSocial,
          genero,
          cpf,
          rg,
          telefone,
          dataNascimento: dataNascimento || null,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          documentoUrl,
          nomeResponsavel,
          cpfResponsavel,
          telefoneResponsavel,
          emailResponsavel,
          parentescoResponsavel,
          statusAluno,
          poloId: poloId ? Number(poloId) : null,
          possuiNecessidadeEspecial,
          descricaoNecessidadeEspecial,
          observacoesAcessibilidade,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const mensagem = data?.error || data?.detalhe || "Erro ao criar aluno";
        mostrarFeedback("erro", mensagem);
        abrirModalAviso("erro", "Não foi possível criar", mensagem);
        window.scrollTo({ top: 0, behavior: "smooth" });
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

limparFormularioCriacao();

await carregarTudo();

mostrarFeedback("sucesso", "Aluno criado com sucesso.");
abrirModalAviso(
  "sucesso",
  "Aluno criado",
  data?.avisoEmail || "O aluno foi criado com sucesso no sistema."
);
window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error: any) {
      const mensagem = error?.message || "Erro ao criar aluno";
      mostrarFeedback("erro", mensagem);
      abrirModalAviso("erro", "Erro ao criar aluno", mensagem);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setCriando(false);
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
    setEditTelefone(aluno.telefone || "");
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
    setEditNomeResponsavel(aluno.nomeResponsavel || "");
    setEditCpfResponsavel(aluno.cpfResponsavel || "");
    setEditTelefoneResponsavel(aluno.telefoneResponsavel || "");
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
          telefone: editTelefone,
          dataNascimento: editDataNascimento || null,
          cep: editCep,
          endereco: editEndereco,
          numero: editNumero,
          complemento: editComplemento,
          bairro: editBairro,
          cidade: editCidade,
          estado: editEstado,
          documentoUrl: editDocumentoUrl,
          nomeResponsavel: editNomeResponsavel,
          cpfResponsavel: editCpfResponsavel,
          telefoneResponsavel: editTelefoneResponsavel,
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
        throw new Error(data.error || "Erro ao atualizar");
      }

      setEditandoId(null);
      await carregarTudo();
      mostrarFeedback("sucesso", "Aluno atualizado com sucesso.");
      abrirModalAviso(
        "sucesso",
        "Aluno atualizado",
        "As informações do aluno foram atualizadas com sucesso."
      );
    } catch (error: any) {
      const mensagem = error?.message || "Erro ao atualizar";
      mostrarFeedback("erro", mensagem);
      abrirModalAviso("erro", "Erro ao atualizar", mensagem);
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
        const mensagem = data?.error || "Erro ao cancelar aluno.";
        mostrarFeedback("erro", mensagem);
        abrirModalAviso("erro", "Não foi possível cancelar", mensagem);
        return;
      }

      await carregarTudo();
      mostrarFeedback("sucesso", "Aluno cancelado com sucesso.");
      abrirModalAviso(
        "sucesso",
        "Aluno cancelado",
        "O aluno foi mantido no sistema com status Cancelado."
      );
    } catch (error: any) {
      const mensagem = error?.message || "Erro ao cancelar aluno.";
      mostrarFeedback("erro", mensagem);
      abrirModalAviso("erro", "Erro ao cancelar", mensagem);
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
        const mensagem = data?.error || "Erro ao reativar aluno.";
        mostrarFeedback("erro", mensagem);
        abrirModalAviso("erro", "Não foi possível reativar", mensagem);
        return;
      }

      await carregarTudo();
      mostrarFeedback("sucesso", "Aluno reativado com sucesso.");
      abrirModalAviso(
        "sucesso",
        "Aluno reativado",
        "O aluno voltou a ficar com status Ativo."
      );
    } catch (error: any) {
      const mensagem = error?.message || "Erro ao reativar aluno.";
      mostrarFeedback("erro", mensagem);
      abrirModalAviso("erro", "Erro ao reativar", mensagem);
    }
  }

  function labelStatusAluno(status?: StatusAluno) {
    switch (status) {
      case "ATIVO":
        return "Ativo";
      case "TRANCADO":
        return "Trancado";
      case "SUSPENSO":
        return "Suspenso";
      case "INADIMPLENTE":
        return "Inadimplente";
      case "TRANSFERIDO":
        return "Transferido";
      case "DESLIGADO":
        return "Desligado";
      case "FORMADO":
        return "Formado";
      case "CANCELADO":
        return "Cancelado";
      case "PAUSA_MEDICA":
        return "Pausa médica";
      case "FALTANTE":
        return "Faltante";
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
      mostrarFeedback("erro", "CEP não encontrado.");
      return;
    }

    setEndereco(data.logradouro || "");
    setBairro(data.bairro || "");
    setCidade(data.localidade || "");
    setEstado(data.uf || "");
  } catch {
    mostrarFeedback("erro", "Não foi possível buscar o endereço pelo CEP.");
  }
}

async function buscarEnderecoEdicaoPorCep(valorCep: string) {
  const cepLimpo = valorCep.replace(/\D/g, "");

  if (cepLimpo.length !== 8) return;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await res.json();

    if (data?.erro) {
      mostrarFeedback("erro", "CEP não encontrado.");
      return;
    }

    setEditEndereco(data.logradouro || "");
    setEditBairro(data.bairro || "");
    setEditCidade(data.localidade || "");
    setEditEstado(data.uf || "");
  } catch {
    mostrarFeedback("erro", "Não foi possível buscar o endereço pelo CEP.");
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
        (filtroSituacaoAcademica === "SEM_MATRICULA" && !matriculado);

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
      throw new Error(data?.error || "Erro ao carregar documentos arquivados.");
    }

    setDocumentosArquivadosAluno(Array.isArray(data) ? data : []);
  } catch (error: any) {
    setDocumentosArquivadosAluno([]);
    mostrarFeedback(
      "erro",
      error?.message || "Erro ao carregar documentos arquivados."
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
      throw new Error(data?.error || "Erro ao carregar documentos.");
    }

    setDocumentosAluno(Array.isArray(data) ? data : []);
  } catch (error: any) {
    setDocumentosAluno([]);
    mostrarFeedback("erro", error?.message || "Erro ao carregar documentos.");
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
      throw new Error(data?.error || "Erro ao restaurar documento.");
    }

    await carregarDocumentosAluno(alunoSelecionado.id);
    await carregarDocumentosArquivadosAluno(alunoSelecionado.id);

    abrirModalAviso(
      "sucesso",
      "Documento restaurado",
      "O documento voltou para a lista ativa."
    );
  } catch (error: any) {
    abrirModalAviso(
      "erro",
      "Erro ao restaurar",
      error?.message || "Não foi possível restaurar o documento."
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
      throw new Error(data?.error || "Erro ao arquivar documento.");
    }

    await carregarDocumentosAluno(alunoSelecionado.id);

    mostrarFeedback("sucesso", "Documento arquivado com sucesso.");
    abrirModalAviso(
      "sucesso",
      "Documento arquivado",
      "O documento foi arquivado e não aparece mais na lista ativa."
    );
  } catch (error: any) {
    abrirModalAviso(
      "erro",
      "Erro ao arquivar",
      error?.message || "Não foi possível arquivar o documento."
    );
  }
}

async function enviarDocumentoAluno() {
  if (!alunoSelecionado) return;

  if (!documentoArquivo) {
    abrirModalAviso(
      "erro",
      "Arquivo obrigatório",
      "Selecione um arquivo antes de enviar."
    );
    return;
  }

  try {
    setEnviandoDocumentoAluno(true);

    const formData = new FormData();
    formData.append(
      "titulo",
      `${documentoTipo} - ${
        documentoProprietario === "ALUNO" ? "Aluno" : "Responsável"
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
      throw new Error(data?.error || "Erro ao enviar documento.");
    }

    setDocumentoArquivo(null);
    await carregarDocumentosAluno(alunoSelecionado.id);

    mostrarFeedback("sucesso", "Documento enviado com sucesso.");
    abrirModalAviso(
      "sucesso",
      "Documento enviado",
      "O documento foi salvo no cadastro do aluno."
    );
  } catch (error: any) {
    abrirModalAviso(
      "erro",
      "Erro ao enviar documento",
      error?.message || "Não foi possível enviar o documento."
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
      throw new Error(data?.error || "Erro ao carregar desempenho.");
    }

    setDesempenhoAluno(data);
  } catch (error: any) {
    setDesempenhoAluno(null);
    mostrarFeedback(
      "erro",
      error?.message || "Erro ao carregar desempenho acadêmico."
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
  "Não foi possível gerar o certificado.";

      mostrarFeedback("erro", mensagem);
      abrirModalAviso("erro", "Erro ao gerar certificado", mensagem);
      return;
    }

    mostrarFeedback("sucesso", "Certificado gerado com sucesso.");
    abrirModalAviso(
      "sucesso",
      "Certificado gerado",
      "O certificado foi gerado e já deve ficar disponível na área do aluno."
    );
  } catch (error: any) {
    console.error("Erro ao gerar certificado do aluno:", error);

const mensagem =
  error?.message ||
  "Erro ao gerar certificado. Verifique se o aluno possui matrícula e disciplina vinculadas.";

    mostrarFeedback("erro", mensagem);
    abrirModalAviso("erro", "Erro ao gerar certificado", mensagem);
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
        "Não foi possível baixar o certificado.";

      mostrarFeedback("erro", mensagem);
      abrirModalAviso("erro", "Erro ao baixar certificado", mensagem);
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

    mostrarFeedback("sucesso", "Certificado baixado com sucesso.");
  } catch (error: any) {
    const mensagem = error?.message || "Erro ao baixar certificado.";

    mostrarFeedback("erro", mensagem);
    abrirModalAviso("erro", "Erro ao baixar certificado", mensagem);
  } finally {
    setBaixandoCertificado(false);
  }
}

  const turmaNomeSelecionada = useMemo(() => {
    if (filtroTurmaId === "TODAS") return "Todas as turmas";
    const turma = turmas.find((t) => t.id === Number(filtroTurmaId));
    return turma ? turma.nome : "Turma";
  }, [filtroTurmaId, turmas]);

  return (
  <div className="phanyx-admin-alunos-page">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              feedbackTipo === "sucesso"
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
                Gestão de alunos
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Alunos
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Organize alunos criados, matriculados, cancelados e por turma em
                uma visão mais profissional e operacional.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMostrarFormulario((prev) => !prev)}
                className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                {mostrarFormulario ? "Ocultar cadastro" : "Novo aluno"}
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
                Limpar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Total de alunos
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {totais.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Matriculados
            </p>
            <p className="mt-3 text-3xl font-bold text-blue-700">
              {totais.matriculados}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Sem matrícula
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-700">
              {totais.semMatricula}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Cancelados
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-600">
              {totais.cancelados}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Inadimplentes
            </p>
            <p className="mt-3 text-3xl font-bold text-red-600">
              {totais.inadimplentes}
            </p>
          </div>
        </section>

        {mostrarFormulario && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Novo aluno
              </h2>
              <p className="text-sm text-slate-500">
                Cadastre novos alunos com dados pessoais, responsável e
                acessibilidade.
              </p>
            </div>

            <form onSubmit={handleCriarAluno} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  placeholder="Nome do aluno"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                  required
                />

                <input
                  placeholder="Nome social"
                  value={nomeSocial}
                  onChange={(e) => setNomeSocial(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                >
                  <option value="">Gênero</option>
                  <option value="FEMININO">Feminino</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="NAO_BINARIO">Não binário</option>
                  <option value="OUTRO">Outro</option>
                  <option value="PREFIRO_NAO_INFORMAR">
                    Prefiro não informar
                  </option>
                </select>

                <input
  placeholder="Email"
  type="email"
  name="email-aluno-phanyx"
  autoComplete="new-password"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full rounded-xl border p-2.5"
  required
/>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
  <strong>Número da matrícula</strong>
  <br />
  Será gerado automaticamente após a matrícula oficial do aluno.
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

                <input
                  placeholder="Telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
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
                  <option value="ATIVO">Ativo</option>
                  <option value="TRANCADO">Trancado</option>
                  <option value="SUSPENSO">Suspenso</option>
                  <option value="INADIMPLENTE">Inadimplente</option>
                  <option value="TRANSFERIDO">Transferido</option>
                  <option value="DESLIGADO">Desligado</option>
                  <option value="FORMADO">Formado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="PAUSA_MEDICA">Pausa médica</option>
                  <option value="FALTANTE">Faltante</option>
                </select>

<select
  value={poloId}
  onChange={(e) => setPoloId(e.target.value)}
  className="w-full rounded-xl border p-2.5"
>
  <option value="">Selecione o polo do aluno</option>
  {polos.map((polo) => (
    <option key={polo.id} value={polo.id}>
      {polo.nome}
    </option>
  ))}
</select>

                <input
  placeholder="CEP"
  value={cep}
  onChange={(e) => {
    const valor = e.target.value;

    setCep(valor);

    if (valor.replace(/\D/g, "").length === 8) {
      buscarEnderecoPorCep(valor);
    }
  }}
  className="w-full rounded-xl border p-2.5"
/>

                <input
                  placeholder="Endereço"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder="Número"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder="Complemento"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder="Bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

                <input
                  placeholder="Estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

<div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
    Documentos do aluno
  </h3>

  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
    Opcional. Envie RG, CPF, CNH, Histórico Escolar, Comprovante de Residência ou Título de Eleitor.
  </p>

  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
    {["RG", "CPF", "CNH", "HISTORICO_ESCOLAR", "COMPROVANTE_RESIDENCIA", "TITULO_ELEITOR"].map((tipo) => (
      <label
        key={`aluno-${tipo}`}
        className="rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <span className="mb-2 block font-semibold">
          {tipo.replaceAll("_", " ")}
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
                  Necessidades especiais e acessibilidade
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
                    Possui necessidade especial
                  </label>

                  <div className="grid grid-cols-1 gap-4">
                    <textarea
                      placeholder="Descreva a necessidade especial do aluno"
                      value={descricaoNecessidadeEspecial}
                      onChange={(e) =>
                        setDescricaoNecessidadeEspecial(e.target.value)
                      }
                      className="min-h-[100px] w-full rounded-xl border p-2.5"
                    />

                    <textarea
                      placeholder="Observações de acessibilidade, apoio pedagógico ou adaptações"
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
                  Dados do responsável
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    placeholder="Nome do responsável"
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5"
                  />

                  <input
                    placeholder="CPF do responsável"
                    value={cpfResponsavel}
                    onChange={(e) => setCpfResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5"
                  />

                  <input
                    placeholder="Telefone do responsável"
                    value={telefoneResponsavel}
                    onChange={(e) => setTelefoneResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5"
                  />

                  <input
                    placeholder="Email do responsável"
                    type="email"
                    value={emailResponsavel}
                    onChange={(e) => setEmailResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5"
                  />

                  <input
                    placeholder="Parentesco do responsável"
                    value={parentescoResponsavel}
                    onChange={(e) => setParentescoResponsavel(e.target.value)}
                    className="w-full rounded-xl border p-2.5 md:col-span-2"
                  />

<div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
    Documentos do responsável
  </h3>

  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
    Opcional. Envie documentos do titular/responsável pelo aluno.
  </p>

  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
    {["RG", "CPF", "CNH", "COMPROVANTE_RESIDENCIA", "TITULO_ELEITOR"].map((tipo) => (
      <label
        key={`responsavel-${tipo}`}
        className="rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <span className="mb-2 block font-semibold">
          {tipo.replaceAll("_", " ")}
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
                disabled={criando}
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {criando ? "Criando..." : "Criar aluno"}
              </button>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Buscar e organizar alunos
              </h2>
              <p className="text-sm text-slate-500">
                Filtre por status, situação acadêmica, turma e texto livre.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <input
                type="text"
                placeholder="Buscar por nome, email, matrícula, CPF..."
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
                className="rounded-xl border px-3 py-2.5"
              >
                <option value="TODOS">Todos os status</option>
                <option value="ATIVO">Ativos</option>
                <option value="CANCELADO">Cancelados</option>
                <option value="INADIMPLENTE">Inadimplentes</option>
                <option value="TRANCADO">Trancados</option>
                <option value="FORMADO">Formados</option>
              </select>

              <select
                value={filtroSituacaoAcademica}
                onChange={(e) =>
                  setFiltroSituacaoAcademica(
                    e.target.value as SituacaoAcademicaFiltro
                  )
                }
                className="rounded-xl border px-3 py-2.5"
              >
                <option value="TODOS">Todos</option>
                <option value="MATRICULADOS">Matriculados</option>
                <option value="SEM_MATRICULA">Sem matrícula</option>
              </select>

              <select
                value={filtroTurmaId}
                onChange={(e) => setFiltroTurmaId(e.target.value)}
                className="rounded-xl border px-3 py-2.5"
              >
                <option value="TODAS">Todas as turmas</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={String(turma.id)}>
                    {turma.nome}
                    {turma.disciplinaNome ? ` • ${turma.disciplinaNome}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Exibindo <strong>{alunosFiltrados.length}</strong> de{" "}
<strong>{totalAlunos}</strong> aluno(s) —
              filtro atual: <strong>{turmaNomeSelecionada}</strong>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Aluno</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Curso</th>
                  <th className="px-4 py-3 font-semibold">Turma(s)</th>
                  <th className="px-4 py-3 font-semibold">Matrícula</th>
                  <th className="px-4 py-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Nenhum aluno encontrado para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  alunosFiltrados.map((a) => {
                    const resumo = a.resumoMatricula;

                    return (
                      <tr
                        key={a.id}
                        className={`border-t ${
                          a.statusAluno === "CANCELADO"
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
                          {resumo?.cursoNome || "Sem matrícula"}
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
                                  +{resumo.turmas.length - 2} turma(s)
                                </div>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-4 align-top text-slate-700">
                          <div>{a.matricula || "-"}</div>
                          <div className="text-xs text-slate-500">
                            {resumo?.status || "Sem vínculo"}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => abrirDetalhesAluno(a)}
                              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Ver
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
                              Contrato
                            </button>

                            {a.statusAluno === "CANCELADO" ? (
                              <button
                                type="button"
                                onClick={() => reativarAluno(a.id)}
                                className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                              >
                                Reativar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => cancelarAluno(a.id)}
                                className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
                              >
                                Cancelar
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
    Página <strong>{paginaAtual}</strong> de{" "}
    <strong>{totalPaginas}</strong> — total de{" "}
    <strong>{totalAlunos}</strong> aluno(s)
  </div>

  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      disabled={paginaAtual <= 1 || carregandoAlunos}
      onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Anterior
    </button>

    <button
      type="button"
      disabled={paginaAtual >= totalPaginas || carregandoAlunos}
      onClick={() =>
        setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
      }
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Próxima
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
                    Detalhes do aluno
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
                  Fechar
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">

              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
  {[
  { id: "DADOS", label: "Dados" },
  { id: "DOCUMENTOS", label: "Documentos" },
  { id: "MATRICULAS", label: "Matrículas" },
  { id: "DESEMPENHO", label: "Desempenho" },
  { id: "HISTORICO", label: "Histórico" },
  { id: "CERTIFICADOS", label: "Certificados" },
].map((aba) => (
    <button
      key={aba.id}
      type="button"
      onClick={() => setAbaPainelAluno(aba.id as any)}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
        abaPainelAluno === aba.id
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
                    Editar aluno
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Nome"
                    />
                    <input
                      value={editNomeSocial}
                      onChange={(e) => setEditNomeSocial(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Nome social"
                    />
                    <select
                      value={editGenero}
                      onChange={(e) => setEditGenero(e.target.value)}
                      className="rounded-xl border p-2.5"
                    >
                      <option value="">Gênero</option>
                      <option value="FEMININO">Feminino</option>
                      <option value="MASCULINO">Masculino</option>
                      <option value="NAO_BINARIO">Não binário</option>
                      <option value="OUTRO">Outro</option>
                      <option value="PREFIRO_NAO_INFORMAR">
                        Prefiro não informar
                      </option>
                    </select>
                    <input
  value={editEmail}
  onChange={(e) => setEditEmail(e.target.value)}
  className="rounded-xl border p-2.5"
  placeholder="Email"
  type="email"
  name="edit-email-aluno-phanyx"
  autoComplete="off"
/>
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
  Matrícula gerada automaticamente pelo sistema.
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
                    <input
                      value={editTelefone}
                      onChange={(e) => setEditTelefone(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Telefone"
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
                      <option value="ATIVO">Ativo</option>
                      <option value="TRANCADO">Trancado</option>
                      <option value="SUSPENSO">Suspenso</option>
                      <option value="INADIMPLENTE">Inadimplente</option>
                      <option value="TRANSFERIDO">Transferido</option>
                      <option value="DESLIGADO">Desligado</option>
                      <option value="FORMADO">Formado</option>
                      <option value="CANCELADO">Cancelado</option>
                      <option value="PAUSA_MEDICA">Pausa médica</option>
                      <option value="FALTANTE">Faltante</option>
                    </select>

<select
  value={editPoloId}
  onChange={(e) => setEditPoloId(e.target.value)}
  className="rounded-xl border p-2.5"
>
  <option value="">Selecione o polo do aluno</option>
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
      buscarEnderecoEdicaoPorCep(valor);
    }
  }}
  className="rounded-xl border p-2.5"
  placeholder="CEP"
/>
                    <input
                      value={editEndereco}
                      onChange={(e) => setEditEndereco(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Endereço"
                    />
                    <input
                      value={editNumero}
                      onChange={(e) => setEditNumero(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Número"
                    />
                    <input
                      value={editComplemento}
                      onChange={(e) => setEditComplemento(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Complemento"
                    />
                    <input
                      value={editBairro}
                      onChange={(e) => setEditBairro(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Bairro"
                    />
                    <input
                      value={editCidade}
                      onChange={(e) => setEditCidade(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Cidade"
                    />
                    <input
                      value={editEstado}
                      onChange={(e) => setEditEstado(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Estado"
                    />
                    <input
                      value={editDocumentoUrl}
                      onChange={(e) => setEditDocumentoUrl(e.target.value)}
                      className="rounded-xl border p-2.5 md:col-span-2"
                      placeholder="URL do documento"
                    />
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <h4 className="mb-3 font-semibold text-slate-900">
                      Necessidades especiais e acessibilidade
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
                        Possui necessidade especial
                      </label>

                      <textarea
                        value={editDescricaoNecessidadeEspecial}
                        onChange={(e) =>
                          setEditDescricaoNecessidadeEspecial(e.target.value)
                        }
                        className="min-h-[100px] w-full rounded-xl border p-2.5"
                        placeholder="Descreva a necessidade especial do aluno"
                      />

                      <textarea
                        value={editObservacoesAcessibilidade}
                        onChange={(e) =>
                          setEditObservacoesAcessibilidade(e.target.value)
                        }
                        className="min-h-[100px] w-full rounded-xl border p-2.5"
                        placeholder="Observações de acessibilidade"
                      />
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <h4 className="mb-3 font-semibold text-slate-900">
                      Responsável
                    </h4>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        value={editNomeResponsavel}
                        onChange={(e) => setEditNomeResponsavel(e.target.value)}
                        className="rounded-xl border p-2.5"
                        placeholder="Nome do responsável"
                      />
                      <input
                        value={editCpfResponsavel}
                        onChange={(e) => setEditCpfResponsavel(e.target.value)}
                        className="rounded-xl border p-2.5"
                        placeholder="CPF do responsável"
                      />
                      <input
                        value={editTelefoneResponsavel}
                        onChange={(e) =>
                          setEditTelefoneResponsavel(e.target.value)
                        }
                        className="rounded-xl border p-2.5"
                        placeholder="Telefone do responsável"
                      />
                      <input
                        value={editEmailResponsavel}
                        onChange={(e) =>
                          setEditEmailResponsavel(e.target.value)
                        }
                        className="rounded-xl border p-2.5"
                        placeholder="Email do responsável"
                      />
                      <input
                        value={editParentescoResponsavel}
                        onChange={(e) =>
                          setEditParentescoResponsavel(e.target.value)
                        }
                        className="rounded-xl border p-2.5 md:col-span-2"
                        placeholder="Parentesco do responsável"
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
                        ? "Salvando..."
                        : "Salvar alterações"}
                    </button>

                    <button
                      onClick={() => setEditandoId(null)}
                      className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancelar edição
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
                        📄 Baixar contrato
                      </button>

                      {alunoSelecionado.statusAluno === "CANCELADO" ? (
                        <button
                          onClick={() => reativarAluno(alunoSelecionado.id)}
                          className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Reativar aluno
                        </button>
                        
                      ) : (
                        <>
                        <button
  type="button"
  onClick={() => {
    if (!alunoSelecionado) return;
    iniciarEdicao(alunoSelecionado);
    setPainelAlunoAberto(false);
    setMostrarFormulario(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }}
  className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
>
  ✏️ Editar cadastro
</button>
                        <button
                          onClick={() => cancelarAluno(alunoSelecionado.id)}
                          className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                        >
                          Cancelar aluno
                        </button>
                          </>
                      )}
                    </div>
                  </section>

                  <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Dados principais
                      </h3>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>
                          <strong>Nome:</strong> {alunoSelecionado.nome || "-"}
                        </p>
                        <p>
                          <strong>Nome social:</strong>{" "}
                          {alunoSelecionado.nomeSocial || "-"}
                        </p>
                        <p>
                          <strong>Email:</strong>{" "}
                          {alunoSelecionado.user?.email || "-"}
                        </p>
                        <p>
                          <strong>Gênero:</strong>{" "}
                          {alunoSelecionado.genero || "-"}
                        </p>
                        <p>
                          <strong>Data de nascimento:</strong>{" "}
                          {formatarData(alunoSelecionado.dataNascimento)}
                        </p>
                        <p>
                          <strong>Matrícula:</strong>{" "}
                          {alunoSelecionado.matricula || "-"}
                        </p>
                        <p>
                          <strong>CPF:</strong> {alunoSelecionado.cpf || "-"}
                        </p>
                        <p>
                          <strong>RG:</strong> {alunoSelecionado.rg || "-"}
                        </p>
                        <p>
                          <strong>Telefone:</strong>{" "}
                          {alunoSelecionado.telefone || "-"}
                        </p>

<p>
  <strong>Polo:</strong>{" "}
  {alunoSelecionado.polo?.nome || "-"}
</p>

                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Endereço
                      </h3>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>
                          <strong>CEP:</strong> {alunoSelecionado.cep || "-"}
                        </p>
                        <p>
                          <strong>Endereço:</strong>{" "}
                          {alunoSelecionado.endereco || "-"}
                        </p>
                        <p>
                          <strong>Número:</strong>{" "}
                          {alunoSelecionado.numero || "-"}
                        </p>
                        <p>
                          <strong>Complemento:</strong>{" "}
                          {alunoSelecionado.complemento || "-"}
                        </p>
                        <p>
                          <strong>Bairro:</strong>{" "}
                          {alunoSelecionado.bairro || "-"}
                        </p>
                        <p>
                          <strong>Cidade:</strong>{" "}
                          {alunoSelecionado.cidade || "-"}
                        </p>
                        <p>
                          <strong>Estado:</strong>{" "}
                          {alunoSelecionado.estado || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Responsável
                      </h3>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>
                          <strong>Nome:</strong>{" "}
                          {alunoSelecionado.nomeResponsavel || "-"}
                        </p>
                        <p>
                          <strong>CPF:</strong>{" "}
                          {alunoSelecionado.cpfResponsavel || "-"}
                        </p>
                        <p>
                          <strong>Telefone:</strong>{" "}
                          {alunoSelecionado.telefoneResponsavel || "-"}
                        </p>
                        <p>
                          <strong>Email:</strong>{" "}
                          {alunoSelecionado.emailResponsavel || "-"}
                        </p>
                        <p>
                          <strong>Parentesco:</strong>{" "}
                          {alunoSelecionado.parentescoResponsavel || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Acessibilidade
                      </h3>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>
                          <strong>Possui necessidade especial:</strong>{" "}
                          {alunoSelecionado.possuiNecessidadeEspecial
                            ? "Sim"
                            : "Não"}
                        </p>
                        <p>
                          <strong>Descrição:</strong>{" "}
                          {alunoSelecionado.descricaoNecessidadeEspecial || "-"}
                        </p>
                        <p>
                          <strong>Observações:</strong>{" "}
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
        Documentos do aluno
      </h3>

      <div className="mt-4 space-y-2">
        {documentosAluno.filter((doc) => doc.proprietario !== "RESPONSAVEL").length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhum documento do aluno enviado.
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
                    {doc.arquivoNome || "Arquivo"}
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
      Abrir
    </a>
  )}

  <button
    type="button"
    onClick={() => arquivarDocumentoAluno(doc.id)}
    className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-center text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
  >
    Arquivar
  </button>
</div>
                
              </div>
            ))
        )}
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Documentos do responsável
      </h3>

      <div className="mt-4 space-y-2">
        {documentosAluno.filter((doc) => doc.proprietario === "RESPONSAVEL").length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhum documento do responsável enviado.
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
                    {doc.arquivoNome || "Arquivo"}
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
      Abrir
    </a>
  )}

  <button
    type="button"
    onClick={() => arquivarDocumentoAluno(doc.id)}
    className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-center text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
  >
    Arquivar
  </button>
</div>
     
              </div>
            ))
        )}
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Enviar novo documento
      </h3>

<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
    Documentos arquivados
  </h3>

  <div className="mt-4 space-y-2">
    {carregandoArquivadosAluno ? (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Carregando documentos arquivados...
      </p>
    ) : documentosArquivadosAluno.length === 0 ? (
      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Nenhum documento arquivado.
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
              {doc.proprietario === "RESPONSAVEL" ? "Responsável" : "Aluno"} •{" "}
              Arquivado em {doc.arquivadoEm ? formatarData(doc.arquivadoEm) : "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => restaurarDocumentoAluno(doc.id)}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Restaurar
          </button>
        </div>
      ))
    )}
  </div>
</section>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Envie documentos opcionais em PDF, PNG, JPG ou JPEG.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <select
          value={documentoProprietario}
          onChange={(e) =>
            setDocumentoProprietario(e.target.value as "ALUNO" | "RESPONSAVEL")
          }
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="ALUNO">Aluno</option>
          <option value="RESPONSAVEL">Responsável</option>
        </select>

        <select
          value={documentoTipo}
          onChange={(e) => setDocumentoTipo(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="RG">RG</option>
          <option value="CPF">CPF</option>
          <option value="CNH">CNH</option>
          <option value="HISTORICO_ESCOLAR">Histórico Escolar</option>
          <option value="COMPROVANTE_RESIDENCIA">
            Comprovante de Residência
          </option>
          <option value="TITULO_ELEITOR">Título de Eleitor</option>
          <option value="OUTRO">Outro</option>
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
        {enviandoDocumentoAluno ? "Enviando..." : "Enviar documento"}
      </button>
    </section>
  </div>
)}

{abaPainelAluno === "MATRICULAS" && (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Matrícula e vínculo acadêmico
    </h3>

    {alunoSelecionado.resumoMatricula ? (
      <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <p><strong>Curso:</strong> {alunoSelecionado.resumoMatricula.cursoNome || "-"}</p>
          <p><strong>Status:</strong> {alunoSelecionado.resumoMatricula.status || "-"}</p>
          <p><strong>Semestre:</strong> {alunoSelecionado.resumoMatricula.semestre || "-"}</p>
          <p>
  <strong>Número da matrícula:</strong>{" "}
  {alunoSelecionado.resumoMatricula?.numeroMatricula ||
    alunoSelecionado.matricula ||
    "-"}
</p>

<p>
  <strong>Data da matrícula:</strong>{" "}
  {formatarData(alunoSelecionado.resumoMatricula?.dataMatricula)}
</p>

<p>
  <strong>Polo:</strong>{" "}
  {alunoSelecionado.resumoMatricula?.polo?.nome ||
    alunoSelecionado.polo?.nome ||
    "-"}
</p>

<p>
  <strong>Modalidade:</strong>{" "}
  {alunoSelecionado.resumoMatricula?.modalidade || "-"}
</p>

<p>
  <strong>Horário letivo / Período:</strong>{" "}
  {alunoSelecionado.resumoMatricula?.periodoLetivo || "-"}
</p>

<p>
  <strong>Previsão de conclusão:</strong>{" "}
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
      Turmas e disciplinas (
      {alunoSelecionado.resumoMatricula.turmas?.length || 0})
    </span>

    <span>{matriculaExpandida ? "⌃" : "⌄"}</span>
  </button>

  {matriculaExpandida && (
    <div className="mt-4">
      <input
        type="text"
        placeholder="Buscar turma, disciplina, professor ou status..."
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
                Disciplina: {turma.disciplinaNome || "-"}
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Professor: {turma.professorNome || "-"}
              </p>

              <p className="text-xs text-slate-400">
                Status da disciplina: {turma.status || "-"}
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
        Este aluno ainda não possui matrícula vinculada.
      </div>
    )}
  </section>
)}

{abaPainelAluno === "DESEMPENHO" && (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Desempenho acadêmico
    </h3>

    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Médias, avaliações, notas e feedbacks do aluno.
    </p>

    <div className="mt-4">
      <input
        type="text"
        placeholder="Buscar disciplina..."
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
        Carregando desempenho...
      </p>
    ) : desempenhoAluno ? (
      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Média Geral
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {desempenhoAluno.mediaGeral ?? "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disciplinas
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
                  Média: {disciplina.media ?? "-"}
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
                        Nota: {avaliacao.nota} / {avaliacao.notaMaxima}
                      </p>

                      {avaliacao.feedback && (
                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                          Feedback: {avaliacao.feedback}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Nenhuma avaliação registrada nesta disciplina.
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhuma disciplina encontrada.
          </p>
        )}
      </div>
    ) : (
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Nenhum dado acadêmico encontrado.
      </p>
    )}
  </section>
)}

{abaPainelAluno === "HISTORICO" && (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Histórico acadêmico
    </h3>

    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Resumo acadêmico do aluno gerado a partir das disciplinas, avaliações e médias registradas no PHANYX.
    </p>

    {carregandoDesempenho ? (
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Carregando histórico acadêmico...
      </p>
    ) : !desempenhoAluno?.disciplinas?.length ? (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Ainda não há disciplinas avaliadas para compor o histórico acadêmico.
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
                  Disciplina cursada/avaliada no PHANYX
                </p>
              </div>

              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Média: {disciplina.media ?? "-"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
              <p>
                <strong>Situação:</strong>{" "}
                {Number(disciplina.media || 0) >= 7 ? "Aprovado" : "Em andamento"}
              </p>
              <p>
                <strong>Frequência:</strong> -
              </p>
              <p>
                <strong>Carga horária:</strong> -
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
      Certificados do aluno
    </h3>

    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
      Gere ou baixe certificados vinculados a este aluno. A emissão manual deve
      ser usada pela secretaria/diretoria somente quando houver autorização da
      instituição.
    </p>

    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
      <p className="font-semibold">
        Regra PHANYX
      </p>

      <p className="mt-1 leading-6">
        A liberação automática para o aluno deverá respeitar a configuração da
        instituição: por disciplina concluída, por semestre concluído ou somente
        após conclusão do curso. Esta área é para emissão manual administrativa.
      </p>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Aluno
        </p>

        <p className="mt-2 font-bold text-slate-900 dark:text-slate-100">
          {alunoSelecionado.nome}
        </p>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {alunoSelecionado.user?.email || "Sem email"}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Matrícula / curso
        </p>

        <p className="mt-2 font-bold text-slate-900 dark:text-slate-100">
          {alunoSelecionado.resumoMatricula?.cursoNome || "Sem matrícula"}
        </p>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {alunoSelecionado.resumoMatricula?.numeroMatricula ||
            alunoSelecionado.matricula ||
            "Matrícula não informada"}
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
        {gerandoCertificado ? "Gerando..." : "Gerar certificado"}
      </button>

      <button
        type="button"
        disabled={baixandoCertificado}
        onClick={baixarCertificadoAlunoSelecionado}
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {baixandoCertificado ? "Baixando..." : "Baixar certificado"}
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
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${
                  modalAvisoTipo === "sucesso"
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
                className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${
                  modalAvisoTipo === "sucesso"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
  );
}

export default withAuth(AdminAlunosPage, ["admin"]);