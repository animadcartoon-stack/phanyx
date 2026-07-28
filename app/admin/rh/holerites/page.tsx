"use client";

import { useEffect, useMemo, useState } from "react";
import PagamentoHoleriteModal from "@/components/rh/PagamentoHoleriteModal";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

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

type LinkAssinaturaRH = {
  pagamentoId: number;
  reciboNumero: string;
  urlAssinatura: string;
  caminhoAssinatura: string;
  expiraEm: string;

  funcionario: {
    id: number;
    nome: string;
    email: string;
  };
};

type AvisoCpfAssinaturaRH = {
  codigo:
    | "CPF_FUNCIONARIO_AUSENTE"
    | "CPF_FUNCIONARIO_INVALIDO";

  funcionarioId: number;
  funcionarioNome: string;
  cadastroCpfUrl: string;
  mensagem: string;
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

function dataHoraBR(valor?: string | null) {
  if (!valor) return "-";

  return new Date(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
  const [holeriteParaArquivar, setHoleriteParaArquivar] =
    useState<Holerite | null>(null);

  const [holeriteParaPagar, setHoleriteParaPagar] = useState<Holerite | null>(
    null,
  );

  const [holeriteParaAssinatura, setHoleriteParaAssinatura] =
    useState<Holerite | null>(null);

  const [linkAssinatura, setLinkAssinatura] =
    useState<LinkAssinaturaRH | null>(null);

  const [gerandoLinkAssinatura, setGerandoLinkAssinatura] = useState(false);

  const [erroAssinatura, setErroAssinatura] = useState("");

  const [linkCopiado, setLinkCopiado] = useState(false);

  const [
  avisoCpfAssinatura,
  setAvisoCpfAssinatura,
] = useState<AvisoCpfAssinaturaRH | null>(null);

  const [motivoArquivo, setMotivoArquivo] = useState("");

  const [arquivando, setArquivando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const funcionarioSelecionado = funcionarios.find(
    (f) => f.id === funcionarioId,
  );

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

      const [resFuncionarios, resHolerites, resEventosFolha] =
        await Promise.all([
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
        [],
      );

      setHolerites(
        dadosHolerites.holerites ||
        dadosHolerites.items ||
        dadosHolerites ||
        [],
      );

      setEventosPadrao(
        Array.isArray(dadosEventosFolha) ? dadosEventosFolha : [],
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

    const salario = funcionario.salarioBase ?? funcionario.salario ?? "";

    setSalarioBase(salario ? String(salario) : "");
  }

  function atualizarEvento(index: number, campo: keyof Evento, valor: string) {
    setEventos((atuais) =>
      atuais.map((evento, i) =>
        i === index ? { ...evento, [campo]: valor } : evento,
      ),
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
        throw new Error(
          dados?.error || "Não foi possível arquivar o holerite.",
        );
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

  async function gerarLinkAssinatura(holerite: Holerite) {
    try {
      setHoleriteParaAssinatura(holerite);
      setLinkAssinatura(null);
      setErroAssinatura("");
      setLinkCopiado(false);
      setAvisoCpfAssinatura(null);
      setGerandoLinkAssinatura(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        `/api/admin/rh/holerites/${holerite.id}/assinatura`,
        {
          method: "POST",
        },
      );

      const dados = await resposta.json().catch(() => null);

const codigoErro = String(dados?.codigo || "");

if (
  !resposta.ok &&
  [
    "CPF_FUNCIONARIO_AUSENTE",
    "CPF_FUNCIONARIO_INVALIDO",
  ].includes(codigoErro)
) {
  const funcionarioIdErro = Number(
    dados?.funcionarioId,
  );

  setAvisoCpfAssinatura({
    codigo:
      codigoErro as AvisoCpfAssinaturaRH["codigo"],

    funcionarioId: funcionarioIdErro,

    funcionarioNome: String(
      dados?.funcionarioNome ||
        holerite.funcionario?.nome ||
        "Funcionário",
    ),

    cadastroCpfUrl: String(
      dados?.cadastroCpfUrl ||
        `/admin/funcionarios/${funcionarioIdErro}`,
    ),

    mensagem: String(
      dados?.error ||
        "Cadastre um CPF válido antes de gerar o link de assinatura.",
    ),
  });

  setHoleriteParaAssinatura(null);
  setLinkAssinatura(null);
  setErroAssinatura("");

  return;
}

if (!resposta.ok) {
  throw new Error(
    dados?.error ||
      "Não foi possível gerar o link de assinatura.",
  );
}

      setLinkAssinatura({
        pagamentoId: Number(dados.pagamentoId),
        reciboNumero: String(dados.reciboNumero || ""),
        urlAssinatura: String(dados.urlAssinatura || ""),
        caminhoAssinatura: String(dados.caminhoAssinatura || ""),
        expiraEm: String(dados.expiraEm || ""),

        funcionario: {
          id: Number(dados.funcionario?.id),
          nome: String(dados.funcionario?.nome || ""),
          email: String(dados.funcionario?.email || ""),
        },
      });

      setSucesso(
        dados?.message || "Link seguro de assinatura gerado com sucesso.",
      );
    } catch (error: any) {
      setErroAssinatura(
        error?.message || "Erro ao gerar o link de assinatura.",
      );
    } finally {
      setGerandoLinkAssinatura(false);
    }
  }

  async function copiarLinkAssinatura() {
    const link = linkAssinatura?.urlAssinatura;

    if (!link) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const campoTemporario = document.createElement("textarea");

        campoTemporario.value = link;
        campoTemporario.style.position = "fixed";
        campoTemporario.style.opacity = "0";

        document.body.appendChild(campoTemporario);
        campoTemporario.select();
        document.execCommand("copy");
        campoTemporario.remove();
      }

      setLinkCopiado(true);

      window.setTimeout(() => {
        setLinkCopiado(false);
      }, 2500);
    } catch {
      setErroAssinatura(
        "Não foi possível copiar automaticamente. Selecione o link e copie manualmente.",
      );
    }
  }

  function fecharModalAssinatura() {
    setHoleriteParaAssinatura(null);
    setLinkAssinatura(null);
    setErroAssinatura("");
    setLinkCopiado(false);
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
        (e) => e.descricao.trim() && numero(e.valor) > 0,
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
    <div className="phanyx-rh-page phanyx-holerite-page space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
          RH Empresarial
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
          Holerites
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Gere holerites com salário base, vencimentos, descontos e líquido
          automático.
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
                    (item) => item.codigo === e.target.value,
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
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
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

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 md:col-span-1">
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
                    e.target.value as "VENCIMENTO" | "DESCONTO",
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
                  onChange={(e) =>
                    atualizarEvento(index, "valor", e.target.value)
                  }
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
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
              Total vencimentos
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {moeda(totalVencimentos)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
              Total descontos
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {moeda(totalDescontos)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
              Valor líquido
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {moeda(valorLiquido)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={gerarHolerite}
            disabled={salvando}
            className="phanyx-rh-primary-action"
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
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    Carregando holerites...
                  </td>
                </tr>
              ) : holerites.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
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
                      <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                        {holerite.status || "GERADO"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={`/api/admin/rh/holerites/${holerite.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-emerald-500 px-3 py-1 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-white"
                        >
                          📄 PDF
                        </a>

                        {String(holerite.status || "").toUpperCase() ===
                          "AGUARDANDO_ASSINATURA" && (
                            <>
                              <a
                                href={`/api/admin/rh/holerites/${holerite.id}/recibo-pagamento/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl border border-blue-600 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white dark:text-blue-300"
                              >
                                Baixar recibo
                              </a>

                              <button
                                type="button"
                                onClick={() => gerarLinkAssinatura(holerite)}
                                className="rounded-xl border border-violet-600 px-3 py-1 text-sm font-semibold text-violet-700 transition hover:bg-violet-600 hover:text-white dark:text-violet-300"
                              >
                                Gerar link de assinatura
                              </button>
                            </>
                          )}

                        {![
                          "PAGO",
                          "ARQUIVADO",
                          "CANCELADO",
                          "AGUARDANDO_ASSINATURA",
                        ].includes(
                          String(holerite.status || "").toUpperCase(),
                        ) && (
                            <button
                              type="button"
                              onClick={() => {
                                setHoleriteParaPagar(holerite);
                                setErro("");
                                setSucesso("");
                              }}
                              className="rounded-xl border border-emerald-600 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:text-emerald-300"
                            >
                              Registrar pagamento
                            </button>
                          )}

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
            <h2 className="text-xl font-bold text-white">Arquivar holerite</h2>

            <p className="mt-3 text-sm text-slate-300">
              Este holerite não será excluído do sistema. Ele ficará preservado
              para auditoria, direção e conferências futuras.
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

      {holeriteParaPagar && (
        <PagamentoHoleriteModal
          holerite={holeriteParaPagar}
          onFechar={() => {
            setHoleriteParaPagar(null);
            setErro("");
          }}
          onConcluido={async (mensagem) => {
            setErro("");
            setSucesso(mensagem);
            await carregarDados();
          }}
        />
      )}

      {holeriteParaAssinatura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <h2 className="text-xl font-bold">
              Assinatura digital do recibo
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Gere um link individual para o funcionário conferir o recibo,
              confirmar o recebimento e assinar digitalmente.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
              <p>
                <strong>Funcionário:</strong>{" "}
                {holeriteParaAssinatura.funcionario?.nome || "Funcionário"}
              </p>

              <p className="mt-2">
                <strong>Competência:</strong>{" "}
                {String(holeriteParaAssinatura.competenciaMes).padStart(2, "0")}/
                {holeriteParaAssinatura.competenciaAno}
              </p>

              <p className="mt-2">
                <strong>Valor do recibo:</strong>{" "}
                {moeda(numero(holeriteParaAssinatura.valorLiquido))}
              </p>
            </div>

            {gerandoLinkAssinatura && (
              <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center text-sm font-semibold text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200">
                Gerando link seguro de assinatura...
              </div>
            )}

            {erroAssinatura && (
              <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                {erroAssinatura}
              </div>
            )}

            {linkAssinatura && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <p className="font-bold">
                    Link gerado com sucesso
                  </p>

                  <p className="mt-2">
                    <strong>Recibo:</strong>{" "}
                    {linkAssinatura.reciboNumero}
                  </p>

                  <p className="mt-1">
                    <strong>Funcionário:</strong>{" "}
                    {linkAssinatura.funcionario.nome}
                  </p>

                  <p className="mt-1">
                    <strong>E-mail cadastrado:</strong>{" "}
                    {linkAssinatura.funcionario.email}
                  </p>

                  <p className="mt-1">
                    <strong>Válido até:</strong>{" "}
                    {dataHoraBR(linkAssinatura.expiraEm)}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Link individual de assinatura
                  </label>

                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={linkAssinatura.urlAssinatura}
                      readOnly
                      onFocus={(event) => event.currentTarget.select()}
                      className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />

                    <button
                      type="button"
                      onClick={copiarLinkAssinatura}
                      className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700"
                    >
                      {linkCopiado ? "Link copiado" : "Copiar link"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  O link é individual e válido por sete dias. Ao gerar um novo
                  link, o anterior deixa de funcionar. Encaminhe-o somente ao
                  funcionário responsável pelo recibo.
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {erroAssinatura && !gerandoLinkAssinatura && (
                <button
                  type="button"
                  onClick={() => gerarLinkAssinatura(holeriteParaAssinatura)}
                  className="rounded-2xl bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700"
                >
                  Tentar novamente
                </button>
              )}

              {linkAssinatura && (
                <a
                  href={linkAssinatura.urlAssinatura}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-violet-600 px-5 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40"
                >
                  Abrir página de assinatura
                </a>
              )}

              <button
                type="button"
                onClick={fecharModalAssinatura}
                disabled={gerandoLinkAssinatura}
                className="rounded-2xl border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <PhanyxConfirmModal
  aberto={Boolean(avisoCpfAssinatura)}
  titulo={
    avisoCpfAssinatura?.codigo ===
    "CPF_FUNCIONARIO_INVALIDO"
      ? "CPF do funcionário inválido"
      : "CPF do funcionário não cadastrado"
  }
  mensagem={
    avisoCpfAssinatura
      ? `${avisoCpfAssinatura.mensagem} O CPF será utilizado para validar a identidade do funcionário no momento da assinatura do recibo.`
      : ""
  }
  textoConfirmar="Cadastrar CPF"
  textoCancelar="Agora não"
  onCancelar={() => {
    setAvisoCpfAssinatura(null);
  }}
  onConfirmar={() => {
    const destino =
      avisoCpfAssinatura?.cadastroCpfUrl;

    setAvisoCpfAssinatura(null);

    if (destino) {
      window.location.href = destino;
    }
  }}
/>

    </div>
  );
}
