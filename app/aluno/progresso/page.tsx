"use client";

import { useEffect, useState } from "react";

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

function getPercentual(totalAulas?: number, totalPresencas?: number) {
  const aulas = Number(totalAulas || 0);
  const presencas = Number(totalPresencas || 0);

  if (aulas <= 0) return 0;

  return Math.min(100, Math.round((presencas / aulas) * 100));
}

export default function ProgressoAluno() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaAluno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProgresso();
  }, []);

  async function carregarProgresso() {
    try {
      setLoading(true);

      const res = await fetch("/api/aluno/aulas", {
        credentials: "include",
        cache: "no-store",
      });

      const json: AulasAlunoResponse = await res.json();

      if (!res.ok || !Array.isArray(json?.disciplinas)) {
        setDisciplinas([]);
        return;
      }

      setDisciplinas(json.disciplinas);
    } catch {
      setDisciplinas([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Progresso Acadêmico
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Acompanhe seu avanço por disciplina com base nas aulas cadastradas e
          nos registros acadêmicos já vinculados ao seu perfil.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando progresso...
        </div>
      ) : disciplinas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Nenhum progresso acadêmico disponível no momento.
        </div>
      ) : (
        <div className="grid gap-6">
          {disciplinas.map((disciplina) => {
            const percentual = getPercentual(
              disciplina.totalAulas,
              disciplina.totalPresencas
            );

            const concluido = percentual >= 100;

            return (
              <div
                key={`${disciplina.id}-${disciplina.turmaId ?? "sem-turma"}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {disciplina.nome}
                    </h2>

                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>
                        <strong className="font-medium text-slate-800">
                          Turma:
                        </strong>{" "}
                        {disciplina.turmaNome || "Não informada"}
                      </p>

                      <p>
                        <strong className="font-medium text-slate-800">
                          Total de aulas:
                        </strong>{" "}
                        {disciplina.totalAulas ?? 0}
                      </p>

                      <p>
                        <strong className="font-medium text-slate-800">
                          Chamadas registradas:
                        </strong>{" "}
                        {disciplina.totalPresencas ?? 0}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      concluido
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {concluido ? "Concluído" : "Em andamento"}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      Percentual de acompanhamento
                    </span>
                    <span className="font-semibold text-slate-900">
                      {percentual}%
                    </span>
                  </div>

                  <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        concluido ? "bg-emerald-600" : "bg-blue-600"
                      }`}
                      style={{ width: `${percentual}%` }}
                    />
                  </div>

                  {concluido && (
                    <p className="mt-3 text-sm font-semibold text-emerald-700">
                      ✅ Disciplina com acompanhamento completo.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}