"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type ConfigFinanceira = {
  jurosPadrao: number;
  multaPadrao: number;
  descontoPadrao: number;
  diasTolerancia: number;
  bloquearAlunoInadimplente: boolean;
  quantidadeMensalidadesParaBloqueio: number;
  permitirPagamentoParcial: boolean;
};

const initialState: ConfigFinanceira = {
  jurosPadrao: 0,
  multaPadrao: 0,
  descontoPadrao: 0,
  diasTolerancia: 0,
  bloquearAlunoInadimplente: false,
  quantidadeMensalidadesParaBloqueio: 3,
  permitirPagamentoParcial: true,
};

type TipoMensagem = "success" | "error" | "";

export default function ConfiguracoesFinanceirasPage() {
  const t = useTranslations("AdminFinanceSettings");

  const [form, setForm] = useState<ConfigFinanceira>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setLoading(true);
      setMensagem("");
      setTipoMensagem("");

      const res = await fetch("/api/admin/financeiro/configuracoes", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("messages.loadError"));
      }

      setForm({
        jurosPadrao: Number(data.jurosPadrao || 0),
        multaPadrao: Number(data.multaPadrao || 0),
        descontoPadrao: Number(data.descontoPadrao || 0),
        diasTolerancia: Number(data.diasTolerancia || 0),
        bloquearAlunoInadimplente: Boolean(data.bloquearAlunoInadimplente),
        quantidadeMensalidadesParaBloqueio: Number(
          data.quantidadeMensalidadesParaBloqueio || 3
        ),
        permitirPagamentoParcial: Boolean(data.permitirPagamentoParcial),
      });
    } catch (error: any) {
      setMensagem(error.message || t("messages.loadError"));
      setTipoMensagem("error");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setMensagem("");
      setTipoMensagem("");

      const res = await fetch("/api/admin/financeiro/configuracoes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("messages.saveError"));
      }

      setMensagem(t("messages.saveSuccess"));
      setTipoMensagem("success");
    } catch (error: any) {
      setMensagem(error.message || t("messages.saveError"));
      setTipoMensagem("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("loading")}
      </div>
    );
  }

  const inputClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white";

  return (
    <div className="max-w-6xl space-y-6 p-6 text-slate-950 dark:text-slate-100">
      <div className="phanyx-financeiro-config-titulo">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </p>
      </div>

      {mensagem && (
        <div
          className={[
            "rounded-xl border p-4 text-sm shadow-sm",
            tipoMensagem === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
          ].join(" ")}
        >
          {mensagem}
        </div>
      )}

      <form
        onSubmit={salvar}
        className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.defaultInterest")}
            </label>

            <input
              type="number"
              step="0.01"
              value={form.jurosPadrao}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  jurosPadrao: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.defaultPenalty")}
            </label>

            <input
              type="number"
              step="0.01"
              value={form.multaPadrao}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  multaPadrao: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.defaultDiscount")}
            </label>

            <input
              type="number"
              step="0.01"
              value={form.descontoPadrao}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  descontoPadrao: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.graceDays")}
            </label>

            <input
              type="number"
              value={form.diasTolerancia}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  diasTolerancia: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            <input
              type="checkbox"
              checked={form.bloquearAlunoInadimplente}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  bloquearAlunoInadimplente: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-blue-600"
            />

            <span className="text-sm">
              {t("fields.blockDelinquentStudent")}
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            <input
              type="checkbox"
              checked={form.permitirPagamentoParcial}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  permitirPagamentoParcial: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-blue-600"
            />

            <span className="text-sm">
              {t("fields.allowPartialPayment")}
            </span>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.blockAfterOverdueInstallments")}
            </label>

            <input
              type="number"
              min={1}
              value={form.quantidadeMensalidadesParaBloqueio}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  quantidadeMensalidadesParaBloqueio: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("fields.blockExample")}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? t("actions.saving")
              : `💾 ${t("actions.save")}`}
          </button>
        </div>
      </form>
    </div>
  );
}
