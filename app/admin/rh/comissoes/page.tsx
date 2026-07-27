"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type StatusComissao =
  | "PENDENTE"
  | "APROVADO"
  | "REPROVADO"
  | "ENVIADO_HOLERITE"
  | "PAGO"
  | "ESTORNADO"
  | "CANCELADO";

type LancamentoComissao = {
  id: number;
  funcionarioId: number;
  matriculaId?: number | null;
  participanteComercialId?: number | null;
  planoId?: number | null;
  regraId?: number | null;
  pagamentoId?: number | null;

  origem: string;
  status: StatusComissao;

  competenciaMes: number;
  competenciaAno: number;

  descricao: string;

  baseCalculo: string;
  percentualAplicado?: string | null;
  valorFixoAplicado?: string | null;
  percentualParticipacao: string;

  valorCalculado: string;
  valorAprovado?: string | null;

  funcionarioNomeSnapshot: string;
  planoNomeSnapshot: string;
  regraNomeSnapshot: string;

  alunoNomeSnapshot?: string | null;
  cursoNomeSnapshot?: string | null;
  matriculaNumeroSnapshot?: string | null;

  calculadoEm: string;
  aprovadoEm?: string | null;
  reprovadoEm?: string | null;
  enviadoHoleriteEm?: string | null;
  pagoEm?: string | null;
  estornadoEm?: string | null;

  motivoReprovacao?: string | null;
  motivoEstorno?: string | null;

  funcionario?: {
    id: number;
    nome: string;
    cargo?: string | null;
    ativo: boolean;

    departamento?: {
      id: number;
      nome: string;
    } | null;
  } | null;

  criadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  aprovadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  enviadoHoleritePor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  reprovadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;
};

type ResumoComissoes = {
  total: number;

  pendentes: number;
  aprovados: number;
  reprovados: number;
  enviadosHolerite: number;
  pagos: number;
  estornados: number;
  cancelados: number;

  valorPendente: number;
  valorAprovado: number;
  valorEnviadoHolerite: number;
};

const resumoInicial: ResumoComissoes = {
  total: 0,
  pendentes: 0,
  aprovados: 0,
  reprovados: 0,
  enviadosHolerite: 0,
  pagos: 0,
  estornados: 0,
  cancelados: 0,
  valorPendente: 0,
  valorAprovado: 0,
  valorEnviadoHolerite: 0,
};

const meses = [
  { valor: "1", nome: "Janeiro" },
  { valor: "2", nome: "Fevereiro" },
  { valor: "3", nome: "Março" },
  { valor: "4", nome: "Abril" },
  { valor: "5", nome: "Maio" },
  { valor: "6", nome: "Junho" },
  { valor: "7", nome: "Julho" },
  { valor: "8", nome: "Agosto" },
  { valor: "9", nome: "Setembro" },
  { valor: "10", nome: "Outubro" },
  { valor: "11", nome: "Novembro" },
  { valor: "12", nome: "Dezembro" },
];

function formatarMoeda(valor: unknown) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "Não informado";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Não informado";
  }

  return data.toLocaleString("pt-BR");
}

function rotuloStatus(status: StatusComissao) {
  const rotulos: Record<StatusComissao, string> = {
    PENDENTE: "Pendente",
    APROVADO: "Aprovada",
    REPROVADO: "Reprovada",
    ENVIADO_HOLERITE: "Enviada ao holerite",
    PAGO: "Paga",
    ESTORNADO: "Estornada",
    CANCELADO: "Cancelada",
  };

  return rotulos[status];
}

function classeStatus(status: StatusComissao) {
  const classes: Record<StatusComissao, string> = {
    PENDENTE:
      "border-amber-400 bg-amber-100 text-amber-900",
    APROVADO:
      "border-emerald-400 bg-emerald-100 text-emerald-900",
    REPROVADO:
      "border-red-400 bg-red-100 text-red-900",
    ENVIADO_HOLERITE:
      "border-violet-400 bg-violet-100 text-violet-900",
    PAGO:
      "border-green-500 bg-green-100 text-green-900",
    ESTORNADO:
      "border-orange-400 bg-orange-100 text-orange-900",
    CANCELADO:
      "border-slate-400 bg-slate-200 text-slate-900",
  };

  return classes[status];
}

