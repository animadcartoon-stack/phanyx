"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

type CanalReferencia = {
  id: number;
  nome: string;
  tipo: string;
  cor?: string | null;
};

type CampanhaReferencia = {
  id: number;
  canalId: number | null;
  nome: string;
  codigo: string | null;
  status: string;
};

type FormularioReferencia = {
  id: number;
  canalId: number | null;
  campanhaId: number | null;
  nome: string;
  titulo: string | null;
  status: string;
};

type Integracao = {
  id: number;
  instituicaoId: number;

  canalId: number | null;
  campanhaId: number | null;
  formularioId: number | null;

  nome: string;
  tipo: string;
  status: string;

  chavePublica: string;

  urlEndpoint: string | null;
  configuracao: unknown;
  eventosAssinados: unknown;

  ativo: boolean;
  possuiSegredo: boolean;

  ultimoSucessoEm: string | null;
  ultimoErroEm: string | null;
  ultimoErro: string | null;

  criadoPorId: number | null;
  atualizadoPorId: number | null;

  criadoEm: string;
  atualizadoEm: string;

  canal: {
    id: number;
    nome: string;
    tipo: string;
    cor?: string | null;
    ativo: boolean;
  } | null;

  campanha: {
    id: number;
    nome: string;
    codigo: string | null;
    status: string;
    ativo: boolean;
  } | null;

  formulario: {
    id: number;
    nome: string;
    titulo: string | null;
    status: string;
    ativo: boolean;
  } | null;

  _count: {
    submissoes: number;
    eventos: number;
  };
};

type Permissoes = {
  podeVer?: boolean;
  podeGerenciar?: boolean;
  podeAuditar?: boolean;
};

type RespostaIntegracao = {
  success: boolean;

  permissoes: Permissoes;

  tiposDisponiveis: string[];
  statusDisponiveis: string[];

  referencias: {
    canais: CanalReferencia[];
    campanhas: CampanhaReferencia[];
    formularios: FormularioReferencia[];
  };

  integracao: Integracao;

  error?: string;
  message?: string;
};

type Evento = {
  id: number;

  integracaoId: number;
  submissaoId: number | null;

  identificadorEvento: string | null;
  tipoEvento: string | null;

  direcao: string;
  status: string;

  codigoHttp: number | null;
  numeroTentativas: number;

  proximaTentativaEm: string | null;
  mensagemErro: string | null;

  recebidoEm: string | null;
  processadoEm: string | null;

  criadoEm: string;
  atualizadoEm: string;

  submissao: {
    id: number;
    status: string;
    leadId: number | null;

    nomeSnapshot: string | null;
    emailSnapshot: string | null;
    telefoneSnapshot: string | null;

    resultadoDeduplicacao: string | null;

    recebidoEm: string | null;
    processadoEm: string | null;
  } | null;
};

type RespostaEventos = {
  success: boolean;

  statusDisponiveis: string[];
  direcoesDisponiveis: string[];

  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
    possuiAnterior: boolean;
    possuiProxima: boolean;
  };

  eventos: Evento[];

  error?: string;
  message?: string;
};

type CredenciaisGeradas = {
  chavePublica: string;
  segredo: string;
};

type RespostaPatch = {
  success: boolean;
  message?: string;
  error?: string;

  integracao?: Integracao;

  credenciais?: {
    chavePublica?: string;
    segredo?: string;
  };
};

type FormularioEdicao = {
  nome: string;
  tipo: string;

  canalId: string;
  campanhaId: string;
  formularioId: string;

  urlEndpoint: string;
};

type Toast = {
  tipo: "sucesso" | "erro";
  mensagem: string;
} | null;

