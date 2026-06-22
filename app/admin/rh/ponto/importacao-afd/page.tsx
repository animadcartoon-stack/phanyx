"use client";

import { useState } from "react";

export default function ImportacaoAFDPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [resumo, setResumo] = useState<any>(null);

  async function importar(e: React.FormEvent) {
    e.preventDefault();

    if (!arquivo) {
      setErro("Selecione um arquivo AFD para importar.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");
      setSucesso("");
      setResumo(null);

      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const res = await fetch("/api/admin/rh/ponto/importacao-afd", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao importar AFD.");
      }

      setSucesso(data.message || "Arquivo AFD importado com sucesso.");
      setResumo(data.resumo || null);
      setArquivo(null);
    } catch (e: any) {
      setErro(e.message || "Erro ao importar AFD.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="phanyx-rh-page min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Importação AFD
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Importe o arquivo AFD exportado do relógio de ponto. O PHANYX
            localizará os funcionários pelo Código do Ponto ou PIS/PASEP e
            gravará as marcações automaticamente.
          </p>
        </div>

        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-200">
            {sucesso}
          </div>
        )}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-lg font-bold">Enviar arquivo AFD</h2>

          <form onSubmit={importar} className="mt-5 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">
                Arquivo AFD (.txt)
              </span>

              <input
                type="file"
                accept=".txt,.afd"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-500"
              />
            </label>

            {arquivo && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-950/30 p-4 text-sm text-blue-100">
                Arquivo selecionado: <strong>{arquivo.name}</strong>
              </div>
            )}

            <button
              disabled={carregando}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {carregando ? "Importando..." : "Importar AFD"}
            </button>
          </form>
        </section>

        {resumo && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-lg font-bold">Resumo da importação</h2>

            <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-slate-400">Linhas no arquivo</p>
                <p className="text-xl font-bold">{resumo.linhasArquivo}</p>
              </div>

              <div>
                <p className="text-slate-400">Linhas lidas</p>
                <p className="text-xl font-bold">{resumo.linhasLidas}</p>
              </div>

              <div>
                <p className="text-slate-400">Linhas ignoradas</p>
                <p className="text-xl font-bold">{resumo.linhasIgnoradas}</p>
              </div>

              <div>
                <p className="text-slate-400">Funcionários/dias encontrados</p>
                <p className="text-xl font-bold">
                  {resumo.funcionariosEncontrados}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Registros criados</p>
                <p className="text-xl font-bold text-emerald-300">
                  {resumo.registrosCriados}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Registros atualizados</p>
                <p className="text-xl font-bold text-blue-300">
                  {resumo.registrosAtualizados}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-amber-500/20 bg-amber-950/20 p-5 text-sm text-amber-100">
          <h2 className="font-bold">Atenção</h2>
          <p className="mt-2 leading-6">
            Para a importação funcionar corretamente, cada funcionário precisa
            ter o campo <strong>Código do Ponto</strong> ou{" "}
            <strong>PIS/PASEP</strong> preenchido na ficha do funcionário com o
            mesmo identificador usado no relógio de ponto.
          </p>
        </section>
      </div>
    </main>
  );
}