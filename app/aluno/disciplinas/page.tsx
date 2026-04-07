"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DisciplinaAluno = {
  id: number;
  nome: string;
  turmaId?: number;
  turmaNome?: string;
  totalAulas?: number;
  totalPresencas?: number;
};

type AulasAlunoResponse = {
  curso?: {
    id: number;
    nome: string;
  } | null;
  disciplinas: DisciplinaAluno[];
};

export default function DisciplinasAluno() {
  const router = useRouter();
  const [disciplinasMatriculadas, setDisciplinasMatriculadas] = useState<
    DisciplinaAluno[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  async function carregarDisciplinas() {
    try {
      setLoading(true);

      const res = await fetch("/api/aluno/aulas", {
        credentials: "include",
        cache: "no-store",
      });

      const json: AulasAlunoResponse = await res.json();

      if (!res.ok || !Array.isArray(json?.disciplinas)) {
        setDisciplinasMatriculadas([]);
        return;
      }

      setDisciplinasMatriculadas(json.disciplinas);
    } catch {
      setDisciplinasMatriculadas([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📘 Minhas Disciplinas</h1>

      {loading ? (
        <p className="text-gray-600">Carregando disciplinas...</p>
      ) : disciplinasMatriculadas.length === 0 ? (
        <p className="text-gray-600">
          Você ainda não está matriculado em nenhuma disciplina.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {disciplinasMatriculadas.map((disciplina) => (
            <div
              key={`${disciplina.id}-${disciplina.turmaId ?? "sem-turma"}`}
              onClick={() =>
                router.push(`/aluno/disciplina/${disciplina.id}`)
              }
              className="cursor-pointer rounded-xl border bg-white p-6 shadow transition hover:border-blue-500 hover:shadow-lg"
            >
              <h2 className="text-lg font-semibold">{disciplina.nome}</h2>

              <p className="mt-2 text-sm text-gray-600">
                {disciplina.totalAulas ?? 0} aulas
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Chamadas registradas: {disciplina.totalPresencas ?? 0}
              </p>

              {disciplina.turmaNome && (
                <p className="mt-1 text-sm text-gray-500">
                  Turma: {disciplina.turmaNome}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}