"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

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

function dataBR(data: string | null | undefined, locale: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale);
}

function moeda(valor: unknown, locale: string) {
  const numero = Number(valor || 0);
  return new Intl.NumberFormat(locale, {
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
  const t = useTranslations("AdminHRVacation");
  const locale = useLocale();

  function statusLabel(value: string) {
    switch (value) {
      case "AGENDADA": return t("scheduled");
      case "EM_ANDAMENTO": return t("inProgress");
      case "CONCLUIDA": return t("completed");
      case "CANCELADA": return t("cancelled");
      case "ARQUIVADA": return t("archived");
      default: return value;
    }
  }
  const [ferias, setFerias] = useState<FeriasRH[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [acaoId, setAcaoId] = useState<number | null>(null);

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
      t("notJson", { route: nomeRota })
    );
  }
}

async function carregarDados() {
  try {
    setLoading(true);
    setErro("");

    const resFuncionarios = await fetch("/api/admin/funcionarios", {
      credentials: "include",
      cache: "no-store",
    });

    const dataFuncionarios = await lerJsonSeguro(
      resFuncionarios,
      "/api/admin/funcionarios"
    );

    if (!resFuncionarios.ok) {
      throw new Error(
        t("loadEmployeesError")
      );
    }

    setFuncionarios(
      Array.isArray(dataFuncionarios)
        ? dataFuncionarios
        : Array.isArray(dataFuncionarios?.funcionarios)
        ? dataFuncionarios.funcionarios
        : []
    );

    const resFerias = await fetch("/api/admin/rh/ferias", {
      credentials: "include",
      cache: "no-store",
    });

    const dataFerias = await lerJsonSeguro(resFerias, "/api/admin/rh/ferias");

    if (!resFerias.ok) {
      throw new Error(t("loadVacationError"));
    }

    setFerias(Array.isArray(dataFerias) ? dataFerias : []);
  } catch (error: any) {
    setErro(error?.message || t("loadError"));
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

  async function arquivarFerias(id: number) {
  try {
    setAcaoId(id);
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/admin/rh/ferias/${id}/arquivar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        motivo: t("archiveReasonSystem"),
      }),
    });

    if (!res.ok) {
      throw new Error(t("archiveError"));
    }

    setMensagem(t("archiveSuccess"));
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || t("archiveError"));
  } finally {
    setAcaoId(null);
  }
}

async function cancelarFerias(id: number) {
  try {
    setAcaoId(id);
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/admin/rh/ferias/${id}/cancelar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        motivo: t("cancelReasonSystem"),
      }),
    });

    if (!res.ok) {
      throw new Error(t("cancelError"));
    }

    setMensagem(t("cancelSuccess"));
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || t("cancelError"));
  } finally {
    setAcaoId(null);
  }
}

  async function salvarFerias() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      if (!funcionarioId) {
  setErro(t("selectEmployeeError"));
  return;
}

if (!periodoAquisitivoInicio || !periodoAquisitivoFim) {
  setErro(t("accrualPeriodError"));
  return;
}

if (!periodoGozoInicio || !periodoGozoFim) {
  setErro(t("vacationPeriodError"));
  return;
}
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

      if (!res.ok) {
        throw new Error(t("scheduleError"));
      }

      setMensagem(t("scheduleSuccess"));
      limparFormulario();
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || t("scheduleError"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="phanyx-rh-page phanyx-rh-ferias-page space-y-6 text-slate-900 dark:text-white">
      <div>
        <p className="text-sm font-bold uppercase text-blue-700 dark:text-blue-400">
          {t("department")}
        </p>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
  {t("title")}
</h1>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {t("description")}
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
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("total")}</p>
          <p className="text-2xl font-bold">{resumo.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("scheduledPlural")}</p>
          <p className="text-2xl font-bold">{resumo.agendadas}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("inProgress")}</p>
          <p className="text-2xl font-bold">{resumo.andamento}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">{t("completedPlural")}</p>
          <p className="text-2xl font-bold">{resumo.concluidas}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
  {t("scheduleTitle")}
</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="text-sm font-medium">{t("employee")}</label>
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{t("select")}</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.cargo ? `- ${f.cargo}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">{t("accrualStart")}</label>
            <input
              type="date"
              value={periodoAquisitivoInicio}
              onChange={(e) => setPeriodoAquisitivoInicio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("accrualEnd")}</label>
            <input
              type="date"
              value={periodoAquisitivoFim}
              onChange={(e) => setPeriodoAquisitivoFim(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("days")}</label>
            <input
              type="number"
              min="1"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("vacationStart")}</label>
            <input
              type="date"
              value={periodoGozoInicio}
              onChange={(e) => setPeriodoGozoInicio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("vacationEnd")}</label>
            <input
              type="date"
              value={periodoGozoFim}
              onChange={(e) => setPeriodoGozoFim(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("returnToWork")}</label>
            <input
              type="date"
              value={dataRetorno}
              onChange={(e) => setDataRetorno(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("paymentDate")}</label>
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
            {t("cashAllowance")}
          </label>

          <div className="md:col-span-3">
            <label className="text-sm font-medium">{t("notes")}</label>
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
            <p className="text-sm text-slate-700 dark:text-slate-300">{t("vacationAmount")}</p>
            <p className="text-xl font-bold">{moeda(valorFerias, locale)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <p className="text-sm text-slate-700 dark:text-slate-300">{t("constitutionalThird")}</p>
            <p className="text-xl font-bold">{moeda(valorTercoConstitucional, locale)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <p className="text-sm text-slate-700 dark:text-slate-300">{t("estimatedTotal")}</p>
            <p className="text-xl font-bold">{moeda(valorLiquidoFerias, locale)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={salvarFerias}
          disabled={salvando}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {salvando ? t("saving") : t("schedule")}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
  {t("registered")}
</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                <th className="p-3">{t("employee")}</th>
                <th className="p-3">{t("accrualPeriod")}</th>
                <th className="p-3">{t("vacationPeriod")}</th>
                <th className="p-3">{t("days")}</th>
                <th className="p-3">{t("amount")}</th>
                <th className="p-3">{t("status")}</th>
                <th className="p-3">{t("actions")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3 text-slate-600 dark:text-slate-400" colSpan={7}>
                    {t("loading")}
                  </td>
                </tr>
              ) : ferias.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-600 dark:text-slate-400" colSpan={7}>
                    {t("empty")}
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
                      {dataBR(item.periodoAquisitivoInicio, locale)} {t("until")}{" "}
                      {dataBR(item.periodoAquisitivoFim, locale)}
                    </td>
                    <td className="p-3">
                      {dataBR(item.dataInicio, locale)} {t("until")} {dataBR(item.dataFim, locale)}
                    </td>
                    <td className="p-3">{item.dias}</td>
                    <td className="p-3">{moeda(item.valorLiquidoFerias, locale)}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-3">
  <div className="flex flex-wrap gap-2">
  <a
    href={`/api/admin/rh/ferias/${item.id}/aviso`}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
  >
    {t("notice")}
  </a>

  <a
    href={`/api/admin/rh/ferias/${item.id}/recibo`}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
  >
    {t("receipt")}
  </a>

  <button
  type="button"
  onClick={() => arquivarFerias(item.id)}
  disabled={acaoId === item.id}
  className="phanyx-rh-archive-action"
>
  {acaoId === item.id ? t("pleaseWait") : t("archive")}
</button>

  {item.status !== "CANCELADA" && (
    <button
      type="button"
      onClick={() => cancelarFerias(item.id)}
      disabled={acaoId === item.id}
      className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
    >
      {t("cancel")}
    </button>
  )}
</div>
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
