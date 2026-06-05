"use client";

import { useEffect, useState } from "react";

type HistoricoRH = {
  id: number;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  dataEvento: string;
  observacoes?: string | null;
  funcionario: {
    id: number;
    nome: string;
    cargo?: string | null;
    departamento?: {
      nome: string;
    } | null;
  };
};

export default function HistoricoRHPage() {
  const [historicos, setHistoricos] = useState<HistoricoRH[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarHistorico() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/rh/historico", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar histórico.");
      }

      setHistoricos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar histórico.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarHistorico();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          🕒 Histórico Funcional
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Acompanhe admissões, férias, advertências, suspensões, exames,
          desligamentos e demais eventos funcionais.
        </p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Carregando histórico funcional...
        </div>
      ) : historicos.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Nenhum evento funcional registrado ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {historicos.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    {item.tipo}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {item.titulo}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Funcionário:{" "}
                    <strong>{item.funcionario?.nome || "-"}</strong>
                    {item.funcionario?.cargo
                      ? ` • ${item.funcionario.cargo}`
                      : ""}
                    {item.funcionario?.departamento?.nome
                      ? ` • ${item.funcionario.departamento.nome}`
                      : ""}
                  </p>

                  {item.descricao && (
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                      {item.descricao}
                    </p>
                  )}

                  {item.observacoes && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Observações: {item.observacoes}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {new Date(item.dataEvento).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}