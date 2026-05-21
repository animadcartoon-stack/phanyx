"use client";

import { useEffect, useState } from "react";

export default function GoogleAnalyticsPage() {
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [googleAnalyticsPropertyId, setGoogleAnalyticsPropertyId] = useState("");
  const [googleAnalyticsAtivo, setGoogleAnalyticsAtivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function carregar() {
      const res = await fetch("/api/admin/integracoes/google-analytics", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) {
        setGoogleAnalyticsId(data?.googleAnalyticsId || "");
        setGoogleAnalyticsPropertyId(data?.googleAnalyticsPropertyId || "");
        setGoogleAnalyticsAtivo(Boolean(data?.googleAnalyticsAtivo));
      }

      setLoading(false);
    }

    carregar();
  }, []);

  async function salvar() {
    setSalvando(true);
    setMensagem("");

    const res = await fetch("/api/admin/integracoes/google-analytics", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        googleAnalyticsId,
        googleAnalyticsAtivo,
        googleAnalyticsPropertyId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMensagem(data?.mensagem || "Configuração salva.");
    } else {
      setMensagem(data?.error || "Erro ao salvar.");
    }

    setSalvando(false);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          📊 Google Analytics
        </h1>
        <p className="mt-2 text-slate-600">
          Configure o Measurement ID da sua instituição.
        </p>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-slate-500">Carregando configuração...</p>
        ) : (
          <div className="space-y-5">
            <div>
  <label className="text-sm font-bold text-slate-700">
    Measurement ID
  </label>

  <input
    value={googleAnalyticsId}
    onChange={(e) => setGoogleAnalyticsId(e.target.value)}
    placeholder="Ex: G-XXXXXXXXXX"
    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
  />

  <p className="mt-2 text-xs text-slate-500">
    Esse é o ID que começa com G-. Ele instala o Analytics no site da instituição.
  </p>
</div>

<div>
  <label className="text-sm font-bold text-slate-700">
    Property ID
  </label>

  <input
    value={googleAnalyticsPropertyId}
    onChange={(e) => setGoogleAnalyticsPropertyId(e.target.value)}
    placeholder="Ex: 538463961"
    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
  />

  <p className="mt-2 text-xs text-slate-500">
    Esse é o ID numérico da propriedade no Google Analytics. Ele é usado para buscar os dados reais no dashboard.
  </p>
</div>

            <label className="flex items-center gap-3 rounded-2xl border bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={googleAnalyticsAtivo}
                onChange={(e) => setGoogleAnalyticsAtivo(e.target.checked)}
              />

              <span className="text-sm font-semibold text-slate-700">
                Ativar Google Analytics nesta instituição
              </span>
            </label>

            {mensagem && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                {mensagem}
              </div>
            )}

            <button
              onClick={salvar}
              disabled={salvando}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar configuração"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}