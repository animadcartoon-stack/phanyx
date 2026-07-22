"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Departamento = {
  id: number;
  nome: string;
};

type ResumoRemuneracaoVariavel = {
  totalProgramas: number;
  programasAtivos: number;
  programasRascunho: number;
  comissoesPendentes: number;
  remuneracoesPendentes: number;
  totalLancamentosPendentes: number;
  totalValorPendente: number;
};

type ProgramaRemuneracaoVariavel = {
  id: number;
    criadoPorId?: number | null;
  criadoPor?: {
    id: number;
    nome: string;
    email?: string | null;
  } | null;
  nome: string;
  descricao?: string | null;
  observacoes?: string | null;
  tipo: string;
  abrangencia: string;
  metodoDistribuicao: string;
  competenciaMes?: number | null;
  competenciaAno?: number | null;
  periodoInicio?: string | null;
  periodoFim?: string | null;
  percentualFundo?: string | number | null;
  valorFundo?: string | number | null;
  valorMinimoIndividual?: string | number | null;
  valorMaximoIndividual?: string | number | null;
  considerarSalarioBase: boolean;
  considerarTempoTrabalhado: boolean;
  exigirFuncionarioAtivo: boolean;
  excluirEmExperiencia: boolean;
  diasMinimosAdmissao?: number | null;
  permitirAjusteManual: boolean;
  status: string;
  criadoEm: string;
  departamento?: Departamento | null;
  _count?: {
    participantes: number;
    lancamentos: number;
      criadoPorId?: number | null;
  criadoPor?: {
    id: number;
    nome: string;
    email?: string | null;
  } | null;
  };
};

type AbaPagina = "visao-geral" | "novo-programa";

const TIPOS = [
  {
    value: "BONUS",
    label: "Bônus",
    descricao: "Pagamento adicional por meta, desempenho ou resultado.",
  },
  {
    value: "PREMIO",
    label: "Prêmio",
    descricao: "Reconhecimento financeiro por desempenho extraordinário.",
  },
  {
    value: "PARTICIPACAO_RESULTADOS",
    label: "Participação nos resultados",
    descricao: "Distribuição baseada nos resultados alcançados.",
  },
  {
    value: "PARTICIPACAO_LUCROS",
    label: "Participação nos lucros",
    descricao: "Distribuição vinculada ao lucro apurado pela instituição.",
  },
  {
    value: "OUTRO",
    label: "Outra remuneração",
    descricao: "Outra verba variável definida pela instituição.",
  },
];

const ABRANGENCIAS = [
  {
    value: "TODOS_FUNCIONARIOS",
    label: "Todos os funcionários",
  },
  {
    value: "DEPARTAMENTO",
    label: "Departamento específico",
  },
  {
    value: "FUNCIONARIOS_SELECIONADOS",
    label: "Funcionários selecionados",
  },
];

const METODOS_DISTRIBUICAO = [
  {
    value: "VALOR_FIXO_INDIVIDUAL",
    label: "Valor fixo por funcionário",
  },
  {
    value: "IGUALITARIO",
    label: "Divisão igualitária",
  },
  {
    value: "PROPORCIONAL_SALARIO",
    label: "Proporcional ao salário",
  },
  {
    value: "PROPORCIONAL_TEMPO_TRABALHADO",
    label: "Proporcional ao tempo trabalhado",
  },
  {
    value: "PERCENTUAL_INDIVIDUAL",
    label: "Percentual individual",
  },
  {
    value: "PONTUACAO",
    label: "Sistema de pontuação ou peso",
  },
  {
    value: "MANUAL",
    label: "Definição manual",
  },
];

const MESES = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const FORM_INICIAL = {
  nome: "",
  descricao: "",
  observacoes: "",
  tipo: "BONUS",
  abrangencia: "FUNCIONARIOS_SELECIONADOS",
  metodoDistribuicao: "MANUAL",
  departamentoId: "",
  competenciaMes: "",
  competenciaAno: "",
  periodoInicio: "",
  periodoFim: "",
  percentualFundo: "",
  valorFundo: "",
  valorMinimoIndividual: "",
  valorMaximoIndividual: "",
  considerarSalarioBase: false,
  considerarTempoTrabalhado: false,
  exigirFuncionarioAtivo: true,
  excluirEmExperiencia: false,
  diasMinimosAdmissao: "",
  permitirAjusteManual: true,
};

