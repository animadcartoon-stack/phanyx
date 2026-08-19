"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type TipoIntegracao =
  | "WEBHOOK_ENTRADA"
  | "WEBHOOK_SAIDA"
  | "META_LEAD_ADS"
  | "GOOGLE_LEAD_FORM"
  | "API"
  | "IMPORTACAO"
  | "OUTRA";

type StatusIntegracao =
  | "INATIVA"
  | "ATIVA"
  | "PAUSADA"
  | "ERRO"
  | "REVOGADA";

type Canal = {
  id: number;
  nome: string;
  tipo: string;
  cor?: string | null;
};

type Campanha = {
  id: number;
  canalId?: number | null;
  nome: string;
  codigo: string;
  status: string;
};

type Formulario = {
  id: number;
  canalId?: number | null;
  campanhaId?: number | null;
  nome: string;
  titulo: string;
  status: string;
};

type Integracao = {
  id: number;

  canalId?: number | null;
  campanhaId?: number | null;
  formularioId?: number | null;

  nome: string;
  tipo: TipoIntegracao;
  status: StatusIntegracao;

  chavePublica: string;

  urlEndpoint?: string | null;

  configuracao?: unknown;
  eventosAssinados?: unknown;

  ativo: boolean;
  possuiSegredo: boolean;

  ultimoSucessoEm?: string | null;
  ultimoErroEm?: string | null;
  ultimoErro?: string | null;

  criadoEm: string;
  atualizadoEm: string;

  canal?: Canal | null;

  campanha?: {
    id: number;
    nome: string;
    codigo: string;
    status: string;
    ativo: boolean;
  } | null;

  formulario?: {
    id: number;
    nome: string;
    titulo: string;
    status: string;
    ativo: boolean;
  } | null;

  _count: {
    submissoes: number;
    eventos: number;
  };
};

type RespostaLista = {
  success: true;

  permissoes: {
    podeVer: boolean;
    podeGerenciar: boolean;
  };

  tiposDisponiveis: TipoIntegracao[];
  statusDisponiveis: StatusIntegracao[];

  resumo: {
    total: number;
    ativas: number;
    pausadas: number;
    comErro: number;
    revogadas: number;
  };

  referencias: {
    canais: Canal[];
    campanhas: Campanha[];
    formularios: Formulario[];
  };

  integracoes: Integracao[];
};

type RespostaErro = {
  success?: false;
  error?: string;
  codigo?: string;
};

type CredenciaisCriadas = {
  chavePublica: string;
  segredo: string | null;
  exibirUmaUnicaVez: boolean;
};

function nomeTipo(
  tipo: TipoIntegracao
) {
  const mapa: Record<
    TipoIntegracao,
    string
  > = {
    WEBHOOK_ENTRADA:
      "Receber dados por webhook",

    WEBHOOK_SAIDA:
      "Enviar dados por webhook",

    META_LEAD_ADS:
      "Meta Lead Ads",

    GOOGLE_LEAD_FORM:
      "Google Lead Forms",

    API:
      "Integração por API",

    IMPORTACAO:
      "Importação de dados",

    OUTRA:
      "Outra integração",
  };

  return mapa[tipo];
}

function descricaoTipo(
  tipo: TipoIntegracao
) {
  const mapa: Record<
    TipoIntegracao,
    string
  > = {
    WEBHOOK_ENTRADA:
      "Receba automaticamente contatos enviados por outro sistema.",

    WEBHOOK_SAIDA:
      "Envie eventos e dados da captação para outro sistema.",

    META_LEAD_ADS:
      "Receba interessados captados em formulários de anúncios da Meta.",

    GOOGLE_LEAD_FORM:
      "Receba interessados captados em formulários de anúncios do Google.",

    API:
      "Permita que outro sistema envie dados diretamente ao PHANYX.",

    IMPORTACAO:
      "Identifique integrações usadas em processos de importação.",

    OUTRA:
      "Use para integrações que não se enquadram nas opções anteriores.",
  };

  return mapa[tipo];
}

