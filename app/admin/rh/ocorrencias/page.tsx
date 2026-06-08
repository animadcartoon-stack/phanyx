"use client";

import { useEffect, useMemo, useState } from "react";

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
  codigoFuncionario?: string | null;
  departamento?: {
    nome?: string | null;
  } | null;
};

type OcorrenciaRH = {
  id: number;
  tipo: string;
  motivo?: string | null;
  descricao?: string | null;
  status: string;
  dataEvento: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  dias?: number | null;
  cid?: string | null;
  dataPericia?: string | null;
  resultadoPericia?: string | null;
  documentoUrl?: string | null;
  funcionario: Funcionario;
};

const TIPOS_OCORRENCIA = [
  { value: "ADVERTENCIA", label: "Advertência" },
  { value: "SUSPENSAO", label: "Suspensão" },
  { value: "ELOGIO", label: "Elogio" },
  { value: "PROMOCAO", label: "Promoção" },
  { value: "MUDANCA_CARGO", label: "Mudança de cargo" },
  { value: "MUDANCA_SALARIAL", label: "Mudança salarial" },
  { value: "AFASTAMENTO_MEDICO", label: "Afastamento médico" },
  { value: "AFASTAMENTO_MATERNIDADE", label: "Afastamento maternidade" },
  { value: "AFASTAMENTO_PERICIA", label: "Afastamento perícia" },
  { value: "RETORNO_TRABALHO", label: "Retorno ao trabalho" },
];

function formatarData(data?: string | null) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

