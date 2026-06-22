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

type RescisaoRH = {
  id: number;
  tipo: string;
  dataAviso?: string | null;
  dataDesligamento: string;
  motivo?: string | null;
  saldoSalario?: string | number | null;
  feriasVencidas?: string | number | null;
  feriasProporcionais?: string | number | null;
  decimoTerceiroProporcional?: string | number | null;
  avisoPrevio?: string | number | null;
  valorRescisao?: string | number | null;
  status: string;
  observacoes?: string | null;
  funcionario?: Funcionario | null;
};

const tiposRescisao = [
  "Pedido de demissão",
  "Dispensa sem justa causa",
  "Dispensa por justa causa",
  "Término de contrato",
  "Acordo entre as partes",
  "Outros",
];

function dataBR(data?: string | null) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

function numero(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return 0;
  return Number(String(valor).replace(",", ".")) || 0;
}

function moeda(valor: unknown) {
  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function RescisoesRHPage() {
  const [rescisoes, setRescisoes] = useState<RescisaoRH[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [funcionarioId, setFuncionarioId] = useState("");
  const [tipo, setTipo] = useState("Pedido de demissão");
  const [dataAviso, setDataAviso] = useState("");
  const [dataDesligamento, setDataDesligamento] = useState("");
  const [motivo, setMotivo] = useState("");

  const [saldoSalario, setSaldoSalario] = useState("");
  const [feriasVencidas, setFeriasVencidas] = useState("");
  const [feriasProporcionais, setFeriasProporcionais] = useState("");
  const [decimoTerceiroProporcional, setDecimoTerceiroProporcional] =
    useState("");
  const [avisoPrevio, setAvisoPrevio] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const valorRescisao = useMemo(() => {
    return (
      numero(saldoSalario) +
      numero(feriasVencidas) +
      numero(feriasProporcionais) +
      numero(decimoTerceiroProporcional) +
      numero(avisoPrevio)
    );
  }, [
    saldoSalario,
    feriasVencidas,
    feriasProporcionais,
    decimoTerceiroProporcional,
    avisoPrevio,
  ]);

  const resumo = useMemo(() => {
    return {
      total: rescisoes.length,
      andamento: rescisoes.filter((r) => r.status === "EM_ANDAMENTO").length,
      finalizadas: rescisoes.filter((r) => r.status === "FINALIZADA").length,
      canceladas: rescisoes.filter((r) => r.status === "CANCELADA").length,
    };
  }, [rescisoes]);

  useEffect(() => {
    carregarDados();
  }, []);

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
          dataFuncionarios?.error || "Erro ao carregar funcionários."
        );
      }

      setFuncionarios(
        Array.isArray(dataFuncionarios)
          ? dataFuncionarios
          : Array.isArray(dataFuncionarios?.funcionarios)
          ? dataFuncionarios.funcionarios
          : []
      );

      const resRescisoes = await fetch("/api/admin/rh/rescisoes", {
        credentials: "include",
        cache: "no-store",
      });

      const dataRescisoes = await lerJsonSeguro(
        resRescisoes,
        "/api/admin/rh/rescisoes"
      );

      if (!resRescisoes.ok) {
        throw new Error(dataRescisoes?.error || "Erro ao carregar rescisões.");
      }

      setRescisoes(Array.isArray(dataRescisoes) ? dataRescisoes : []);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  function limparFormulario() {
    setFuncionarioId("");
    setTipo("Pedido de demissão");
    setDataAviso("");
    setDataDesligamento("");
    setMotivo("");
    setSaldoSalario("");
    setFeriasVencidas("");
    setFeriasProporcionais("");
    setDecimoTerceiroProporcional("");
    setAvisoPrevio("");
    setObservacoes("");
  }

  async function arquivarRescisao(id: number) {
  try {
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/admin/rh/rescisoes/${id}/arquivar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        motivo: "Arquivamento realizado pela tela de rescisões.",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao arquivar rescisão.");
    }

    setMensagem("Rescisão arquivada com sucesso.");
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || "Erro ao arquivar rescisão.");
  }
}

