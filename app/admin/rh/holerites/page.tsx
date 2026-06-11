"use client";

import { useEffect, useMemo, useState } from "react";

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
  setor?: string | null;
  salario?: string | number | null;
  salarioBase?: string | number | null;
};

type Evento = {
  codigo: string;
  descricao: string;
  referencia: string;
  tipo: "VENCIMENTO" | "DESCONTO";
  valor: string;
};

type EventoFolhaPadrao = {
  id: number;
  codigo: string;
  descricao: string;
  tipo: "VENCIMENTO" | "DESCONTO" | "INFORMATIVO";
  natureza?: string | null;
};

type Holerite = {
  id: number;
  competenciaMes: number;
  competenciaAno: number;
  salarioBase: string | number;
  totalVencimentos: string | number;
  totalDescontos: string | number;
  valorLiquido: string | number;
  status: string;
  funcionario?: {
    nome: string;
    cargo?: string | null;
  };
  eventos?: {
    id: number;
    codigo?: string | null;
    descricao: string;
    referencia?: string | null;
    tipo: string;
    valor: string | number;
  }[];
};

const eventoInicial: Evento = {
  codigo: "",
  descricao: "",
  referencia: "",
  tipo: "VENCIMENTO",
  valor: "",
};

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return 0;
  return Number(String(valor).replace(",", ".")) || 0;
}

