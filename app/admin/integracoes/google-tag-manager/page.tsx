"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function GoogleTagManagerPage() {
  const t = useTranslations("AdminIntegracoes.googleTagManager");
  const common = useTranslations("AdminIntegracoes.common");

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
      setMensagem(common("loadError"));
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

      setMensagem(t("success"));
    } catch {
      setMensagem(common("saveError"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="phanyx-google-config-page max-w-3xl space-y-6">
      <div>
        <h1 className="phanyx-config-title text-3xl font-black">
          {"\u{1F3F7}\uFE0F"} Google Tag Manager
        </h1>

        <p className="phanyx-config-muted mt-2">
          {t("description")}
        </p>
      </div>

      <div className="phanyx-config-card space-y-5 p-6 shadow-sm">
        <div>
          <label className="phanyx-config-label mb-2 block text-sm">
            {t("containerId")}
          </label>

          <input
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
            placeholder="GTM-XXXXXXX"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
          />

          <p className="phanyx-config-muted mt-2 text-sm">
            {t("help")}
          </p>
        </div>

        <label className="phanyx-config-check-row flex cursor-pointer items-center gap-3 rounded-xl p-4">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />

          <span className="phanyx-config-check-label font-semibold">
            {t("activate")}
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
          {salvando ? common("saving") : common("saveConfiguration")}
        </button>
      </div>
    </div>
  );
}