async function cancelarRescisao(id: number) {
  try {
    setErro("");
    setMensagem("");

    const res = await fetch(`/api/admin/rh/rescisoes/${id}/cancelar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        motivo: "Cancelamento realizado pela tela de rescisões.",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao cancelar rescisão.");
    }

    setMensagem("Rescisão cancelada com sucesso.");
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || "Erro ao cancelar rescisão.");
  }
}

  async function salvarRescisao() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      if (!funcionarioId) {
        setErro("Selecione um funcionário antes de registrar a rescisão.");
        return;
      }

      if (!tipo.trim()) {
        setErro("Informe o tipo de rescisão.");
        return;
      }

      if (!dataDesligamento) {
        setErro("Informe a data de desligamento.");
        return;
      }

      const res = await fetch("/api/admin/rh/rescisoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          funcionarioId,
          tipo,
          dataAviso,
          dataDesligamento,
          motivo,
          saldoSalario,
          feriasVencidas,
          feriasProporcionais,
          decimoTerceiroProporcional,
          avisoPrevio,
          valorRescisao,
          status: "EM_ANDAMENTO",
          observacoes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao registrar rescisão.");
      }

      setMensagem("Rescisão registrada com sucesso.");
      limparFormulario();
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar rescisão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6 text-slate-950 dark:text-white">
      <div>
        <p className="text-sm font-bold uppercase text-red-700 dark:text-red-400">
          Departamento Pessoal
        </p>

        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          Rescisões
        </h1>

        <p className="text-sm text-slate-700 dark:text-slate-300">
          Registre desligamentos, valores rescisórios, motivos e documentos para auditoria.
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
          <p className="text-sm text-slate-700 dark:text-slate-300">Em andamento</p>
          <p className="text-2xl font-bold">{resumo.andamento}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Finalizadas</p>
          <p className="text-2xl font-bold">{resumo.finalizadas}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Canceladas</p>
          <p className="text-2xl font-bold">{resumo.canceladas}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Registrar rescisão
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="text-sm font-medium">Funcionário</label>
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
            <label className="text-sm font-medium">Tipo de rescisão</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {tiposRescisao.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Data do aviso</label>
            <input
              type="date"
              value={dataAviso}
              onChange={(e) => setDataAviso(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Data de desligamento</label>
            <input
              type="date"
              value={dataDesligamento}
              onChange={(e) => setDataDesligamento(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-medium">Motivo</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo do desligamento"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Saldo de salário</label>
            <input
              value={saldoSalario}
              onChange={(e) => setSaldoSalario(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Férias vencidas</label>
            <input
              value={feriasVencidas}
              onChange={(e) => setFeriasVencidas(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Férias proporcionais</label>
            <input
              value={feriasProporcionais}
              onChange={(e) => setFeriasProporcionais(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">13º proporcional</label>
            <input
              value={decimoTerceiroProporcional}
              onChange={(e) => setDecimoTerceiroProporcional(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Aviso prévio</label>
            <input
              value={avisoPrevio}
              onChange={(e) => setAvisoPrevio(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <p className="text-sm text-slate-700 dark:text-slate-300">Valor estimado</p>
            <p className="text-xl font-bold">{moeda(valorRescisao)}</p>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-medium">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Observações internas"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={salvarRescisao}
          disabled={salvando}
          className="mt-5 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {salvando ? "Salvando..." : "Registrar rescisão"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          Rescisões cadastradas
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                <th className="p-3">Funcionário</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Aviso</th>
                <th className="p-3">Desligamento</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={7}>
                    Carregando...
                  </td>
                </tr>
              ) : rescisoes.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={7}>
                    Nenhuma rescisão cadastrada.
                  </td>
                </tr>
              ) : (
                rescisoes.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="p-3 font-medium">
                      {item.funcionario?.nome || "-"}
                    </td>

                    <td className="p-3">{item.tipo}</td>

                    <td className="p-3">{dataBR(item.dataAviso)}</td>

                    <td className="p-3">{dataBR(item.dataDesligamento)}</td>

                    <td className="p-3">{moeda(item.valorRescisao)}</td>

                    <td className="p-3">
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => arquivarRescisao(item.id)}
      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      Arquivar
    </button>

    {item.status !== "CANCELADA" && (
      <button
        type="button"
        onClick={() => cancelarRescisao(item.id)}
        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        Cancelar
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