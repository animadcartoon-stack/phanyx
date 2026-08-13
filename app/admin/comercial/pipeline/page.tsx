"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type Responsavel = {
  id: number;
  nome: string;
  cargo: string | null;
};

type Referencia = {
  id: number;
  nome: string;
};

type ProximaTarefa = {
  id: number;
  tipo: string;
  status: string;
  prioridade: string;
  titulo: string;
  agendadaPara: string;
  prazoEm: string | null;
  lembreteEm: string | null;
  responsavelFuncionarioId:
    | number
    | null;
  responsavelNomeSnapshot:
    | string
    | null;
};

type MatriculaConvertida = {
  id: number;
  leadOrigemId: number | null;
  numeroMatricula: string | null;
  status: string;
};

type LeadKanban = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  origem: string;
  tipo: string;
  interesse: string | null;
  status: string;
  prioridade: string;
  valorEstimado: number | null;
  proximoContatoEm: string | null;
  ultimoContatoEm: string | null;
  responsavelFuncionarioId:
    | number
    | null;
  equipeResponsavelId: number | null;
  funilId: number | null;
  etapaFunilId: number | null;
  cursoInteresseId: number | null;
  poloInteresseId: number | null;
  primeiroContatoEm: string | null;
  qualificadoEm: string | null;
  entrouEtapaEm: string | null;
  perdidoEm: string | null;
  encerradoEm: string | null;
  createdAt: string;
  updatedAt: string;

  responsavel: Responsavel | null;
  equipe: Referencia | null;
  curso: Referencia | null;
  polo: Referencia | null;

  proximaTarefa: ProximaTarefa | null;
  acompanhamentoAtrasado: boolean;
  etapaAtrasada: boolean;
  semProximaAcao: boolean;

  matriculaConvertida:
    | MatriculaConvertida
    | null;
};

type EtapaKanban = {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string;
  resultado: string;
  ordem: number;
  cor: string;
  probabilidadeConversao: number;
  prazoMaximoHoras: number | null;
  exigeProximaAcao: boolean;
  exigeMotivoPerda: boolean;
  permiteMovimentoManual: boolean;
  totalLeads: number;
  valorEstimado: number;
  temMais: boolean;
  leads: LeadKanban[];
};

type RespostaKanban = {
  success: boolean;
  error?: string;
  codigo?: string;

  permissoes: {
    podeVer: boolean;
    podeVerTodos: boolean;
    somenteMeus: boolean;
  };

  funil: {
    id: number;
    nome: string;
    descricao: string | null;
  };

  resumo: {
    totalLeads: number;
    valorEstimado: number;
    limitePorEtapa: number;
  };

  etapas: EtapaKanban[];
};

const CATEGORIAS: Record<
  string,
  string
> = {
  ENTRADA: "Entrada",
  PRIMEIRO_CONTATO:
    "Primeiro contato",
  EM_ATENDIMENTO:
    "Em atendimento",
  QUALIFICACAO: "Qualificação",
  APRESENTACAO: "Apresentação",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  DOCUMENTACAO: "Documentação",
  PAGAMENTO: "Pagamento",
  CONVERSAO: "Conversão",
  PERDA: "Perda",
  PAUSA: "Pausa",
  DESCARTE: "Descarte",
};

