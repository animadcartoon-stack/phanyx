"use client";

import { useEffect, useState } from "react";

export default function GoogleTagManagerPage() {
  const [containerId, setContainerId] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await fetch("/api/admin/integracoes/google-tag-manager", {
        cache: "no-store",
      });

      const data = await res.json();

      setContainerId(data?.containerId || "");
      setAtivo(Boolean(data?.ativo));
    } catch {
      setMensagem("Erro ao carregar configuração.");
    }
  }

  async function salvar() {
    try {
      setSalvando(true);
      setMensagem("");

      const res = await fetch("/api/admin/integracoes/google-tag-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          containerId,
          ativo,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      setMensagem("Google Tag Manager salvo com sucesso.");
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
          🏷️ Google Tag Manager
        </h1>
        <p className="mt-2 text-slate-600">
          Configure o Container ID da sua instituição.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Container ID
          </label>

          <input
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
            placeholder="GTM-XXXXXXX"
            className="w-full rounded-xl border px-4 py-3 text-lg"
          />

          <p className="mt-2 text-sm text-slate-500">
            Cada instituição deve usar seu próprio container GTM.
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          <span className="font-semibold text-slate-800">
            Ativar Google Tag Manager nesta instituição
          </span>
        </label>

        {mensagem && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-blue-700">
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