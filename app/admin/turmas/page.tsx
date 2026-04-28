"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";

interface Curso {
  id: number;
  nome: string;
  codigo?: string | null;
}

interface Disciplina {
  id: number;
  nome: string;
  codigo?: string | null;
  curso?: Curso | null;
}

interface Professor {
  id: number;
  nome: string;
}

type StatusTurma =
  | "AGUARDANDO"
  | "A_INICIAR"
  | "ATIVA"
  | "INATIVA"
  | "CONCLUIDA"
  | "CANCELADA"
  | "NAO_FORMADA";

interface Turma {
  id: number;
  nome: string;
  codigo?: string | null;
  semestre: string;
  periodoLetivo?: string | null;
  ativa: boolean;
  statusTurma?: StatusTurma;
  capacidadeMinima?: number | null;
  capacidadeMaxima?: number | null;
  cursoId?: number | null;
  curso?: Curso | null;
  professorId?: number | null;
  professor?: Professor | null;
  disciplinas?: Disciplina[];
  _count?: {
    itensMatricula: number;
  };
}

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminTurmasPage() {
  const searchParams = useSearchParams();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [polos, setPolos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [professorId, setProfessorId] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState("");
  const [poloId, setPoloId] = useState("");
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [semestre, setSemestre] = useState("");
  const [periodoLetivo, setPeriodoLetivo] = useState("");
  const [statusTurma, setStatusTurma] = useState<StatusTurma>("AGUARDANDO");
  const [ativa, setAtiva] = useState(true);
  const [capacidadeMinima, setCapacidadeMinima] = useState("");
  const [capacidadeMaxima, setCapacidadeMaxima] = useState("");
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);
  const [disciplinasAbertas, setDisciplinasAbertas] = useState(false);
  const [professoresPorDisciplina, setProfessoresPorDisciplina] = useState<Record<number, string>>({});
  const [datasInicioPorDisciplina, setDatasInicioPorDisciplina] = useState<Record<number, string>>({});
  const [datasFimPorDisciplina, setDatasFimPorDisciplina] = useState<Record<number, string>>({});
  const [statusPorDisciplina, setStatusPorDisciplina] = useState<Record<number, string>>({});
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [editNome, setEditNome] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [editSemestre, setEditSemestre] = useState("");
  const [editPeriodoLetivo, setEditPeriodoLetivo] = useState("");
  const [editStatusTurma, setEditStatusTurma] =
    useState<StatusTurma>("AGUARDANDO");
  const [editAtiva, setEditAtiva] = useState(true);
  const [editCapacidadeMinima, setEditCapacidadeMinima] = useState("");
  const [editCapacidadeMaxima, setEditCapacidadeMaxima] = useState("");
  const [editDisciplinasSelecionadas, setEditDisciplinasSelecionadas] = useState<number[]>([]);
  const [editDisciplinasAbertas, setEditDisciplinasAbertas] = useState(false);
  const [editProfessorId, setEditProfessorId] = useState("");

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<Turma | null>(null);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  async function carregarTurmas() {
    const res = await fetch("/api/turma", {
      credentials: "include",
    });

    const data = await res.json();
    setTurmas(Array.isArray(data) ? data : []);
  }

  async function carregarDisciplinas() {
    const res = await fetch("/api/disciplina", {
      credentials: "include",
    });

    const data = await res.json();
    setDisciplinas(Array.isArray(data) ? data : []);
  }

async function carregarPolos() {
  const res = await fetch("/api/admin/polos", {
    credentials: "include",
  });

  const data = await res.json();
  setPolos(Array.isArray(data) ? data : []);
}

async function carregarProfessores() {
  const res = await fetch("/api/professor", {
    credentials: "include",
  });

  const data = await res.json();
  setProfessores(Array.isArray(data) ? data : []);
}

async function carregarCursos() {
  const res = await fetch("/api/curso", {
    credentials: "include",
  });

  const data = await res.json();
  setCursos(Array.isArray(data) ? data : []);
}

  async function criarTurma(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

      const res = await fetch("/api/turma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
  nome,
  codigo,
  semestre,
  cursoId,
  periodoLetivo,
  statusTurma,
  ativa,
  capacidadeMinima,
  capacidadeMaxima,
  disciplinaIds: disciplinasSelecionadas,
  professoresPorDisciplina,
  datasInicioPorDisciplina,
  datasFimPorDisciplina,
  statusPorDisciplina,
  poloId,
  professorId,
  
}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar turma");
      }

      setNome("");
      setCodigo("");
      setSemestre("");
      setCursoId("");
      setProfessorId("");
      setPoloId("");
      setPeriodoLetivo("");
      setStatusTurma("AGUARDANDO");
      setAtiva(true);
      setCapacidadeMinima("");
      setCapacidadeMaxima("");
      setEditDisciplinasSelecionadas([]);
      setProfessoresPorDisciplina({});
      setDatasInicioPorDisciplina({});
      setDatasFimPorDisciplina({});
      setStatusPorDisciplina({});

      await carregarTurmas();
      mostrarFeedback("sucesso", "Turma criada com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao criar turma");
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(turma: Turma) {
    setEditandoId(turma.id);
    setEditNome(turma.nome || "");
    setEditCodigo(turma.codigo || "");
    setEditSemestre(turma.semestre || "");
    setEditPeriodoLetivo(turma.periodoLetivo || "");
    setEditStatusTurma(turma.statusTurma || "AGUARDANDO");
    setEditAtiva(Boolean(turma.ativa));
    setEditCapacidadeMinima(
      turma.capacidadeMinima !== null && turma.capacidadeMinima !== undefined
        ? String(turma.capacidadeMinima)
        : ""
    );
    setEditCapacidadeMaxima(
      turma.capacidadeMaxima !== null && turma.capacidadeMaxima !== undefined
        ? String(turma.capacidadeMaxima)
        : ""
    );
    setEditDisciplinasSelecionadas(
  Array.isArray(turma.disciplinas)
    ? turma.disciplinas.map((d: any) => Number(d.id)).filter((id) => Number.isFinite(id))
    : []
);
setEditDisciplinasAbertas(false);
setEditProfessorId(
  turma.professorId ? String(turma.professorId) : ""
);
  }

  async function salvarEdicao(id: number) {
    try {
      setSalvandoId(id);

      const res = await fetch(`/api/turma/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: editNome,
          codigo: editCodigo,
          semestre: editSemestre,
          periodoLetivo: editPeriodoLetivo,
          statusTurma: editStatusTurma,
          ativa: editAtiva,
          capacidadeMinima: editCapacidadeMinima,
          capacidadeMaxima: editCapacidadeMaxima,
          disciplinaIds: editDisciplinasSelecionadas,
          professorId: editProfessorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar turma");
      }

      setEditandoId(null);
      await carregarTurmas();
      mostrarFeedback("sucesso", "Turma atualizada com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao atualizar turma");
    } finally {
      setSalvandoId(null);
    }
  }

  async function confirmarExclusaoTurma() {
    if (!turmaParaExcluir) return;

    try {
      setExcluindoId(turmaParaExcluir.id);

      const res = await fetch(`/api/turma/${turmaParaExcluir.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir turma");
      }

      setTurmaParaExcluir(null);
      await carregarTurmas();
      mostrarFeedback("sucesso", "Turma excluída com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao excluir turma");
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
  carregarTurmas();
  carregarDisciplinas();
  carregarPolos();
  carregarCursos();
  carregarProfessores();
}, []);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const turmasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return turmas;

    return turmas.filter((turma) => {
      const nome = String(turma.nome || "").toLowerCase();
      const codigo = String(turma.codigo || "").toLowerCase();
      const semestre = String(turma.semestre || "").toLowerCase();
      const periodoLetivo = String(turma.periodoLetivo || "").toLowerCase();
      const disciplina = String(
  turma.disciplinas?.map((d) => d.nome).join(" | ") || ""
).toLowerCase();

const curso = String(turma.curso?.nome || "").toLowerCase();
      
      const status = String(turma.statusTurma || "").toLowerCase();
      const capacidadeMinima = String(turma.capacidadeMinima || "").toLowerCase();
      const capacidadeMaxima = String(turma.capacidadeMaxima || "").toLowerCase();

      return (
        nome.includes(termo) ||
        codigo.includes(termo) ||
        semestre.includes(termo) ||
        periodoLetivo.includes(termo) ||
        disciplina.includes(termo) ||
        curso.includes(termo) ||
        status.includes(termo) ||
        capacidadeMinima.includes(termo) ||
        capacidadeMaxima.includes(termo)
      );
    });
  }, [turmas, busca]);

  function labelStatusTurma(status?: StatusTurma) {
    switch (status) {
      case "AGUARDANDO":
        return "Aguardando";
      case "A_INICIAR":
        return "A iniciar";
      case "ATIVA":
        return "Ativa";
      case "INATIVA":
        return "Inativa";
      case "CONCLUIDA":
        return "Concluída";
      case "CANCELADA":
        return "Cancelada";
      case "NAO_FORMADA":
        return "Não formada";
      default:
        return "-";
    }
  }

  return (
    <>
      <div className="max-w-5xl space-y-6">
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

        <h1 className="text-2xl font-bold">🏫 Turmas</h1>

        <form
          onSubmit={criarTurma}
          className="bg-white border rounded-lg p-6 space-y-4"
        >
          <h2 className="font-semibold">Nova turma</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Nome da turma"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />

            <input
              placeholder="Código da turma"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full border rounded-lg p-2"
            />

<select
  value={cursoId}
  onChange={(e) => setCursoId(e.target.value)}
  className="w-full border rounded-lg p-2"
  required
>
  <option value="">Selecione o curso</option>
  {cursos.map((curso) => (
    <option key={curso.id} value={curso.id}>
      {curso.nome}
    </option>
  ))}
</select>
<select
  value={professorId}
  onChange={(e) => setProfessorId(e.target.value)}
  className="w-full border rounded-lg p-2"
>
  <option value="">Professor responsável</option>
  {professores.map((professor) => (
    <option key={professor.id} value={professor.id}>
      {professor.nome}
    </option>
  ))}
</select>
            <input
              placeholder="Semestre"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />

            <select
  value={periodoLetivo}
  onChange={(e) => setPeriodoLetivo(e.target.value)}
  className="w-full border rounded-lg p-2"
>
  <option value="">Selecione o período</option>
  <option>Matutino</option>
  <option>Vespertino</option>
  <option>Noturno</option>
  <option>Integral</option>
  <option>Matutino/Vespertino</option>
  <option>Matutino/Noturno</option>
  <option>Vespertino/Noturno</option>
  <option>EAD Livre</option>
  <option>EAD Matutino</option>
  <option>EAD Vespertino</option>
  <option>EAD Noturno</option>
  <option>EAD Integral</option>
</select>

            <input
              type="number"
              min="1"
              placeholder="Capacidade mínima de alunos"
              value={capacidadeMinima}
              onChange={(e) => setCapacidadeMinima(e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            <input
              type="number"
              min="1"
              placeholder="Capacidade máxima de alunos"
              value={capacidadeMaxima}
              onChange={(e) => setCapacidadeMaxima(e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            <select
              value={statusTurma}
              onChange={(e) => setStatusTurma(e.target.value as StatusTurma)}
              className="w-full border rounded-lg p-2"
            >
              <option value="AGUARDANDO">Aguardando</option>
              <option value="A_INICIAR">A iniciar</option>
              <option value="ATIVA">Ativa</option>
              <option value="INATIVA">Inativa</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NAO_FORMADA">Não formada</option>
            </select>

<div className="col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
  <div>
    <button
      type="button"
      onClick={() => setDisciplinasAbertas((prev) => !prev)}
      className="flex h-[46px] w-full items-center justify-between rounded-lg border p-3 text-left"
    >
      <span className="text-sm font-medium">
        Disciplinas da turma
        {disciplinasSelecionadas.length > 0
  ? ` (${disciplinasSelecionadas.length} selecionada(s))`
          : ""}
      </span>
      <span className="text-sm text-gray-500">
        {disciplinasAbertas ? "▲ Fechar" : "▼ Abrir"}
      </span>
    </button>

    {disciplinasAbertas && (
  <div className="mt-2 max-h-72 overflow-auto rounded border p-2">
    <div className="grid grid-cols-1 gap-3">
      {disciplinas.map((disciplina) => {
        const selecionada = disciplinasSelecionadas.includes(disciplina.id);

        return (
          <div
            key={disciplina.id}
            className="rounded-lg border bg-gray-50 p-3"
          >
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selecionada}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDisciplinasSelecionadas((prev) => [
                      ...prev,
                      disciplina.id,
                    ]);
                  } else {
                    setDisciplinasSelecionadas((prev) =>
                      prev.filter((id) => id !== disciplina.id)
                    );

                    setProfessoresPorDisciplina((prev) => {
                      const novo = { ...prev };
                      delete novo[disciplina.id];
                      return novo;
                    });
                  }
                }}
              />

              <span>{disciplina.nome}</span>
            </label>

            {selecionada && (
              <select
                value={professoresPorDisciplina[disciplina.id] || ""}
                onChange={(e) =>
                  setProfessoresPorDisciplina((prev) => ({
                    ...prev,
                    [disciplina.id]: e.target.value,
                  }))
                }
                className="mt-2 h-[42px] w-full rounded-lg border bg-white p-2 text-sm"
              >
                <option value="">Professor desta disciplina</option>
                {professores.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
  </div>

  <div>
    <select
      value={poloId}
      onChange={(e) => setPoloId(e.target.value)}
      className="h-[46px] w-full rounded-lg border p-3"
    >
      <option value="">Polo da turma</option>
      {polos.map((polo) => (
        <option key={polo.id} value={polo.id}>
          {polo.nome}
        </option>
      ))}
    </select>
  </div>
</div>

<label className="flex items-center gap-2 text-sm">
  <input
    type="checkbox"
    checked={ativa}
    onChange={(e) => setAtiva(e.target.checked)}
  />
  Turma ativa
</label>
          </div>

          <button
            disabled={criando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {criando ? "Criando..." : "Criar turma"}
          </button>
        </form>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-semibold">Lista de turmas</h2>

            <input
              type="text"
              placeholder="Buscar por nome, código, semestre, disciplinas ou curso"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full md:w-[520px] border rounded-lg p-2"
            />
          </div>

          {turmasFiltradas.length === 0 ? (
            <div className="bg-white border rounded-lg p-4 text-sm text-gray-600">
              Nenhuma turma encontrada para essa busca.
            </div>
          ) : (
            turmasFiltradas.map((turma) => {
              const matriculados = turma._count?.itensMatricula || 0;
              const capacidadeMinima = turma.capacidadeMinima ?? null;
              const capacidadeMaxima = turma.capacidadeMaxima ?? null;
              const vagasRestantes =
                capacidadeMaxima !== null
                  ? Math.max(capacidadeMaxima - matriculados, 0)
                  : null;
              const atingiuMinimo =
                capacidadeMinima !== null
                  ? matriculados >= capacidadeMinima
                  : null;

              return (
                <div key={turma.id} className="bg-white border rounded-lg p-4">
                  {editandoId === turma.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          className="border p-2 rounded"
                          placeholder="Nome da turma"
                        />

                        <input
                          value={editCodigo}
                          onChange={(e) => setEditCodigo(e.target.value)}
                          className="border p-2 rounded"
                          placeholder="Código da turma"
                        />

                        <input
                          value={editSemestre}
                          onChange={(e) => setEditSemestre(e.target.value)}
                          className="border p-2 rounded"
                          placeholder="Semestre"
                        />

                        <input
                          value={editPeriodoLetivo}
                          onChange={(e) => setEditPeriodoLetivo(e.target.value)}
                          className="border p-2 rounded"
                          placeholder="Período letivo"
                        />

                        <input
                          type="number"
                          min="1"
                          value={editCapacidadeMinima}
                          onChange={(e) => setEditCapacidadeMinima(e.target.value)}
                          className="border p-2 rounded"
                          placeholder="Capacidade mínima"
                        />

                        <input
                          type="number"
                          min="1"
                          value={editCapacidadeMaxima}
                          onChange={(e) => setEditCapacidadeMaxima(e.target.value)}
                          className="border p-2 rounded"
                          placeholder="Capacidade máxima"
                        />

                        <select
                          value={editStatusTurma}
                          onChange={(e) =>
                            setEditStatusTurma(e.target.value as StatusTurma)
                          }
                          className="border p-2 rounded"
                        >
                          <option value="AGUARDANDO">Aguardando</option>
                          <option value="A_INICIAR">A iniciar</option>
                          <option value="ATIVA">Ativa</option>
                          <option value="INATIVA">Inativa</option>
                          <option value="CONCLUIDA">Concluída</option>
                          <option value="CANCELADA">Cancelada</option>
                          <option value="NAO_FORMADA">Não formada</option>
                        </select>

                        <div className="md:col-span-2">
  <button
    type="button"
    onClick={() => setEditDisciplinasAbertas((prev) => !prev)}
    className="flex h-[46px] w-full items-center justify-between rounded-lg border p-3 text-left"
  >
    <span className="text-sm font-medium">
      Disciplinas da turma
      {editDisciplinasSelecionadas.length > 0
        ? ` (${editDisciplinasSelecionadas.length} selecionada(s))`
        : ""}
    </span>
    <span className="text-sm text-gray-500">
      {editDisciplinasAbertas ? "▲ Fechar" : "▼ Abrir"}
    </span>
  </button>

  {disciplinasAbertas && (
  <div className="mt-2 max-h-72 overflow-auto rounded border p-2">
    <div className="grid grid-cols-1 gap-3">
      {disciplinas.map((disciplina) => {
        const selecionada = editDisciplinasSelecionadas.includes(disciplina.id);

        return (
          <div
            key={disciplina.id}
            className="rounded-lg border bg-gray-50 p-3"
          >
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selecionada}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEditDisciplinasSelecionadas((prev) => [
                      ...prev,
                      disciplina.id,
                    ]);
                  } else {
                    setEditDisciplinasSelecionadas((prev) =>
                      prev.filter((id) => id !== disciplina.id)
                    );

                    setProfessoresPorDisciplina((prev) => {
                      const novo = { ...prev };
                      delete novo[disciplina.id];
                      return novo;
                    });
                  }
                }}
              />

              <span>{disciplina.nome}</span>
            </label>

            {selecionada && (
  <>
    <select
      value={professoresPorDisciplina[disciplina.id] || ""}
      onChange={(e) =>
        setProfessoresPorDisciplina((prev) => ({
          ...prev,
          [disciplina.id]: e.target.value,
        }))
      }
      className="mt-2 h-[42px] w-full rounded-lg border bg-white p-2 text-sm"
    >
      <option value="">Professor desta disciplina</option>
      {professores.map((professor) => (
        <option key={professor.id} value={professor.id}>
          {professor.nome}
        </option>
      ))}
    </select>

    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
      <input
        type="date"
        value={datasInicioPorDisciplina[disciplina.id] || ""}
        onChange={(e) =>
          setDatasInicioPorDisciplina((prev) => ({
            ...prev,
            [disciplina.id]: e.target.value,
          }))
        }
        className="h-[42px] w-full rounded-lg border bg-white p-2 text-sm"
      />

      <input
        type="date"
        value={datasFimPorDisciplina[disciplina.id] || ""}
        onChange={(e) =>
          setDatasFimPorDisciplina((prev) => ({
            ...prev,
            [disciplina.id]: e.target.value,
          }))
        }
        className="h-[42px] w-full rounded-lg border bg-white p-2 text-sm"
      />

      <select
        value={statusPorDisciplina[disciplina.id] || ""}
        onChange={(e) =>
          setStatusPorDisciplina((prev) => ({
            ...prev,
            [disciplina.id]: e.target.value,
          }))
        }
        className="h-[42px] w-full rounded-lg border bg-white p-2 text-sm"
      >
        <option value="">Status</option>
        <option value="A_INICIAR">A iniciar</option>
        <option value="EM_ANDAMENTO">Em andamento</option>
        <option value="ENCERRADA">Encerrada</option>
        <option value="CONCLUIDA">Concluída</option>
      </select>
    </div>
  </>
)}
          </div>
        );
      })}
    </div>
  </div>
)}
</div>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editAtiva}
                            onChange={(e) => setEditAtiva(e.target.checked)}
                          />
                          Turma ativa
                        </label>
                      </div>
<select
  value={editProfessorId}
  onChange={(e) => setEditProfessorId(e.target.value)}
  className="border p-2 rounded"
>
  <option value="">Professor responsável</option>
  {professores.map((professor) => (
    <option key={professor.id} value={professor.id}>
      {professor.nome}
    </option>
  ))}
</select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => salvarEdicao(turma.id)}
                          disabled={salvandoId === turma.id}
                          className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                        >
                          {salvandoId === turma.id ? "Salvando..." : "Salvar"}
                        </button>

                        <button
                          onClick={() => setEditandoId(null)}
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{turma.nome}</p>
                      <p className="text-sm text-gray-600">
                        Código: {turma.codigo || "-"}
                      </p>
                      <p className="text-sm text-gray-600">
  Curso: {turma.curso?.nome || "-"}
</p>

<p className="text-sm text-gray-600">
  Professor: {turma.professor?.nome || "-"}
</p>

<p className="text-sm text-gray-600">
  Disciplinas:{" "}
  {turma.disciplinas && turma.disciplinas.length > 0
    ? turma.disciplinas.map((d) => d.nome).join(", ")
    : "-"}
</p>
                      <p className="text-sm text-gray-600">
                        Semestre: {turma.semestre}
                      </p>
                      <p className="text-sm text-gray-600">
                        Período letivo: {turma.periodoLetivo || "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status da turma: {labelStatusTurma(turma.statusTurma)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Ativa: {turma.ativa ? "Sim" : "Não"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Capacidade mínima: {capacidadeMinima ?? "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Capacidade máxima: {capacidadeMaxima ?? "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Matriculados: {matriculados}
                      </p>
                      <p className="text-sm text-gray-600">
                        Vagas restantes: {vagasRestantes ?? "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Atingiu mínimo:{" "}
                        {atingiuMinimo === null
                          ? "-"
                          : atingiuMinimo
                          ? "Sim"
                          : "Não"}
                      </p>

                      <div className="flex gap-4 mt-3">
                        <button
                          onClick={() => iniciarEdicao(turma)}
                          className="text-blue-600 text-sm"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => setTurmaParaExcluir(turma)}
                          className="text-red-600 text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {turmaParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Confirmar exclusão
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tem certeza que deseja excluir a turma{" "}
                  <strong>"{turmaParaExcluir.nome}"</strong>?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTurmaParaExcluir(null)}
                disabled={excluindoId === turmaParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusaoTurma}
                disabled={excluindoId === turmaParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === turmaParaExcluir.id
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(AdminTurmasPage, ["admin"]);