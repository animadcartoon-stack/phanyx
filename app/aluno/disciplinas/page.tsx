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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              📘 Minhas Disciplinas
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Visualize suas disciplinas, acompanhe aulas cadastradas e consulte
              o histórico de chamadas registradas.
            </p>
          </div>

          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {loading ? "Carregando..." : `${disciplinasMatriculadas.length} disciplina(s)`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando disciplinas...
        </div>
      ) : disciplinasMatriculadas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Você ainda não está matriculado em nenhuma disciplina.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {disciplinasMatriculadas.map((disciplina) => (
            <div
              key={`${disciplina.id}-${disciplina.turmaId ?? "sem-turma"}`}
              onClick={() => router.push(`/aluno/disciplinas/${disciplina.id}`)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {disciplina.nome}
                </h2>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {disciplina.totalAulas ?? 0} aula(s)
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <strong className="font-medium text-slate-800">
                    Chamadas registradas:
                  </strong>{" "}
                  {disciplina.totalPresencas ?? 0}
                </p>

                <p>
                  <strong className="font-medium text-slate-800">Turma:</strong>{" "}
                  {disciplina.turmaNome || "Não informada"}
                </p>
              </div>

              <div className="mt-5 inline-flex items-center text-sm font-semibold text-blue-600">
                Acessar disciplina →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}