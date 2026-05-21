"use client";

import { useEffect, useState } from "react";

export default function SearchConsolePage() {
  const [meta, setMeta] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await fetch("/api/admin/integracoes/search-console", {
        cache: "no-store",
      });

      const data = await res.json();

      setMeta(data?.meta || "");
      setAtivo(Boolean(data?.ativo));
    } catch {
      setMensagem("Erro ao carregar configuração.");
    }
  }

  async function salvar() {
    try {
      setSalvando(true);
      setMensagem("");

      const res = await fetch("/api/admin/integracoes/search-console", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meta,
          ativo,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      setMensagem("Search Console salvo com sucesso.");
    } catch {
      setMensagem("Erro ao salvar configuração.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          🔎 Google Search Console
        </h1>
        <p className="mt-2 text-slate-600">
          Configure a verificação do Search Console da sua instituição.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Meta tag de verificação
          </label>

          <input
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            placeholder='Ex: <meta name="google-site-verification" content="..." />'
            className="w-full rounded-xl border px-4 py-3 text-lg"
          />

          <p className="mt-2 text-sm text-slate-500">
            Cole aqui a meta tag fornecida pelo Google Search Console.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          <span className="font-semibold text-slate-800">
            Ativar Search Console nesta instituição
          </span>
        </label>

        {mensagem && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
            {mensagem}
          </div>
        )}

        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}