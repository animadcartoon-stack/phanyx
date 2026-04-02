"use client";

import { useEffect, useMemo, useState } from "react";

type TurmaFiltro = {
  id: number;
  nome: string;
  disciplinaNome?: string | null;
};

type AlunoProfessor = {
  itemMatriculaId: number;
  alunoId: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
  statusAluno?: string | null;
  statusDisciplina?: string | null;
  turma?: {
    id: number;
    nome: string;
    semestre?: string | null;
  } | null;
  disciplina?: {
    id: number | null;
    nome?: string | null;
  } | null;
  notas: number[];
  media: number | null;
  frequencia: {
    total: number;
    presente: number;
    falta: number;
    justificada: number;
    atestado: number;
    percentual: number | null;
  };
};

function labelStatusAluno(status?: string | null) {
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

function labelStatusDisciplina(status?: string | null) {
  switch (status) {
    case "A_CURSAR":
      return "A cursar";
    case "EM_CURSO":
      return "Em curso";
    case "CONCLUIDO":
      return "Concluído";
    case "TRANCADO":
      return "Trancado";
    case "REPROVADO":
      return "Reprovado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return "-";
  }
}

export default function ProfessorAlunosPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [alunos, setAlunos] = useState<AlunoProfessor[]>([]);
  const [turmas, setTurmas] = useState<TurmaFiltro[]>([]);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const query = new URLSearchParams();
      if (busca.trim()) query.set("busca", busca.trim());
      if (turmaId) query.set("turmaId", turmaId);

      const res = await fetch(`/api/professor/alunos?${query.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar alunos");
      }

      setAlunos(Array.isArray(data?.alunos) ? data.alunos : []);
      setTurmas(Array.isArray(data?.turmas) ? data.turmas : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar alunos");
      setAlunos([]);
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      carregarDados();
    }, 300);

    return () => clearTimeout(t);
  }, [busca, turmaId]);

  const resumo = useMemo(() => {
    const total = alunos.length;
    const comAtestado = alunos.filter((a) => a.frequencia.atestado > 0).length;
    const comFaltas = alunos.filter((a) => a.frequencia.falta > 0).length;
    const mediaGeral =
      alunos.length > 0
        ? Number(
            (
              alunos.reduce((acc, a) => acc + Number(a.media || 0), 0) /
              alunos.length
            ).toFixed(2)
          )
        : 0;

    return { total, comAtestado, comFaltas, mediaGeral };
  }, [alunos]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">👨‍🎓 Alunos do Professor</h1>
        <p className="text-gray-600 mt-1">
          Acompanhe notas, frequência, faltas, atestados e desempenho acadêmico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Alunos</p>
          <p className="text-2xl font-bold">{resumo.total}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Com faltas</p>
          <p className="text-2xl font-bold">{resumo.comFaltas}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Com atestado</p>
          <p className="text-2xl font-bold">{resumo.comAtestado}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Média geral</p>
          <p className="text-2xl font-bold">{resumo.mediaGeral}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nome, matrícula, email, turma ou disciplina"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 border rounded-lg p-2"
        />

        <select
          value={turmaId}
          onChange={(e) => setTurmaId(e.target.value)}
          className="w-full md:w-80 border rounded-lg p-2 bg-white"
        >
          <option value="">Todas as turmas</option>
          {turmas.map((turma) => (
            <option key={turma.id} value={String(turma.id)}>
              {turma.nome}
              {turma.disciplinaNome ? ` — ${turma.disciplinaNome}` : ""}
            </option>
          ))}
        </select>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          Carregando alunos...
        </div>
      ) : alunos.length === 0 ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          Nenhum aluno encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {alunos.map((aluno) => (
            <div key={aluno.itemMatriculaId} className="bg-white border rounded-xl p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-lg">{aluno.nome}</p>
                  <p className="text-sm text-gray-600">{aluno.email || "-"}</p>
                  <p className="text-sm text-gray-600">
                    Matrícula: {aluno.matricula || "-"}
                  </p>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>Status aluno: {labelStatusAluno(aluno.statusAluno)}</p>
                  <p>Status disciplina: {labelStatusDisciplina(aluno.statusDisciplina)}</p>
                  <p>Turma: {aluno.turma?.nome || "-"}</p>
                  <p>Disciplina: {aluno.disciplina?.nome || "-"}</p>
                  <p>Semestre: {aluno.turma?.semestre || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Lançadas: {aluno.notas.length}
                  </p>
                  <p className="text-sm text-gray-700">
                    Média: {aluno.media ?? "-"}
                  </p>
                  <p className="text-sm text-gray-700">
                    Valores: {aluno.notas.length > 0 ? aluno.notas.join(", ") : "-"}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Frequência</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Percentual: {aluno.frequencia.percentual ?? "-"}%
                  </p>
                  <p className="text-sm text-gray-700">
                    Presenças: {aluno.frequencia.presente}
                  </p>
                  <p className="text-sm text-gray-700">
                    Faltas: {aluno.frequencia.falta}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Justificativas</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Justificadas: {aluno.frequencia.justificada}
                  </p>
                  <p className="text-sm text-gray-700">
                    Atestados: {aluno.frequencia.atestado}
                  </p>
                  <p className="text-sm text-gray-700">
                    Total de registros: {aluno.frequencia.total}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}