"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";

type DashboardMasterResponse = {
  filtros: {
    busca: string;
    status: string;
    plano: string;
  };
  resumo: {
    totalInstituicoes: number;
    totalAdesoes: number;
    totalPagas: number;
    totalPendentes: number;
    totalComInstituicaoCriada: number;
    faturamentoPago: number;
    faturamentoPrevisto: number;
    totalInstituicoesFiltradas: number;
    totalAdesoesFiltradas: number;
  };
  opcoes: {
    planos: string[];
    status: string[];
  };
  instituicoes: {
    id: number;
    nome: string;
    slug?: string | null;
    plano?: string | null;
    createdAt?: string;
    _count?: {
      alunos: number;
      professores: number;
    };
  }[];
  adesoes: {
    id: string;
    nomeResponsavel: string;
    nomeInstituicao: string;
    email: string;
    telefone?: string | null;
    plano: string;
    valor: number | string;
    status: string;
    createdAt?: string;
    instituicaoId?: number | null;
    asaasId?: string | null;
  }[];
};

function formatarData(data?: string) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

function formatarValor(valor: number | string) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return String(valor);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function classeStatus(status?: string) {
  const valor = String(status || "").toUpperCase();

  if (valor === "PAGO") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
  }

  if (valor === "PENDING") {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/20";
  }

  if (valor === "CANCELADO") {
    return "bg-red-500/15 text-red-300 border border-red-500/20";
  }

  return "bg-slate-500/15 text-slate-300 border border-slate-500/20";
}

function CardResumo({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
        {titulo}
      </p>
      <p className="mt-3 text-4xl font-bold text-white">{valor}</p>
      <p className="mt-2 text-sm text-slate-500">{descricao}</p>
    </div>
  );
}