function formatarRotulo(valor?: string | null) {
  if (!valor) {
    return "Não informado";
  }

  const especiais: Record<string, string> = {
    WEBHOOK_ENTRADA: "Receber dados por webhook",
    WEBHOOK_SAIDA: "Enviar dados por webhook",

    ATIVA: "Ativa",
    INATIVA: "Inativa",
    PAUSADA: "Pausada",
    ERRO: "Com problema",
    REVOGADA: "Revogada",

    RECEBIDO: "Recebido",
    PENDENTE: "Pendente",
    PROCESSANDO: "Processando",
    PROCESSADO: "Processado",
    ENTREGUE: "Entregue",
    DESCARTADO: "Descartado",

    ENTRADA: "Entrada",
    SAIDA: "Saída",
  };

  if (especiais[valor]) {
    return especiais[valor];
  }

  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
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
    return "Não informado";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

function classeStatus(
  status?: string | null
) {
  if (
    [
      "ATIVA",
      "PROCESSADO",
      "ENTREGUE",
    ].includes(
      String(status)
    )
  ) {
    return "ci-badge ci-badge-success";
  }

  if (
    [
      "PAUSADA",
      "PENDENTE",
      "PROCESSANDO",
      "RECEBIDO",
    ].includes(
      String(status)
    )
  ) {
    return "ci-badge ci-badge-warning";
  }

  if (
    [
      "ERRO",
      "REVOGADA",
      "DESCARTADO",
    ].includes(
      String(status)
    )
  ) {
    return "ci-badge ci-badge-danger";
  }

  return "ci-badge";
}

async function lerJson(
  resposta: Response
) {
  return resposta
    .json()
    .catch(
      () => ({
        success: false,
        error:
          "O servidor retornou uma resposta inválida.",
      })
    );
}

export default function IntegracaoDetalhePage() {
  const params =
    useParams<{
      id: string;
    }>();

  const id =
    Number(
      params.id
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    processandoStatus,
    setProcessandoStatus,
  ] =
    useState(false);

  const [
    integracao,
    setIntegracao,
  ] =
    useState<Integracao | null>(
      null
    );

  const [
    permissoes,
    setPermissoes,
  ] =
    useState<Permissoes>(
      {}
    );

  const [
    tiposDisponiveis,
    setTiposDisponiveis,
  ] =
    useState<string[]>(
      []
    );

  const [
    referencias,
    setReferencias,
  ] =
    useState<{
      canais: CanalReferencia[];
      campanhas: CampanhaReferencia[];
      formularios: FormularioReferencia[];
    }>({
      canais: [],
      campanhas: [],
      formularios: [],
    });

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioEdicao>({
      nome: "",
      tipo: "",
      canalId: "",
      campanhaId: "",
      formularioId: "",
      urlEndpoint: "",
    });

  const [
    eventos,
    setEventos,
  ] =
    useState<Evento[]>(
      []
    );

  const [
    carregandoEventos,
    setCarregandoEventos,
  ] =
    useState(false);

  const [
    paginaEventos,
    setPaginaEventos,
  ] =
    useState(1);

  const [
    paginacao,
    setPaginacao,
  ] =
    useState<RespostaEventos["paginacao"] | null>(
      null
    );

  const [
    statusDisponiveisEventos,
    setStatusDisponiveisEventos,
  ] =
    useState<string[]>(
      []
    );

  const [
    direcoesDisponiveis,
    setDirecoesDisponiveis,
  ] =
    useState<string[]>(
      []
    );

  const [
    buscaEvento,
    setBuscaEvento,
  ] =
    useState("");

  const [
    statusEvento,
    setStatusEvento,
  ] =
    useState("");

  const [
    direcaoEvento,
    setDirecaoEvento,
  ] =
    useState("");

  const [
    toast,
    setToast,
  ] =
    useState<Toast>(
      null
    );

  const [
    modalNovoSegredo,
    setModalNovoSegredo,
  ] =
    useState(false);

  const [
    modalRevogar,
    setModalRevogar,
  ] =
    useState(false);

  const [
    credenciaisGeradas,
    setCredenciaisGeradas,
  ] =
    useState<CredenciaisGeradas | null>(
      null
    );

  const [
    gerandoSegredo,
    setGerandoSegredo,
  ] =
    useState(false);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setToast(
            null
          );
        },
        3500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [toast]);

  const campanhasFiltradas =
    useMemo(
      () => {
        if (
          !formulario.canalId
        ) {
          return referencias.campanhas;
        }

        const canalId =
          Number(
            formulario.canalId
          );

        return referencias.campanhas.filter(
          (campanha) =>
            !campanha.canalId ||
            campanha.canalId ===
              canalId
        );
      },
      [
        referencias.campanhas,
        formulario.canalId,
      ]
    );

  const formulariosFiltrados =
    useMemo(
      () => {
        const canalId =
          formulario.canalId
            ? Number(
                formulario.canalId
              )
            : null;

        const campanhaId =
          formulario.campanhaId
            ? Number(
                formulario.campanhaId
              )
            : null;

        return referencias.formularios.filter(
          (item) => {
            if (
              canalId &&
              item.canalId &&
              item.canalId !==
                canalId
            ) {
              return false;
            }

            if (
              campanhaId &&
              item.campanhaId &&
              item.campanhaId !==
                campanhaId
            ) {
              return false;
            }

            return true;
          }
        );
      },
      [
        referencias.formularios,
        formulario.canalId,
        formulario.campanhaId,
      ]
    );

  const endpointRecebimento =
    useMemo(
      () => {
        if (
          !integracao?.chavePublica
        ) {
          return "";
        }

        if (
          typeof window ===
          "undefined"
        ) {
          return "";
        }

        return `${window.location.origin}/api/public/captacao/integracoes/${integracao.chavePublica}`;
      },
      [
        integracao?.chavePublica,
      ]
    );

  function mostrarSucesso(
    mensagem: string
  ) {
    setToast({
      tipo: "sucesso",
      mensagem,
    });
  }

  function mostrarErro(
    mensagem: string
  ) {
    setToast({
      tipo: "erro",
      mensagem,
    });
  }

  async function carregarIntegracao() {
    if (
      !Number.isFinite(id) ||
      id <= 0
    ) {
      mostrarErro(
        "Integração inválida."
      );

      setCarregando(
        false
      );

      return;
    }

    try {
      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/integracoes/${id}`,
          {
            cache:
              "no-store",
          }
        );

      const dados =
        (await lerJson(
          resposta
        )) as RespostaIntegracao;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
            dados.message ||
            "Não foi possível carregar a integração."
        );
      }

      setIntegracao(
        dados.integracao
      );

      setPermissoes(
        dados.permissoes ||
          {}
      );

      setTiposDisponiveis(
        dados.tiposDisponiveis ||
          []
      );

      setReferencias(
        dados.referencias || {
          canais: [],
          campanhas: [],
          formularios: [],
        }
      );

      setFormulario({
        nome:
          dados.integracao
            .nome || "",

        tipo:
          dados.integracao
            .tipo || "",

        canalId:
          dados.integracao
            .canalId
            ? String(
                dados.integracao
                  .canalId
              )
            : "",

        campanhaId:
          dados.integracao
            .campanhaId
            ? String(
                dados.integracao
                  .campanhaId
              )
            : "",

        formularioId:
          dados.integracao
            .formularioId
            ? String(
                dados.integracao
                  .formularioId
              )
            : "",

        urlEndpoint:
          dados.integracao
            .urlEndpoint ||
          "",
      });
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : "Erro ao carregar integração."
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  async function carregarEventos(
    pagina = 1
  ) {
    if (
      !Number.isFinite(id) ||
      id <= 0
    ) {
      return;
    }

    try {
      setCarregandoEventos(
        true
      );

      const query =
        new URLSearchParams();

      query.set(
        "integracaoId",
        String(id)
      );

      query.set(
        "pagina",
        String(pagina)
      );

      query.set(
        "limite",
        "10"
      );

      if (
        buscaEvento.trim()
      ) {
        query.set(
          "busca",
          buscaEvento.trim()
        );
      }

      if (
        statusEvento
      ) {
        query.set(
          "status",
          statusEvento
        );
      }

      if (
        direcaoEvento
      ) {
        query.set(
          "direcao",
          direcaoEvento
        );
      }

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/integracoes/eventos?${query.toString()}`,
          {
            cache:
              "no-store",
          }
        );

      const dados =
        (await lerJson(
          resposta
        )) as RespostaEventos;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
            dados.message ||
            "Não foi possível carregar os eventos."
        );
      }

      setEventos(
        dados.eventos ||
          []
      );

      setPaginacao(
        dados.paginacao ||
          null
      );

      setPaginaEventos(
        dados.paginacao
          ?.pagina ||
          pagina
      );

      setStatusDisponiveisEventos(
        dados.statusDisponiveis ||
          []
      );

      setDirecoesDisponiveis(
        dados.direcoesDisponiveis ||
          []
      );
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : "Erro ao carregar eventos."
      );
    } finally {
      setCarregandoEventos(
        false
      );
    }
  }

  useEffect(() => {
    void Promise.all([
      carregarIntegracao(),
      carregarEventos(1),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function salvarConfiguracao(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !permissoes.podeGerenciar
    ) {
      mostrarErro(
        "Você não possui permissão para editar esta integração."
      );

      return;
    }

    if (
      !formulario.nome.trim()
    ) {
      mostrarErro(
        "Informe o nome da integração."
      );

      return;
    }

    try {
      setSalvando(
        true
      );

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/integracoes/${id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nome:
                formulario.nome.trim(),

              tipo:
                formulario.tipo,

              canalId:
                formulario.canalId
                  ? Number(
                      formulario.canalId
                    )
                  : null,

              campanhaId:
                formulario.campanhaId
                  ? Number(
                      formulario.campanhaId
                    )
                  : null,

              formularioId:
                formulario.formularioId
                  ? Number(
                      formulario.formularioId
                    )
                  : null,

              urlEndpoint:
                formulario.urlEndpoint.trim() ||
                null,
            }),
          }
        );

      const dados =
        (await lerJson(
          resposta
        )) as RespostaPatch;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
            dados.message ||
            "Não foi possível salvar a integração."
        );
      }

      mostrarSucesso(
        "Integração atualizada com sucesso."
      );

      await carregarIntegracao();
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : "Erro ao salvar integração."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  async function alternarDisponibilidade() {
    if (
      !integracao ||
      !permissoes.podeGerenciar ||
      integracao.status ===
        "REVOGADA"
    ) {
      return;
    }

    const estaAtiva =
      integracao.status ===
      "ATIVA";

    try {
      setProcessandoStatus(
        true
      );

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/integracoes/${id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              estaAtiva
                ? {
                    status:
                      "PAUSADA",
                    ativo:
                      false,
                  }
                : {
                    status:
                      "ATIVA",
                    ativo:
                      true,
                  }
            ),
          }
        );

      const dados =
        (await lerJson(
          resposta
        )) as RespostaPatch;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
            dados.message ||
            "Não foi possível alterar a situação da integração."
        );
      }

      mostrarSucesso(
        estaAtiva
          ? "Integração pausada."
          : "Integração ativada."
      );

      await carregarIntegracao();
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : "Erro ao alterar integração."
      );
    } finally {
      setProcessandoStatus(
        false
      );
    }
  }

  async function gerarNovoSegredo() {
    if (
      !permissoes.podeGerenciar
    ) {
      return;
    }

    try {
      setGerandoSegredo(
        true
      );

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/integracoes/${id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              gerarNovoSegredo:
                true,
            }),
          }
        );

      const dados =
        (await lerJson(
          resposta
        )) as RespostaPatch;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
            dados.message ||
            "Não foi possível gerar uma nova credencial."
        );
      }

      const segredo =
        dados.credenciais
          ?.segredo;

      if (!segredo) {
        throw new Error(
          "O servidor não retornou o novo segredo."
        );
      }

      setCredenciaisGeradas({
        chavePublica:
          dados.credenciais
            ?.chavePublica ||
          integracao
            ?.chavePublica ||
          "",

        segredo,
      });

      setModalNovoSegredo(
        true
      );

      await carregarIntegracao();
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : "Erro ao gerar nova credencial."
      );
    } finally {
      setGerandoSegredo(
        false
      );
    }
  }

  async function revogarIntegracao() {
    try {
      setProcessandoStatus(
        true
      );

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/integracoes/${id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status:
                "REVOGADA",
              ativo:
                false,
            }),
          }
        );

      const dados =
        (await lerJson(
          resposta
        )) as RespostaPatch;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
            dados.message ||
            "Não foi possível revogar a integração."
        );
      }

      setModalRevogar(
        false
      );

      mostrarSucesso(
        "Credencial revogada."
      );

      await carregarIntegracao();
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : "Erro ao revogar integração."
      );
    } finally {
      setProcessandoStatus(
        false
      );
    }
  }

  async function copiar(
    valor: string,
    mensagem: string
  ) {
    if (!valor) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        valor
      );

      mostrarSucesso(
        mensagem
      );
    } catch {
      mostrarErro(
        "Não foi possível copiar automaticamente."
      );
    }
  }

  function filtrarEventos(
    event: FormEvent
  ) {
    event.preventDefault();

    void carregarEventos(
      1
    );
  }

  function limparFiltrosEventos() {
    setBuscaEvento(
      ""
    );

    setStatusEvento(
      ""
    );

    setDirecaoEvento(
      ""
    );

    window.setTimeout(
      () => {
        void carregarEventos(
          1
        );
      },
      0
    );
  }

  if (
    carregando
  ) {
    return (
      <div className="captacao-integracao-detalhe-page">
        <div className="ci-loading">
          Carregando integração...
        </div>
      </div>
    );
  }

  if (
    !integracao
  ) {
    return (
      <div className="captacao-integracao-detalhe-page">
        <div className="ci-container">
          <div className="ci-card ci-empty">
            <h1>
              Integração não encontrada
            </h1>

            <p>
              Não foi possível localizar esta integração.
            </p>

            <Link
              href="/admin/comercial/captacao/integracoes"
              className="ci-button ci-secondary"
            >
              ← Voltar para integrações
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const revogada =
    integracao.status ===
    "REVOGADA";

  const ativa =
    integracao.status ===
    "ATIVA";

  return (
    <div className="captacao-integracao-detalhe-page">
      {toast && (
        <div
          className={`ci-toast ${
            toast.tipo ===
            "sucesso"
              ? "ci-toast-success"
              : "ci-toast-error"
          }`}
        >
          {toast.mensagem}
        </div>
      )}

      <div className="ci-container">
        <section className="ci-hero">
          <div className="ci-hero-main">
            <Link
              href="/admin/comercial/captacao/integracoes"
              className="ci-back"
            >
              ← Integrações da Captação
            </Link>

            <div className="ci-title-row">
              <div className="ci-icon">
                🔌
              </div>

              <div>
                <div className="ci-title-status">
                  <h1>
                    {integracao.nome}
                  </h1>

                  <span
                    className={classeStatus(
                      integracao.status
                    )}
                  >
                    {formatarRotulo(
                      integracao.status
                    )}
                  </span>
                </div>

                <p>
                  Acompanhe a conexão, os recebimentos e o histórico desta integração.
                </p>
              </div>
            </div>
          </div>

          <div className="ci-hero-actions">
            <button
              type="button"
              className="ci-button ci-secondary"
              onClick={() => {
                void Promise.all([
                  carregarIntegracao(),
                  carregarEventos(
                    paginaEventos
                  ),
                ]);
              }}
            >
              ↻ Atualizar
            </button>

            {permissoes.podeGerenciar &&
              !revogada && (
                <button
                  type="button"
                  className={`ci-button ${
                    ativa
                      ? "ci-warning-button"
                      : "ci-primary"
                  }`}
                  disabled={
                    processandoStatus
                  }
                  onClick={() =>
                    void alternarDisponibilidade()
                  }
                >
                  {processandoStatus
                    ? "Aguarde..."
                    : ativa
                    ? "Pausar integração"
                    : "Ativar integração"}
                </button>
              )}
          </div>
        </section>

        <section className="ci-summary-grid">
          <div className="ci-card ci-summary-card">
            <span>
              Situação
            </span>

            <strong>
              {formatarRotulo(
                integracao.status
              )}
            </strong>

            <small>
              {ativa
                ? "Funcionando normalmente"
                : revogada
                ? "Credencial encerrada"
                : "Não está recebendo normalmente"}
            </small>
          </div>

          <div className="ci-card ci-summary-card">
            <span>
              Recebimentos
            </span>

            <strong>
              {
                integracao
                  ._count
                  .submissoes
              }
            </strong>

            <small>
              Submissões vinculadas
            </small>
          </div>

          <div className="ci-card ci-summary-card">
            <span>
              Eventos
            </span>

            <strong>
              {
                integracao
                  ._count
                  .eventos
              }
            </strong>

            <small>
              Registros da integração
            </small>
          </div>

          <div className="ci-card ci-summary-card">
            <span>
              Último sucesso
            </span>

            <strong className="ci-summary-date">
              {formatarData(
                integracao.ultimoSucessoEm
              )}
            </strong>

            <small>
              Último processamento concluído
            </small>
          </div>
        </section>

        {integracao.ultimoErro && (
          <section className="ci-error-panel">
            <div>
              <strong>
                O que precisa de atenção
              </strong>

              <p>
                {
                  integracao.ultimoErro
                }
              </p>
            </div>

            {integracao.ultimoErroEm && (
              <span>
                {formatarData(
                  integracao.ultimoErroEm
                )}
              </span>
            )}
          </section>
        )}

        <div className="ci-main-grid">
          <main className="ci-main-column">
            <section className="ci-card ci-section">
              <div className="ci-section-header">
                <div>
                  <span className="ci-eyebrow">
                    CONFIGURAÇÃO
                  </span>

                  <h2>
                    Dados da integração
                  </h2>

                  <p>
                    Estas informações organizam como os contatos entram no PHANYX.
                  </p>
                </div>
              </div>

              <form
                onSubmit={
                  salvarConfiguracao
                }
                className="ci-form"
              >
                <div className="ci-field">
                  <label>
                    Nome da integração
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.nome
                    }
                    disabled={
                      revogada ||
                      !permissoes.podeGerenciar
                    }
                    onChange={(
                      event
                    ) =>
                      setFormulario(
                        (
                          atual
                        ) => ({
                          ...atual,
                          nome:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </div>

                <div className="ci-field">
                  <label>
                    Como os dados são integrados?
                  </label>

                  <select
                    value={
                      formulario.tipo
                    }
                    disabled={
                      revogada ||
                      !permissoes.podeGerenciar
                    }
                    onChange={(
                      event
                    ) =>
                      setFormulario(
                        (
                          atual
                        ) => ({
                          ...atual,
                          tipo:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  >
                    {tiposDisponiveis.map(
                      (tipo) => (
                        <option
                          key={
                            tipo
                          }
                          value={
                            tipo
                          }
                        >
                          {formatarRotulo(
                            tipo
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="ci-subcard">
                  <div className="ci-subcard-title">
                    <h3>
                      Organização da captação
                    </h3>

                    <p>
                      Vincule a origem para identificar de onde cada interessado chegou.
                    </p>
                  </div>

                  <div className="ci-form-grid">
                    <div className="ci-field">
                      <label>
                        Canal
                      </label>

                      <select
                        value={
                          formulario.canalId
                        }
                        disabled={
                          revogada ||
                          !permissoes.podeGerenciar
                        }
                        onChange={(
                          event
                        ) =>
                          setFormulario(
                            (
                              atual
                            ) => ({
                              ...atual,
                              canalId:
                                event
                                  .target
                                  .value,
                              campanhaId:
                                "",
                              formularioId:
                                "",
                            })
                          )
                        }
                      >
                        <option value="">
                          Sem vínculo
                        </option>

                        {referencias.canais.map(
                          (
                            canal
                          ) => (
                            <option
                              key={
                                canal.id
                              }
                              value={
                                canal.id
                              }
                            >
                              {
                                canal.nome
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="ci-field">
                      <label>
                        Campanha
                      </label>

                      <select
                        value={
                          formulario.campanhaId
                        }
                        disabled={
                          revogada ||
                          !permissoes.podeGerenciar
                        }
                        onChange={(
                          event
                        ) =>
                          setFormulario(
                            (
                              atual
                            ) => ({
                              ...atual,
                              campanhaId:
                                event
                                  .target
                                  .value,
                              formularioId:
                                "",
                            })
                          )
                        }
                      >
                        <option value="">
                          Sem vínculo
                        </option>

                        {campanhasFiltradas.map(
                          (
                            campanha
                          ) => (
                            <option
                              key={
                                campanha.id
                              }
                              value={
                                campanha.id
                              }
                            >
                              {
                                campanha.nome
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="ci-field ci-field-full">
                      <label>
                        Formulário
                      </label>

                      <select
                        value={
                          formulario.formularioId
                        }
                        disabled={
                          revogada ||
                          !permissoes.podeGerenciar
                        }
                        onChange={(
                          event
                        ) =>
                          setFormulario(
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
                      >
                        <option value="">
                          Sem vínculo
                        </option>

                        {formulariosFiltrados.map(
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
                  </div>
                </div>

                {formulario.tipo.includes(
                  "SAIDA"
                ) && (
                  <div className="ci-field">
                    <label>
                      Endereço de destino
                    </label>

                    <input
                      type="url"
                      placeholder="https://..."
                      value={
                        formulario.urlEndpoint
                      }
                      disabled={
                        revogada ||
                        !permissoes.podeGerenciar
                      }
                      onChange={(
                        event
                      ) =>
                        setFormulario(
                          (
                            atual
                          ) => ({
                            ...atual,
                            urlEndpoint:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />

                    <small>
                      Endereço do sistema que receberá os dados enviados pelo PHANYX.
                    </small>
                  </div>
                )}

                {permissoes.podeGerenciar &&
                  !revogada && (
                    <div className="ci-form-actions">
                      <button
                        type="submit"
                        className="ci-button ci-primary"
                        disabled={
                          salvando
                        }
                      >
                        {salvando
                          ? "Salvando..."
                          : "Salvar alterações"}
                      </button>
                    </div>
                  )}
              </form>
            </section>

            <section className="ci-card ci-section">
              <div className="ci-section-header">
                <div>
                  <span className="ci-eyebrow">
                    HISTÓRICO
                  </span>

                  <h2>
                    Eventos da integração
                  </h2>

                  <p>
                    Veja as entradas, processamentos e possíveis falhas desta conexão.
                  </p>
                </div>
              </div>

              <form
                className="ci-event-filters"
                onSubmit={
                  filtrarEventos
                }
              >
                <div className="ci-field">
                  <label>
                    Buscar
                  </label>

                  <input
                    type="text"
                    placeholder="Evento, tipo ou erro..."
                    value={
                      buscaEvento
                    }
                    onChange={(
                      event
                    ) =>
                      setBuscaEvento(
                        event
                          .target
                          .value
                      )
                    }
                  />
                </div>

                <div className="ci-field">
                  <label>
                    Situação
                  </label>

                  <select
                    value={
                      statusEvento
                    }
                    onChange={(
                      event
                    ) =>
                      setStatusEvento(
                        event
                          .target
                          .value
                      )
                    }
                  >
                    <option value="">
                      Todas
                    </option>

                    {statusDisponiveisEventos.map(
                      (
                        status
                      ) => (
                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {formatarRotulo(
                            status
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="ci-field">
                  <label>
                    Direção
                  </label>

                  <select
                    value={
                      direcaoEvento
                    }
                    onChange={(
                      event
                    ) =>
                      setDirecaoEvento(
                        event
                          .target
                          .value
                      )
                    }
                  >
                    <option value="">
                      Todas
                    </option>

                    {direcoesDisponiveis.map(
                      (
                        direcao
                      ) => (
                        <option
                          key={
                            direcao
                          }
                          value={
                            direcao
                          }
                        >
                          {formatarRotulo(
                            direcao
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="ci-event-filter-actions">
                  <button
                    type="button"
                    className="ci-button ci-secondary"
                    onClick={
                      limparFiltrosEventos
                    }
                  >
                    Limpar
                  </button>

                  <button
                    type="submit"
                    className="ci-button ci-primary"
                  >
                    Filtrar
                  </button>
                </div>
              </form>

              <div className="ci-events-list">
                {carregandoEventos ? (
                  <div className="ci-empty">
                    Carregando eventos...
                  </div>
                ) : eventos.length ===
                  0 ? (
                  <div className="ci-empty">
                    <strong>
                      Nenhum evento encontrado
                    </strong>

                    <p>
                      Os eventos desta integração aparecerão aqui conforme os dados forem recebidos ou enviados.
                    </p>
                  </div>
                ) : (
                  eventos.map(
                    (
                      evento
                    ) => (
                      <article
                        key={
                          evento.id
                        }
                        className="ci-event"
                      >
                        <div className="ci-event-top">
                          <div>
                            <div className="ci-event-badges">
                              <span
                                className={classeStatus(
                                  evento.status
                                )}
                              >
                                {formatarRotulo(
                                  evento.status
                                )}
                              </span>

                              <span className="ci-badge">
                                {formatarRotulo(
                                  evento.direcao
                                )}
                              </span>
                            </div>

                            <h3>
                              {evento.tipoEvento ||
                                evento.identificadorEvento ||
                                `Evento #${evento.id}`}
                            </h3>

                            {evento.identificadorEvento && (
                              <p className="ci-event-id">
                                {
                                  evento.identificadorEvento
                                }
                              </p>
                            )}
                          </div>

                          <time>
                            {formatarData(
                              evento.recebidoEm ||
                                evento.criadoEm
                            )}
                          </time>
                        </div>

                        <div className="ci-event-meta">
                          <div>
                            <span>
                              Tentativas
                            </span>

                            <strong>
                              {
                                evento.numeroTentativas
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              HTTP
                            </span>

                            <strong>
                              {evento.codigoHttp ??
                                "—"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Submissão
                            </span>

                            <strong>
                              {evento.submissaoId
                                ? `#${evento.submissaoId}`
                                : "—"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Processado
                            </span>

                            <strong>
                              {evento.processadoEm
                                ? formatarData(
                                    evento.processadoEm
                                  )
                                : "Ainda não"}
                            </strong>
                          </div>
                        </div>

                        {evento.submissao && (
                          <div className="ci-event-person">
                            <strong>
                              {evento.submissao
                                .nomeSnapshot ||
                                "Interessado sem nome"}
                            </strong>

                            <span>
                              {[
                                evento.submissao
                                  .emailSnapshot,
                                evento.submissao
                                  .telefoneSnapshot,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " · "
                                )}
                            </span>

                            {evento.submissao
                              .leadId && (
                              <Link
                                href={`/admin/comercial/leads/${evento.submissao.leadId}`}
                                className="ci-inline-link"
                              >
                                Abrir lead →
                              </Link>
                            )}
                          </div>
                        )}

                        {evento.mensagemErro && (
                          <div className="ci-event-error">
                            <strong>
                              O que aconteceu
                            </strong>

                            <p>
                              {
                                evento.mensagemErro
                              }
                            </p>
                          </div>
                        )}
                      </article>
                    )
                  )
                )}
              </div>

              {paginacao &&
                paginacao.total >
                  0 && (
                  <div className="ci-pagination">
                    <span>
                      Página{" "}
                      {
                        paginacao.pagina
                      }{" "}
                      de{" "}
                      {Math.max(
                        1,
                        paginacao.totalPaginas
                      )}
                      {" · "}
                      {
                        paginacao.total
                      }{" "}
                      evento(s)
                    </span>

                    <div>
                      <button
                        type="button"
                        className="ci-button ci-secondary"
                        disabled={
                          !paginacao.possuiAnterior ||
                          carregandoEventos
                        }
                        onClick={() =>
                          void carregarEventos(
                            paginaEventos -
                              1
                          )
                        }
                      >
                        Anterior
                      </button>

                      <button
                        type="button"
                        className="ci-button ci-secondary"
                        disabled={
                          !paginacao.possuiProxima ||
                          carregandoEventos
                        }
                        onClick={() =>
                          void carregarEventos(
                            paginaEventos +
                              1
                          )
                        }
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
            </section>
          </main>

          <aside className="ci-side-column">
            <section className="ci-card ci-section">
              <span className="ci-eyebrow">
                CREDENCIAL
              </span>

              <h2>
                Conexão com o PHANYX
              </h2>

              <p className="ci-section-description">
                Use estas informações para conectar o sistema externo.
              </p>

              <div className="ci-credential-block">
                <label>
                  Chave pública
                </label>

                <div className="ci-copy-row">
                  <code>
                    {
                      integracao.chavePublica
                    }
                  </code>

                  <button
                    type="button"
                    onClick={() =>
                      void copiar(
                        integracao.chavePublica,
                        "Chave pública copiada."
                      )
                    }
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {endpointRecebimento && (
                <div className="ci-credential-block">
                  <label>
                    Endereço para receber dados
                  </label>

                  <div className="ci-copy-row ci-copy-row-column">
                    <code>
                      {
                        endpointRecebimento
                      }
                    </code>

                    <button
                      type="button"
                      onClick={() =>
                        void copiar(
                          endpointRecebimento,
                          "Endereço copiado."
                        )
                      }
                    >
                      Copiar endereço
                    </button>
                  </div>
                </div>
              )}

              <div className="ci-credential-status">
                <span>
                  🔒
                </span>

                <div>
                  <strong>
                    {integracao.possuiSegredo
                      ? "Segredo configurado"
                      : "Segredo não configurado"}
                  </strong>

                  <p>
                    O segredo atual nunca é exibido novamente depois de criado.
                  </p>
                </div>
              </div>

              {permissoes.podeGerenciar &&
                !revogada && (
                  <button
                    type="button"
                    className="ci-button ci-secondary ci-full-button"
                    disabled={
                      gerandoSegredo
                    }
                    onClick={() =>
                      void gerarNovoSegredo()
                    }
                  >
                    {gerandoSegredo
                      ? "Gerando..."
                      : "Gerar novo segredo"}
                  </button>
                )}
            </section>

            <section className="ci-card ci-section">
              <span className="ci-eyebrow">
                VÍNCULOS
              </span>

              <h2>
                Origem da captação
              </h2>

              <dl className="ci-details-list">
                <div>
                  <dt>
                    Canal
                  </dt>

                  <dd>
                    {integracao.canal
                      ?.nome ||
                      "Sem vínculo"}
                  </dd>
                </div>

                <div>
                  <dt>
                    Campanha
                  </dt>

                  <dd>
                    {integracao.campanha
                      ?.nome ||
                      "Sem vínculo"}
                  </dd>
                </div>

                <div>
                  <dt>
                    Formulário
                  </dt>

                  <dd>
                    {integracao.formulario
                      ?.titulo ||
                      integracao.formulario
                        ?.nome ||
                      "Sem vínculo"}
                  </dd>
                </div>

                <div>
                  <dt>
                    Tipo
                  </dt>

                  <dd>
                    {formatarRotulo(
                      integracao.tipo
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="ci-card ci-section">
              <span className="ci-eyebrow">
                REGISTRO
              </span>

              <h2>
                Informações da integração
              </h2>

              <dl className="ci-details-list">
                <div>
                  <dt>
                    Criada em
                  </dt>

                  <dd>
                    {formatarData(
                      integracao.criadoEm
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Última atualização
                  </dt>

                  <dd>
                    {formatarData(
                      integracao.atualizadoEm
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Último sucesso
                  </dt>

                  <dd>
                    {formatarData(
                      integracao.ultimoSucessoEm
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Último erro
                  </dt>

                  <dd>
                    {formatarData(
                      integracao.ultimoErroEm
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            {permissoes.podeGerenciar && (
              <section className="ci-card ci-section ci-danger-zone">
                <span className="ci-eyebrow">
                  SEGURANÇA
                </span>

                <h2>
                  Credencial da integração
                </h2>

                {revogada ? (
                  <div className="ci-revoked-message">
                    <strong>
                      Credencial revogada
                    </strong>

                    <p>
                      Esta integração não pode ser reativada. Para voltar a utilizá-la, crie uma nova integração.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="ci-section-description">
                      Revogue somente quando esta conexão não puder mais ser utilizada.
                    </p>

                    <button
                      type="button"
                      className="ci-button ci-danger-button ci-full-button"
                      onClick={() =>
                        setModalRevogar(
                          true
                        )
                      }
                    >
                      Revogar credencial
                    </button>
                  </>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>

      {modalRevogar && (
        <div className="ci-modal-backdrop">
          <div className="ci-modal">
            <div className="ci-modal-icon ci-modal-icon-danger">
              🔒
            </div>

            <h2>
              Revogar esta credencial?
            </h2>

            <p>
              A integração deixará de funcionar imediatamente. Uma credencial revogada não poderá ser reativada.
            </p>

            <div className="ci-modal-actions">
              <button
                type="button"
                className="ci-button ci-secondary"
                disabled={
                  processandoStatus
                }
                onClick={() =>
                  setModalRevogar(
                    false
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="ci-button ci-danger-button"
                disabled={
                  processandoStatus
                }
                onClick={() =>
                  void revogarIntegracao()
                }
              >
                {processandoStatus
                  ? "Revogando..."
                  : "Sim, revogar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalNovoSegredo &&
        credenciaisGeradas && (
          <div className="ci-modal-backdrop">
            <div className="ci-modal ci-secret-modal">
              <div className="ci-secret-warning">
                <strong>
                  Guarde estas informações agora
                </strong>

                <p>
                  Por segurança, o novo segredo não poderá ser exibido novamente.
                </p>
              </div>

              <div className="ci-secret-field">
                <label>
                  Chave pública
                </label>

                <code>
                  {
                    credenciaisGeradas.chavePublica
                  }
                </code>

                <button
                  type="button"
                  className="ci-button ci-secondary"
                  onClick={() =>
                    void copiar(
                      credenciaisGeradas.chavePublica,
                      "Chave pública copiada."
                    )
                  }
                >
                  Copiar chave
                </button>
              </div>

              <div className="ci-secret-field">
                <label>
                  Novo segredo
                </label>

                <code>
                  {
                    credenciaisGeradas.segredo
                  }
                </code>

                <button
                  type="button"
                  className="ci-button ci-primary"
                  onClick={() =>
                    void copiar(
                      credenciaisGeradas.segredo,
                      "Segredo copiado."
                    )
                  }
                >
                  Copiar segredo
                </button>
              </div>

              <div className="ci-modal-actions">
                <button
                  type="button"
                  className="ci-button ci-secondary"
                  onClick={() => {
                    setModalNovoSegredo(
                      false
                    );

                    setCredenciaisGeradas(
                      null
                    );
                  }}
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