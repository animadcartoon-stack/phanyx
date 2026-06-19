"use client";

import { useEffect, useMemo, useState } from "react";

type Funcionario = {
  id: number;
  nome: string;
  cpf?: string | null;
  cargo?: string | null;
  salarioBase?: string | number | null;
  departamento?: { nome?: string | null } | null;
};

type FeriasRH = {
  id: number;
  funcionario: Funcionario;
  periodoAquisitivoInicio?: string | null;
  periodoAquisitivoFim?: string | null;
  dataInicio: string;
  dataFim: string;
  dias: number;
  dataPagamento?: string | null;
  dataRetorno?: string | null;
  valorFerias?: string | number | null;
  valorTercoConstitucional?: string | number | null;
  valorLiquidoFerias?: string | number | null;
  abonoPecuniario: boolean;
  status: string;
  observacoes?: string | null;
};

function dataBR(data?: string | null) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

function moeda(valor: any) {
  const numero = Number(valor || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

function calcularDataFim(inicio: string, dias: string) {
  if (!inicio || !dias) return "";
  const d = new Date(inicio);
  const qtd = Number(dias);
  if (Number.isNaN(d.getTime()) || !qtd) return "";

  d.setDate(d.getDate() + qtd - 1);
  return d.toISOString().slice(0, 10);
}

function calcularRetorno(fim: string) {
  if (!fim) return "";
  const d = new Date(fim);
  if (Number.isNaN(d.getTime())) return "";

  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function Page() {
  const [ferias, setFerias] = useState<FeriasRH[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [funcionarioId, setFuncionarioId] = useState("");
  const [periodoAquisitivoInicio, setPeriodoAquisitivoInicio] = useState("");
  const [periodoAquisitivoFim, setPeriodoAquisitivoFim] = useState("");
  const [periodoGozoInicio, setPeriodoGozoInicio] = useState("");
  const [periodoGozoFim, setPeriodoGozoFim] = useState("");
  const [dias, setDias] = useState("30");
  const [dataPagamento, setDataPagamento] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");
  const [abonoPecuniario, setAbonoPecuniario] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  const funcionarioSelecionado = funcionarios.find(
    (f) => String(f.id) === funcionarioId
  );

  const salarioBase = Number(funcionarioSelecionado?.salarioBase || 0);
  const diasNumero = Number(dias || 0);

  const valorFerias = salarioBase > 0 && diasNumero > 0
    ? (salarioBase / 30) * diasNumero
    : 0;

  const valorTercoConstitucional = valorFerias / 3;
  const valorLiquidoFerias = valorFerias + valorTercoConstitucional;

  const resumo = useMemo(() => {
    return {
      agendadas: ferias.filter((f) => f.status === "AGENDADA").length,
      andamento: ferias.filter((f) => f.status === "EM_ANDAMENTO").length,
      concluidas: ferias.filter((f) => f.status === "CONCLUIDA").length,
      total: ferias.length,
    };
  }, [ferias]);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const fim = calcularDataFim(periodoGozoInicio, dias);
    setPeriodoGozoFim(fim);
    setDataRetorno(calcularRetorno(fim));
  }, [periodoGozoInicio, dias]);

  async function lerJsonSeguro(res: Response, nomeRota: string) {
  const texto = await res.text();

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(
      `${nomeRota} não retornou JSON. Verifique se a rota existe e se não está redirecionando para HTML.`
    );
  }
}

async function carregarDados() {
  try {
    setLoading(true);
    setErro("");

    const [resFerias, resFuncionarios] = await Promise.all([
      fetch("/api/admin/rh/ferias", {
        credentials: "include",
        cache: "no-store",
      }),
      fetch("/api/admin/funcionarios", {
        credentials: "include",
        cache: "no-store",
      }),
    ]);

    const dataFerias = await lerJsonSeguro(
      resFerias,
      "/api/admin/rh/ferias"
    );

    const dataFuncionarios = await lerJsonSeguro(
      resFuncionarios,
      "/api/admin/funcionarios"
    );

    if (!resFerias.ok) {
      throw new Error(dataFerias?.error || "Erro ao carregar férias.");
    }

    if (!resFuncionarios.ok) {
      throw new Error(
        dataFuncionarios?.error || "Erro ao carregar funcionários."
      );
    }

    setFerias(Array.isArray(dataFerias) ? dataFerias : []);

    setFuncionarios(
      Array.isArray(dataFuncionarios)
        ? dataFuncionarios
        : Array.isArray(dataFuncionarios?.funcionarios)
        ? dataFuncionarios.funcionarios
        : []
    );
  } catch (error: any) {
    setErro(error?.message || "Erro ao carregar dados.");
  } finally {
    setLoading(false);
  }
}

  function limparFormulario() {
    setFuncionarioId("");
    setPeriodoAquisitivoInicio("");
    setPeriodoAquisitivoFim("");
    setPeriodoGozoInicio("");
    setPeriodoGozoFim("");
    setDias("30");
    setDataPagamento("");
    setDataRetorno("");
    setAbonoPecuniario(false);
    setObservacoes("");
  }

  async function salvarFerias() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const res = await fetch("/api/admin/rh/ferias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          funcionarioId,
          periodoAquisitivoInicio,
          periodoAquisitivoFim,
          periodoGozoInicio,
          periodoGozoFim,
          dias,
          dataPagamento,
          dataRetorno,
          abonoPecuniario,
          valorFerias,
          valorTercoConstitucional,
          valorLiquidoFerias,
          status: "AGENDADA",
          observacoes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao programar férias.");
      }

      setMensagem("Férias programadas com sucesso.");
      limparFormulario();
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar férias.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6 !text-slate-950 opacity-100 dark:!text-white">
      <div>
        <p className="text-sm font-bold uppercase text-blue-700 dark:text-blue-400">
          Departamento Pessoal
        </p>
        <h1 className="text-3xl font-bold !text-slate-950 dark:!text-white">
  Férias
</h1>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Programe férias, calcule valores e prepare documentos para assinatura.
        </p>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Total</p>
          <p className="text-2xl font-bold">{resumo.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Agendadas</p>
          <p className="text-2xl font-bold">{resumo.agendadas}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Em andamento</p>
          <p className="text-2xl font-bold">{resumo.andamento}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Concluídas</p>
          <p className="text-2xl font-bold">{resumo.concluidas}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold !text-slate-950 dark:!text-white">
  Programar férias
</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="text-sm font-medium">Funcionário</label>
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Selecione</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.cargo ? `- ${f.cargo}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Período aquisitivo início</label>
            <input
              type="date"
              value={periodoAquisitivoInicio}
              onChange={(e) => setPeriodoAquisitivoInicio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Período aquisitivo fim</label>
            <input
              type="date"
              value={periodoAquisitivoFim}
              onChange={(e) => setPeriodoAquisitivoFim(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Dias</label>
            <input
              type="number"
              min="1"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Início das férias</label>
            <input
              type="date"
              value={periodoGozoInicio}
              onChange={(e) => setPeriodoGozoInicio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Fim das férias</label>
            <input
              type="date"
              value={periodoGozoFim}
              onChange={(e) => setPeriodoGozoFim(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Retorno ao trabalho</label>
            <input
              type="date"
              value={dataRetorno}
              onChange={(e) => setDataRetorno(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Data de pagamento</label>
            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-300 p-3 text-sm dark:border-slate-700">
            <input
              type="checkbox"
              checked={abonoPecuniario}
              onChange={(e) => setAbonoPecuniario(e.target.checked)}
            />
            Abono pecuniário
          </label>

          <div className="md:col-span-3">
            <label className="text-sm font-medium">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <p className="text-sm text-slate-700 dark:text-slate-300">Valor férias</p>
            <p className="text-xl font-bold">{moeda(valorFerias)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <p className="text-sm text-slate-700 dark:text-slate-300">1/3 constitucional</p>
            <p className="text-xl font-bold">{moeda(valorTercoConstitucional)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <p className="text-sm text-slate-700 dark:text-slate-300">Total estimado</p>
            <p className="text-xl font-bold">{moeda(valorLiquidoFerias)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={salvarFerias}
          disabled={salvando}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {salvando ? "Salvando..." : "Programar férias"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold !text-slate-950 dark:!text-white">
  Férias cadastradas
</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                <th className="p-3">Funcionário</th>
                <th className="p-3">Período aquisitivo</th>
                <th className="p-3">Gozo</th>
                <th className="p-3">Dias</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={6}>
                    Carregando...
                  </td>
                </tr>
              ) : ferias.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={6}>
                    Nenhuma férias cadastrada.
                  </td>
                </tr>
              ) : (
                ferias.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="p-3 font-medium">
                      {item.funcionario?.nome || "-"}
                    </td>
                    <td className="p-3">
                      {dataBR(item.periodoAquisitivoInicio)} até{" "}
                      {dataBR(item.periodoAquisitivoFim)}
                    </td>
                    <td className="p-3">
                      {dataBR(item.dataInicio)} até {dataBR(item.dataFim)}
                    </td>
                    <td className="p-3">{item.dias}</td>
                    <td className="p-3">{moeda(item.valorLiquidoFerias)}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}