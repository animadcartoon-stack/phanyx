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
  disciplinaId: number;
  professorId: number;
  disciplina?: Disciplina | null;
  professor?: Professor | null;
  _count?: {
    itensMatricula: number;
  };
}

function AdminTurmasPage() {
  const searchParams = useSearchParams();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [semestre, setSemestre] = useState("");
  const [periodoLetivo, setPeriodoLetivo] = useState("");
  const [statusTurma, setStatusTurma] = useState<StatusTurma>("AGUARDANDO");
  const [ativa, setAtiva] = useState(true);
  const [capacidadeMinima, setCapacidadeMinima] = useState("");
  const [capacidadeMaxima, setCapacidadeMaxima] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [professorId, setProfessorId] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [editSemestre, setEditSemestre] = useState("");
  const [editPeriodoLetivo, setEditPeriodoLetivo] = useState("");
  const [editStatusTurma, setEditStatusTurma] =
    useState<StatusTurma>("AGUARDANDO");
  const [editAtiva, setEditAtiva] = useState(true);
  const [editCapacidadeMinima, setEditCapacidadeMinima] = useState("");
  const [editCapacidadeMaxima, setEditCapacidadeMaxima] = useState("");
  const [editDisciplinaId, setEditDisciplinaId] = useState("");
  const [editProfessorId, setEditProfessorId] = useState("");

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

  async function carregarProfessores() {
    const res = await fetch("/api/professor", {
      credentials: "include",
    });

    const data = await res.json();
    setProfessores(Array.isArray(data) ? data : []);
  }

  async function criarTurma(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/turma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome,
        codigo,
        semestre,
        periodoLetivo,
        statusTurma,
        ativa,
        capacidadeMinima,
        capacidadeMaxima,
        disciplinaId,
        professorId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao criar turma");
      return;
    }

    setNome("");
    setCodigo("");
    setSemestre("");
    setPeriodoLetivo("");
    setStatusTurma("AGUARDANDO");
    setAtiva(true);
    setCapacidadeMinima("");
    setCapacidadeMaxima("");
    setDisciplinaId("");
    setProfessorId("");

    carregarTurmas();
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
    setEditDisciplinaId(String(turma.disciplinaId || ""));
    setEditProfessorId(String(turma.professorId || ""));
  }

  async function salvarEdicao(id: number) {
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
        disciplinaId: editDisciplinaId,
        professorId: editProfessorId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao atualizar turma");
      return;
    }

    setEditandoId(null);
    carregarTurmas();
  }

  async function deletarTurma(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return;

    const res = await fetch(`/api/turma/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao excluir turma");
      return;
    }

    carregarTurmas();
  }

  useEffect(() => {
    carregarTurmas();
    carregarDisciplinas();
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
      const disciplina = String(turma.disciplina?.nome || "").toLowerCase();
      const curso = String(turma.disciplina?.curso?.nome || "").toLowerCase();
      const professor = String(turma.professor?.nome || "").toLowerCase();
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
        professor.includes(termo) ||
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
    <div className="space-y-6 max-w-5xl">
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

          <input
            placeholder="Semestre"
            value={semestre}
            onChange={(e) => setSemestre(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            placeholder="Período letivo"
            value={periodoLetivo}
            onChange={(e) => setPeriodoLetivo(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

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

          <select
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          >
            <option value="">Selecione a disciplina</option>
            {disciplinas.map((disciplina) => (
              <option key={disciplina.id} value={disciplina.id}>
                {disciplina.nome}
                {disciplina.curso?.nome ? ` — ${disciplina.curso.nome}` : ""}
              </option>
            ))}
          </select>

          <select
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          >
            <option value="">Selecione o professor</option>
            {professores.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.nome}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
            />
            Turma ativa
          </label>
        </div>

        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Criar turma
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">Lista de turmas</h2>

          <input
            type="text"
            placeholder="Buscar por nome, código, semestre, disciplina, curso ou professor"
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

                      <select
                        value={editDisciplinaId}
                        onChange={(e) => setEditDisciplinaId(e.target.value)}
                        className="border p-2 rounded"
                      >
                        <option value="">Selecione a disciplina</option>
                        {disciplinas.map((disciplina) => (
                          <option key={disciplina.id} value={disciplina.id}>
                            {disciplina.nome}
                            {disciplina.curso?.nome
                              ? ` — ${disciplina.curso.nome}`
                              : ""}
                          </option>
                        ))}
                      </select>

                      <select
                        value={editProfessorId}
                        onChange={(e) => setEditProfessorId(e.target.value)}
                        className="border p-2 rounded"
                      >
                        <option value="">Selecione o professor</option>
                        {professores.map((professor) => (
                          <option key={professor.id} value={professor.id}>
                            {professor.nome}
                          </option>
                        ))}
                      </select>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editAtiva}
                          onChange={(e) => setEditAtiva(e.target.checked)}
                        />
                        Turma ativa
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => salvarEdicao(turma.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Salvar
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
                      Curso: {turma.disciplina?.curso?.nome || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Disciplina: {turma.disciplina?.nome || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Professor: {turma.professor?.nome || "-"}
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
                        onClick={() => deletarTurma(turma.id)}
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
  );
}

export default withAuth(AdminTurmasPage, ["admin"]);