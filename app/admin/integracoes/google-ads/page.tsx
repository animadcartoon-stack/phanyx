"use client";

import { useEffect, useState } from "react";

export default function GoogleAdsPage() {
  const [adsId, setAdsId] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await fetch("/api/admin/integracoes/google-ads", {
        cache: "no-store",
      });

      const data = await res.json();

      setAdsId(data?.adsId || "");
      setAtivo(Boolean(data?.ativo));
    } catch {
      setMensagem("Erro ao carregar configuração.");
    }
  }

  async function salvar() {
    try {
      setSalvando(true);
      setMensagem("");

      const res = await fetch("/api/admin/integracoes/google-ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adsId,
          ativo,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      setMensagem("Google Ads salvo com sucesso.");
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
          💰 Google Ads
        </h1>
        <p className="mt-2 text-slate-600">
          Configure o ID de conversão do Google Ads da sua instituição.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Conversion ID
          </label>

          <input
            value={adsId}
            onChange={(e) => setAdsId(e.target.value)}
            placeholder="AW-123456789"
            className="w-full rounded-xl border px-4 py-3 text-lg"
          />

          <p className="mt-2 text-sm text-slate-500">
            Cada instituição deve usar seu próprio ID do Google Ads.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          <span className="font-semibold text-slate-800">
            Ativar Google Ads nesta instituição
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