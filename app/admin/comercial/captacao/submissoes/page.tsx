"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Filtros = {
  busca: string;
  status: string;
  resultado: string;
  canalId: string;
  campanhaId: string;
  formularioId: string;
  integracaoId: string;
};

type ReferenciaCanal = {
  id: number;
  nome: string;
  tipo: string;
  cor?: string | null;
  ativo?: boolean;
};

type ReferenciaCampanha = {
  id: number;
  nome: string;
  codigo?: string;
  status?: string;
  ativo?: boolean;
};

type ReferenciaFormulario = {
  id: number;
  nome: string;
  titulo: string;
  status?: string;
  ativo?: boolean;
};

type ReferenciaIntegracao = {
  id: number;
  nome: string;
  tipo: string;
  status?: string;
  ativo?: boolean;
};

type Submissao = {
  id: number;

  canalId?: number | null;
  campanhaId?: number | null;
  formularioId?: number | null;
  integracaoId?: number | null;
  leadId?: number | null;

  identificadorExterno?: string | null;

  status: string;
  resultadoDeduplicacao?: string | null;

  nomeSnapshot?: string | null;
  emailSnapshot?: string | null;
  telefoneSnapshot?: string | null;

  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;

  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;

  paginaOrigem?: string | null;
  referrer?: string | null;

  consentimentoLgpd: boolean;
  consentimentoEm?: string | null;

  codigoErro?: string | null;
  mensagemErro?: string | null;

  recebidoEm: string;
  processadoEm?: string | null;
  atualizadoEm: string;

  canal?: {
    id: number;
    nome: string;
    tipo: string;
    cor?: string | null;
  } | null;

  campanha?: {
    id: number;
    nome: string;
    codigo: string;
    status: string;
  } | null;

  formulario?: {
    id: number;
    nome: string;
    titulo: string;
    slug: string;
    status: string;
  } | null;

  integracao?: {
    id: number;
    nome: string;
    tipo: string;
    status: string;
  } | null;

  lead?: {
    id: number;
    nome: string;

    cursoInteresse?: {
      id: number;
      nome: string;
    } | null;

    poloInteresse?: {
      id: number;
      nome: string;
    } | null;
  } | null;
};

type RespostaApi = {
  success: true;

  permissoes: {
    podeVer: boolean;
    podeReprocessar: boolean;
  };

  statusDisponiveis: string[];
  resultadosDeduplicacaoDisponiveis: string[];

  resumo: {
    total: number;
    recebidas: number;
    emProcessamento: number;
    processadas: number;
    duplicadas: number;
    rejeitadas: number;
    spam: number;
    comErro: number;
  };

  referencias: {
    canais: ReferenciaCanal[];
    campanhas: ReferenciaCampanha[];
    formularios: ReferenciaFormulario[];
    integracoes: ReferenciaIntegracao[];
  };

  filtros: {
    busca?: string | null;
    status?: string | null;
    resultado?: string | null;
    canalId?: number | null;
    campanhaId?: number | null;
    formularioId?: number | null;
    integracaoId?: number | null;
  };

  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
    temAnterior: boolean;
    temProxima: boolean;
  };

  submissoes: Submissao[];
};

type RespostaErro = {
  success?: false;
  error?: string;
  codigo?: string;
};

const FILTROS_VAZIOS: Filtros = {
  busca: "",
  status: "",
  resultado: "",
  canalId: "",
  campanhaId: "",
  formularioId: "",
  integracaoId: "",
};

function nomeStatus(status: string) {
  const mapa: Record<string, string> = {
    RECEBIDA: "Recebida",
    VALIDANDO: "Validando dados",
    PROCESSANDO: "Em processamento",
    PROCESSADA: "Processada",
    DUPLICADA: "Duplicada",
    REJEITADA: "Não processada",
    SPAM: "Bloqueada como spam",
    ERRO: "Com erro",
  };

  return mapa[status] || status;
}

function descricaoStatus(status: string) {
  const mapa: Record<string, string> = {
    RECEBIDA:
      "Os dados foram recebidos e aguardam processamento.",
    VALIDANDO:
      "O PHANYX está verificando os dados recebidos.",
    PROCESSANDO:
      "O PHANYX está criando ou atualizando o lead.",
    PROCESSADA:
      "Os dados foram processados com sucesso.",
    DUPLICADA:
      "Esta entrada já havia sido recebida anteriormente.",
    REJEITADA:
      "Os dados não puderam ser processados.",
    SPAM:
      "A entrada foi bloqueada pelos mecanismos de proteção.",
    ERRO:
      "Ocorreu um problema durante o processamento.",
  };

  return mapa[status] || "";
}