function formatarMoeda(valor: string | number | null | undefined) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor?: string | null) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleDateString("pt-BR");
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelPorValor(
  itens: Array<{ value: string; label: string }>,
  valor: string
) {
  return itens.find((item) => item.value === valor)?.label || valor;
}

function classeStatus(status: string) {
  switch (status) {
    case "ATIVO":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";

    case "EM_APURACAO":
      return "border-blue-500/30 bg-blue-500/15 text-blue-300";

    case "FECHADO":
      return "border-violet-500/30 bg-violet-500/15 text-violet-300";

    case "CANCELADO":
      return "border-red-500/30 bg-red-500/15 text-red-300";

    default:
      return "border-amber-500/30 bg-amber-500/15 text-amber-300";
  }
}

export default function RemuneracaoVariavelPage() {
  const [aba, setAba] = useState<AbaPagina>("visao-geral");
  const [programas, setProgramas] = useState<
    ProgramaRemuneracaoVariavel[]
  >([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>(
    []
  );

  const [resumo, setResumo] =
    useState<ResumoRemuneracaoVariavel>({
      totalProgramas: 0,
      programasAtivos: 0,
      programasRascunho: 0,
      comissoesPendentes: 0,
      remuneracoesPendentes: 0,
      totalLancamentosPendentes: 0,
      totalValorPendente: 0,
    });

  const [form, setForm] = useState(FORM_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const tipoSelecionado = useMemo(
    () =>
      TIPOS.find((item) => item.value === form.tipo) ||
      TIPOS[0],
    [form.tipo]
  );

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/rh/remuneracao-variavel",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            "Não foi possível carregar a remuneração variável."
        );
      }

      setProgramas(
        Array.isArray(dados.programas) ? dados.programas : []
      );

      setDepartamentos(
        Array.isArray(dados.departamentos)
          ? dados.departamentos
          : []
      );

      setResumo({
        totalProgramas: Number(
          dados.resumo?.totalProgramas || 0
        ),
        programasAtivos: Number(
          dados.resumo?.programasAtivos || 0
        ),
        programasRascunho: Number(
          dados.resumo?.programasRascunho || 0
        ),
        comissoesPendentes: Number(
          dados.resumo?.comissoesPendentes || 0
        ),
        remuneracoesPendentes: Number(
          dados.resumo?.remuneracoesPendentes || 0
        ),
        totalLancamentosPendentes: Number(
          dados.resumo?.totalLancamentosPendentes || 0
        ),
        totalValorPendente: Number(
          dados.resumo?.totalValorPendente || 0
        ),
      });
    } catch (error: any) {
      setErro(
        error?.message ||
          "Erro ao carregar a remuneração variável."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function atualizarForm(
    campo: keyof typeof FORM_INICIAL,
    valor: string | boolean
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarPrograma(evento: React.FormEvent) {
    evento.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        "/api/admin/rh/remuneracao-variavel",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            "Não foi possível criar o programa."
        );
      }

      setForm(FORM_INICIAL);
      setSucesso(
        dados.message ||
          "Programa de remuneração variável criado."
      );
      setAba("visao-geral");

      await carregarDados();
    } catch (error: any) {
      setErro(
        error?.message ||
          "Erro ao criar o programa de remuneração variável."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-300">
              Pessoal / RH
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Remuneração Variável
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Gerencie comissões, bônus, prêmios, participação
              nos resultados e participação nos lucros.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAba("visao-geral");
                setErro("");
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                aba === "visao-geral"
                  ? "phanyx-remuneracao-tab-ativa border-blue-500 bg-blue-600 text-white"
                  : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-blue-400"
              }`}
            >
              Visão geral
            </button>

            <button
              type="button"
              onClick={() => {
                setAba("novo-programa");
                setErro("");
                setSucesso("");
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                aba === "novo-programa"
                  ? "phanyx-remuneracao-tab-ativa border-blue-500 bg-blue-600 text-white"
                  : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-blue-400"
              }`}
            >
              + Novo programa
            </button>
          </div>
        </header>

        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-200">
            {sucesso}
          </div>
        )}

        {aba === "visao-geral" && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Programas cadastrados
                </p>

                <p className="mt-3 text-3xl font-black">
                  {resumo.totalProgramas}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {resumo.programasAtivos} ativos e{" "}
                  {resumo.programasRascunho} em rascunho
                </p>
              </article>

              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Comissões pendentes
                </p>

                <p className="mt-3 text-3xl font-black">
                  {resumo.comissoesPendentes}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Vendas e matrículas aguardando aprovação
                </p>
              </article>

              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Outros lançamentos
                </p>

                <p className="mt-3 text-3xl font-black">
                  {resumo.remuneracoesPendentes}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Bônus, prêmios e participações pendentes
                </p>
              </article>

              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Valor pendente
                </p>

                <p className="mt-3 text-3xl font-black">
                  {formatarMoeda(resumo.totalValorPendente)}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {resumo.totalLancamentosPendentes} lançamentos
                  aguardando análise
                </p>
              </article>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="text-2xl">📈</div>
                <h2 className="mt-3 font-black">
                  Comissões
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Valores por matrícula, venda, renovação ou
                  recebimento.
                </p>
              </article>

              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="text-2xl">🏆</div>
                <h2 className="mt-3 font-black">
                  Bônus e prêmios
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Reconhecimento por desempenho, produtividade e
                  metas.
                </p>
              </article>

              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="text-2xl">🤝</div>
                <h2 className="mt-3 font-black">
                  Resultados e lucros
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Distribuição para todos, por departamento ou
                  pessoas selecionadas.
                </p>
              </article>

              <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="text-2xl">🧾</div>
                <h2 className="mt-3 font-black">
                  Integração com folha
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Lançamentos aprovados serão enviados ao holerite.
                </p>
              </article>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
              <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black">
                    Programas de remuneração
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Programas de bônus, prêmio e participação
                    cadastrados pela instituição.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAba("novo-programa");
                    setErro("");
                    setSucesso("");
                  }}
                  className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  + Criar programa
                </button>
              </div>

              {carregando ? (
                <div className="p-6 text-sm text-slate-400">
                  Carregando programas...
                </div>
              ) : programas.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl">💰</div>

                  <h3 className="mt-4 text-lg font-black">
                    Nenhum programa cadastrado
                  </h3>

                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
                    Crie o primeiro programa para distribuir bônus,
                    prêmios, participação nos resultados ou nos
                    lucros.
                  </p>

                  <button
                    type="button"
                    onClick={() => setAba("novo-programa")}
                    className="phanyx-remuneracao-botao-primario mt-5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    Criar primeiro programa
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="p-3">Programa</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Abrangência</th>
                        <th className="p-3">Competência</th>
                        <th className="p-3">Participantes</th>
                        <th className="p-3">Fundo</th>
                        <th className="p-3">Auditoria</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {programas.map((programa) => (
                        <tr
                          key={programa.id}
                          className="border-t border-slate-800"
                        >
                          <td className="p-3">
                            <p className="font-bold">
                              {programa.nome}
                            </p>

                            {programa.departamento?.nome && (
                              <p className="mt-1 text-xs text-slate-400">
                                {programa.departamento.nome}
                              </p>
                            )}
                          </td>

                          <td className="p-3 text-slate-300">
                            {labelPorValor(
                              TIPOS,
                              programa.tipo
                            )}
                          </td>

                          <td className="p-3 text-slate-300">
                            {labelPorValor(
                              ABRANGENCIAS,
                              programa.abrangencia
                            )}
                          </td>

                          <td className="p-3 text-slate-300">
                            {programa.competenciaMes &&
                            programa.competenciaAno
                              ? `${String(
                                  programa.competenciaMes
                                ).padStart(2, "0")}/${
                                  programa.competenciaAno
                                }`
                              : programa.periodoInicio ||
                                  programa.periodoFim
                                ? `${formatarData(
                                    programa.periodoInicio
                                  )} até ${formatarData(
                                    programa.periodoFim
                                  )}`
                                : "-"}
                          </td>

                          <td className="p-3 text-slate-300">
                            {programa._count?.participantes || 0}
                          </td>

                          <td className="p-3 text-slate-300">
                            {programa.valorFundo
                              ? formatarMoeda(
                                  programa.valorFundo
                                )
                              : programa.percentualFundo
                                ? `${programa.percentualFundo}%`
                                : "-"}
                          </td>

                          <td className="p-3">
  <p className="font-semibold">
  {programa.criadoPor?.nome?.trim() ||
    programa.criadoPor?.email ||
    `Usuário ID ${programa.criadoPorId ?? "-"}`}
</p>

  <p className="mt-1 text-xs text-slate-400">
    ID do usuário:{" "}
    {programa.criadoPor?.id ||
      programa.criadoPorId ||
      "-"}
  </p>

  <p className="mt-1 text-xs text-slate-400">
    Criado em: {formatarDataHora(programa.criadoEm)}
  </p>
</td>

                          <td className="p-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${classeStatus(
                                programa.status
                              )}`}
                            >
                              {programa.status.replaceAll(
                                "_",
                                " "
                              )}
                            </span>
                          </td>

<td className="p-3">
  <Link
    href={`/admin/rh/remuneracao-variavel/${programa.id}`}
    className="phanyx-remuneracao-botao-primario inline-flex whitespace-nowrap rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
  >
    Gerenciar
  </Link>
</td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {aba === "novo-programa" && (
          <form
            onSubmit={salvarPrograma}
            className="space-y-6"
          >
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
              <div>
                <h2 className="text-lg font-black">
                  Identificação do programa
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Defina qual remuneração será distribuída e quem
                  poderá participar.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-bold text-slate-300">
                    Nome do programa
                  </span>

                  <input
                    required
                    value={form.nome}
                    onChange={(event) =>
                      atualizarForm(
                        "nome",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Programa de participação nos resultados 2026"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Tipo de remuneração
                  </span>

                  <select
                    value={form.tipo}
                    onChange={(event) =>
                      atualizarForm(
                        "tipo",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  >
                    {TIPOS.map((tipo) => (
                      <option
                        key={tipo.value}
                        value={tipo.value}
                      >
                        {tipo.label}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-slate-500">
                    {tipoSelecionado.descricao}
                  </p>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Abrangência
                  </span>

                  <select
                    value={form.abrangencia}
                    onChange={(event) => {
                      atualizarForm(
                        "abrangencia",
                        event.target.value
                      );

                      if (
                        event.target.value !== "DEPARTAMENTO"
                      ) {
                        atualizarForm("departamentoId", "");
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  >
                    {ABRANGENCIAS.map((abrangencia) => (
                      <option
                        key={abrangencia.value}
                        value={abrangencia.value}
                      >
                        {abrangencia.label}
                      </option>
                    ))}
                  </select>
                </label>

                {form.abrangencia === "DEPARTAMENTO" && (
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-slate-300">
                      Departamento participante
                    </span>

                    <select
                      required
                      value={form.departamentoId}
                      onChange={(event) =>
                        atualizarForm(
                          "departamentoId",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                    >
                      <option value="">
                        Selecione o departamento
                      </option>

                      {departamentos.map((departamento) => (
                        <option
                          key={departamento.id}
                          value={departamento.id}
                        >
                          {departamento.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Método de distribuição
                  </span>

                  <select
                    value={form.metodoDistribuicao}
                    onChange={(event) =>
                      atualizarForm(
                        "metodoDistribuicao",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  >
                    {METODOS_DISTRIBUICAO.map((metodo) => (
                      <option
                        key={metodo.value}
                        value={metodo.value}
                      >
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-bold text-slate-300">
                    Descrição
                  </span>

                  <textarea
                    value={form.descricao}
                    onChange={(event) =>
                      atualizarForm(
                        "descricao",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Descreva a finalidade, as metas e os critérios gerais do programa."
                    className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
              <h2 className="text-lg font-black">
                Competência e período
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                A competência define em qual folha o pagamento
                deverá ser considerado.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Mês da competência
                  </span>

                  <select
                    value={form.competenciaMes}
                    onChange={(event) =>
                      atualizarForm(
                        "competenciaMes",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  >
                    <option value="">Selecione</option>

                    {MESES.map((mes) => (
                      <option
                        key={mes.value}
                        value={mes.value}
                      >
                        {mes.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Ano da competência
                  </span>

                  <input
                    type="number"
                    min={2000}
                    max={2200}
                    value={form.competenciaAno}
                    onChange={(event) =>
                      atualizarForm(
                        "competenciaAno",
                        event.target.value
                      )
                    }
                    placeholder="2026"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Início da apuração
                  </span>

                  <input
                    type="date"
                    value={form.periodoInicio}
                    onChange={(event) =>
                      atualizarForm(
                        "periodoInicio",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Final da apuração
                  </span>

                  <input
                    type="date"
                    value={form.periodoFim}
                    onChange={(event) =>
                      atualizarForm(
                        "periodoFim",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
              <h2 className="text-lg font-black">
                Valores e limites
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Informe o fundo disponível ou o percentual que será
                distribuído.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Valor total do fundo
                  </span>

                  <input
                    value={form.valorFundo}
                    onChange={(event) =>
                      atualizarForm(
                        "valorFundo",
                        event.target.value
                      )
                    }
                    placeholder="0,00"
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Percentual do fundo
                  </span>

                  <input
                    value={form.percentualFundo}
                    onChange={(event) =>
                      atualizarForm(
                        "percentualFundo",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 5"
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Valor mínimo individual
                  </span>

                  <input
                    value={form.valorMinimoIndividual}
                    onChange={(event) =>
                      atualizarForm(
                        "valorMinimoIndividual",
                        event.target.value
                      )
                    }
                    placeholder="0,00"
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-300">
                    Valor máximo individual
                  </span>

                  <input
                    value={form.valorMaximoIndividual}
                    onChange={(event) =>
                      atualizarForm(
                        "valorMaximoIndividual",
                        event.target.value
                      )
                    }
                    placeholder="0,00"
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
              <h2 className="text-lg font-black">
                Elegibilidade
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Determine quais condições os funcionários devem
                cumprir.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.exigirFuncionarioAtivo}
                    onChange={(event) =>
                      atualizarForm(
                        "exigirFuncionarioAtivo",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">
                      Exigir funcionário ativo
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      Funcionários desligados não serão incluídos.
                    </span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.excluirEmExperiencia}
                    onChange={(event) =>
                      atualizarForm(
                        "excluirEmExperiencia",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">
                      Excluir período de experiência
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      Funcionários em experiência não participarão.
                    </span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.considerarSalarioBase}
                    onChange={(event) =>
                      atualizarForm(
                        "considerarSalarioBase",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">
                      Considerar salário-base
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      O salário poderá influenciar a distribuição.
                    </span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.considerarTempoTrabalhado}
                    onChange={(event) =>
                      atualizarForm(
                        "considerarTempoTrabalhado",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">
                      Considerar tempo trabalhado
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      Funcionários com períodos diferentes poderão
                      receber valores proporcionais.
                    </span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.permitirAjusteManual}
                    onChange={(event) =>
                      atualizarForm(
                        "permitirAjusteManual",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">
                      Permitir ajuste manual
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      O RH poderá corrigir valores antes da
                      aprovação.
                    </span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card space-y-1 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <span className="text-xs font-bold text-slate-300">
                    Dias mínimos desde a admissão
                  </span>

                  <input
                    type="number"
                    min={0}
                    value={form.diasMinimosAdmissao}
                    onChange={(event) =>
                      atualizarForm(
                        "diasMinimosAdmissao",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 90"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-1">
                <span className="text-xs font-bold text-slate-300">
                  Observações internas
                </span>

                <textarea
                  value={form.observacoes}
                  onChange={(event) =>
                    atualizarForm(
                      "observacoes",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Registre orientações internas para o RH e os gestores."
                  className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                />
              </label>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setAba("visao-geral");
                  setErro("");
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:border-slate-500"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : "Criar programa como rascunho"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}