export default function AdminRHComissoesPage() {
  const agora = new Date();

  const [lancamentos, setLancamentos] =
    useState<LancamentoComissao[]>([]);

  const [resumo, setResumo] =
    useState<ResumoComissoes>(resumoInicial);

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [mes, setMes] = useState(
    String(agora.getMonth() + 1)
  );
  const [ano, setAno] = useState(
    String(agora.getFullYear())
  );

  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [selecionados, setSelecionados] =
    useState<Set<number>>(new Set());

  const [detalhesAbertos, setDetalhesAbertos] =
    useState<Set<number>>(new Set());

  const [modalReprovacaoAberto, setModalReprovacaoAberto] =
    useState(false);

  const [idsParaReprovar, setIdsParaReprovar] =
    useState<number[]>([]);

  const [motivoReprovacao, setMotivoReprovacao] =
    useState("");

  const anosDisponiveis = useMemo(() => {
    const anoAtual = agora.getFullYear();

    return [
      anoAtual - 2,
      anoAtual - 1,
      anoAtual,
      anoAtual + 1,
      anoAtual + 2,
    ];
  }, []);

  const carregarComissoes = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const parametros =
        new URLSearchParams();

      if (busca.trim()) {
        parametros.set(
          "busca",
          busca.trim()
        );
      }

      if (status) {
        parametros.set("status", status);
      }

      if (mes) {
        parametros.set("mes", mes);
      }

      if (ano) {
        parametros.set("ano", ano);
      }

      const resposta = await fetch(
        `/api/admin/rh/comissoes?${parametros.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          "Não foi possível carregar as comissões."
        );
      }

      setLancamentos(
        Array.isArray(dados?.lancamentos)
          ? dados.lancamentos
          : []
      );

      setResumo(
        dados?.resumo || resumoInicial
      );

      setSelecionados(new Set());
    } catch (error: any) {
      setErro(
        error?.message ||
        "Não foi possível carregar as comissões."
      );

      setLancamentos([]);
      setResumo(resumoInicial);
    } finally {
      setLoading(false);
    }
  }, [ano, busca, mes, status]);

  useEffect(() => {
    const temporizador = window.setTimeout(
      carregarComissoes,
      300
    );

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [carregarComissoes]);

  const pendentes =
    useMemo(
      () =>
        lancamentos.filter(
          (item) =>
            item.status === "PENDENTE"
        ),
      [lancamentos]
    );

  const idsSelecionados =
    useMemo(
      () => Array.from(selecionados),
      [selecionados]
    );

  const todosPendentesSelecionados =
    pendentes.length > 0 &&
    pendentes.every((item) =>
      selecionados.has(item.id)
    );

  function alternarSelecionado(
    lancamentoId: number
  ) {
    setSelecionados((estadoAtual) => {
      const novoEstado =
        new Set(estadoAtual);

      if (
        novoEstado.has(lancamentoId)
      ) {
        novoEstado.delete(
          lancamentoId
        );
      } else {
        novoEstado.add(
          lancamentoId
        );
      }

      return novoEstado;
    });
  }

  function alternarTodosPendentes() {
    setSelecionados((estadoAtual) => {
      const novoEstado =
        new Set(estadoAtual);

      if (
        todosPendentesSelecionados
      ) {
        for (const item of pendentes) {
          novoEstado.delete(item.id);
        }
      } else {
        for (const item of pendentes) {
          novoEstado.add(item.id);
        }
      }

      return novoEstado;
    });
  }

  function alternarDetalhes(
    lancamentoId: number
  ) {
    setDetalhesAbertos(
      (estadoAtual) => {
        const novoEstado =
          new Set(estadoAtual);

        if (
          novoEstado.has(lancamentoId)
        ) {
          novoEstado.delete(
            lancamentoId
          );
        } else {
          novoEstado.add(
            lancamentoId
          );
        }

        return novoEstado;
      }
    );
  }

  async function processarComissoes(
    acao:
      | "APROVAR_LANCAMENTOS"
      | "REPROVAR_LANCAMENTOS",
    lancamentoIds: number[],
    motivo?: string
  ) {
    if (
      lancamentoIds.length === 0
    ) {
      setErro(
        "Selecione pelo menos uma comissão pendente."
      );
      return;
    }

    try {
      setProcessando(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        "/api/admin/rh/comissoes",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            acao,
            lancamentoIds,
            motivoReprovacao:
              motivo || undefined,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          "Não foi possível processar as comissões."
        );
      }

      setSucesso(
        dados?.message ||
        "Comissões processadas com sucesso."
      );

      setSelecionados(new Set());
      setModalReprovacaoAberto(false);
      setIdsParaReprovar([]);
      setMotivoReprovacao("");

      await carregarComissoes();
    } catch (error: any) {
      setErro(
        error?.message ||
        "Não foi possível processar as comissões."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function enviarComissoesAoHolerite(
    lancamentoIds: number[]
  ) {
    if (lancamentoIds.length === 0) {
      setErro(
        "Selecione pelo menos uma comissão aprovada."
      );
      return;
    }

    try {
      setProcessando(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        "/api/admin/rh/holerites",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acao: "ENVIAR_COMISSOES",
            lancamentoIds,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          "Não foi possível enviar a comissão ao holerite."
        );
      }

      setSucesso(
        dados?.message ||
        "Comissão enviada ao holerite com sucesso."
      );

      setSelecionados(new Set());

      await carregarComissoes();
    } catch (error: any) {
      setErro(
        error?.message ||
        "Não foi possível enviar a comissão ao holerite."
      );
    } finally {
      setProcessando(false);
    }
  }

  function abrirReprovacao(
    ids: number[]
  ) {
    if (ids.length === 0) {
      setErro(
        "Selecione pelo menos uma comissão pendente."
      );
      return;
    }

    setErro("");
    setIdsParaReprovar(ids);
    setMotivoReprovacao("");
    setModalReprovacaoAberto(true);
  }

  function fecharReprovacao() {
    if (processando) return;

    setModalReprovacaoAberto(false);
    setIdsParaReprovar([]);
    setMotivoReprovacao("");
  }

  function confirmarReprovacao() {
    if (
      motivoReprovacao.trim().length < 5
    ) {
      setErro(
        "Informe um motivo com pelo menos 5 caracteres."
      );
      return;
    }

    processarComissoes(
      "REPROVAR_LANCAMENTOS",
      idsParaReprovar,
      motivoReprovacao.trim()
    );
  }

  return (
    <div className="phanyx-rh-comissoes-page max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-black">
          💰 Comissões comerciais
        </h1>

        <p className="mt-1 text-sm phanyx-comissoes-texto-secundario">
          Analise as comissões geradas pelas vendas,
          aprove os valores corretos e registre
          reprovações com motivo auditável.
        </p>
      </header>

      {erro && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-black">
            Tudo certo.
          </p>

          <p className="mt-1">
            {sucesso}
          </p>
        </div>
      )}

      <section className="phanyx-comissoes-panel rounded-3xl border p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="phanyx-comissoes-card rounded-2xl border p-4">
            <p className="text-sm phanyx-comissoes-texto-secundario">
              Pendentes
            </p>

            <p className="mt-1 text-2xl font-black">
              {resumo.pendentes}
            </p>

            <p className="mt-2 text-sm font-bold text-amber-700">
              {formatarMoeda(
                resumo.valorPendente
              )}
            </p>
          </div>

          <div className="phanyx-comissoes-card rounded-2xl border p-4">
            <p className="text-sm phanyx-comissoes-texto-secundario">
              Aprovadas
            </p>

            <p className="mt-1 text-2xl font-black">
              {resumo.aprovados}
            </p>

            <p className="mt-2 text-sm font-bold text-emerald-700">
              {formatarMoeda(
                resumo.valorAprovado
              )}
            </p>
          </div>

          <div className="phanyx-comissoes-card rounded-2xl border p-4">
            <p className="text-sm phanyx-comissoes-texto-secundario">
              Enviadas ao holerite
            </p>

            <p className="mt-1 text-2xl font-black">
              {resumo.enviadosHolerite}
            </p>

            <p className="mt-2 text-sm font-bold text-violet-700">
              {formatarMoeda(resumo.valorEnviadoHolerite)}
            </p>
          </div>

          <div className="phanyx-comissoes-card rounded-2xl border p-4">
            <p className="text-sm phanyx-comissoes-texto-secundario">
              Reprovadas
            </p>

            <p className="mt-1 text-2xl font-black">
              {resumo.reprovados}
            </p>

            <p className="mt-2 text-sm phanyx-comissoes-texto-secundario">
              Com justificativa registrada
            </p>
          </div>

          <div className="phanyx-comissoes-card rounded-2xl border p-4">
            <p className="text-sm phanyx-comissoes-texto-secundario">
              Total encontrado
            </p>

            <p className="mt-1 text-2xl font-black">
              {resumo.total}
            </p>

            <p className="mt-2 text-sm phanyx-comissoes-texto-secundario">
              Na competência e filtros atuais
            </p>
          </div>
        </div>
      </section>

      <section className="phanyx-comissoes-panel rounded-3xl border p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-black">
              Buscar
            </label>

            <input
              value={busca}
              onChange={(evento) =>
                setBusca(
                  evento.target.value
                )
              }
              placeholder="Vendedor, aluno, curso, matrícula, plano ou regra..."
              className="phanyx-comissoes-input w-full rounded-xl border px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Status
            </label>

            <select
              value={status}
              onChange={(evento) =>
                setStatus(
                  evento.target.value
                )
              }
              className="phanyx-comissoes-input w-full rounded-xl border px-4 py-3 outline-none"
            >
              <option value="">
                Todos
              </option>

              <option value="PENDENTE">
                Pendentes
              </option>

              <option value="APROVADO">
                Aprovadas
              </option>

              <option value="REPROVADO">
                Reprovadas
              </option>

              <option value="ENVIADO_HOLERITE">
                Enviadas ao holerite
              </option>

              <option value="PAGO">
                Pagas
              </option>

              <option value="ESTORNADO">
                Estornadas
              </option>

              <option value="CANCELADO">
                Canceladas
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Mês
            </label>

            <select
              value={mes}
              onChange={(evento) =>
                setMes(
                  evento.target.value
                )
              }
              className="phanyx-comissoes-input w-full rounded-xl border px-4 py-3 outline-none"
            >
              <option value="">
                Todos
              </option>

              {meses.map((item) => (
                <option
                  key={item.valor}
                  value={item.valor}
                >
                  {item.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Ano
            </label>

            <select
              value={ano}
              onChange={(evento) =>
                setAno(
                  evento.target.value
                )
              }
              className="phanyx-comissoes-input w-full rounded-xl border px-4 py-3 outline-none"
            >
              <option value="">
                Todos
              </option>

              {anosDisponiveis.map(
                (anoItem) => (
                  <option
                    key={anoItem}
                    value={anoItem}
                  >
                    {anoItem}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>

      {idsSelecionados.length > 0 && (
        <section className="phanyx-comissoes-selecao rounded-2xl border p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black">
                {idsSelecionados.length} comissão(ões)
                selecionada(s)
              </p>

              <p className="mt-1 text-sm phanyx-comissoes-texto-secundario">
                Apenas lançamentos pendentes podem ser
                aprovados ou reprovados.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={processando}
                onClick={() =>
                  processarComissoes(
                    "APROVAR_LANCAMENTOS",
                    idsSelecionados
                  )
                }
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aprovar selecionadas
              </button>

              <button
                type="button"
                disabled={processando}
                onClick={() =>
                  abrirReprovacao(
                    idsSelecionados
                  )
                }
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reprovar selecionadas
              </button>

              <button
                type="button"
                disabled={processando}
                onClick={() =>
                  setSelecionados(
                    new Set()
                  )
                }
                className="phanyx-comissoes-botao-neutro rounded-xl border px-4 py-2 text-sm font-black"
              >
                Limpar seleção
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="phanyx-comissoes-panel overflow-hidden rounded-3xl border shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">
              Lançamentos de comissão
            </h2>

            <p className="mt-1 text-sm phanyx-comissoes-texto-secundario">
              Valores gerados automaticamente ou
              inseridos manualmente.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarComissoes}
            disabled={loading}
            className="phanyx-comissoes-botao-neutro rounded-xl border px-4 py-2 text-sm font-black disabled:opacity-60"
          >
            {loading
              ? "Atualizando..."
              : "Recarregar"}
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center phanyx-comissoes-texto-secundario">
            Carregando comissões...
          </div>
        ) : lancamentos.length === 0 ? (
          <div className="p-10 text-center phanyx-comissoes-texto-secundario">
            Nenhuma comissão encontrada para os filtros
            informados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="phanyx-comissoes-table min-w-[1180px] w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        todosPendentesSelecionados
                      }
                      onChange={
                        alternarTodosPendentes
                      }
                      aria-label="Selecionar comissões pendentes"
                      className="h-4 w-4"
                    />
                  </th>

                  <th className="px-4 py-3">
                    Vendedor
                  </th>

                  <th className="px-4 py-3">
                    Venda
                  </th>

                  <th className="px-4 py-3">
                    Regra
                  </th>

                  <th className="px-4 py-3">
                    Cálculo
                  </th>

                  <th className="px-4 py-3">
                    Valor
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {lancamentos.map(
                  (lancamento) => {
                    const pendente =
                      lancamento.status ===
                      "PENDENTE";

                    const detalhesAbertosNeste =
                      detalhesAbertos.has(
                        lancamento.id
                      );

                    return (
                      <>
                        <tr key={lancamento.id}>
                          <td className="px-4 py-4 align-top">
                            <input
                              type="checkbox"
                              disabled={!pendente}
                              checked={selecionados.has(
                                lancamento.id
                              )}
                              onChange={() =>
                                alternarSelecionado(
                                  lancamento.id
                                )
                              }
                              aria-label={`Selecionar comissão de ${lancamento.funcionarioNomeSnapshot}`}
                              className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-40"
                            />
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="font-black">
                              {
                                lancamento.funcionarioNomeSnapshot
                              }
                            </p>

                            <p className="mt-1 text-xs phanyx-comissoes-texto-secundario">
                              {lancamento.funcionario
                                ?.cargo ||
                                "Cargo não informado"}
                            </p>

                            <p className="mt-1 text-xs phanyx-comissoes-texto-secundario">
                              {lancamento.funcionario
                                ?.departamento?.nome ||
                                "Departamento não informado"}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="font-bold">
                              {lancamento.alunoNomeSnapshot ||
                                "Aluno não informado"}
                            </p>

                            <p className="mt-1 text-xs phanyx-comissoes-texto-secundario">
                              Matrícula:{" "}
                              {lancamento.matriculaNumeroSnapshot ||
                                lancamento.matriculaId ||
                                "Não informada"}
                            </p>

                            <p className="mt-1 max-w-[220px] text-xs phanyx-comissoes-texto-secundario">
                              {lancamento.cursoNomeSnapshot ||
                                "Curso não informado"}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="font-bold">
                              {
                                lancamento.regraNomeSnapshot
                              }
                            </p>

                            <p className="mt-1 max-w-[220px] text-xs phanyx-comissoes-texto-secundario">
                              {
                                lancamento.planoNomeSnapshot
                              }
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p>
                              Base:{" "}
                              <strong>
                                {formatarMoeda(
                                  lancamento.baseCalculo
                                )}
                              </strong>
                            </p>

                            {lancamento.percentualAplicado && (
                              <p className="mt-1 text-xs phanyx-comissoes-texto-secundario">
                                Percentual:{" "}
                                {
                                  lancamento.percentualAplicado
                                }
                                %
                              </p>
                            )}

                            <p className="mt-1 text-xs phanyx-comissoes-texto-secundario">
                              Participação:{" "}
                              {
                                lancamento.percentualParticipacao
                              }
                              %
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="text-lg font-black">
                              {formatarMoeda(
                                lancamento.valorCalculado
                              )}
                            </p>

                            {lancamento.valorAprovado && (
                              <p className="mt-1 text-xs font-bold text-emerald-700">
                                Aprovado:{" "}
                                {formatarMoeda(
                                  lancamento.valorAprovado
                                )}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className={[
                                "inline-flex rounded-full border px-3 py-1 text-xs font-black",
                                classeStatus(
                                  lancamento.status
                                ),
                              ].join(" ")}
                            >
                              {rotuloStatus(
                                lancamento.status
                              )}
                            </span>

                            <p className="mt-2 text-xs phanyx-comissoes-texto-secundario">
                              {lancamento.competenciaMes
                                .toString()
                                .padStart(2, "0")}
                              /
                              {
                                lancamento.competenciaAno
                              }
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  alternarDetalhes(
                                    lancamento.id
                                  )
                                }
                                className="phanyx-comissoes-botao-neutro rounded-lg border px-3 py-2 text-xs font-black"
                              >
                                {detalhesAbertosNeste
                                  ? "Ocultar"
                                  : "Detalhes"}
                              </button>

                              {lancamento.status === "APROVADO" && (
                                <button
                                  type="button"
                                  disabled={processando}
                                  onClick={() =>
                                    enviarComissoesAoHolerite([
                                      lancamento.id,
                                    ])
                                  }
                                  className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {processando
                                    ? "Enviando..."
                                    : "Enviar ao holerite"}
                                </button>
                              )}

                              {pendente && (
                                <>
                                  <button
                                    type="button"
                                    disabled={
                                      processando
                                    }
                                    onClick={() =>
                                      processarComissoes(
                                        "APROVAR_LANCAMENTOS",
                                        [
                                          lancamento.id,
                                        ]
                                      )
                                    }
                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    Aprovar
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      processando
                                    }
                                    onClick={() =>
                                      abrirReprovacao([
                                        lancamento.id,
                                      ])
                                    }
                                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-60"
                                  >
                                    Reprovar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {detalhesAbertosNeste && (
                          <tr
                            key={`detalhes-${lancamento.id}`}
                          >
                            <td
                              colSpan={8}
                              className="phanyx-comissoes-detalhes px-5 py-5"
                            >
                              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div>
                                  <p className="text-xs font-black uppercase tracking-wide phanyx-comissoes-texto-secundario">
                                    Descrição
                                  </p>

                                  <p className="mt-1 text-sm">
                                    {
                                      lancamento.descricao
                                    }
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-black uppercase tracking-wide phanyx-comissoes-texto-secundario">
                                    Origem
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {
                                      lancamento.origem
                                    }
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-black uppercase tracking-wide phanyx-comissoes-texto-secundario">
                                    Calculada em
                                  </p>

                                  <p className="mt-1 text-sm">
                                    {formatarDataHora(
                                      lancamento.calculadoEm
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-black uppercase tracking-wide phanyx-comissoes-texto-secundario">
                                    Pagamento
                                  </p>

                                  <p className="mt-1 text-sm">
                                    {lancamento.pagamentoId
                                      ? `#${lancamento.pagamentoId}`
                                      : "Não vinculado"}
                                  </p>
                                </div>

                                {lancamento.aprovadoEm && (
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-wide phanyx-comissoes-texto-secundario">
                                      Aprovação
                                    </p>

                                    <p className="mt-1 text-sm">
                                      {formatarDataHora(
                                        lancamento.aprovadoEm
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs phanyx-comissoes-texto-secundario">
                                      Por:{" "}
                                      {lancamento
                                        .aprovadoPor
                                        ?.nome ||
                                        lancamento
                                          .aprovadoPor
                                          ?.email ||
                                        "Não informado"}
                                    </p>
                                  </div>
                                )}

                                {lancamento.enviadoHoleriteEm && (
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-wide phanyx-comissoes-texto-secundario">
                                      Envio ao holerite
                                    </p>

                                    <p className="mt-1 text-sm">
                                      {formatarDataHora(lancamento.enviadoHoleriteEm)}
                                    </p>

                                    <p className="mt-1 text-xs phanyx-comissoes-texto-secundario">
                                      Por:{" "}
                                      {lancamento.enviadoHoleritePor?.nome ||
                                        lancamento.enviadoHoleritePor?.email ||
                                        "Responsável não registrado"}
                                    </p>
                                  </div>
                                )}

                                {lancamento.reprovadoEm && (
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-wide phanyx-comissoes-texto-secundario">
                                      Reprovação
                                    </p>

                                    <p className="mt-1 text-sm">
                                      {formatarDataHora(
                                        lancamento.reprovadoEm
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs phanyx-comissoes-texto-secundario">
                                      Por:{" "}
                                      {lancamento
                                        .reprovadoPor
                                        ?.nome ||
                                        lancamento
                                          .reprovadoPor
                                          ?.email ||
                                        "Não informado"}
                                    </p>
                                  </div>
                                )}

                                {lancamento.motivoReprovacao && (
                                  <div className="md:col-span-2">
                                    <p className="text-xs font-black uppercase tracking-wide text-red-700">
                                      Motivo da reprovação
                                    </p>

                                    <p className="mt-1 text-sm">
                                      {
                                        lancamento.motivoReprovacao
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalReprovacaoAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-reprovar-comissao"
            className="phanyx-comissoes-modal w-full max-w-lg rounded-3xl border p-6 shadow-2xl"
          >
            <h2
              id="titulo-reprovar-comissao"
              className="text-xl font-black"
            >
              Reprovar comissão
            </h2>

            <p className="mt-2 text-sm phanyx-comissoes-texto-secundario">
              Você está reprovando{" "}
              <strong>
                {idsParaReprovar.length}
              </strong>{" "}
              comissão(ões). O motivo ficará registrado
              para auditoria.
            </p>

            <label className="mt-5 block text-sm font-black">
              Motivo da reprovação
            </label>

            <textarea
              value={motivoReprovacao}
              onChange={(evento) =>
                setMotivoReprovacao(
                  evento.target.value
                )
              }
              rows={5}
              placeholder="Explique por que esta comissão não deve ser aprovada..."
              className="phanyx-comissoes-input mt-2 w-full resize-none rounded-xl border px-4 py-3 outline-none"
            />

            <p className="mt-2 text-xs phanyx-comissoes-texto-secundario">
              Mínimo de 5 caracteres.
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={processando}
                onClick={fecharReprovacao}
                className="phanyx-comissoes-botao-neutro rounded-xl border px-4 py-2 text-sm font-black"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  processando ||
                  motivoReprovacao.trim()
                    .length < 5
                }
                onClick={
                  confirmarReprovacao
                }
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando
                  ? "Reprovando..."
                  : "Confirmar reprovação"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        html[data-theme="light"]
          .phanyx-rh-comissoes-page {
          color: #0f172a;
        }

        html[data-theme="light"]
          .phanyx-comissoes-panel,
        html[data-theme="light"]
          .phanyx-comissoes-modal {
          background: #ffffff;
          border-color: #dbe3ee;
          color: #0f172a;
        }

        html[data-theme="light"]
          .phanyx-comissoes-card,
        html[data-theme="light"]
          .phanyx-comissoes-detalhes,
        html[data-theme="light"]
          .phanyx-comissoes-selecao {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        html[data-theme="light"]
          .phanyx-comissoes-texto-secundario {
          color: #475569;
        }

        html[data-theme="light"]
          .phanyx-comissoes-input,
        html[data-theme="light"]
          .phanyx-comissoes-botao-neutro {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        html[data-theme="light"]
          .phanyx-comissoes-input::placeholder {
          color: #64748b;
          opacity: 1;
        }

        html[data-theme="light"]
          .phanyx-comissoes-table
          thead {
          background: #f1f5f9;
          color: #0f172a;
        }

        html[data-theme="light"]
          .phanyx-comissoes-table
          th,
        html[data-theme="light"]
          .phanyx-comissoes-table
          td {
          border-color: #e2e8f0;
        }

        html[data-theme="light"]
          .phanyx-comissoes-table
          tbody
          tr {
          border-top: 1px solid #e2e8f0;
        }

        html[data-theme="dark"]
          .phanyx-rh-comissoes-page {
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .phanyx-comissoes-panel,
        html[data-theme="dark"]
          .phanyx-comissoes-modal {
          background: #0f172a;
          border-color: #334155;
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .phanyx-comissoes-card,
        html[data-theme="dark"]
          .phanyx-comissoes-detalhes,
        html[data-theme="dark"]
          .phanyx-comissoes-selecao {
          background: #020617;
          border-color: #334155;
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .phanyx-comissoes-texto-secundario {
          color: #cbd5e1;
        }

        html[data-theme="dark"]
          .phanyx-comissoes-input,
        html[data-theme="dark"]
          .phanyx-comissoes-botao-neutro {
          background: #020617;
          border-color: #475569;
          color: #ffffff;
        }

        html[data-theme="dark"]
          .phanyx-comissoes-input::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        html[data-theme="dark"]
          .phanyx-comissoes-table
          thead {
          background: #1e293b;
          color: #ffffff;
        }

        html[data-theme="dark"]
          .phanyx-comissoes-table
          th,
        html[data-theme="dark"]
          .phanyx-comissoes-table
          td {
          border-color: #334155;
        }

        html[data-theme="dark"]
          .phanyx-comissoes-table
          tbody
          tr {
          border-top: 1px solid #334155;
        }

        html[data-theme="system"]
          .phanyx-rh-comissoes-page {
          color: #ffffff;
        }

        html[data-theme="system"]
          .phanyx-comissoes-panel,
        html[data-theme="system"]
          .phanyx-comissoes-modal {
          background: #2f2f2f;
          border-color: #525252;
          color: #ffffff;
        }

        html[data-theme="system"]
          .phanyx-comissoes-card,
        html[data-theme="system"]
          .phanyx-comissoes-detalhes,
        html[data-theme="system"]
          .phanyx-comissoes-selecao {
          background: #262626;
          border-color: #5f5f5f;
          color: #ffffff;
        }

        html[data-theme="system"]
          .phanyx-comissoes-texto-secundario {
          color: #d4d4d4;
        }

        html[data-theme="system"]
          .phanyx-comissoes-input,
        html[data-theme="system"]
          .phanyx-comissoes-botao-neutro {
          background: #1f1f1f;
          border-color: #737373;
          color: #ffffff;
        }

        html[data-theme="system"]
          .phanyx-comissoes-input::placeholder {
          color: #b3b3b3;
          opacity: 1;
        }

        html[data-theme="system"]
          .phanyx-comissoes-table
          thead {
          background: #3a3a3a;
          color: #ffffff;
        }

        html[data-theme="system"]
          .phanyx-comissoes-table
          th,
        html[data-theme="system"]
          .phanyx-comissoes-table
          td {
          border-color: #525252;
        }

        html[data-theme="system"]
          .phanyx-comissoes-table
          tbody
          tr {
          border-top: 1px solid #525252;
        }
      `}</style>
    </div>
  );
}