function classeStatus(status: string) {
  if (status === "PROCESSADA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    status === "VALIDANDO" ||
    status === "PROCESSANDO"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (status === "RECEBIDA") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    status === "ERRO" ||
    status === "REJEITADA"
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "SPAM") {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function nomeResultado(resultado?: string | null) {
  if (!resultado) {
    return "Aguardando resultado";
  }

  const mapa: Record<string, string> = {
    NAO_VERIFICADA: "Ainda não verificado",
    NOVO_LEAD: "Novo lead criado",
    LEAD_EXISTENTE_ATUALIZADO:
      "Lead existente atualizado",
    DUPLICADA_IGNORADA:
      "Entrada duplicada ignorada",
    REVISAO_MANUAL:
      "Necessita revisão",
  };

  return mapa[resultado] || resultado;
}

function formatarData(valor?: string | null) {
  if (!valor) {
    return "—";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(data);
}

function origemSubmissao(
  submissao: Submissao
) {
  if (submissao.canal?.nome) {
    return submissao.canal.nome;
  }

  if (submissao.integracao?.nome) {
    return submissao.integracao.nome;
  }

  return "Origem não identificada";
}

export default function SubmissoesCaptacaoPage() {
  const [
    dados,
    setDados,
  ] = useState<RespostaApi | null>(
    null
  );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    pagina,
    setPagina,
  ] = useState(1);

  const [
    filtros,
    setFiltros,
  ] = useState<Filtros>(
    FILTROS_VAZIOS
  );

  const [
    filtrosEdicao,
    setFiltrosEdicao,
  ] = useState<Filtros>(
    FILTROS_VAZIOS
  );

  const [
    submissaoReprocessar,
    setSubmissaoReprocessar,
  ] = useState<Submissao | null>(
    null
  );

  const [
    reprocessandoId,
    setReprocessandoId,
  ] = useState<number | null>(
    null
  );

  const carregar =
    useCallback(
      async (
        silencioso = false
      ) => {
        try {
          if (silencioso) {
            setAtualizando(true);
          } else {
            setCarregando(true);
          }

          setErro("");

          const params =
            new URLSearchParams();

          params.set(
            "pagina",
            String(pagina)
          );

          params.set(
            "limite",
            "20"
          );

          if (filtros.busca.trim()) {
            params.set(
              "busca",
              filtros.busca.trim()
            );
          }

          if (filtros.status) {
            params.set(
              "status",
              filtros.status
            );
          }

          if (filtros.resultado) {
            params.set(
              "resultado",
              filtros.resultado
            );
          }

          if (filtros.canalId) {
            params.set(
              "canalId",
              filtros.canalId
            );
          }

          if (filtros.campanhaId) {
            params.set(
              "campanhaId",
              filtros.campanhaId
            );
          }

          if (filtros.formularioId) {
            params.set(
              "formularioId",
              filtros.formularioId
            );
          }

          if (filtros.integracaoId) {
            params.set(
              "integracaoId",
              filtros.integracaoId
            );
          }

          const resposta =
            await fetch(
              `/api/admin/comercial/captacao/submissoes?${params.toString()}`,
              {
                cache: "no-store",
              }
            );

          const json =
            (await resposta
              .json()
              .catch(
                () => null
              )) as
            | RespostaApi
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
                "Não foi possível carregar as submissões."
                : "Não foi possível carregar as submissões."
            );
          }

          setDados(json);
        } catch (error) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as submissões."
          );
        } finally {
          setCarregando(false);
          setAtualizando(false);
        }
      },
      [
        filtros,
        pagina,
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
      window.setTimeout(() => {
        setMensagem("");
      }, 4000);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [mensagem]);

  const exigeAtencao =
    useMemo(() => {
      if (!dados) {
        return 0;
      }

      return (
        dados.resumo.comErro +
        dados.resumo.rejeitadas
      );
    }, [dados]);

  function aplicarFiltros(
    event: FormEvent
  ) {
    event.preventDefault();

    setPagina(1);

    setFiltros({
      ...filtrosEdicao,
    });
  }

  function limparFiltros() {
    setPagina(1);

    setFiltrosEdicao({
      ...FILTROS_VAZIOS,
    });

    setFiltros({
      ...FILTROS_VAZIOS,
    });
  }

  async function reprocessarSubmissao() {
    if (
      !submissaoReprocessar
    ) {
      return;
    }

    const submissao =
      submissaoReprocessar;

    try {
      setReprocessandoId(
        submissao.id
      );

      setErro("");
      setMensagem("");

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/submissoes/${submissao.id}/reprocessar`,
          {
            method: "POST",
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
        }
        | null;

      if (!resposta.ok) {
        throw new Error(
          json?.error ||
          "Não foi possível tentar novamente."
        );
      }

      setSubmissaoReprocessar(
        null
      );

      setMensagem(
        "Submissão enviada novamente para processamento."
      );

      await carregar(true);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível tentar novamente."
      );
    } finally {
      setReprocessandoId(
        null
      );
    }
  }

  if (
    carregando &&
    !dados
  ) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="phanyx-card rounded-3xl p-8 shadow-sm">
            <p className="font-semibold">
              Carregando submissões...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="captacao-submissoes-page min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="phanyx-admin-hero rounded-3xl border p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/comercial/captacao"
                className="text-sm font-semibold text-slate-500"
              >
                ← Central de Captação
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">
                  📥
                </div>

                <div>
                  <h1 className="text-3xl font-black text-slate-900">
                    Submissões recebidas
                  </h1>

                  <p className="mt-1 text-sm text-slate-600">
                    Acompanhe os dados enviados pelos interessados e o resultado de cada processamento.
                  </p>
                </div>
              </div>
            </div>

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
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Total recebido
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.total}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Todas as submissões
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Processadas
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.processadas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Concluídas com sucesso
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Em andamento
                </p>

                <strong className="mt-2 block text-3xl">
                  {dados.resumo.emProcessamento +
                    dados.resumo.recebidas}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Aguardando ou processando
                </p>
              </div>

              <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                <p className="phanyx-muted text-sm">
                  Exigem atenção
                </p>

                <strong className="mt-2 block text-3xl">
                  {exigeAtencao}
                </strong>

                <p className="phanyx-muted mt-2 text-xs">
                  Rejeitadas ou com erro
                </p>
              </div>
            </section>

            <form
              onSubmit={
                aplicarFiltros
              }
              className="phanyx-card rounded-3xl p-5 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-bold">
                    Buscar
                  </label>

                  <input
                    type="text"
                    value={
                      filtrosEdicao.busca
                    }
                    onChange={(
                      event
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          busca:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="phanyx-input w-full rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="Nome, e-mail ou telefone..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Situação
                  </label>

                  <select
                    value={
                      filtrosEdicao.status
                    }
                    onChange={(
                      event
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          status:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="phanyx-select w-full rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Todas
                    </option>

                    {dados.statusDisponiveis.map(
                      (
                        item
                      ) => (
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
                    Resultado do lead
                  </label>

                  <select
                    value={
                      filtrosEdicao.resultado
                    }
                    onChange={(
                      event
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          resultado:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="phanyx-select w-full rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Todos
                    </option>

                    {dados.resultadosDeduplicacaoDisponiveis.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {nomeResultado(
                            item
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Canal
                  </label>

                  <select
                    value={
                      filtrosEdicao.canalId
                    }
                    onChange={(
                      event
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          canalId:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="phanyx-select w-full rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Todos os canais
                    </option>

                    {dados.referencias.canais.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.nome}
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
                      filtrosEdicao.campanhaId
                    }
                    onChange={(
                      event
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          campanhaId:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="phanyx-select w-full rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Todas as campanhas
                    </option>

                    {dados.referencias.campanhas.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.nome}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Formulário
                  </label>

                  <select
                    value={
                      filtrosEdicao.formularioId
                    }
                    onChange={(
                      event
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          formularioId:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="phanyx-select w-full rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Todos os formulários
                    </option>

                    {dados.referencias.formularios.map(
                      (
                        item
                      ) => (
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

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Integração
                  </label>

                  <select
                    value={
                      filtrosEdicao.integracaoId
                    }
                    onChange={(
                      event
                    ) =>
                      setFiltrosEdicao(
                        (
                          atual
                        ) => ({
                          ...atual,
                          integracaoId:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="phanyx-select w-full rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Todas as integrações
                    </option>

                    {dados.referencias.integracoes.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.nome}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
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
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  Filtrar
                </button>
              </div>
            </form>

            <section className="phanyx-card overflow-hidden rounded-3xl shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5">
                <h2 className="text-xl font-black">
                  Envios recebidos
                </h2>

                <p className="phanyx-muted mt-1 text-sm">
                  {dados.paginacao.total}{" "}
                  {dados.paginacao.total ===
                    1
                    ? "submissão encontrada."
                    : "submissões encontradas."}
                </p>
              </div>

              {dados.submissoes.length ===
                0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="text-4xl">
                    📥
                  </div>

                  <h3 className="mt-4 text-lg font-black">
                    Nenhuma submissão encontrada
                  </h3>

                  <p className="phanyx-muted mt-2 text-sm">
                    Ajuste os filtros ou aguarde novos interessados enviarem seus dados.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dados.submissoes.map(
                    (
                      submissao
                    ) => {
                      const podeTentarNovamente =
                        dados
                          .permissoes
                          .podeReprocessar &&
                        [
                          "ERRO",
                          "REJEITADA",
                        ].includes(
                          submissao.status
                        );

                      return (
                        <article
                          key={
                            submissao.id
                          }
                          className="p-5"
                        >
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-black">
                                  {submissao.nomeSnapshot ||
                                    "Interessado sem nome"}
                                </h3>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${classeStatus(
                                    submissao.status
                                  )}`}
                                  title={descricaoStatus(
                                    submissao.status
                                  )}
                                >
                                  {nomeStatus(
                                    submissao.status
                                  )}
                                </span>
                              </div>

                              <div className="phanyx-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                {submissao.emailSnapshot && (
                                  <span>
                                    {
                                      submissao.emailSnapshot
                                    }
                                  </span>
                                )}

                                {submissao.telefoneSnapshot && (
                                  <span>
                                    {
                                      submissao.telefoneSnapshot
                                    }
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Origem
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {origemSubmissao(
                                      submissao
                                    )}
                                  </p>

                                  {submissao.campanha?.nome && (
                                    <p className="phanyx-muted mt-1 text-xs">
                                      Campanha:{" "}
                                      {
                                        submissao
                                          .campanha
                                          .nome
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Formulário
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {submissao.formulario?.titulo ||
                                      submissao.formulario?.nome ||
                                      "Não informado"}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Interesse
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {submissao.lead?.cursoInteresse?.nome ||
                                      "Não informado"}
                                  </p>

                                  {submissao.lead?.poloInteresse?.nome && (
                                    <p className="phanyx-muted mt-1 text-xs">
                                      Unidade:{" "}
                                      {
                                        submissao
                                          .lead
                                          .poloInteresse
                                          .nome
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Recebido em
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {formatarData(
                                      submissao.recebidoEm
                                    )}
                                  </p>

                                  {submissao.processadoEm && (
                                    <p className="phanyx-muted mt-1 text-xs">
                                      Processado:{" "}
                                      {formatarData(
                                        submissao.processadoEm
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">
                                  {nomeResultado(
                                    submissao.resultadoDeduplicacao
                                  )}
                                </span>

                                {submissao.consentimentoLgpd ? (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                    ✓ Consentimento registrado
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">
                                    Consentimento não registrado
                                  </span>
                                )}
                              </div>

                              {(submissao.status ===
                                "ERRO" ||
                                submissao.status ===
                                "REJEITADA") &&
                                submissao.mensagemErro && (
                                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                      O que aconteceu
                                    </p>

                                    <p className="mt-1 text-sm text-red-800">
                                      {
                                        submissao.mensagemErro
                                      }
                                    </p>
                                  </div>
                                )}
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2 xl:flex-col">

                              <Link
                                href={`/admin/comercial/captacao/submissoes/${submissao.id}`}
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-bold"
                              >
                                Ver detalhes
                              </Link>

                              {submissao.leadId && (
                                <Link
                                  href={`/admin/comercial/leads/${submissao.leadId}`}
                                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-bold"
                                >
                                  Abrir lead
                                </Link>
                              )}

                              {podeTentarNovamente && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSubmissaoReprocessar(
                                      submissao
                                    )
                                  }
                                  disabled={
                                    reprocessandoId ===
                                    submissao.id
                                  }
                                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                  Tentar novamente
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}

              {dados.paginacao.totalPaginas >
                1 && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="phanyx-muted text-sm">
                      Página{" "}
                      {
                        dados
                          .paginacao
                          .pagina
                      }{" "}
                      de{" "}
                      {
                        dados
                          .paginacao
                          .totalPaginas
                      }
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          !dados
                            .paginacao
                            .temAnterior
                        }
                        onClick={() =>
                          setPagina(
                            (
                              atual
                            ) =>
                              Math.max(
                                1,
                                atual -
                                1
                              )
                          )
                        }
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
                      >
                        Anterior
                      </button>

                      <button
                        type="button"
                        disabled={
                          !dados
                            .paginacao
                            .temProxima
                        }
                        onClick={() =>
                          setPagina(
                            (
                              atual
                            ) =>
                              atual +
                              1
                          )
                        }
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
            </section>
          </>
        )}
      </div>

      {submissaoReprocessar && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="phanyx-card w-full max-w-lg rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black">
              Tentar processar novamente?
            </h2>

            <p className="phanyx-muted mt-2 text-sm leading-6">
              O PHANYX verificará novamente os dados enviados por{" "}
              <strong>
                {submissaoReprocessar.nomeSnapshot ||
                  "este interessado"}
              </strong>
              .
            </p>

            <p className="phanyx-muted mt-2 text-sm leading-6">
              Caso já exista um lead correspondente, as regras de deduplicação serão respeitadas.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setSubmissaoReprocessar(
                    null
                  )
                }
                disabled={
                  reprocessandoId !==
                  null
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  void reprocessarSubmissao()
                }
                disabled={
                  reprocessandoId !==
                  null
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {reprocessandoId !==
                  null
                  ? "Processando..."
                  : "Tentar novamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}