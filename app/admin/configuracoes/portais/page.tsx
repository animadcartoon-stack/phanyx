"use client";

import { useEffect, useMemo, useState } from "react";

type PaginaPortal = {
  id: number | null;
  portal: "ALUNO" | "PROFESSOR";
  chavePagina: string;
  nome: string;
  visivel: boolean;
};

export default function ConfiguracaoPortaisPage() {
  const [paginas, setPaginas] = useState<PaginaPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/configuracoes/portais", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar configurações");
      }

      setPaginas(Array.isArray(data?.paginas) ? data.paginas : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar configurações");
      setPaginas([]);
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const res = await fetch("/api/admin/configuracoes/portais", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paginas }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar configurações");
      }

      setMensagem("Configurações salvas com sucesso.");
      await carregar();
    } catch (e: any) {
      setErro(e?.message || "Erro ao salvar configurações");
    } finally {
      setSalvando(false);
    }
  }

  function alternar(chavePagina: string) {
    setPaginas((atuais) =>
      atuais.map((item) =>
        item.chavePagina === chavePagina
          ? { ...item, visivel: !item.visivel }
          : item
      )
    );
  }

  useEffect(() => {
    carregar();
  }, []);

  const paginasAluno = useMemo(
    () => paginas.filter((p) => p.portal === "ALUNO"),
    [paginas]
  );

  const paginasProfessor = useMemo(
    () => paginas.filter((p) => p.portal === "PROFESSOR"),
    [paginas]
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Configurações
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            Visibilidade dos Portais
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Defina quais páginas aparecem para alunos e professores desta
            instituição.
          </p>
        </section>

        {mensagem && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Carregando configurações...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <BlocoPortal
              titulo="Área do Aluno"
              descricao="Controle as páginas visíveis no portal do aluno."
              paginas={paginasAluno}
              onAlternar={alternar}
            />

            <BlocoPortal
              titulo="Área do Professor"
              descricao="Controle as páginas visíveis no portal do professor."
              paginas={paginasProfessor}
              onAlternar={alternar}
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || loading}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </div>
    </main>
  );
}

function BlocoPortal({
  titulo,
  descricao,
  paginas,
  onAlternar,
}: {
  titulo: string;
  descricao: string;
  paginas: PaginaPortal[];
  onAlternar: (chavePagina: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {titulo}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {descricao}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {paginas.map((pagina) => (
          <button
            key={pagina.chavePagina}
            type="button"
            onClick={() => onAlternar(pagina.chavePagina)}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {pagina.nome}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {pagina.chavePagina}
              </p>
            </div>

            <span
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                pagina.visivel
                  ? "bg-blue-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                  pagina.visivel ? "left-6" : "left-1"
                }`}
              />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}