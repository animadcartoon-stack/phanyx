"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Integracao = {
  id: number;
  nome: string;
  modo: string;
  provedor: string;
  ativo: boolean;
  baseUrl?: string | null;
  ipEquipamento?: string | null;
  porta?: number | null;
  usuario?: string | null;
  token?: string | null;
  coletorIdentificador?: string | null;
  status: string;
  ultimoSyncEm?: string | null;
};

const PROVEDORES = [
  "API_GENERICA",
  "CONTROL_ID",
  "HENRY",
  "TOPDATA",
  "AHGORA",
  "OUTRO",
];

export default function ConfiguracoesPontoPage() {
  const t = useTranslations("AdminHRPointSettings");
  const locale = useLocale();
  const MODOS = [
    { value: "MANUAL", label: t("modeManual"), description: t("modeManualDescription"), defaultName: t("manualPoint") },
    { value: "AFD", label: t("modeAfd"), description: t("modeAfdDescription"), defaultName: t("modeAfd") },
    { value: "API", label: t("modeApi"), description: t("modeApiDescription"), defaultName: t("modeApi") },
    { value: "COLETOR", label: t("modeCollector"), description: t("modeCollectorDescription"), defaultName: t("modeCollector") },
  ];
  const providerLabel = (provider: string) =>
    provider === "API_GENERICA" ? t("genericApi") :
    provider === "OUTRO" ? t("other") : provider.replaceAll("_", " ");
  const statusLabels: Record<string, string> = {
    NAO_CONFIGURADA: t("statusNotConfigured"),
    CONFIGURADA: t("statusConfigured"),
    ATIVA: t("statusActive"),
    INATIVA: t("statusInactive"),
    CONECTADA: t("statusConnected"),
    ERRO: t("statusError"),
  };
  const statusLabel = (status: string) =>
    statusLabels[String(status || "").toUpperCase()] || status;
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    nome: t("defaultName"),
    modo: "MANUAL",
    provedor: "OUTRO",
    ativo: true,
    baseUrl: "",
    ipEquipamento: "",
    porta: "",
    apiKey: "",
    usuario: "",
    senha: "",
    token: "",
    coletorIdentificador: "",
    observacoes: "",
  });

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch("/api/admin/rh/ponto/configuracoes", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale === "pt-BR" && data.error) || t("loadError"));
      }

      setIntegracoes(data.integracoes || []);
    } catch (e: any) {
      setErro(e.message || t("loadError"));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch("/api/admin/rh/ponto/configuracoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale === "pt-BR" && data.error) || t("saveError"));
      }

      setSucesso(t("saveSuccess"));
      setForm({
        nome: t("defaultName"),
        modo: "MANUAL",
        provedor: "OUTRO",
        ativo: true,
        baseUrl: "",
        ipEquipamento: "",
        porta: "",
        apiKey: "",
        usuario: "",
        senha: "",
        token: "",
        coletorIdentificador: "",
        observacoes: "",
      });

      await carregar();
    } catch (e: any) {
      setErro(e.message || t("saveError"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-rh-page min-h-screen p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{t("title")}</h1>

          <p className="mt-2 max-w-4xl text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
        </div>

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {sucesso}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          {MODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  modo: m.value,
                  nome: m.defaultName,
                }))
              }
              className={`rounded-3xl border p-5 text-left text-slate-900 transition dark:text-slate-100 ${
                form.modo === m.value
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/15"
                  : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-600"
              }`}
            >
              <p className="text-lg font-bold">{m.label}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {m.description}
              </p>
            </button>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 p-5">
          <h2 className="text-lg font-bold">{t("newSetting")}</h2>

          <form onSubmit={salvar} className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("settingName")}</span>
              <input
                value={form.nome}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nome: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("mode")}</span>
              <select
                value={form.modo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, modo: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {MODOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("provider")}</span>
              <select
                value={form.provedor}
                onChange={(e) =>
                  setForm((p) => ({ ...p, provedor: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {PROVEDORES.map((p) => (
                  <option key={p} value={p}>
                    {providerLabel(p)}
                  </option>
                ))}
              </select>
            </label>

            {(form.modo === "API" || form.modo === "COLETOR") && (
              <>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("baseUrl")}</span>
                  <input
                    value={form.baseUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, baseUrl: e.target.value }))
                    }
                    placeholder="https://api.fabricante.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("equipmentIp")}</span>
                  <input
                    value={form.ipEquipamento}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        ipEquipamento: e.target.value,
                      }))
                    }
                    placeholder="192.168.0.100"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("port")}</span>
                  <input
                    value={form.porta}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, porta: e.target.value }))
                    }
                    placeholder="80, 443, 3000..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </>
            )}

            {form.modo === "API" && (
              <>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("apiUser")}</span>
                  <input
                    value={form.usuario}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, usuario: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("apiPassword")}</span>
                  <input
                    type="password"
                    value={form.senha}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, senha: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("tokenKey")}</span>
                  <input
                    value={form.token}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, token: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </>
            )}

            {form.modo === "COLETOR" && (
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("collectorId")}</span>
                <input
                  value={form.coletorIdentificador}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      coletorIdentificador: e.target.value,
                    }))
                  }
                  placeholder={t("collectorPlaceholder")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
            )}

            {form.modo === "AFD" && (
              <div className="md:col-span-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-950/30 dark:text-blue-100">{t("afdNotice")}</div>
            )}

            <label className="space-y-1 md:col-span-4">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("notes")}</span>
              <textarea
                value={form.observacoes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, observacoes: e.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-4">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ativo: e.target.checked }))
                }
              />{t("activeSetting")}</label>

            <div className="md:col-span-4">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {salvando ? t("saving") : t("saveSettings")}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="text-lg font-bold">{t("savedSettings")}</h2>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-600 dark:text-slate-300">{t("loading")}</div>
          ) : integracoes.length === 0 ? (
            <div className="p-5 text-sm text-slate-600 dark:text-slate-300">{t("emptySettings")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide dark:bg-slate-950/70 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">{t("name")}</th>
                    <th className="p-3">{t("mode")}</th>
                    <th className="p-3">{t("provider")}</th>
                    <th className="p-3">{t("status")}</th>
                    <th className="p-3">{t("lastSync")}</th>
                    <th className="p-3">{t("active")}</th>
                  </tr>
                </thead>
                <tbody>
                  {integracoes.map((i) => (
                    <tr key={i.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="p-3 font-semibold">{i.nome}</td>
                      <td className="p-3">{MODOS.find((mode) => mode.value === i.modo)?.label || i.modo}</td>
                      <td className="p-3">{providerLabel(i.provedor)}</td>
                      <td className="p-3">{statusLabel(i.status)}</td>
                      <td className="p-3">
                        {i.ultimoSyncEm
                          ? new Date(i.ultimoSyncEm).toLocaleString(locale)
                          : "-"}
                      </td>
                      <td className="p-3">{i.ativo ? t("yes") : t("no")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
