"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Turma = {
  id: number;
  turmaDisciplinaId: number;
  nome: string;
  semestre: string;
  periodoLetivo?: string | null;
  statusTurma?: string | null;
  alunos: number;
  curso?: {
    id: number;
    nome: string;
  } | null;
  disciplina?: {
    id: number;
    nome: string;
  } | null;
  statusDisciplina?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
};

export default function TurmasProfessorPage() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarTurmas() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/professor/turmas", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar turmas");
        }

        const listaTurmas = Array.isArray(data)
          ? data
          : Array.isArray(data?.turmas)
          ? data.turmas
          : [];

        setTurmas(listaTurmas);
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar turmas");
        setTurmas([]);
      } finally {
        setLoading(false);
      }
    }

    carregarTurmas();
  }, []);

  if (loading) {
    return (
      <main className="p-8 bg-white text-gray-900 min-h-screen">
        Carregando turmas...
      </main>
    );
  }

  if (erro) {
    return (
      <main className="p-8 bg-white text-gray-900 min-h-screen space-y-4">
        <p className="text-red-600">Erro</p>
        <p className="text-gray-700">{erro}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:underline"
        >
          Tentar novamente
        </button>
      </main>
    );
  }

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen space-y-6">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline"
      >
        ⬅ Voltar
      </button>

      <h1 className="text-3xl font-bold flex items-center gap-2">
        📚 Minhas Turmas
      </h1>

      <p className="text-gray-600">
        Selecione uma turma para visualizar os alunos, aulas e boletim
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Array.isArray(turmas) ? turmas : []).map((turma) => (
          <div
            key={turma.id}
            className="border rounded-xl p-6 hover:shadow space-y-4"
          >
            <div
              onClick={() => router.push(`/professor/turmas/${turma.id}`)}
              className="cursor-pointer"
            >
              <h2 className="text-xl font-bold">Turma: {turma.nome}</h2>

<p className="text-gray-700">
  <strong>Curso:</strong> {turma.curso?.nome || "—"}
</p>

<p className="text-gray-700">
  <strong>Disciplina:</strong> {turma.disciplina?.nome || "—"}
</p>

<p className="text-gray-700">
  <strong>Status:</strong>{" "}
  {turma.statusDisciplina || turma.statusTurma || "—"}
</p>

<p className="text-gray-700">
  <strong>Início:</strong>{" "}
  {turma.dataInicio
    ? new Date(turma.dataInicio).toLocaleDateString("pt-BR")
    : "—"}
</p>

<p className="text-gray-700">
  <strong>Fim:</strong>{" "}
  {turma.dataFim
    ? new Date(turma.dataFim).toLocaleDateString("pt-BR")
    : "—"}
</p>

<p className="text-gray-700">
  <strong>Período:</strong> {turma.periodoLetivo || "—"}
</p>

<p className="text-gray-700">
  <strong>Semestre:</strong> {turma.semestre || "—"}
</p>

<p className="text-gray-600">
  👨‍🎓 {turma.alunos} alunos
</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push(`/professor/turmas/${turma.turmaDisciplinaId}`)}
                className="text-left text-blue-600 hover:underline"
              >
                👉 Ver alunos
              </button>

              <button
                onClick={() => router.push(`/professor/turmas/${turma.turmaDisciplinaId}/aulas`)}
                className="text-left text-blue-600 hover:underline"
              >
                🎥 Gerenciar aulas
              </button>

              <button
                onClick={() => router.push(`/professor/turmas/${turma.id}/boletim`)}
                className="text-left text-green-600 hover:underline"
              >
                📊 Ver boletim
              </button>
            </div>
          </div>
        ))}
      </div>

      {turmas.length === 0 && (
        <p className="text-gray-600">Nenhuma turma encontrada.</p>
      )}
    </main>
  );
}