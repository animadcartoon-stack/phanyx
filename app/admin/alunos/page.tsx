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
  turmas: Array<{
    turmaId: number;
    turmaNome: string;
    disciplinaNome?: string | null;
    professorNome?: string | null;
    status?: string | null;
  }>;
};

type AlunoComResumo = Aluno & {
  resumoMatricula?: MatriculaResumo | null;
};

function AdminAlunosPage() {
  const searchParams = useSearchParams();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [matriculas, setMatriculas] = useState<any[]>([]);
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
  const [matricula, setMatricula] = useState("");
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
  const [editMatricula, setEditMatricula] = useState("");
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
    carregarMatriculas(),
    carregarTurmas(),
    carregarPolos(),
  ]);
}

  async function carregarAlunos() {
  try {
    const res = await fetch("/api/aluno", {
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
      return;
    }

    console.log("📚 /api/aluno retornou:", data);

    setAlunos(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro ao carregar alunos:", error);
    mostrarFeedback("erro", "Erro ao carregar alunos.");
    setAlunos([]);
  }
}

  async function carregarMatriculas() {
    try {
      const res = await fetch("/api/matricula", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Erro ao buscar matrículas");
        return;
      }

      const data = await res.json();
      setMatriculas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar matrículas:", error);
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
    setMatricula("");
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
          matricula,
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

      limparFormularioCriacao();

if (data?.id) {
  setAlunos((prev) => [
    data,
    ...prev.filter((aluno) => aluno.id !== data.id),
  ]);
}

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
    setEditMatricula(aluno.matricula || "");
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
          matricula: editMatricula,
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

  const mapaMatriculasPorAluno = useMemo(() => {
    const mapa = new Map<number, MatriculaResumo>();

    for (const matricula of matriculas) {
      const alunoId = Number(matricula?.aluno?.id);
      if (!Number.isFinite(alunoId)) continue;

      const resumo: MatriculaResumo = {
        id: Number(matricula.id),
        status: matricula?.status || null,
        cursoNome: matricula?.curso?.nome || null,
        semestre: matricula?.semestre ?? null,
        turmas: Array.isArray(matricula?.itens)
          ? matricula.itens
              .map((item: any) => ({
                turmaId: Number(item?.turma?.id),
                turmaNome: String(item?.turma?.nome || "Turma"),
                disciplinaNome: item?.turma?.disciplina?.nome || null,
                professorNome: item?.turma?.professor?.nome || null,
                status: item?.status || null,
              }))
              .filter((t: any) => Number.isFinite(t.turmaId))
          : [],
      };

      if (!mapa.has(alunoId)) {
        mapa.set(alunoId, resumo);
      }
    }

    return mapa;
  }, [matriculas]);

  const alunosComResumo = useMemo<AlunoComResumo[]>(() => {
    return alunos.map((aluno) => ({
  ...aluno,
  resumoMatricula: mapaMatriculasPorAluno.get(aluno.id) || null,
}));
  }, [alunos, mapaMatriculasPorAluno]);

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

  function abrirDetalhesAluno(aluno: AlunoComResumo) {
    setAlunoSelecionado(aluno);
    setPainelAlunoAberto(true);
  }

  const turmaNomeSelecionada = useMemo(() => {
    if (filtroTurmaId === "TODAS") return "Todas as turmas";
    const turma = turmas.find((t) => t.id === Number(filtroTurmaId));
    return turma ? turma.nome : "Turma";
  }, [filtroTurmaId, turmas]);

  return (
    <>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                  required
                />

                <input
                  placeholder="Matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full rounded-xl border p-2.5"
                />

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
                  onChange={(e) => setCep(e.target.value)}
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

                <input
                  placeholder="URL do documento"
                  value={documentoUrl}
                  onChange={(e) => setDocumentoUrl(e.target.value)}
                  className="w-full rounded-xl border p-2.5 md:col-span-2"
                />
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
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="rounded-xl border px-3 py-2.5"
              />

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
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
              Exibindo <strong>{alunosFiltrados.length}</strong> aluno(s) —
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
                    />
                    <input
                      value={editMatricula}
                      onChange={(e) => setEditMatricula(e.target.value)}
                      className="rounded-xl border p-2.5"
                      placeholder="Matrícula"
                    />
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
                      onChange={(e) => setEditCep(e.target.value)}
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
                        onClick={() => iniciarEdicao(alunoSelecionado)}
                        className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        Editar aluno
                      </button>

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
                        <button
                          onClick={() => cancelarAluno(alunoSelecionado.id)}
                          className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                        >
                          Cancelar aluno
                        </button>
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

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Situação acadêmica
                    </h3>

                    {alunoSelecionado.resumoMatricula ? (
                      <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <p>
                          <strong>Curso:</strong>{" "}
                          {alunoSelecionado.resumoMatricula.cursoNome || "-"}
                        </p>
                        <p>
                          <strong>Status da matrícula:</strong>{" "}
                          {alunoSelecionado.resumoMatricula.status || "-"}
                        </p>
                        <p>
                          <strong>Semestre:</strong>{" "}
                          {alunoSelecionado.resumoMatricula.semestre || "-"}
                        </p>

                        <div>
                          <p className="font-semibold text-slate-900">
                            Turmas vinculadas
                          </p>
                          <div className="mt-2 grid gap-3 md:grid-cols-2">
                            {alunoSelecionado.resumoMatricula.turmas.map(
                              (turma) => (
                                <div
                                  key={turma.turmaId}
                                  className="rounded-xl border border-slate-200 p-3"
                                >
                                  <p className="font-medium text-slate-900">
                                    {turma.turmaNome}
                                  </p>
                                  <p className="text-slate-600">
                                    {turma.disciplinaNome || "-"}
                                  </p>
                                  <p className="text-slate-500">
                                    Prof. {turma.professorNome || "-"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Status da disciplina: {turma.status || "-"}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                        Este aluno ainda não possui matrícula vinculada.
                      </div>
                    )}
                  </section>
                </>
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
    </>
  );
}

export default withAuth(AdminAlunosPage, ["admin"]);