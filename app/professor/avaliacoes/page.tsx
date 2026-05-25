"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Resultado = {
  aluno: string;
  prova: string;
  nota: number | null;
  status: string;
  tentativaId: number;
};

function statusClass(status: string) {
  if (status === "APROVADO") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "REPROVADO") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function AvaliacoesPage() {
  const [dados, setDados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);

        const res = await fetch("/api/professor/avaliacoes", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();
        setDados(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error("Erro ao carregar avaliações:", error);
        setDados([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <div className="space-y-5 px-1 py-2 text-slate-900 sm:px-0">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Avaliações
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900">
          Resultados das Provas
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Acompanhe as tentativas enviadas pelos alunos e veja as respostas de
          cada avaliação.
        </p>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Carregando avaliações...
        </div>
      )}

      {!loading && dados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Nenhum resultado encontrado.
        </div>
      )}

      {!loading && dados.length > 0 && (
        <div className="space-y-4">
          {dados.map((r) => (
            <button
              key={r.tentativaId}
              type="button"
              onClick={() =>
                router.push(`/professor/avaliacoes/${r.tentativaId}`)
              }
              className="block w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Aluno
                  </p>

                  <h2 className="mt-1 text-lg font-black text-slate-900">
                    {r.aluno}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    <strong className="font-semibold text-slate-800">
                      Prova:
                    </strong>{" "}
                    {r.prova}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    Nota: {r.nota ?? "-"}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                      r.status
                    )}`}
                  >
                    {r.status || "Pendente"}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-blue-700">
                Ver respostas →
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}