function MasterPage() {
  const [data, setData] = useState<DashboardMasterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [plano, setPlano] = useState("TODOS");

  async function carregarDashboard() {
    try {
      setLoading(true);
      setErro("");

      const params = new URLSearchParams();

      if (busca.trim()) params.set("busca", busca.trim());
      if (status && status !== "TODOS") params.set("status", status);
      if (plano && plano !== "TODOS") params.set("plano", plano);

      const url = `/api/master/dashboard${params.toString() ? `?${params.toString()}` : ""}`;

      const res = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar painel master.");
      }

      setData(json);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar painel master.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDashboard();
    }, 350);

    return () => clearTimeout(timer);
  }, [busca, status, plano]);

  const resumoVisual = useMemo(() => {
    if (!data) return null;

    return [
      {
        titulo: "Instituições",
        valor: data.resumo.totalInstituicoes,
        descricao: "Total geral de instituições já criadas no FORMAX.",
      },
      {
        titulo: "Adesões",
        valor: data.resumo.totalAdesoes,
        descricao: "Entradas comerciais registradas na base.",
      },
      {
        titulo: "Pagas",
        valor: data.resumo.totalPagas,
        descricao: "Adesões confirmadas e prontas para operação.",
      },
      {
        titulo: "Pendentes",
        valor: data.resumo.totalPendentes,
        descricao: "Adesões que ainda aguardam confirmação de pagamento.",
      },
      {
        titulo: "Com instituição criada",
        valor: data.resumo.totalComInstituicaoCriada,
        descricao: "Adesões já convertidas em ambiente institucional.",
      },
      {
        titulo: "Faturamento pago",
        valor: formatarValor(data.resumo.faturamentoPago),
        descricao: "Total já confirmado nas adesões pagas.",
      },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            Painel master FORMAX
          </p>

          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold md:text-5xl">
                Controle global da plataforma
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                Acompanhe instituições, adesões, conversão comercial e a
                expansão operacional do FORMAX em um só painel.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Visão executiva</p>
              <p className="mt-1 text-slate-300">
                Busca, filtros e monitoramento comercial/operacional.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Buscar por instituição, responsável, email, plano ou status
              </label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite para buscar..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Filtrar por status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              >
                <option value="TODOS">Todos</option>
                {data?.opcoes?.status?.map((item) => (
                  <option key={item} value={item.toUpperCase()}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Filtrar por plano
              </label>
              <select
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              >
                <option value="TODOS">Todos</option>
                {data?.opcoes?.planos?.map((item) => (
                  <option key={item} value={item.toUpperCase()}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setStatus("TODOS");
                setPlano("TODOS");
              }}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
            >
              Limpar filtros
            </button>

            <button
              type="button"
              onClick={carregarDashboard}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Atualizar painel
            </button>
          </div>
        </section>

        {loading && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
            Carregando painel master...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200 shadow-xl">
            {erro}
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {resumoVisual?.map((card) => (
                <CardResumo
                  key={card.titulo}
                  titulo={card.titulo}
                  valor={card.valor}
                  descricao={card.descricao}
                />
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h2 className="text-2xl font-bold">Visão comercial</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Acompanhamento rápido da conversão e do volume financeiro.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">Adesões filtradas</p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {data.resumo.totalAdesoesFiltradas}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">
                      Instituições filtradas
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {data.resumo.totalInstituicoesFiltradas}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">
                      Faturamento previsto
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {formatarValor(data.resumo.faturamentoPrevisto)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">
                      Faturamento confirmado
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-400">
                      {formatarValor(data.resumo.faturamentoPago)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h2 className="text-2xl font-bold">Leitura operacional</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Resumo do que já virou operação real dentro da base.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">
                      Adesões com instituição criada
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {data.resumo.totalComInstituicaoCriada}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">
                      Adesões pendentes de confirmação
                    </p>
                    <p className="mt-2 text-3xl font-bold text-amber-400">
                      {data.resumo.totalPendentes}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">
                      Conversão paga / total
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {data.resumo.totalAdesoes > 0
                        ? `${Math.round(
                            (data.resumo.totalPagas / data.resumo.totalAdesoes) *
                              100
                          )}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Adesões</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Lista operacional e comercial das adesões mais relevantes.
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  Exibindo até 50 registros filtrados.
                </p>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-400">
                      <th className="px-4 py-3">Instituição</th>
                      <th className="px-4 py-3">Responsável</th>
                      <th className="px-4 py-3">Contato</th>
                      <th className="px-4 py-3">Plano</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Operação</th>
                      <th className="px-4 py-3">Criada em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.adesoes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma adesão encontrada com os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      data.adesoes.map((adesao) => (
                        <tr
                          key={adesao.id}
                          className="border-b border-slate-900/80 align-top"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">
                              {adesao.nomeInstituicao}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              ID: {adesao.id}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {adesao.nomeResponsavel}
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-slate-300">{adesao.email}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {adesao.telefone || "-"}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {adesao.plano}
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {formatarValor(adesao.valor)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classeStatus(
                                adesao.status
                              )}`}
                            >
                              {adesao.status}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-slate-300">
                              {adesao.instituicaoId
                                ? `Instituição #${adesao.instituicaoId}`
                                : "Aguardando criação"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Asaas: {adesao.asaasId || "-"}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-slate-400">
                            {formatarData(adesao.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Instituições</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Ambientes institucionais já criados dentro da plataforma.
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  Exibindo até 50 registros filtrados.
                </p>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-400">
                      <th className="px-4 py-3">Instituição</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Plano</th>
                      <th className="px-4 py-3">Alunos</th>
                      <th className="px-4 py-3">Professores</th>
                      <th className="px-4 py-3">Criada em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.instituicoes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Nenhuma instituição encontrada com os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      data.instituicoes.map((instituicao) => (
                        <tr
                          key={instituicao.id}
                          className="border-b border-slate-900/80"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">
                              {instituicao.nome}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              ID: {instituicao.id}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {instituicao.slug || "-"}
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {instituicao.plano || "-"}
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {instituicao._count?.alunos ?? 0}
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {instituicao._count?.professores ?? 0}
                          </td>

                          <td className="px-4 py-4 text-slate-400">
                            {formatarData(instituicao.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(MasterPage, ["admin"]);