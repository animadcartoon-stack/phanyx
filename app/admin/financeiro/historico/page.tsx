"use client";

import { useEffect, useState } from "react";

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
        throw new Error(data.error || "Erro ao carregar histórico");
      }

      setHistoricos(data);
    } catch (error: any) {
      setMensagem(error.message || "Erro ao carregar histórico");
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
        throw new Error(data.error || "Erro ao registrar histórico");
      }

      setMensagem("Histórico registrado com sucesso.");
      setForm(initialForm);
      await carregarHistorico();
    } catch (error: any) {
      setMensagem(error.message || "Erro ao registrar histórico");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Histórico de Cobrança
        </h1>
        <p className="text-sm text-slate-500">
          Registre e acompanhe as cobranças realizadas pela equipe.
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
              ID do aluno
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
              Nome do aluno
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
              ID do lançamento financeiro
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
              Responsável
            </label>
            <input
              value={form.responsavelNome}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  responsavelNome: e.target.value,
                }))
              }
              placeholder="Opcional"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Canal
            </label>
            <select
              value={form.canal}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, canal: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="MANUAL">Manual</option>
              <option value="EMAIL">E-mail</option>
              <option value="TELEFONE">Telefone</option>
              <option value="SISTEMA">Sistema</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ação
            </label>
            <select
              value={form.acao}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, acao: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            >
              <option value="COBRANCA_ENVIADA">Cobrança enviada</option>
              <option value="LEMBRETE_ENVIADO">Lembrete enviado</option>
              <option value="CONTATO_REALIZADO">Contato realizado</option>
              <option value="NEGOCIACAO">Negociação</option>
              <option value="OBSERVACAO">Observação</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Observação
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
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Registrando..." : "Registrar histórico"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Registros recentes
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando histórico...</p>
        ) : historicos.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum registro encontrado.</p>
        ) : (
          <div className="space-y-3">
            {historicos.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.canal}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.acao}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                  <div>
                    <strong>Aluno:</strong>{" "}
                    {item.alunoNome || item.alunoId || "Não informado"}
                  </div>
                  <div>
                    <strong>Responsável:</strong>{" "}
                    {item.responsavelNome || "Não informado"}
                  </div>
                  <div>
                    <strong>Lançamento:</strong>{" "}
                    {item.lancamentoFinanceiroId || "Não informado"}
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