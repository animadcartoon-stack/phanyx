"use client";

import { useEffect, useState } from "react";

type BeneficioRH = {
  id: number;
  nome: string;
  tipo: string;
  descricao?: string | null;
  valorPadrao?: string | number | null;
  percentual?: string | number | null;
  descontaFolha: boolean;
  ativo: boolean;
};

const TIPOS = [
  "VALE_TRANSPORTE",
  "VALE_ALIMENTACAO",
  "VALE_REFEICAO",
  "PLANO_SAUDE",
  "PLANO_ODONTOLOGICO",
  "SEGURO_VIDA",
  "AUXILIO_EDUCACAO",
  "AUXILIO_CRECHE",
  "AUXILIO_COMBUSTIVEL",
  "AUXILIO_HOME_OFFICE",
  "OUTRO",
];

export default function BeneficiosRHPage() {
  const [beneficios, setBeneficios] = useState<BeneficioRH[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    nome: "",
    tipo: "VALE_TRANSPORTE",
    descricao: "",
    valorPadrao: "",
    percentual: "",
    descontaFolha: true,
    ativo: true,
  });

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch("/api/admin/rh/beneficios", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar benefícios.");
      }

      setBeneficios(data.beneficios || []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar benefícios.");
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

      const res = await fetch("/api/admin/rh/beneficios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar benefício.");
      }

      setSucesso("Benefício cadastrado com sucesso.");
      setForm({
        nome: "",
        tipo: "VALE_TRANSPORTE",
        descricao: "",
        valorPadrao: "",
        percentual: "",
        descontaFolha: true,
        ativo: true,
      });

      await carregar();
    } catch (e: any) {
      setErro(e.message || "Erro ao salvar benefício.");
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
          <h1 className="mt-2 text-3xl font-bold">Benefícios RH</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Cadastre benefícios padrão da instituição para depois vincular aos
            funcionários e integrar automaticamente ao holerite.
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

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <h2 className="text-lg font-bold">Novo benefício</h2>

          <form onSubmit={salvar} className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-300">
                Nome
              </span>
              <input
                value={form.nome}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nome: e.target.value }))
                }
                placeholder="Ex.: Vale Transporte"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">
                Tipo
              </span>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tipo: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">
                Valor padrão
              </span>
              <input
                value={form.valorPadrao}
                onChange={(e) =>
                  setForm((p) => ({ ...p, valorPadrao: e.target.value }))
                }
                placeholder="0,00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">
                Percentual
              </span>
              <input
                value={form.percentual}
                onChange={(e) =>
                  setForm((p) => ({ ...p, percentual: e.target.value }))
                }
                placeholder="Ex.: 6"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <label className="space-y-1 md:col-span-3">
              <span className="text-xs font-semibold text-slate-300">
                Descrição
              </span>
              <input
                value={form.descricao}
                onChange={(e) =>
                  setForm((p) => ({ ...p, descricao: e.target.value }))
                }
                placeholder="Observações internas"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <div className="flex items-center gap-4 md:col-span-4">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.descontaFolha}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      descontaFolha: e.target.checked,
                    }))
                  }
                />
                Desconta na folha
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ativo: e.target.checked }))
                  }
                />
                Ativo
              </label>
            </div>

            <div className="md:col-span-4">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Cadastrar benefício"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-bold">Benefícios cadastrados</h2>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-400">Carregando...</div>
          ) : beneficios.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">
              Nenhum benefício cadastrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Percentual</th>
                    <th className="p-3">Folha</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficios.map((b) => (
                    <tr key={b.id} className="border-t border-slate-800">
                      <td className="p-3 font-semibold">{b.nome}</td>
                      <td className="p-3 text-slate-300">
                        {b.tipo?.replaceAll("_", " ")}
                      </td>
                      <td className="p-3 text-slate-300">
                        {b.valorPadrao
                          ? Number(b.valorPadrao).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "-"}
                      </td>
                      <td className="p-3 text-slate-300">
                        {b.percentual ? `${b.percentual}%` : "-"}
                      </td>
                      <td className="p-3">
                        {b.descontaFolha ? "Desconta" : "Não desconta"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            b.ativo
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {b.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
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