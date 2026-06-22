"use client";

import { useEffect, useState } from "react";

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

const MODOS = [
  { value: "MANUAL", label: "Manual" },
  { value: "AFD", label: "Importação AFD" },
  { value: "API", label: "API do equipamento" },
  { value: "COLETOR", label: "Coletor PHANYX" },
];

const PROVEDORES = [
  "API_GENERICA",
  "CONTROL_ID",
  "HENRY",
  "TOPDATA",
  "AHGORA",
  "OUTRO",
];

export default function ConfiguracoesPontoPage() {
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    nome: "Integração de ponto",
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
        throw new Error(data.error || "Erro ao carregar configurações.");
      }

      setIntegracoes(data.integracoes || []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar configurações.");
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
        throw new Error(data.error || "Erro ao salvar configuração.");
      }

      setSucesso("Configuração de ponto cadastrada.");
      setForm({
        nome: "Integração de ponto",
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
      setErro(e.message || "Erro ao salvar configuração.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-rh-page min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Configurações de Ponto
          </h1>

          <p className="mt-2 max-w-4xl text-sm text-slate-400">
            Configure como o PHANYX receberá marcações de ponto: manual,
            importação de arquivo AFD, API do equipamento ou Coletor PHANYX.
          </p>
        </div>

        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-200">
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
                  nome:
                    m.value === "MANUAL"
                      ? "Ponto manual"
                      : m.value === "AFD"
                      ? "Importação AFD"
                      : m.value === "API"
                      ? "API do equipamento"
                      : "Coletor PHANYX",
                }))
              }
              className={`rounded-3xl border p-5 text-left transition ${
                form.modo === m.value
                  ? "border-blue-400 bg-blue-500/15"
                  : "border-slate-800 bg-slate-900/80 hover:border-slate-600"
              }`}
            >
              <p className="text-lg font-bold">{m.label}</p>
              <p className="mt-2 text-sm text-slate-400">
                {m.value === "MANUAL" &&
                  "Lançamento manual das marcações pelo RH."}
                {m.value === "AFD" &&
                  "Importação de arquivo AFD exportado do relógio de ponto."}
                {m.value === "API" &&
                  "Conexão direta com equipamento ou sistema do fabricante."}
                {m.value === "COLETOR" &&
                  "Sincronização automática por serviço instalado na instituição."}
              </p>
            </button>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-lg font-bold">Nova configuração</h2>

          <form onSubmit={salvar} className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-300">
                Nome da configuração
              </span>
              <input
                value={form.nome}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nome: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">
                Modo
              </span>
              <select
                value={form.modo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, modo: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                {MODOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">
                Provedor
              </span>
              <select
                value={form.provedor}
                onChange={(e) =>
                  setForm((p) => ({ ...p, provedor: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                {PROVEDORES.map((p) => (
                  <option key={p} value={p}>
                    {p.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            {(form.modo === "API" || form.modo === "COLETOR") && (
              <>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Base URL
                  </span>
                  <input
                    value={form.baseUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, baseUrl: e.target.value }))
                    }
                    placeholder="https://api.fabricante.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">
                    IP do equipamento
                  </span>
                  <input
                    value={form.ipEquipamento}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        ipEquipamento: e.target.value,
                      }))
                    }
                    placeholder="192.168.0.100"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Porta
                  </span>
                  <input
                    value={form.porta}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, porta: e.target.value }))
                    }
                    placeholder="80, 443, 3000..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
              </>
            )}

            {form.modo === "API" && (
              <>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Usuário API
                  </span>
                  <input
                    value={form.usuario}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, usuario: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Senha API
                  </span>
                  <input
                    type="password"
                    value={form.senha}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, senha: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Token / API Key
                  </span>
                  <input
                    value={form.token}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, token: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
              </>
            )}

            {form.modo === "COLETOR" && (
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-slate-300">
                  Identificador do Coletor PHANYX
                </span>
                <input
                  value={form.coletorIdentificador}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      coletorIdentificador: e.target.value,
                    }))
                  }
                  placeholder="Ex.: IBE-TIJUCAS-COLETOR-01"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </label>
            )}

            {form.modo === "AFD" && (
              <div className="md:col-span-4 rounded-2xl border border-blue-500/20 bg-blue-950/30 p-4 text-sm text-blue-100">
                Este modo será usado para importar arquivos AFD exportados do
                relógio de ponto. A tela de upload será criada depois.
              </div>
            )}

            <label className="space-y-1 md:col-span-4">
              <span className="text-xs font-semibold text-slate-300">
                Observações
              </span>
              <textarea
                value={form.observacoes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, observacoes: e.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-4">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ativo: e.target.checked }))
                }
              />
              Configuração ativa
            </label>

            <div className="md:col-span-4">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar configuração"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-bold">Configurações cadastradas</h2>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-400">Carregando...</div>
          ) : integracoes.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">
              Nenhuma configuração cadastrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Modo</th>
                    <th className="p-3">Provedor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Último Sync</th>
                    <th className="p-3">Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {integracoes.map((i) => (
                    <tr key={i.id} className="border-t border-slate-800">
                      <td className="p-3 font-semibold">{i.nome}</td>
                      <td className="p-3">{i.modo}</td>
                      <td className="p-3">{i.provedor}</td>
                      <td className="p-3">{i.status}</td>
                      <td className="p-3">
                        {i.ultimoSyncEm
                          ? new Date(i.ultimoSyncEm).toLocaleString("pt-BR")
                          : "-"}
                      </td>
                      <td className="p-3">{i.ativo ? "Sim" : "Não"}</td>
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