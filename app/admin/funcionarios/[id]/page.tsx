"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";

type Beneficio = {
  id: number;
  nome: string;
  tipo: string;
  valorPadrao?: any;
  percentual?: any;
  descontaFolha: boolean;
};

type Vinculo = {
  id: number;
  valor?: any;
  percentual?: any;
  descontaFolha: boolean;
  ativo: boolean;
  beneficio: Beneficio;
};

function moeda(v: any) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function FuncionarioFichaPage() {
  const params = useParams();
  const funcionarioId = Number(params.id);

  const [funcionario, setFuncionario] = useState<any>(null);

  const [beneficiosDisponiveis, setBeneficiosDisponiveis] = useState<Beneficio[]>([]);
  const [beneficiosVinculados, setBeneficiosVinculados] = useState<Vinculo[]>([]);

  const [beneficioId, setBeneficioId] = useState("");
  const [valor, setValor] = useState("");
  const [percentual, setPercentual] = useState("");
  const [descontaFolha, setDescontaFolha] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarFuncionario() {
  try {
    const res = await fetch(`/api/funcionario/${funcionarioId}`, {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao carregar funcionário.");
    }

    setFuncionario(data.funcionario);
  } catch (e: any) {
    setErro(e.message || "Erro ao carregar funcionário.");
  }
}

  async function carregarBeneficios() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch(`/api/admin/funcionarios/${funcionarioId}/beneficios`, {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar benefícios.");
      }

      setBeneficiosDisponiveis(data.beneficiosDisponiveis || []);
      setBeneficiosVinculados(data.beneficiosVinculados || []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar benefícios.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
  if (!funcionarioId) return;

  carregarFuncionario();
  carregarBeneficios();
}, [funcionarioId]);

  async function vincularBeneficio(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch(`/api/admin/funcionarios/${funcionarioId}/beneficios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          beneficioId,
          valor,
          percentual,
          descontaFolha,
          ativo: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao vincular benefício.");
      }

      setSucesso("Benefício vinculado ao funcionário.");
      setBeneficioId("");
      setValor("");
      setPercentual("");
      setDescontaFolha(true);

      await carregarBeneficios();
    } catch (e: any) {
      setErro(e.message || "Erro ao vincular benefício.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Link href="/admin/funcionarios" className="text-sm text-blue-300 hover:text-blue-200">
            ← Voltar para funcionários
          </Link>

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold">Ficha do Funcionário</h1>

          {funcionario && (
  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
    <h2 className="text-lg font-bold">
      👤 Dados Gerais
    </h2>

    <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
      <div>
        <p className="text-slate-400">Nome</p>
        <p>{funcionario.nome || "-"}</p>
      </div>

      <div>
        <p className="text-slate-400">CPF</p>
        <p>{funcionario.cpf || "-"}</p>
      </div>

      <div>
        <p className="text-slate-400">RG</p>
        <p>{funcionario.rg || "-"}</p>
      </div>

      <div>
        <p className="text-slate-400">Telefone</p>
        <p>{funcionario.telefone || "-"}</p>
      </div>

      <div>
        <p className="text-slate-400">Cargo</p>
        <p>{funcionario.cargo || "-"}</p>
      </div>

      <div>
        <p className="text-slate-400">Departamento</p>
        <p>{funcionario.departamento?.nome || "-"}</p>
      </div>

      <div>
        <p className="text-slate-400">Código</p>
        <p>{funcionario.codigoFuncionario || "-"}</p>
      </div>

      <div>
        <p className="text-slate-400">Status</p>
        <p>{funcionario.statusFuncionario || "-"}</p>
      </div>

      <div>
        <p className="text-slate-400">Email</p>
        <p>{funcionario.user?.email || "-"}</p>
      </div>
    </div>
  </div>
)}

          <p className="mt-2 text-sm text-slate-400">
            Área central do Departamento Pessoal. Primeiro módulo ativo: benefícios vinculados ao funcionário.
          </p>
        </div>

        {erro && (
          <PhanyxToast
            tipo="erro"
            titulo="Não foi possível concluir"
            mensagem={erro}
            onClose={() => setErro("")}
          />
        )}

        {sucesso && (
          <PhanyxToast
            tipo="sucesso"
            titulo="Tudo certo"
            mensagem={sucesso}
            onClose={() => setSucesso("")}
          />
        )}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-lg font-bold">🎁 Benefícios</h2>

          <form onSubmit={vincularBeneficio} className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-300">Benefício</span>
              <select
                value={beneficioId}
                onChange={(e) => setBeneficioId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                required
              >
                <option value="">Selecione</option>
                {beneficiosDisponiveis.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">Valor (R$)</span>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex.: 120,00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">Percentual (%)</span>
              <input
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                placeholder="Ex.: 6"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-4">
              <input
                type="checkbox"
                checked={descontaFolha}
                onChange={(e) => setDescontaFolha(e.target.checked)}
              />
              Desconta na folha
            </label>

            <div className="md:col-span-4">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {salvando ? "Vinculando..." : "Vincular benefício"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-bold">Benefícios vinculados</h2>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-400">Carregando...</div>
          ) : beneficiosVinculados.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">
              Nenhum benefício vinculado a este funcionário.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/70 text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Benefício</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Percentual</th>
                    <th className="p-3">Folha</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiosVinculados.map((v) => (
                    <tr key={v.id} className="border-t border-slate-800">
                      <td className="p-3 font-semibold">{v.beneficio?.nome}</td>
                      <td className="p-3 text-slate-300">
                        {v.beneficio?.tipo?.replaceAll("_", " ")}
                      </td>
                      <td className="p-3 text-slate-300">
                        {v.valor ? moeda(v.valor) : "-"}
                      </td>
                      <td className="p-3 text-slate-300">
                        {v.percentual ? `${v.percentual}%` : "-"}
                      </td>
                      <td className="p-3">
                        {v.descontaFolha ? "Desconta" : "Não desconta"}
                      </td>
                      <td className="p-3">
                        {v.ativo ? "Ativo" : "Inativo"}
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

export default withAuth(FuncionarioFichaPage, ["admin"]);