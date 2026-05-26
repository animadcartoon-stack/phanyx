"use client";

import { useEffect, useState } from "react";

type AulaProfessor = {
  id: number;
  titulo?: string;
  nome?: string;
  disciplina?: {
    nome?: string;
  };
  turma?: {
    nome?: string;
  };
};

export default function ProfessorAulasPage() {
  const [aulas, setAulas] = useState<AulaProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/professor/aulas", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Erro ao carregar aulas");
        }

        const lista = Array.isArray(json)
          ? json
          : json.aulas || json.items || [];

        setAulas(lista);
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar aulas");
        setAulas([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <main className="space-y-5 px-1 py-2 text-slate-900 sm:px-0">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Aulas
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900">
          Minhas Aulas
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Acesse as aulas vinculadas às suas turmas e gerencie materiais.
        </p>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Carregando aulas...
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
          {erro}
        </div>
      )}

      {!loading && !erro && aulas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Nenhuma aula encontrada para este professor.
        </div>
      )}

      {!loading && !erro && aulas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {aulas.map((aula) => (
            <article
              key={aula.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Aula
              </p>

              <h2 className="mt-2 text-lg font-black text-slate-900">
                {aula.titulo || aula.nome || "Aula sem título"}
              </h2>

              <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                <p>
                  <strong className="font-semibold text-slate-800">
                    Disciplina:
                  </strong>{" "}
                  {aula.disciplina?.nome || "-"}
                </p>

                <p>
                  <strong className="font-semibold text-slate-800">
                    Turma:
                  </strong>{" "}
                  {aula.turma?.nome || "-"}
                </p>
              </div>

              <a
                href={`/professor/aulas/${aula.id}/materiais/novo`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Adicionar material
              </a>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}