export default function Page() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [holerites, setHolerites] = useState<Holerite[]>([]);

  const [funcionarioBusca, setFuncionarioBusca] = useState("");
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null);

  const hoje = new Date();
  const [competenciaMes, setCompetenciaMes] = useState(hoje.getMonth() + 1);
  const [competenciaAno, setCompetenciaAno] = useState(hoje.getFullYear());
  const [salarioBase, setSalarioBase] = useState("");

  const [eventos, setEventos] = useState<Evento[]>([{ ...eventoInicial }]);
  const [eventosPadrao, setEventosPadrao] = useState<EventoFolhaPadrao[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [holeriteParaArquivar, setHoleriteParaArquivar] = useState<Holerite | null>(null);

  const [motivoArquivo, setMotivoArquivo] = useState("");

  const [arquivando, setArquivando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const funcionarioSelecionado = funcionarios.find((f) => f.id === funcionarioId);

  const funcionariosFiltrados = useMemo(() => {
    const termo = funcionarioBusca.trim().toLowerCase();
    if (!termo) return [];

    return funcionarios
      .filter((f) => f.nome.toLowerCase().includes(termo))
      .slice(0, 6);
  }, [funcionarioBusca, funcionarios]);

  const totalVencimentos = useMemo(() => {
    return eventos
      .filter((e) => e.tipo === "VENCIMENTO")
      .reduce((total, e) => total + numero(e.valor), 0);
  }, [eventos]);

  const totalDescontos = useMemo(() => {
    return eventos
      .filter((e) => e.tipo === "DESCONTO")
      .reduce((total, e) => total + numero(e.valor), 0);
  }, [eventos]);

  const valorLiquido = useMemo(() => {
    return numero(salarioBase) + totalVencimentos - totalDescontos;
  }, [salarioBase, totalVencimentos, totalDescontos]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
  resFuncionarios,
  resHolerites,
  resEventosFolha,
] = await Promise.all([
        fetch("/api/admin/funcionarios"),
        fetch("/api/admin/rh/holerites"),
        fetch("/api/admin/rh/eventos-folha"),
      ]);

      if (!resFuncionarios.ok) {
        throw new Error("Não foi possível carregar os funcionários.");
      }

      if (!resHolerites.ok) {
        throw new Error("Não foi possível carregar os holerites.");
      }

      const dadosFuncionarios = await resFuncionarios.json();
      const dadosHolerites = await resHolerites.json();
      const dadosEventosFolha = await resEventosFolha.json();


      setFuncionarios(
        dadosFuncionarios.funcionarios ||
          dadosFuncionarios.items ||
          dadosFuncionarios ||
          []
      );

      setHolerites(
        dadosHolerites.holerites ||
          dadosHolerites.items ||
          dadosHolerites ||
          []
      );

      setEventosPadrao(
  Array.isArray(dadosEventosFolha)
    ? dadosEventosFolha
    : []
);

    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar dados de holerites.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function selecionarFuncionario(funcionario: Funcionario) {
    setFuncionarioId(funcionario.id);
    setFuncionarioBusca(funcionario.nome);

    const salario =
      funcionario.salarioBase ?? funcionario.salario ?? "";

    setSalarioBase(salario ? String(salario) : "");
  }

  function atualizarEvento(index: number, campo: keyof Evento, valor: string) {
    setEventos((atuais) =>
      atuais.map((evento, i) =>
        i === index ? { ...evento, [campo]: valor } : evento
      )
    );
  }

  function adicionarEvento() {
    setEventos((atuais) => [...atuais, { ...eventoInicial }]);
  }

  function removerEvento(index: number) {
    setEventos((atuais) => atuais.filter((_, i) => i !== index));
  }

async function arquivarHolerite() {
  if (!holeriteParaArquivar) return;

  if (!motivoArquivo.trim()) {
    setErro("Informe o motivo do arquivamento.");
    return;
  }

  try {
    setErro("");
    setSucesso("");
    setArquivando(true);

    const res = await fetch("/api/admin/rh/holerites", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        holeriteId: holeriteParaArquivar.id,
        motivoArquivo,
      }),
    });

    const dados = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(dados?.error || "Não foi possível arquivar o holerite.");
    }

    setSucesso("Holerite arquivado com sucesso.");
    setHoleriteParaArquivar(null);
    setMotivoArquivo("");
    await carregarDados();
  } catch (error: any) {
    setErro(error?.message || "Erro ao arquivar holerite.");
  } finally {
    setArquivando(false);
  }
}

  async function gerarHolerite() {
    try {
      setErro("");
      setSucesso("");

      if (!funcionarioId) {
        setErro("Selecione um funcionário antes de gerar o holerite.");
        return;
      }

      if (!competenciaMes || !competenciaAno) {
        setErro("Informe a competência do holerite.");
        return;
      }

      if (numero(salarioBase) <= 0) {
        setErro("Informe um salário base válido.");
        return;
      }

      const eventosValidos = eventos.filter(
        (e) => e.descricao.trim() && numero(e.valor) > 0
      );

      if (eventosValidos.length === 0) {
        setErro("Adicione pelo menos um evento com descrição e valor.");
        return;
      }

      setSalvando(true);

      const res = await fetch("/api/admin/rh/holerites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funcionarioId,
          competenciaMes,
          competenciaAno,
          salarioBase: numero(salarioBase),
          eventos: eventosValidos.map((e) => ({
            ...e,
            valor: numero(e.valor),
          })),
        }),
      });

      const dados = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(dados?.error || "Não foi possível gerar o holerite.");
      }

      setSucesso("Holerite gerado com sucesso.");
      setEventos([{ ...eventoInicial }]);
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Erro ao gerar holerite.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
          RH Empresarial
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
          Holerites
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Gere holerites com salário base, vencimentos, descontos e líquido automático.
        </p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {sucesso}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Novo holerite
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <label className="text-xs font-bold uppercase text-slate-500">
              Funcionário
            </label>
            <input
              value={funcionarioBusca}
              onChange={(e) => {
                setFuncionarioBusca(e.target.value);
                setFuncionarioId(null);
              }}
              placeholder="Digite o nome do funcionário"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            {funcionariosFiltrados.length > 0 && !funcionarioId && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {funcionariosFiltrados.map((funcionario) => (
                  <button
                    key={funcionario.id}
                    type="button"
                    onClick={() => selecionarFuncionario(funcionario)}
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {funcionario.nome}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {funcionario.cargo || "Sem cargo informado"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">
              Mês
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={competenciaMes}
              onChange={(e) => setCompetenciaMes(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">
              Ano
            </label>
            <input
              type="number"
              value={competenciaAno}
              onChange={(e) => setCompetenciaAno(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">
              Salário base
            </label>
            <input
              value={salarioBase}
              onChange={(e) => setSalarioBase(e.target.value)}
              placeholder="0,00"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-bold uppercase text-slate-500">
              Funcionário selecionado
            </label>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {funcionarioSelecionado
                ? `${funcionarioSelecionado.nome} • ${funcionarioSelecionado.cargo || "Sem cargo"}`
                : "Nenhum funcionário selecionado"}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Eventos do holerite
            </h3>

            <button
              type="button"
              onClick={adicionarEvento}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              + Adicionar evento
            </button>
          </div>

          {eventos.map((evento, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-6"
            >
             <select
  value={evento.codigo}
  onChange={(e) => {
    const selecionado = eventosPadrao.find(
      (item) => item.codigo === e.target.value
    );

    if (!selecionado) return;

    atualizarEvento(index, "codigo", selecionado.codigo);
    atualizarEvento(index, "descricao", selecionado.descricao);

    if (
      selecionado.tipo === "VENCIMENTO" ||
      selecionado.tipo === "DESCONTO"
    ) {
      atualizarEvento(index, "tipo", selecionado.tipo);
    }
  }}
  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
>
  <option value="">Selecione um evento</option>

  {eventosPadrao
    .filter((item) => item.tipo !== "INFORMATIVO")
    .map((item) => (
      <option key={item.id} value={item.codigo}>
        {item.codigo} - {item.descricao}
      </option>
    ))}
</select>

<div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 md:col-span-2">
  {evento.descricao || "Descrição do evento"}
</div>

              <input
                value={evento.referencia}
                onChange={(e) =>
                  atualizarEvento(index, "referencia", e.target.value)
                }
                placeholder="Referência"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <select
                value={evento.tipo}
                onChange={(e) =>
                  atualizarEvento(
                    index,
                    "tipo",
                    e.target.value as "VENCIMENTO" | "DESCONTO"
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="VENCIMENTO">Vencimento</option>
                <option value="DESCONTO">Desconto</option>
              </select>

              <div className="flex gap-2">
                <input
                  value={evento.valor}
                  onChange={(e) => atualizarEvento(index, "valor", e.target.value)}
                  placeholder="Valor"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                {eventos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerEvento(index)}
                    className="rounded-xl border border-red-200 px-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
              Total vencimentos
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-200">
              {moeda(totalVencimentos)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <p className="text-xs font-bold uppercase text-red-700 dark:text-red-300">
              Total descontos
            </p>
            <p className="mt-1 text-2xl font-black text-red-800 dark:text-red-200">
              {moeda(totalDescontos)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">
              Valor líquido
            </p>
            <p className="mt-1 text-2xl font-black text-blue-800 dark:text-blue-200">
              {moeda(valorLiquido)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={gerarHolerite}
            disabled={salvando}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
          >
            {salvando ? "Gerando..." : "Gerar holerite"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Holerites gerados
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                <th className="py-3">Funcionário</th>
                <th className="py-3">Competência</th>
                <th className="py-3">Salário</th>
                <th className="py-3">Vencimentos</th>
                <th className="py-3">Descontos</th>
                <th className="py-3">Líquido</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Carregando holerites...
                  </td>
                </tr>
              ) : holerites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Nenhum holerite gerado ainda.
                  </td>
                </tr>
              ) : (
                holerites.map((holerite) => (
                  <tr
                    key={holerite.id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      {holerite.funcionario?.nome || "Funcionário"}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {String(holerite.competenciaMes).padStart(2, "0")}/
                      {holerite.competenciaAno}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {moeda(numero(holerite.salarioBase))}
                    </td>
                    <td className="py-3 text-emerald-700 dark:text-emerald-300">
                      {moeda(numero(holerite.totalVencimentos))}
                    </td>
                    <td className="py-3 text-red-700 dark:text-red-300">
                      {moeda(numero(holerite.totalDescontos))}
                    </td>
                    <td className="py-3 font-bold text-blue-700 dark:text-blue-300">
                      {moeda(numero(holerite.valorLiquido))}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {holerite.status || "GERADO"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
  <div className="flex justify-end gap-2">
    <a
      href={`/api/admin/rh/holerites/${holerite.id}/pdf`}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border border-emerald-500 px-3 py-1 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-white"
    >
      📄 PDF
    </a>

    <button
      type="button"
      onClick={() => {
        setHoleriteParaArquivar(holerite);
        setMotivoArquivo("");
      }}
      className="rounded-xl border border-amber-500 px-3 py-1 text-sm font-semibold text-amber-300 transition hover:bg-amber-500 hover:text-white"
    >
      Arquivar
    </button>
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
            </div>

      {holeriteParaArquivar && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white">
        Arquivar holerite
      </h2>

      <p className="mt-3 text-sm text-slate-300">
        Este holerite não será excluído do sistema. Ele ficará preservado para auditoria, direção e conferências futuras.
      </p>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
        <p>
          <strong>Funcionário:</strong>{" "}
          {holeriteParaArquivar.funcionario?.nome || "Funcionário"}
        </p>
        <p className="mt-2">
          <strong>Competência:</strong>{" "}
          {String(holeriteParaArquivar.competenciaMes).padStart(2, "0")}/
          {holeriteParaArquivar.competenciaAno}
        </p>
      </div>

      <label className="mt-5 block text-xs font-bold uppercase text-slate-300">
        Motivo do arquivamento
      </label>

      <textarea
        value={motivoArquivo}
        onChange={(e) => setMotivoArquivo(e.target.value)}
        rows={4}
        placeholder="Explique por que este holerite está sendo arquivado."
        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
      />

      {erro && (
        <div className="mt-3 rounded-xl border border-red-500 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-200">
          {erro}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setHoleriteParaArquivar(null);
            setMotivoArquivo("");
            setErro("");
          }}
          disabled={arquivando}
          className="rounded-2xl border border-slate-600 px-5 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={arquivarHolerite}
          disabled={arquivando}
          className="rounded-2xl bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {arquivando ? "Arquivando..." : "Arquivar holerite"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}