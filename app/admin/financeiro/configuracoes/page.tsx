"use client";

import { useEffect, useState } from "react";

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

export default function ConfiguracoesFinanceirasPage() {
  const [form, setForm] = useState<ConfigFinanceira>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/financeiro/configuracoes", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar configurações");
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
      setMensagem(error.message || "Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setMensagem("");

      const res = await fetch("/api/admin/financeiro/configuracoes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar configurações");
      }

      setMensagem("Configurações financeiras salvas com sucesso.");
    } catch (error: any) {
      setMensagem(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Carregando configurações financeiras...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Configuração Financeira por Instituição
        </h1>
        <p className="text-sm text-slate-500">
          Defina os padrões financeiros usados pela instituição.
        </p>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {mensagem}
        </div>
      )}

      <form
        onSubmit={salvar}
        className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Juros padrão (%)
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Multa padrão (%)
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Desconto padrão
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Dias de tolerância
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={form.bloquearAlunoInadimplente}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  bloquearAlunoInadimplente: e.target.checked,
                }))
              }
            />
            <span className="text-sm text-slate-700">
              Bloquear aluno inadimplente
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={form.permitirPagamentoParcial}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  permitirPagamentoParcial: e.target.checked,
                }))
              }
            />
            <span className="text-sm text-slate-700">
              Permitir pagamento parcial
            </span>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Bloquear após quantas mensalidades em atraso
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              Exemplo: 3 = bloquear somente após 3 mensalidades vencidas.
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}