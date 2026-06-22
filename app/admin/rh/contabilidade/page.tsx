"use client";

import { useEffect, useMemo, useState } from "react";

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
  departamento?: {
    nome: string;
  } | null;
};

type Holerite = {
  id: number;
  mes: number;
  ano: number;
  salarioBase: number | string;
  totalVencimentos: number | string;
  totalDescontos: number | string;
  valorLiquido: number | string;
  status?: string | null;
  funcionario?: Funcionario | null;
};

type DadosContabilidade = {
  mes: number;
  ano: number;
  totais: {
    salarios: number;
    vencimentos: number;
    descontos: number;
    liquido: number;
  };
  encargosEstimados: {
    inssPatronal: number;
    fgts: number;
    provisaoFerias: number;
    provisaoDecimo: number;
  };
  holerites: Holerite[];
};

export default function ContabilidadeRHPage() {
  const hoje = new Date();

  const [mes, setMes] = useState(String(hoje.getMonth() + 1));
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [dados, setDados] = useState<DadosContabilidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  function moeda(valor: number | string | null | undefined) {
    const numero = Number(valor || 0);

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(
        `/api/admin/rh/contabilidade?mes=${mes}&ano=${ano}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar contabilidade RH.");
      }

      setDados(data);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar contabilidade RH.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalEncargos = useMemo(() => {
    if (!dados) return 0;

    return (
      dados.encargosEstimados.inssPatronal +
      dados.encargosEstimados.fgts +
      dados.encargosEstimados.provisaoFerias +
      dados.encargosEstimados.provisaoDecimo
    );
  }, [dados]);

  return (
    <div className="phanyx-rh-page space-y-6 text-slate-950 dark:text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-700 dark:text-blue-400">
          RH Empresarial
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
          Contabilidade RH
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-700 dark:text-slate-300">
          Confira totais da folha, salários, vencimentos, descontos, líquido e
          encargos estimados do Departamento Pessoal.
        </p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {erro}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Mês
            </label>

            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index + 1} value={String(index + 1)}>
                  {String(index + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Ano
            </label>

            <input
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-end md:col-span-2">
            <button
              type="button"
              onClick={carregarDados}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Carregando..." : "Filtrar competência"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Salários base
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
            {moeda(dados?.totais.salarios)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Vencimentos
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
            {moeda(dados?.totais.vencimentos)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Descontos
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
            {moeda(dados?.totais.descontos)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Líquido
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
            {moeda(dados?.totais.liquido)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Encargos e provisões estimadas
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
              INSS Patronal
            </p>
            <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
              {moeda(dados?.encargosEstimados.inssPatronal)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
              FGTS
            </p>
            <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
              {moeda(dados?.encargosEstimados.fgts)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
              Provisão férias
            </p>
            <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
              {moeda(dados?.encargosEstimados.provisaoFerias)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
              Provisão 13º
            </p>
            <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
              {moeda(dados?.encargosEstimados.provisaoDecimo)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">
              Total estimado
            </p>
            <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
              {moeda(totalEncargos)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Holerites da competência
        </h2>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3">Funcionário</th>
                <th className="p-3">Cargo / Departamento</th>
                <th className="p-3">Salário</th>
                <th className="p-3">Vencimentos</th>
                <th className="p-3">Descontos</th>
                <th className="p-3">Líquido</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-5 text-center text-slate-600 dark:text-slate-300"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : !dados || dados.holerites.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-5 text-center text-slate-600 dark:text-slate-300"
                  >
                    Nenhum holerite encontrado nesta competência.
                  </td>
                </tr>
              ) : (
                dados.holerites.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-200 dark:border-slate-800"
                  >
                    <td className="p-3 font-bold text-slate-950 dark:text-white">
                      {item.funcionario?.nome || "-"}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {item.funcionario?.cargo || "-"}
                      {item.funcionario?.departamento?.nome
                        ? ` • ${item.funcionario.departamento.nome}`
                        : ""}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {moeda(item.salarioBase)}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {moeda(item.totalVencimentos)}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {moeda(item.totalDescontos)}
                    </td>

                    <td className="p-3 font-bold text-slate-950 dark:text-white">
                      {moeda(item.valorLiquido)}
                    </td>

                    <td className="p-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {item.status || "GERADO"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}