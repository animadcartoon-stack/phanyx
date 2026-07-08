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
    <div className="phanyx-google-config-page max-w-3xl space-y-6">
      <div>
        <h1 className="phanyx-config-title text-3xl font-black">
          💰 Google Ads
        </h1>

        <p className="phanyx-config-muted mt-2">
          Configure o ID de conversão do Google Ads da sua instituição.
        </p>
      </div>

      <div className="phanyx-config-card space-y-5 p-6 shadow-sm">
        <div>
          <label className="phanyx-config-label mb-2 block text-sm">
            Conversion ID
          </label>

          <input
            value={adsId}
            onChange={(e) => setAdsId(e.target.value)}
            placeholder="AW-123456789"
            className="phanyx-config-input text-lg"
          />

          <p className="phanyx-config-muted mt-2 text-sm">
            Cada instituição deve usar seu próprio ID do Google Ads.
          </p>
        </div>

        <label className="phanyx-config-check-row flex cursor-pointer items-center gap-3 rounded-xl p-4">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />

          <span className="phanyx-config-check-label font-semibold">
            Ativar Google Ads nesta instituição
          </span>
        </label>

        {mensagem && (
          <div className="phanyx-config-info rounded-xl p-4">
            {mensagem}
          </div>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="phanyx-primary-action disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}