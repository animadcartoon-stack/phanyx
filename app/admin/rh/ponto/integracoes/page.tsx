"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Integracao = {
  id: number;
  nome: string;
  provedor: string;
  status: string;
  ativo: boolean;
  baseUrl?: string | null;
};

export default function IntegracoesPontoPage() {
  const t = useTranslations("AdminHRPointIntegrations");
  const locale = useLocale();
  const providerLabel = (provider: string) =>
    provider === "API_GENERICA" ? t("genericApi") :
    provider === "OUTRO" ? t("other") : provider.replaceAll("_", " ");
  const statusLabels: Record<string, string> = {
    CONFIGURADA: t("statusConfigured"),
    CONECTADA: t("statusConnected"),
    FALHA_CONEXAO: t("statusConnectionFailed"),
    SINCRONIZADA: t("statusSyncRecorded"),
    NAO_CONFIGURADA: t("statusNotConfigured"),
  };
  const statusLabel = (status: string) =>
    statusLabels[String(status || "").toUpperCase()] || status;
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);

  const [nome, setNome] = useState("");
  const [provedor, setProvedor] = useState("API_GENERICA");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [token, setToken] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  async function carregarIntegracoes() {
    try {
      const res = await fetch("/api/admin/rh/ponto/integracoes", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(res.status === 401 ? t("notAuthorized") : t("loadError"));
      }
      setIntegracoes(Array.isArray(data) ? data : []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("loadError"));
    }
  }

  async function salvar() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        "/api/admin/rh/ponto/integracoes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            nome,
            provedor,
            baseUrl,
            apiKey,
            usuario,
            senha,
            token,
            observacoes,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale === "pt-BR" && data?.error) || t("saveError"));
      }

      setSucesso(t("saveSuccess"));

      setNome("");
      setBaseUrl("");
      setApiKey("");
      setUsuario("");
      setSenha("");
      setToken("");
      setObservacoes("");

      await carregarIntegracoes();
    } catch (error: any) {
      setErro(error?.message || t("saveError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarIntegracoes();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
          {sucesso}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <h2 className="mb-5 text-lg font-bold">{t("newIntegration")}</h2>

        <div className="grid gap-4 md:grid-cols-2">

          <input
            placeholder={t("namePlaceholder")}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          <select
            value={provedor}
            onChange={(e) => setProvedor(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="API_GENERICA">{t("genericApi")}</option>
            <option value="CONTROL_ID">Control iD</option>
            <option value="TOPDATA">TopData</option>
            <option value="HENRY">Henry</option>
            <option value="AHGORA">Ahgora</option>
            <option value="OUTRO">{t("other")}</option>
          </select>

          <input
            placeholder={t("baseUrlPlaceholder")}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          <input
            placeholder={t("apiKeyPlaceholder")}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          <input
            placeholder={t("usernamePlaceholder")}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          <input
            placeholder={t("passwordPlaceholder")}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          <input
            placeholder={t("tokenPlaceholder")}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
          />
        </div>

        <textarea
          placeholder={t("notesPlaceholder")}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <button
          onClick={salvar}
          disabled={loading}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? t("saving") : t("saveIntegration")}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <h2 className="mb-5 text-lg font-bold">{t("configuredIntegrations")}</h2>

        <p className="mb-4 text-sm text-amber-800 dark:text-amber-200">{t("syncNotice")}</p>
        <div className="space-y-3">
          {integracoes.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">{t("noIntegrations")}</p>}
          {integracoes.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="font-semibold">
                {item.nome}
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300">
                {providerLabel(item.provedor)}
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300">
                {item.baseUrl || "-"}
              </div>

              <div className="mt-2">
                {t("statusLabel")} {statusLabel(item.status)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">

  <button
    type="button"
    onClick={async () => {
      try {
        setErro("");
        setSucesso("");
        const res = await fetch(
          `/api/admin/rh/ponto/integracoes/${item.id}/testar`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setErro((locale === "pt-BR" && data.error) || (res.status === 404 ? t("integrationNotFound") : data.error === "Informe a Base URL antes de testar." ? t("baseUrlRequired") : t("testError")));
          await carregarIntegracoes();
          return;
        }

        setSucesso(t("testSuccess"));

        await carregarIntegracoes();
      } catch {
        setErro(t("testError"));
      }
    }}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >{t("testConnection")}</button>

<button
  type="button"
  onClick={async () => {
    try {
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/admin/rh/ponto/integracoes/${item.id}/sincronizar`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErro((locale === "pt-BR" && data.error) || (res.status === 404 ? t("integrationNotFound") : t("syncError")));
        return;
      }

      setSucesso(
        t("syncResult", { count: Number(data.registrosImportados || 0) })
      );

      await carregarIntegracoes();
    } catch {
      setErro(t("syncError"));
    }
  }}
  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
>{t("recordSync")}</button>

</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