function nomeStatus(
  status: StatusIntegracao
) {
  const mapa: Record<
    StatusIntegracao,
    string
  > = {
    INATIVA:
      "Inativa",

    ATIVA:
      "Ativa",

    PAUSADA:
      "Pausada",

    ERRO:
      "Com problema",

    REVOGADA:
      "Revogada",
  };

  return mapa[status];
}

function classeStatus(
  status: StatusIntegracao
) {
  if (status === "ATIVA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "ERRO") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "PAUSADA") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "REVOGADA") {
    return "border-slate-300 bg-slate-100 text-slate-600";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
}

function formatarData(
  valor?: string | null
) {
  if (!valor) {
    return "Nunca";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(data);
}

export default function IntegracoesCaptacaoPage() {
  const [
    dados,
    setDados,
  ] =
    useState<RespostaLista | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    atualizando,
    setAtualizando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    mensagem,
    setMensagem,
  ] =
    useState("");

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    buscaAplicada,
    setBuscaAplicada,
  ] =
    useState("");

  const [
    filtroTipo,
    setFiltroTipo,
  ] =
    useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] =
    useState("");

  const [
    filtroAtivo,
    setFiltroAtivo,
  ] =
    useState("");

  const [
    modalNova,
    setModalNova,
  ] =
    useState(false);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    nome,
    setNome,
  ] =
    useState("");

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoIntegracao>(
      "WEBHOOK_ENTRADA"
    );

  const [
    ativarAgora,
    setAtivarAgora,
  ] =
    useState(false);

  const [
    canalId,
    setCanalId,
  ] =
    useState("");

  const [
    campanhaId,
    setCampanhaId,
  ] =
    useState("");

  const [
    formularioId,
    setFormularioId,
  ] =
    useState("");

  const [
    urlEndpoint,
    setUrlEndpoint,
  ] =
    useState("");

  const [
    credenciais,
    setCredenciais,
  ] =
    useState<CredenciaisCriadas | null>(
      null
    );

  const carregar =
    useCallback(
      async (
        silencioso = false
      ) => {
        try {
          if (silencioso) {
            setAtualizando(
              true
            );
          } else {
            setCarregando(
              true
            );
          }

          setErro("");

          const params =
            new URLSearchParams();

          if (
            buscaAplicada.trim()
          ) {
            params.set(
              "busca",
              buscaAplicada.trim()
            );
          }

          if (filtroTipo) {
            params.set(
              "tipo",
              filtroTipo
            );
          }

          if (filtroStatus) {
            params.set(
              "status",
              filtroStatus
            );
          }

          if (filtroAtivo) {
            params.set(
              "ativo",
              filtroAtivo
            );
          }

          const query =
            params.toString();

          const resposta =
            await fetch(
              `/api/admin/comercial/captacao/integracoes${query
                ? `?${query}`
                : ""
              }`,
              {
                cache:
                  "no-store",
              }
            );

          const json =
            (await resposta
              .json()
              .catch(
                () => null
              )) as
            | RespostaLista
            | RespostaErro
            | null;

          if (
            !resposta.ok ||
            !json ||
            json.success !== true
          ) {
            throw new Error(
              json &&
                "error" in json
                ? json.error ||
                "Não foi possível consultar as integrações."
                : "Não foi possível consultar as integrações."
            );
          }

          setDados(
            json
          );
        } catch (
        error
        ) {
          setErro(
            error instanceof
              Error
              ? error.message
              : "Não foi possível consultar as integrações."
          );
        } finally {
          setCarregando(
            false
          );

          setAtualizando(
            false
          );
        }
      },
      [
        buscaAplicada,
        filtroTipo,
        filtroStatus,
        filtroAtivo,
      ]
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!mensagem) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setMensagem("");
        },
        4000
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [mensagem]);

  const campanhasDisponiveis =
    useMemo(() => {
      if (!dados) {
        return [];
      }

      if (!canalId) {
        return dados.referencias
          .campanhas;
      }

      return dados.referencias
        .campanhas.filter(
          (campanha) =>
            !campanha.canalId ||
            String(
              campanha.canalId
            ) === canalId
        );
    }, [
      dados,
      canalId,
    ]);

  const formulariosDisponiveis =
    useMemo(() => {
      if (!dados) {
        return [];
      }

      return dados.referencias
        .formularios.filter(
          (formulario) => {
            if (
              canalId &&
              formulario.canalId &&
              String(
                formulario.canalId
              ) !== canalId
            ) {
              return false;
            }

            if (
              campanhaId &&
              formulario.campanhaId &&
              String(
                formulario.campanhaId
              ) !== campanhaId
            ) {
              return false;
            }

            return true;
          }
        );
    }, [
      dados,
      canalId,
      campanhaId,
    ]);

  function limparFormulario() {
    setNome("");
    setTipo(
      "WEBHOOK_ENTRADA"
    );
    setAtivarAgora(
      false
    );
    setCanalId("");
    setCampanhaId("");
    setFormularioId("");
    setUrlEndpoint("");
  }

  function abrirNova() {
    limparFormulario();
    setErro("");
    setModalNova(
      true
    );
  }

  async function criarIntegracao(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!nome.trim()) {
      setErro(
        "Informe um nome para a integração."
      );

      return;
    }

    if (
      tipo ===
      "WEBHOOK_SAIDA" &&
      !urlEndpoint.trim()
    ) {
      setErro(
        "Informe para qual endereço o PHANYX deverá enviar os dados."
      );

      return;
    }

    try {
      setSalvando(
        true
      );

      setErro("");
      setMensagem("");

      const resposta =
        await fetch(
          "/api/admin/comercial/captacao/integracoes",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nome:
                  nome.trim(),

                tipo,

                status:
                  ativarAgora
                    ? "ATIVA"
                    : "INATIVA",

                ativo:
                  ativarAgora,

                canalId:
                  canalId
                    ? Number(
                      canalId
                    )
                    : null,

                campanhaId:
                  campanhaId
                    ? Number(
                      campanhaId
                    )
                    : null,

                formularioId:
                  formularioId
                    ? Number(
                      formularioId
                    )
                    : null,

                urlEndpoint:
                  urlEndpoint.trim() ||
                  null,
              }),
          }
        );

      const json =
        (await resposta
          .json()
          .catch(
            () => null
          )) as
        | {
          success?: boolean;
          error?: string;
          message?: string;

          credenciais?: {
            chavePublica: string;
            segredo:
            | string
            | null;
            exibirUmaUnicaVez:
            boolean;
          };
        }
        | null;

      if (
        !resposta.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.error ||
          "Não foi possível criar a integração."
        );
      }

      setModalNova(
        false
      );

      limparFormulario();

      if (
        json.credenciais &&
        json.credenciais
          .exibirUmaUnicaVez
      ) {
        setCredenciais(
          json.credenciais
        );
      }

      setMensagem(
        json.message ||
        "Integração criada com sucesso."
      );

      await carregar(
        true
      );
    } catch (
    error
    ) {
      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível criar a integração."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  function aplicarFiltros(
    event?: FormEvent
  ) {
    event?.preventDefault();

    setBuscaAplicada(
      busca
    );
  }

  function limparFiltros() {
    setBusca("");
    setBuscaAplicada("");
    setFiltroTipo("");
    setFiltroStatus("");
    setFiltroAtivo("");
  }

  if (
    carregando &&
    !dados
  ) {
    return (
      <div className="captacao-integracoes-page min-h-screen p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="phanyx-card rounded-3xl p-8 shadow-sm">
            <p className="font-semibold">
              Carregando integrações...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="captacao-integracoes-page min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="phanyx-admin-hero rounded-3xl border p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/comercial/captacao"
                className="text-sm font-bold text-slate-500"
              >
                ← Central de Captação
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <div className="captacao-integracoes-hero-icon flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white">
                  🔌
                </div>

                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    Integrações da Captação
                  </h1>

                  <p className="mt-1 text-sm text-slate-600">
                    Conecte o PHANYX a anúncios, sites e outros sistemas para receber ou enviar dados automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {dados?.permissoes
                .podeGerenciar && (
                  <button
                    type="button"
                    onClick={
                      abrirNova
                    }
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    + Nova integração
                  </button>
                )}

              <button
                type="button"
                onClick={() =>
                  void carregar(
                    true
                  )
                }
                disabled={
                  atualizando
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm disabled:opacity-60"
              >
                {atualizando
                  ? "Atualizando..."
                  : "↻ Atualizar"}
              </button>
            </div>
          </div>
        </section>

        {mensagem && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            ✓ {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {erro}
          </div>
        )}

        {dados && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Total
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.total}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Integrações cadastradas
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Ativas
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.ativas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Funcionando normalmente
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Pausadas
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.pausadas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Temporariamente interrompidas
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Com problema
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.comErro}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Exigem atenção
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Revogadas
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.revogadas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Credenciais encerradas
                </p>
              </div>
            </section>

            <form
              onSubmit={
                aplicarFiltros
              }
              className="phanyx-card rounded-3xl p-5 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Buscar
                  </label>

                  <input
                    type="text"
                    value={busca}
                    onChange={(e) =>
                      setBusca(
                        e.target.value
                      )
                    }
                    placeholder="Nome ou endereço da integração..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Tipo
                  </label>

                  <select
                    value={
                      filtroTipo
                    }
                    onChange={(e) =>
                      setFiltroTipo(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Todos os tipos
                    </option>

                    {dados.tiposDisponiveis.map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {nomeTipo(
                            item
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Situação
                  </label>

                  <select
                    value={
                      filtroStatus
                    }
                    onChange={(e) =>
                      setFiltroStatus(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Todas
                    </option>

                    {dados.statusDisponiveis.map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {nomeStatus(
                            item
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Disponibilidade
                  </label>

                  <select
                    value={
                      filtroAtivo
                    }
                    onChange={(e) =>
                      setFiltroAtivo(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Todas
                    </option>

                    <option value="true">
                      Habilitadas
                    </option>

                    <option value="false">
                      Desabilitadas
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={
                    limparFiltros
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
                >
                  Limpar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Filtrar
                </button>
              </div>
            </form>

            <section className="phanyx-card overflow-hidden rounded-3xl shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-xl font-black">
                  Integrações configuradas
                </h2>

                <p className="phanyx-muted mt-1 text-sm">
                  {dados.integracoes.length} integração(ões) encontrada(s).
                </p>
              </div>

              {dados.integracoes.length ===
                0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl">
                    🔌
                  </div>

                  <h3 className="mt-3 text-lg font-black">
                    Nenhuma integração encontrada
                  </h3>

                  <p className="phanyx-muted mx-auto mt-2 max-w-lg text-sm leading-6">
                    Crie uma integração para conectar anúncios, sites ou outros sistemas ao PHANYX.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dados.integracoes.map(
                    (integracao) => (
                      <article
                        key={
                          integracao.id
                        }
                        className="p-5"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black">
                                {
                                  integracao.nome
                                }
                              </h3>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatus(
                                  integracao.status
                                )}`}
                              >
                                {nomeStatus(
                                  integracao.status
                                )}
                              </span>
                            </div>

                            <p className="phanyx-muted mt-1 text-sm">
                              {nomeTipo(
                                integracao.tipo
                              )}
                            </p>

                            <p className="phanyx-muted mt-1 text-xs leading-5">
                              {descricaoTipo(
                                integracao.tipo
                              )}
                            </p>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Canal
                                </p>

                                <p className="mt-1 text-sm font-bold">
                                  {integracao.canal?.nome ||
                                    "Não vinculado"}
                                </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Campanha
                                </p>

                                <p className="mt-1 text-sm font-bold">
                                  {integracao.campanha?.nome ||
                                    "Não vinculada"}
                                </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Recebimentos
                                </p>

                                <p className="mt-1 text-sm font-bold">
                                  {
                                    integracao
                                      ._count
                                      .submissoes
                                  }
                                </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Último sucesso
                                </p>

                                <p className="mt-1 text-sm font-bold">
                                  {formatarData(
                                    integracao.ultimoSucessoEm
                                  )}
                                </p>
                              </div>
                            </div>

                            {integracao.status ===
                              "ERRO" &&
                              integracao.ultimoErro && (
                                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                  <p className="font-bold">
                                    O que aconteceu
                                  </p>

                                  <p className="mt-1 leading-6">
                                    {
                                      integracao.ultimoErro
                                    }
                                  </p>
                                </div>
                              )}
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <span className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold">
                              {integracao.possuiSegredo
                                ? "🔐 Credencial configurada"
                                : "Credencial não necessária"}
                            </span>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {modalNova && dados && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/65 p-4">
          <form
            onSubmit={
              criarIntegracao
            }
            className="phanyx-card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-black">
              Nova integração
            </h2>

            <p className="phanyx-muted mt-1 text-sm leading-6">
              Informe apenas o necessário. O PHANYX cuidará automaticamente das credenciais técnicas quando elas forem exigidas.
            </p>

            <div className="mt-6 space-y-5 pb-32">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Nome da integração
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(e) =>
                    setNome(
                      e.target.value
                    )
                  }
                  placeholder="Ex.: Meta - Vestibular 2027"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Como os dados serão integrados?
                </label>

                <select
                  value={tipo}
                  onChange={(e) =>
                    setTipo(
                      e.target
                        .value as TipoIntegracao
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  {dados.tiposDisponiveis.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {nomeTipo(
                          item
                        )}
                      </option>
                    )
                  )}
                </select>

                <p className="phanyx-muted mt-2 text-xs leading-5">
                  {descricaoTipo(
                    tipo
                  )}
                </p>
              </div>

              {tipo ===
                "WEBHOOK_SAIDA" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Para qual endereço o PHANYX deverá enviar?
                    </label>

                    <input
                      type="url"
                      value={
                        urlEndpoint
                      }
                      onChange={(e) =>
                        setUrlEndpoint(
                          e.target.value
                        )
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>
                )}

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-black">
                  Organização da captação
                </h3>

                <p className="phanyx-muted mt-1 text-xs leading-5">
                  Estes vínculos ajudam o PHANYX a saber de onde os interessados chegaram.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Canal
                    </label>

                    <select
                      value={
                        canalId
                      }
                      onChange={(e) => {
                        setCanalId(
                          e.target.value
                        );

                        setCampanhaId(
                          ""
                        );

                        setFormularioId(
                          ""
                        );
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="">
                        Sem vínculo
                      </option>

                      {dados.referencias.canais.map(
                        (item) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {
                              item.nome
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Campanha
                    </label>

                    <select
                      value={
                        campanhaId
                      }
                      onChange={(e) => {
                        setCampanhaId(
                          e.target.value
                        );

                        setFormularioId(
                          ""
                        );
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="">
                        Sem vínculo
                      </option>

                      {campanhasDisponiveis.map(
                        (item) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {
                              item.nome
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold">
                      Formulário
                    </label>

                    <select
                      value={
                        formularioId
                      }
                      onChange={(e) =>
                        setFormularioId(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="">
                        Sem vínculo
                      </option>

                      {formulariosDisponiveis.map(
                        (item) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {item.titulo ||
                              item.nome}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={
                    ativarAgora
                  }
                  onChange={(e) =>
                    setAtivarAgora(
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block font-bold">
                    Ativar integração agora
                  </span>

                  <span className="phanyx-muted mt-1 block text-xs leading-5">
                    Se deixar desmarcado, a integração será salva como inativa para você concluir a configuração depois.
                  </span>
                </span>
              </label>
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 pb-1 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setModalNova(
                    false
                  )
                }
                disabled={
                  salvando
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  salvando
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {salvando
                  ? "Criando..."
                  : "Criar integração"}
              </button>
            </div>
          </form>
        </div>
      )}

      {credenciais && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="phanyx-card w-full max-w-xl rounded-3xl p-6 shadow-2xl">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-black">
                Guarde estas informações agora
              </p>

              <p className="mt-1 text-sm leading-6">
                Por segurança, o segredo desta integração não poderá ser exibido novamente.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Chave pública
                </p>

                <p className="mt-2 break-all font-mono text-sm font-bold">
                  {
                    credenciais.chavePublica
                  }
                </p>
              </div>

              {credenciais.segredo && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Segredo
                  </p>

                  <p className="mt-2 break-all font-mono text-sm font-bold">
                    {
                      credenciais.segredo
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setCredenciais(
                    null
                  )
                }
                className="rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-700"
              >
                Já guardei as informações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}