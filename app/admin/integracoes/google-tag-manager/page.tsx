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
    <div className="phanyx-google-config-page max-w-3xl space-y-6">
      <div>
        <h1 className="phanyx-config-title text-3xl font-black">
          🏷️ Google Tag Manager
        </h1>

        <p className="phanyx-config-muted mt-2">
          Configure o Container ID da sua instituição.
        </p>
      </div>

      <div className="phanyx-config-card space-y-5 p-6 shadow-sm">
        <div>
          <label className="phanyx-config-label mb-2 block text-sm">
            Container ID
          </label>

          <input
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
            placeholder="GTM-XXXXXXX"
            className="phanyx-config-input text-lg"
          />

          <p className="phanyx-config-muted mt-2 text-sm">
            Cada instituição deve usar seu próprio container GTM.
          </p>
        </div>

        <label className="phanyx-config-check-row flex cursor-pointer items-center gap-3 rounded-xl p-4">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />

          <span className="phanyx-config-check-label font-semibold">
            Ativar Google Tag Manager nesta instituição
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