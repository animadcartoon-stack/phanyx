"use client";

import { useEffect, useMemo, useState } from "react";

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

  const [busca, setBusca] = useState("");

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/y/g, "i")
    .trim();
}

const historicosFiltrados = useMemo(() => {
  const termo = normalizar(busca);

  const lista = [...historicos].sort((a, b) =>
    String(a.funcionario?.nome || "").localeCompare(
      String(b.funcionario?.nome || ""),
      "pt-BR"
    )
  );

  if (!termo) return lista;

  return lista.filter((item) => {
    const nome = normalizar(item.funcionario?.nome || "");
    const cargo = normalizar(item.funcionario?.cargo || "");
    const departamento = normalizar(item.funcionario?.departamento?.nome || "");
    const tipo = normalizar(item.tipo || "");
    const titulo = normalizar(item.titulo || "");

    return (
      nome.includes(termo) ||
      cargo.includes(termo) ||
      departamento.includes(termo) ||
      tipo.includes(termo) ||
      titulo.includes(termo)
    );
  });
}, [historicos, busca]);

const sugestoes = useMemo(() => {
  const termo = normalizar(busca);
  if (!termo) return [];

  const nomes = new Map<string, string>();

  historicos.forEach((item) => {
    const nome = item.funcionario?.nome || "";
    if (!nome) return;

    if (normalizar(nome).includes(termo)) {
      nomes.set(nome, nome);
    }
  });

  return Array.from(nomes.values())
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .slice(0, 8);
}, [historicos, busca]);

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
    <div className="phanyx-rh-page mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <p className="text-sm font-bold uppercase text-blue-700 dark:text-blue-400">
  Departamento Pessoal
</p>

<h1 className="text-3xl font-bold text-slate-950 dark:text-white">
  Histórico Funcional
</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Acompanhe admissões, férias, advertências, suspensões, exames,
          desligamentos e demais eventos funcionais.
        </p>
        <div className="relative mt-5 max-w-xl">
  <input
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    placeholder="Buscar por funcionário, cargo, departamento ou evento..."
className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"  />

  {busca.trim() && sugestoes.length > 0 && (
    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {sugestoes.map((nome) => (
        <button
          key={nome}
          type="button"
          onClick={() => setBusca(nome)}
          className="block w-full px-4 py-3 text-left text-sm text-slate-900 hover:bg-blue-50 dark:text-white dark:hover:bg-blue-600"
        >
          {nome}
        </button>
      ))}
    </div>
  )}
</div>
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
      ) : historicosFiltrados.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Nenhum evento funcional registrado ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {historicosFiltrados.map((item) => (
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

                <div className="rounded-2xl border border-slate-200 !bg-slate-50 px-4 py-2 text-sm font-semibold !text-slate-700 dark:border-slate-700 dark:!bg-slate-800 dark:!text-slate-200">
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