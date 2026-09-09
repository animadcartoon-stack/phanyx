"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Historico = {
  id: number;
  alunoId?: number | null;
  alunoNome?: string | null;
  lancamentoFinanceiroId?: number | null;
  responsavelId?: number | null;
  responsavelNome?: string | null;
  canal: string;
  acao: string;
  observacao?: string | null;
  createdAt: string;
};

type FormState = {
  alunoId: string;
  alunoNome: string;
  lancamentoFinanceiroId: string;
  responsavelNome: string;
  canal: string;
  acao: string;
  observacao: string;
};

const initialForm: FormState = {
  alunoId: "",
  alunoNome: "",
  lancamentoFinanceiroId: "",
  responsavelNome: "",
  canal: "WHATSAPP",
  acao: "COBRANCA_ENVIADA",
  observacao: "",
};

export default function HistoricoCobrancaPage() {
  const t = useTranslations("AdminFinanceiroHistorico");
  const locale = useLocale();

  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    carregarHistorico();
  }, []);

  async function carregarHistorico() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/financeiro/historico", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("messages.loadError"));
      }

      setHistoricos(data);
    } catch (error: any) {
      setMensagem(error.message || t("messages.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setMensagem("");

      const payload = {
        alunoId: form.alunoId,
        alunoNome: form.alunoNome,
        lancamentoFinanceiroId: form.lancamentoFinanceiroId,
        responsavelNome: form.responsavelNome,
        canal: form.canal,
        acao: form.acao,
        observacao: form.observacao,
      };

      const res = await fetch("/api/admin/financeiro/historico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("messages.saveError"));
      }

      setMensagem(t("messages.saveSuccess"));
      setForm(initialForm);
      await carregarHistorico();
    } catch (error: any) {
      setMensagem(error.message || t("messages.saveError"));
    } finally {
      setSaving(false);
    }
  }

  function labelCanal(canal: string) {
    const chave = String(canal || "").toUpperCase();

    const labels: Record<string, string> = {
      WHATSAPP: t("channels.whatsapp"),
      MANUAL: t("channels.manual"),
      EMAIL: t("channels.email"),
      TELEFONE: t("channels.phone"),
      SISTEMA: t("channels.system"),
    };

    return labels[chave] || canal;
  }

  function labelAcao(acao: string) {
    const chave = String(acao || "").toUpperCase();

    const labels: Record<string, string> = {
      COBRANCA_ENVIADA: t("actions.chargeSent"),
      LEMBRETE_ENVIADO: t("actions.reminderSent"),
      CONTATO_REALIZADO: t("actions.contactMade"),
      NEGOCIACAO: t("actions.negotiation"),
      OBSERVACAO: t("actions.note"),
      COBRANCA_COPIADA: t("actions.chargeCopied"),
      BAIXA_MANUAL: t("actions.manualSettlement"),
    };

    return labels[chave] || acao;
  }

  return (
    <div className="phanyx-financeiro-historico-page space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {t("title")}
        </h1>

        <p className="text-sm text-slate-500">
          {t("subtitle")}
        </p>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {mensagem}
        </div>
      )}

      <form
        onSubmit={salvar}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("fields.studentId")}
            </label>

            <input
              value={form.alunoId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, alunoId: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("fields.studentName")}
            </label>

            <input
              value={form.alunoNome}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, alunoNome: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("fields.financialEntryId")}
            </label>

            <input
              value={form.lancamentoFinanceiroId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  lancamentoFinanceiroId: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("fields.responsible")}
            </label>

            <input
              value={form.responsavelNome}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  responsavelNome: e.target.value,
                }))
              }
              placeholder={t("common.optional")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("fields.channel")}
            </label>

            <select
              value={form.canal}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, canal: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            >
              <option value="WHATSAPP">{t("channels.whatsapp")}</option>
              <option value="MANUAL">{t("channels.manual")}</option>
              <option value="EMAIL">{t("channels.email")}</option>
              <option value="TELEFONE">{t("channels.phone")}</option>
              <option value="SISTEMA">{t("channels.system")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("fields.action")}
            </label>

            <select
              value={form.acao}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, acao: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            >
              <option value="COBRANCA_ENVIADA">{t("actions.chargeSent")}</option>
              <option value="LEMBRETE_ENVIADO">{t("actions.reminderSent")}</option>
              <option value="CONTATO_REALIZADO">{t("actions.contactMade")}</option>
              <option value="NEGOCIACAO">{t("actions.negotiation")}</option>
              <option value="OBSERVACAO">{t("actions.note")}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t("fields.note")}
          </label>

          <textarea
            value={form.observacao}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, observacao: e.target.value }))
            }
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="phanyx-financeiro-primary-action rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
          >
            {saving ? t("buttons.saving") : t("buttons.register")}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {t("recent.title")}
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">{t("recent.loading")}</p>
        ) : historicos.length === 0 ? (
          <p className="text-sm text-slate-500">{t("recent.empty")}</p>
        ) : (
          <div className="space-y-3">
            {historicos.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {labelCanal(item.canal)}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {labelAcao(item.acao)}
                  </span>

                  <span className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString(locale)}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                  <div>
                    <strong>{t("recent.student")}:</strong>{" "}
                    {item.alunoNome || item.alunoId || t("common.notProvided")}
                  </div>

                  <div>
                    <strong>{t("recent.responsible")}:</strong>{" "}
                    {item.responsavelNome || t("common.notProvided")}
                  </div>

                  <div>
                    <strong>{t("recent.entry")}:</strong>{" "}
                    {item.lancamentoFinanceiroId || t("common.notProvided")}
                  </div>
                </div>

                {item.observacao && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    {item.observacao}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
