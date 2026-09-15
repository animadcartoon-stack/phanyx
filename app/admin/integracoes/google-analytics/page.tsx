"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function GoogleAnalyticsPage() {
  const t = useTranslations("AdminIntegracoes.googleAnalytics");
  const common = useTranslations("AdminIntegracoes.common");

  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [googleAnalyticsPropertyId, setGoogleAnalyticsPropertyId] = useState("");
  const [googleAnalyticsAtivo, setGoogleAnalyticsAtivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/admin/integracoes/google-analytics", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error();
        }

        setGoogleAnalyticsId(data?.googleAnalyticsId || "");
        setGoogleAnalyticsPropertyId(data?.googleAnalyticsPropertyId || "");
        setGoogleAnalyticsAtivo(Boolean(data?.googleAnalyticsAtivo));
      } catch {
        setMensagem(common("loadError"));
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  async function salvar() {
    try {
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

      await res.json().catch(() => null);

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
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          {"\u{1F4CA}"} Google Analytics
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">
            {common("loadingConfiguration")}
          </p>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("measurementId")}
              </label>

              <input
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("measurementHelp")}
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("propertyId")}
              </label>

              <input
                value={googleAnalyticsPropertyId}
                onChange={(e) => setGoogleAnalyticsPropertyId(e.target.value)}
                placeholder="538463961"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("propertyHelp")}
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="checkbox"
                checked={googleAnalyticsAtivo}
                onChange={(e) => setGoogleAnalyticsAtivo(e.target.checked)}
              />

              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("activate")}
              </span>
            </label>

            {mensagem && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                {mensagem}
              </div>
            )}

            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? common("saving") : common("saveConfiguration")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