export default function OcorrenciasRHPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaRH[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] =
    useState<Funcionario | null>(null);

  const [tipo, setTipo] = useState("ADVERTENCIA");
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [dias, setDias] = useState("");
  const [cid, setCid] = useState("");
  const [dataPericia, setDataPericia] = useState("");
  const [resultadoPericia, setResultadoPericia] = useState("");

  const funcionariosFiltrados = useMemo(() => {
    const termo = buscaFuncionario.trim().toLowerCase();

    if (!termo) return funcionarios.slice(0, 8);

    return funcionarios
      .filter((f) => {
        return (
          f.nome.toLowerCase().includes(termo) ||
          f.cargo?.toLowerCase().includes(termo) ||
          f.codigoFuncionario?.toLowerCase().includes(termo) ||
          f.departamento?.nome?.toLowerCase().includes(termo)
        );
      })
      .slice(0, 8);
  }, [funcionarios, buscaFuncionario]);

  const mostrarCamposAfastamento =
    tipo.includes("AFASTAMENTO") || tipo === "RETORNO_TRABALHO";

  const mostrarCamposPeriodo =
    tipo === "SUSPENSAO" || mostrarCamposAfastamento;

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const [resFuncionarios, resOcorrencias] = await Promise.all([
        fetch("/api/admin/funcionarios", { cache: "no-store" }),
        fetch("/api/admin/rh/ocorrencias", { cache: "no-store" }),
      ]);

      const dataFuncionarios = await resFuncionarios.json();
      const dataOcorrencias = await resOcorrencias.json();

      if (!resFuncionarios.ok) {
        throw new Error(
          dataFuncionarios?.error || "Erro ao carregar funcionários."
        );
      }

      if (!resOcorrencias.ok) {
        throw new Error(
          dataOcorrencias?.error || "Erro ao carregar ocorrências."
        );
      }

      setFuncionarios(
        Array.isArray(dataFuncionarios)
          ? dataFuncionarios
          : Array.isArray(dataFuncionarios?.funcionarios)
          ? dataFuncionarios.funcionarios
          : []
      );

      setOcorrencias(Array.isArray(dataOcorrencias) ? dataOcorrencias : []);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function limparFormulario() {
    setTipo("ADVERTENCIA");
    setMotivo("");
    setDescricao("");
    setDataEvento("");
    setDataInicio("");
    setDataFim("");
    setDias("");
    setCid("");
    setDataPericia("");
    setResultadoPericia("");
  }

  async function salvarOcorrencia() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      if (!funcionarioSelecionado) {
        setErro("Selecione um funcionário.");
        return;
      }

      if (!tipo) {
        setErro("Selecione o tipo da ocorrência.");
        return;
      }

      const res = await fetch("/api/admin/rh/ocorrencias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funcionarioId: funcionarioSelecionado.id,
          tipo,
          motivo,
          descricao,
          dataEvento,
          dataInicio,
          dataFim,
          dias,
          cid,
          dataPericia,
          resultadoPericia,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao registrar ocorrência.");
      }

      setMensagem("Ocorrência registrada com sucesso.");
      limparFormulario();
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Erro ao registrar ocorrência.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-400">
          RH Empresarial
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Ocorrências funcionais
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Registre advertências, suspensões, afastamentos, promoções e eventos
          importantes do histórico funcional.
        </p>
      </div>

      {mensagem && (
        <div className="rounded-2xl border border-emerald-500 bg-emerald-950/40 p-4 text-sm font-medium text-emerald-200">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-500 bg-red-950/40 p-4 text-sm font-medium text-red-200">
          {erro}
        </div>
      )}

      <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-white">Nova ocorrência</h2>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="text-xs font-bold uppercase text-slate-300">
              Funcionário
            </label>
            <input
              value={buscaFuncionario}
              onChange={(e) => {
                setBuscaFuncionario(e.target.value);
                setFuncionarioSelecionado(null);
              }}
              placeholder="Digite o nome do funcionário"
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />

            {buscaFuncionario && !funcionarioSelecionado && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                {funcionariosFiltrados.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">
                    Nenhum funcionário encontrado.
                  </div>
                ) : (
                  funcionariosFiltrados.map((funcionario) => (
                    <button
                      key={funcionario.id}
                      type="button"
                      onClick={() => {
                        setFuncionarioSelecionado(funcionario);
                        setBuscaFuncionario(funcionario.nome);
                      }}
                      className="block w-full border-b border-slate-800 px-4 py-3 text-left text-sm text-white hover:bg-slate-800"
                    >
                      <strong>{funcionario.nome}</strong>
                      <span className="ml-2 text-slate-400">
                        {funcionario.cargo || "Sem cargo"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-300">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              {TIPOS_OCORRENCIA.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-300">
              Data do evento
            </label>
            <input
              type="date"
              value={dataEvento}
              onChange={(e) => setDataEvento(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-300">
              Motivo
            </label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: atraso recorrente, retorno ao trabalho..."
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {mostrarCamposPeriodo && (
            <>
              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Data final
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Dias
                </label>
                <input
                  type="number"
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {mostrarCamposAfastamento && (
            <>
              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  CID
                </label>
                <input
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  placeholder="Opcional"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Data da perícia
                </label>
                <input
                  type="date"
                  value={dataPericia}
                  onChange={(e) => setDataPericia(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300">
                  Resultado da perícia
                </label>
                <input
                  value={resultadoPericia}
                  onChange={(e) => setResultadoPericia(e.target.value)}
                  placeholder="Ex.: aprovado, indeferido, aguardando"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className="lg:col-span-3">
            <label className="text-xs font-bold uppercase text-slate-300">
              Descrição detalhada
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              placeholder="Descreva o ocorrido com clareza."
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={salvarOcorrencia}
          disabled={salvando}
          className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-600"
        >
          {salvando ? "Registrando..." : "Registrar ocorrência"}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-white">Ocorrências registradas</h2>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="p-3">Funcionário</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Data</th>
                <th className="p-3">Motivo</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-slate-400" colSpan={5}>
                    Carregando...
                  </td>
                </tr>
              ) : ocorrencias.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-400" colSpan={5}>
                    Nenhuma ocorrência registrada ainda.
                  </td>
                </tr>
              ) : (
                ocorrencias.map((ocorrencia) => (
                  <tr
                    key={ocorrencia.id}
                    className="border-b border-slate-800 text-slate-200"
                  >
                    <td className="p-3 font-semibold">
                      {ocorrencia.funcionario?.nome || "-"}
                    </td>
                    <td className="p-3">{ocorrencia.tipo}</td>
                    <td className="p-3">{formatarData(ocorrencia.dataEvento)}</td>
                    <td className="p-3">{ocorrencia.motivo || "-"}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-blue-200">
                        {ocorrencia.status}
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