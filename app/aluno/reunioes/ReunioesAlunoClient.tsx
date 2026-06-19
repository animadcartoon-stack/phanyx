"use client";

import { useEffect, useState } from "react";

type Reuniao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  link: string;
  dataHora: string;
  publicoTipo: string;
  status: string;
};

export default function ReunioesAlunoClient() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarReunioes() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/reunioes", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar reuniões.");
      }

      setReunioes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar reuniões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarReunioes();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="aluno-reunioes-fix">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          📅 Minhas reuniões
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Acompanhe as reuniões para as quais você foi convidado.
        </p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {erro}
        </div>
      )}

      {loading ? (
<div className="aluno-reunioes-card rounded-3xl border border-slate-200 bg-white p-6 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">          Carregando reuniões...
        </div>
      ) : reunioes.length === 0 ? (
<div className="aluno-reunioes-card rounded-3xl border border-slate-200 bg-white p-6 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">          Nenhuma reunião disponível no momento.
        </div>
      ) : (
        <div className="grid gap-4">
          {reunioes.map((reuniao) => (
            <div
              key={reuniao.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {reuniao.titulo}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {new Date(reuniao.dataHora).toLocaleString("pt-BR")}
                  </p>

                  {reuniao.descricao && (
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                      {reuniao.descricao}
                    </p>
                  )}
                </div>

                <a
                  href={reuniao.link}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Entrar na reunião
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}