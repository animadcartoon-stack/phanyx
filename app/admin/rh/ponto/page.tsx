"use client";

import { useEffect, useMemo, useState } from "react";

type FuncionarioOpcao = {
  id: number;
  nome: string;
  cargo?: string | null;
  codigoFuncionario?: string | null;
  departamento?: {
    nome: string;
  } | null;
};

type RegistroPonto = {
  id: number;
  data: string;
  entrada?: string | null;
  saidaAlmoco?: string | null;
  retornoAlmoco?: string | null;
  saida?: string | null;
  horasTrabalhadas?: string | number | null;
  horasExtras?: string | number | null;
  horasAtraso?: string | number | null;
  status: string;
  observacoes?: string | null;
  funcionario: FuncionarioOpcao;
};

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarHora(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function numero(valor: any) {
  return Number(valor || 0);
}

function saldoBanco(ponto: RegistroPonto) {
  return numero(ponto.horasExtras) - numero(ponto.horasAtraso);
}

export default function PontoRHPage() {
  const [funcionarios, setFuncionarios] = useState<FuncionarioOpcao[]>([]);
  const [pontos, setPontos] = useState<RegistroPonto[]>([]);

  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] =
    useState<FuncionarioOpcao | null>(null);

  const [data, setData] = useState("");
  const [entrada, setEntrada] = useState("");
  const [saidaAlmoco, setSaidaAlmoco] = useState("");
  const [retornoAlmoco, setRetornoAlmoco] = useState("");
  const [saida, setSaida] = useState("");
  const [jornada, setJornada] = useState("8");
  const [status, setStatus] = useState("REGISTRADO");
  const [observacoes, setObservacoes] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarFuncionarios() {
    const res = await fetch("/api/funcionario", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json();

    setFuncionarios(Array.isArray(data) ? data : []);
  }

  async function carregarPontos() {
    const res = await fetch("/api/admin/rh/ponto", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json();

    setPontos(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    carregarFuncionarios();
    carregarPontos();
  }, []);

    const sugestoesFuncionarios = useMemo(() => {
    const termo = normalizar(buscaFuncionario);

    if (!termo) return [];

    return funcionarios
      .filter((f) => {
        const nome = normalizar(f.nome || "");
        const cargo = normalizar(f.cargo || "");
        const codigo = normalizar(f.codigoFuncionario || "");
        const departamento = normalizar(f.departamento?.nome || "");

        return (
          nome.includes(termo) ||
          cargo.includes(termo) ||
          codigo.includes(termo) ||
          departamento.includes(termo)
        );
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .slice(0, 8);
  }, [buscaFuncionario, funcionarios]);

  const pontosOrdenados = useMemo(() => {
    return [...pontos].sort((a, b) => {
      const nomeA = String(a.funcionario?.nome || "");
      const nomeB = String(b.funcionario?.nome || "");

      const nomeComparado = nomeA.localeCompare(nomeB, "pt-BR");

      if (nomeComparado !== 0) return nomeComparado;

      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });
  }, [pontos]);

  async function salvarPonto() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      if (!funcionarioSelecionado) {
        setErro("Selecione um funcionário.");
        return;
      }

      if (!data) {
        setErro("Informe a data do ponto.");
        return;
      }

      const res = await fetch("/api/admin/rh/ponto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          funcionarioId: funcionarioSelecionado.id,
          data,
          entrada,
          saidaAlmoco,
          retornoAlmoco,
          saida,
          jornada,
          status,
          observacoes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao salvar ponto.");
      }

      setSucesso("Ponto registrado com sucesso.");
      setEntrada("");
      setSaidaAlmoco("");
      setRetornoAlmoco("");
      setSaida("");
      setObservacoes("");

      await carregarPontos();
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar ponto.");
    } finally {
      setLoading(false);
    }
  }

    return (
    <div className="phanyx-rh-page w-full max-w-full space-y-6 overflow-x-hidden px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          ⏱️ Controle de Ponto
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Registro de jornada, atrasos, horas extras, faltas e banco de horas.
        </p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
          {sucesso}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
          Novo Registro de Ponto
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <div className="relative lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
              Funcionário
            </label>

            <input
              value={buscaFuncionario}
              onChange={(e) => {
                setBuscaFuncionario(e.target.value);
                setFuncionarioSelecionado(null);
              }}
              placeholder="🔎 Digite nome, cargo, código ou departamento"
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />

            {buscaFuncionario &&
              !funcionarioSelecionado &&
              sugestoesFuncionarios.length > 0 && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
                  {sugestoesFuncionarios.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFuncionarioSelecionado(f);
                        setBuscaFuncionario(f.nome);
                      }}
                      className="block w-full px-4 py-3 text-left text-white hover:bg-blue-600"
                    >
                      {f.nome}
                      {f.cargo ? ` • ${f.cargo}` : ""}
                    </button>
                  ))}
                </div>
              )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
              Data
            </label>

            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            >
              <option value="REGISTRADO">Registrado</option>
              <option value="ATRASADO">Atrasado</option>
              <option value="FALTA">Falta</option>
              <option value="ATESTADO">Atestado</option>
              <option value="FERIAS">Férias</option>
              <option value="AFASTADO">Afastado</option>
              <option value="HOME_OFFICE">Home Office</option>
              <option value="LICENCA">Licença</option>
              <option value="SUSPENSAO">Suspensão</option>
              <option value="TREINAMENTO">Treinamento</option>
              <option value="VIAGEM">Viagem</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
              Entrada
            </label>

            <input
              type="time"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
              Saída Almoço
            </label>

            <input
              type="time"
              value={saidaAlmoco}
              onChange={(e) => setSaidaAlmoco(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
              Retorno Almoço
            </label>

            <input
              type="time"
              value={retornoAlmoco}
              onChange={(e) => setRetornoAlmoco(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
              Saída
            </label>

            <input
              type="time"
              value={saida}
              onChange={(e) => setSaida(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
              Jornada (horas)
            </label>

            <input
              type="number"
              value={jornada}
              onChange={(e) => setJornada(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações..."
            className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <button
          type="button"
          onClick={salvarPonto}
          disabled={loading}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Salvando..." : "Salvar Registro"}
        </button>
      </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
          Registros de Ponto
        </h2>

        {pontosOrdenados.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            Nenhum registro de ponto lançado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700">
                  <th className="px-3 py-3">Funcionário</th>
                  <th className="px-3 py-3">Data</th>
                  <th className="px-3 py-3">Entrada</th>
                  <th className="px-3 py-3">Saída almoço</th>
                  <th className="px-3 py-3">Retorno</th>
                  <th className="px-3 py-3">Saída</th>
                  <th className="px-3 py-3">Trabalhadas</th>
                  <th className="px-3 py-3">Extras</th>
                  <th className="px-3 py-3">Atraso</th>
                  <th className="px-3 py-3">Saldo</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {pontosOrdenados.map((ponto) => (
                  <tr
                    key={ponto.id}
                    className="border-b border-slate-100 text-slate-700 last:border-b-0 dark:border-slate-800 dark:text-slate-200"
                  >
                    <td className="px-3 py-3">
                      <div className="font-semibold">
                        {ponto.funcionario?.nome || "-"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ponto.funcionario?.cargo || "-"}
                        {ponto.funcionario?.departamento?.nome
                          ? ` • ${ponto.funcionario.departamento.nome}`
                          : ""}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      {formatarData(ponto.data)}
                    </td>

                    <td className="px-3 py-3">
                      {formatarHora(ponto.entrada)}
                    </td>

                    <td className="px-3 py-3">
                      {formatarHora(ponto.saidaAlmoco)}
                    </td>

                    <td className="px-3 py-3">
                      {formatarHora(ponto.retornoAlmoco)}
                    </td>

                    <td className="px-3 py-3">
                      {formatarHora(ponto.saida)}
                    </td>

                    <td className="px-3 py-3 font-semibold">
                      {numero(ponto.horasTrabalhadas).toFixed(2)}h
                    </td>

                    <td className="px-3 py-3 text-green-600 font-semibold">
                      {numero(ponto.horasExtras).toFixed(2)}h
                    </td>

                    <td className="px-3 py-3 text-red-600 font-semibold">
  {numero(ponto.horasAtraso).toFixed(2)}h
</td>

<td
  className={`px-3 py-3 font-bold ${
    saldoBanco(ponto) >= 0 ? "text-green-600" : "text-red-600"
  }`}
>
  {saldoBanco(ponto) >= 0 ? "+" : ""}
  {saldoBanco(ponto).toFixed(2)}h
</td>

<td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {ponto.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}