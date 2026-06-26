"use client";

import { useEffect, useMemo, useState } from "react";

type Substituicao = {
  id: number;
  status: string;
  dataInicio: string;
  dataFim?: string | null;
  motivo?: string | null;
  professorTitular?: { id: number; nome: string } | null;
  turma?: { id: number; nome: string; curso?: { id: number; nome: string } | null } | null;
  disciplina?: { id: number; nome: string } | null;
};

function formatarData(data?: string | null) {
  if (!data) return "sem previsão";
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function ProfessorSubstituicoesPage() {
  const [items, setItems] = useState<Substituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/substituicoes", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar substituições.");
      }

      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar substituições.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const ativas = useMemo(
    () => items.filter((item) => item.status === "ATIVA"),
    [items]
  );

  return (
  <main className="phanyx-professor-substituicoes-page space-y-6 text-slate-900 dark:text-slate-100">

    <section className="substituicao-header rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
        Portal do Professor
      </p>

      <h1 className="mt-2 text-4xl font-black">
        Substituições Docentes
      </h1>

      <p className="substituicao-descricao mt-2 text-sm">
  Veja as turmas e disciplinas em que você está atuando como professor
  substituto. Use sempre seu próprio login.
</p>
    </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Carregando substituições...
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      {!loading && !erro && ativas.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <p className="text-lg font-black text-slate-900 dark:text-white">
            Nenhuma substituição ativa no momento.
          </p>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Quando a instituição atribuir uma substituição ativa a você, ela
            aparecerá aqui automaticamente.
          </p>
        </div>
      )}

      {!loading && !erro && ativas.length > 0 && (
        <section className="grid gap-4 xl:grid-cols-2">
          {ativas.map((item) => (
            <article
              key={item.id}
              className="substituicao-card rounded-3xl border p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="substituicao-selo rounded-full px-3 py-1 text-xs font-black">
                    🔁 EM SUBSTITUIÇÃO
                  </span>

                  <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
                    {item.disciplina?.nome || "Disciplina não informada"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Turma {item.turma?.nome || "-"} •{" "}
                    {item.turma?.curso?.nome || "Curso não informado"}
                  </p>
                </div>

                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
                  {item.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="substituicao-info rounded-2xl border p-4">
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Professor titular
                  </p>
                  <p className="mt-1 font-black text-slate-900 dark:text-white">
                    {item.professorTitular?.nome || "-"}
                  </p>
                </div>

                <div className="substituicao-info rounded-2xl border p-4">
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Período
                  </p>
                  <p className="mt-1 font-black text-slate-900 dark:text-white">
                    {formatarData(item.dataInicio)} até {formatarData(item.dataFim)}
                  </p>
                </div>
              </div>

              {item.motivo && (
                <p className="motivo mt-4 text-sm leading-6">
                  <strong>Motivo:</strong> {item.motivo}
                </p>
              )}

              <a
                href={`/professor/turmas/${item.turma?.id}/aulas?disciplinaId=${item.disciplina?.id || ""}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Entrar na disciplina
              </a>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}