function formatarMoeda(
  valor: number | null | undefined
) {
  return Number(
    valor ?? 0
  ).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(
  valor: string | null | undefined
) {
  if (!valor) {
    return "Não definida";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "Data inválida";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

function classePrioridade(
  prioridade: string
) {
  switch (
    String(prioridade).toUpperCase()
  ) {
    case "URGENTE":
      return "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100";

    case "ALTA":
      return "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100";

    case "MEDIA":
      return "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100";

    default:
      return "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";
  }
}

function telefoneSomenteNumeros(
  telefone: string
) {
  return telefone.replace(
    /\D/g,
    ""
  );
}

export default function PipelineComercialPage() {
  const [dados, setDados] =
    useState<RespostaKanban | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  const [
    buscaDigitada,
    setBuscaDigitada,
  ] = useState("");

  const [
    buscaAplicada,
    setBuscaAplicada,
  ] = useState("");

  const [
    prioridade,
    setPrioridade,
  ] = useState("");

  const [
    somenteMeus,
    setSomenteMeus,
  ] = useState(false);

  const [
    atualizacao,
    setAtualizacao,
  ] = useState(0);

  useEffect(() => {
    const temporizador =
      window.setTimeout(() => {
        setBuscaAplicada(
          buscaDigitada.trim()
        );
      }, 350);

    return () => {
      window.clearTimeout(
        temporizador
      );
    };
  }, [buscaDigitada]);

  const carregarKanban =
    useCallback(
      async (
        signal?: AbortSignal
      ) => {
        try {
          setCarregando(true);
          setErro("");

          const params =
            new URLSearchParams();

          if (buscaAplicada) {
            params.set(
              "q",
              buscaAplicada
            );
          }

          if (prioridade) {
            params.set(
              "prioridade",
              prioridade
            );
          }

          if (somenteMeus) {
            params.set(
              "meus",
              "true"
            );
          }

          params.set(
            "limitePorEtapa",
            "25"
          );

          const resposta =
            await fetch(
              `/api/admin/comercial/leads/kanban?${params.toString()}`,
              {
                cache: "no-store",
                credentials:
                  "include",
                signal,
              }
            );

          const payload =
            (await resposta
              .json()
              .catch(() => null)) as
              | RespostaKanban
              | null;

          if (
            !resposta.ok ||
            !payload?.success
          ) {
            throw new Error(
              payload?.error ??
                "Não foi possível carregar o pipeline."
            );
          }

          setDados(payload);
        } catch (error) {
          if (
            error instanceof
              DOMException &&
            error.name ===
              "AbortError"
          ) {
            return;
          }

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o pipeline."
          );
        } finally {
          if (!signal?.aborted) {
            setCarregando(false);
          }
        }
      },
      [
        buscaAplicada,
        prioridade,
        somenteMeus,
        atualizacao,
      ]
    );

  useEffect(() => {
    const controlador =
      new AbortController();

    void carregarKanban(
      controlador.signal
    );

    return () => {
      controlador.abort();
    };
  }, [carregarKanban]);

  function atualizar() {
    setAtualizacao(
      (valor) => valor + 1
    );
  }

  return (
    <div className="phanyx-pipeline-page mx-auto max-w-[1800px] space-y-5 p-4 sm:p-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <Link
                href="/admin/comercial"
                className="transition hover:text-slate-950 dark:hover:text-white"
              >
                Comercial
              </Link>

              <span>/</span>

              <span className="text-slate-950 dark:text-white">
                Pipeline
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
              Pipeline comercial
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Acompanhe cada oportunidade,
              identifique atrasos e organize as
              próximas ações do setor
              comercial.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/leads"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              Ver lista de leads
            </Link>

            <Link
              href="/admin/comercial/funis"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              Configurar funil
            </Link>

            <button
              type="button"
              onClick={atualizar}
              disabled={carregando}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {carregando
                ? "Atualizando..."
                : "Atualizar"}
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_auto]">
          <div>
            <label
              htmlFor="busca-pipeline"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
            >
              Buscar oportunidades
            </label>

            <input
              id="busca-pipeline"
              value={buscaDigitada}
              onChange={(event) =>
                setBuscaDigitada(
                  event.target.value
                )
              }
              placeholder="Nome, e-mail, telefone, interesse..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="prioridade-pipeline"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
            >
              Prioridade
            </label>

            <select
              id="prioridade-pipeline"
              value={prioridade}
              onChange={(event) =>
                setPrioridade(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">
                Todas
              </option>
              <option value="ALTA">
                Alta
              </option>
              <option value="MEDIA">
                Média
              </option>
              <option value="BAIXA">
                Baixa
              </option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <input
                type="checkbox"
                checked={somenteMeus}
                disabled={
                  !dados?.permissoes
                    .podeVerTodos
                }
                onChange={(event) =>
                  setSomenteMeus(
                    event.target.checked
                  )
                }
                className="h-4 w-4 accent-emerald-600"
              />

              Somente meus leads
            </label>
          </div>
        </div>
      </section>

      {erro ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          <h2 className="font-black">
            Não foi possível carregar o
            pipeline
          </h2>

          <p className="mt-1 text-sm">
            {erro}
          </p>

          <button
            type="button"
            onClick={atualizar}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      {dados ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Funil ativo
              </p>

              <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                {dados.funil.nome}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Oportunidades
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {dados.resumo.totalLeads}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Valor estimado
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {formatarMoeda(
                  dados.resumo
                    .valorEstimado
                )}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Visualização
              </p>

              <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                {dados.permissoes
                  .somenteMeus
                  ? "Meus leads"
                  : "Toda a equipe"}
              </p>
            </article>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                  Etapas do funil
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Role horizontalmente para
                  visualizar todas as etapas.
                </p>
              </div>

              {carregando ? (
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Atualizando dados...
                </span>
              ) : null}
            </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5">
              {dados.etapas.map(
                (etapa) => (
                  <article
                    key={etapa.id}
                    className="w-[320px] shrink-0 snap-start overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div
                      className="h-1.5"
                      style={{
                        backgroundColor:
                          etapa.cor,
                      }}
                    />

                    <header className="border-b border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Etapa {etapa.ordem}
                          </p>

                          <h3 className="mt-1 font-black leading-5 text-slate-950 dark:text-white">
                            {etapa.nome}
                          </h3>

                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            {CATEGORIAS[
                              etapa.categoria
                            ] ??
                              etapa.categoria}
                          </p>
                        </div>

                        <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                          {etapa.totalLeads}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                          <p className="text-[9px] font-bold uppercase text-slate-500">
                            Valor
                          </p>

                          <p className="mt-1 text-xs font-black text-slate-950 dark:text-white">
                            {formatarMoeda(
                              etapa.valorEstimado
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                          <p className="text-[9px] font-bold uppercase text-slate-500">
                            Probabilidade
                          </p>

                          <p className="mt-1 text-xs font-black text-slate-950 dark:text-white">
                            {
                              etapa.probabilidadeConversao
                            }
                            %
                          </p>
                        </div>
                      </div>
                    </header>

                    <div className="max-h-[620px] space-y-3 overflow-y-auto bg-slate-50 p-3 dark:bg-slate-900/40">
                      {etapa.leads.map(
                        (lead) => {
                          const telefone =
                            lead.telefone
                              ? telefoneSomenteNumeros(
                                  lead.telefone
                                )
                              : "";

                          return (
                            <div
                              key={lead.id}
                              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="truncate font-black text-slate-950 dark:text-white">
                                    {lead.nome}
                                  </h4>

                                  <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">
                                    {lead.interesse ||
                                      "Interesse não informado"}
                                  </p>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${classePrioridade(
                                    lead.prioridade
                                  )}`}
                                >
                                  {lead.prioridade}
                                </span>
                              </div>

                              <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                <p>
                                  <strong>
                                    Responsável:
                                  </strong>{" "}
                                  {lead
                                    .responsavel
                                    ?.nome ??
                                    "Não definido"}
                                </p>

                                {lead.curso ? (
                                  <p>
                                    <strong>
                                      Curso:
                                    </strong>{" "}
                                    {
                                      lead.curso
                                        .nome
                                    }
                                  </p>
                                ) : null}

                                {lead.polo ? (
                                  <p>
                                    <strong>
                                      Polo:
                                    </strong>{" "}
                                    {
                                      lead.polo
                                        .nome
                                    }
                                  </p>
                                ) : null}

                                <p>
                                  <strong>
                                    Valor:
                                  </strong>{" "}
                                  {formatarMoeda(
                                    lead.valorEstimado
                                  )}
                                </p>
                              </div>

                              {lead.etapaAtrasada ? (
                                <div className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                                  Etapa com prazo
                                  vencido
                                </div>
                              ) : null}

                              {lead
                                .acompanhamentoAtrasado ? (
                                <div className="mt-2 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100">
                                  Acompanhamento
                                  atrasado
                                </div>
                              ) : null}

                              {lead.semProximaAcao ? (
                                <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                                  Próxima ação não
                                  definida
                                </div>
                              ) : null}

                              {lead.proximaTarefa ? (
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                  <p className="text-[9px] font-bold uppercase text-slate-500">
                                    Próxima ação
                                  </p>

                                  <p className="mt-1 text-xs font-black text-slate-950 dark:text-white">
                                    {
                                      lead
                                        .proximaTarefa
                                        .titulo
                                    }
                                  </p>

                                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                                    {formatarDataHora(
                                      lead
                                        .proximaTarefa
                                        .agendadaPara
                                    )}
                                  </p>
                                </div>
                              ) : null}

                              {lead.matriculaConvertida ? (
                                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                                  Matrícula{" "}
                                  {lead
                                    .matriculaConvertida
                                    .numeroMatricula ??
                                    `#${lead.matriculaConvertida.id}`}
                                </div>
                              ) : null}

                              <div className="mt-4 flex flex-wrap gap-2">
                                {telefone ? (
                                  <a
                                    href={`https://wa.me/55${telefone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-[11px] font-bold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                                  >
                                    WhatsApp
                                  </a>
                                ) : null}

                                <a
                                  href={`mailto:${lead.email}`}
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                >
                                  E-mail
                                </a>

                                <span className="ml-auto self-center text-[10px] font-semibold text-slate-500">
                                  #{lead.id}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}

                      {etapa.leads.length ===
                      0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                          Nenhuma oportunidade
                          nesta etapa.
                        </div>
                      ) : null}

                      {etapa.temMais ? (
                        <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                          Existem mais leads
                          nesta etapa
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              )}
            </div>
          </section>
        </>
      ) : null}

      {carregando && !dados ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
          <div className="text-3xl">
            ⏳
          </div>

          <p className="mt-3 font-bold text-slate-900 dark:text-white">
            Carregando pipeline
            comercial...
          </p>
        </section>
      ) : null}
    </div>
  );
}