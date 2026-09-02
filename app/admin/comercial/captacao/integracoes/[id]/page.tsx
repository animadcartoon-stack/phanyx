"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";
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

type EventoDetalhe = Evento & {
  headers: unknown;
  payload: unknown;
  resposta: unknown;

  integracao: {
    id: number;
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

    ultimoSucessoEm: string | null;
    ultimoErroEm: string | null;
    ultimoErro: string | null;

    criadoEm: string;
    atualizadoEm: string;

    canal: {
      id: number;
      nome: string;
      tipo: string;
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
  };

  submissao: {
    id: number;

    canalId: number | null;
    campanhaId: number | null;
    formularioId: number | null;
    integracaoId: number | null;
    leadId: number | null;

    identificadorExterno: string | null;
    chaveDeduplicacao: string | null;

    status: string;
    resultadoDeduplicacao: string | null;

    nomeSnapshot: string | null;
    emailSnapshot: string | null;
    telefoneSnapshot: string | null;

    dadosOriginais: unknown;
    dadosNormalizados: unknown;

    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;

    gclid: string | null;
    fbclid: string | null;
    msclkid: string | null;

    paginaOrigem: string | null;
    referrer: string | null;
    ipHash: string | null;
    userAgent: string | null;
    idioma: string | null;

    consentimentoLgpd: boolean;
    consentimentoEm: string | null;
    versaoConsentimento: string | null;
    textoConsentimentoSnapshot: string | null;

    tentativasProcessamento: number;
    codigoErro: string | null;
    mensagemErro: string | null;

    recebidoEm: string | null;
    processadoEm: string | null;
    atualizadoEm: string;

    canal: {
      id: number;
      nome: string;
      tipo: string;
    } | null;

    campanha: {
      id: number;
      nome: string;
      codigo: string | null;
    } | null;

    formulario: {
      id: number;
      nome: string;
      titulo: string | null;
      status: string;
    } | null;
  } | null;
};

type RespostaEventoDetalhe = {
  success: boolean;

  permissoes: {
    podeVerAuditoria: boolean;
    podeReprocessarSubmissao: boolean;
    podeGerenciarIntegracoes: boolean;
  };

  acoes: {
    submissaoPodeSerReprocessada: boolean;
    eventoPossuiFalha: boolean;
    eventoPendente: boolean;
  };

  evento: EventoDetalhe;

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

const CHAVES_ROTULO = {
  WEBHOOK_ENTRADA:
    "list.types.webhookIn",
  WEBHOOK_SAIDA:
    "list.types.webhookOut",
  META_LEAD_ADS:
    "list.types.metaLeadAds",
  GOOGLE_LEAD_FORM:
    "list.types.googleLeadForm",
  API:
    "list.types.api",
  IMPORTACAO:
    "list.types.import",
  OUTRA:
    "list.types.other",

  ATIVA:
    "list.statuses.active",
  INATIVA:
    "list.statuses.inactive",
  PAUSADA:
    "list.statuses.paused",
  ERRO:
    "list.statuses.error",
  REVOGADA:
    "list.statuses.revoked",

  RECEBIDO:
    "detail.eventStatuses.received",
  PENDENTE:
    "detail.eventStatuses.pending",
  PROCESSANDO:
    "detail.eventStatuses.processing",
  PROCESSADO:
    "detail.eventStatuses.processed",
  ENTREGUE:
    "detail.eventStatuses.delivered",
  DESCARTADO:
    "detail.eventStatuses.discarded",

  ENTRADA:
    "detail.directions.in",
  SAIDA:
    "detail.directions.out",
} as const;

function chaveRotulo(
  valor?: string | null
) {
  if (!valor) {
    return null;
  }

  return CHAVES_ROTULO[
    valor as keyof typeof CHAVES_ROTULO
  ] ?? null;
}

function formatarRotuloFallback(
  valor?: string | null
) {
  if (!valor) {
    return "";
  }

  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase()
    );
}

function formatarData(
  valor: string | null | undefined,
  locale: string,
  nunca: string,
  naoInformado: string
) {
  if (!valor) {
    return nunca;
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return naoInformado;
  }

  return data.toLocaleString(
    locale,
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
  resposta: Response,
  mensagemInvalida: string
) {
  return resposta
    .json()
    .catch(
      () => ({
        success: false,
        error:
          mensagemInvalida,
      })
    );
}

function formatarConteudoTecnico(
  valor: unknown,
  naoInformado = "—"
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return naoInformado;
  }

  if (
    typeof valor ===
    "string"
  ) {
    try {
      return JSON.stringify(
        JSON.parse(valor),
        null,
        2
      );
    } catch {
      return valor;
    }
  }

  try {
    return (
      JSON.stringify(
        valor,
        null,
        2
      ) ||
      String(valor)
    );
  } catch {
    return String(
      valor
    );
  }
}

type OpcaoSeletor = {
  value: string;
  label: string;
};

function SeletorDetalheIntegracao({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  options: OpcaoSeletor[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [
    aberto,
    setAberto,
  ] =
    useState(false);

  const ref =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(() => {
    function fecharFora(
      event: MouseEvent
    ) {
      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharFora
      );
    };
  }, []);

  const selecionada =
    options.find(
      (option) =>
        option.value ===
        value
    ) ?? options[0];

  return (
    <div
      ref={ref}
      className="ci-theme-select"
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className="ci-theme-select-button"
        onClick={() =>
          setAberto(
            (atual) =>
              !atual
          )
        }
      >
        <span>
          {selecionada?.label ?? ""}
        </span>

        <span
          aria-hidden="true"
          className="ci-theme-select-arrow"
        >
          {aberto
            ? "▲"
            : "▼"}
        </span>
      </button>

      {aberto &&
        !disabled && (
          <div
            role="listbox"
            className="ci-theme-select-menu"
          >
            {options.map(
              (option) => {
                const selecionado =
                  option.value ===
                  value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    role="option"
                    aria-selected={
                      selecionado
                    }
                    className={`ci-theme-select-option ${selecionado
                      ? "is-selected"
                      : ""
                      }`}
                    onClick={() => {
                      onChange(
                        option.value
                      );

                      setAberto(
                        false
                      );
                    }}
                  >
                    {
                      option.label
                    }
                  </button>
                );
              }
            )}
          </div>
        )}
    </div>
  );
}

export default function IntegracaoDetalhePage() {
  const t =
    useTranslations(
      "AdminCommercialIntegrations"
    );

  const locale =
    useLocale();

  function rotulo(
    valor?: string | null
  ) {
    if (!valor) {
      return t(
        "common.notInformed"
      );
    }

    const chave =
      chaveRotulo(
        valor
      );

    if (chave) {
      return t(chave);
    }

    return formatarRotuloFallback(
      valor
    );
  }

  function dataUi(
    valor?: string | null
  ) {
    return formatarData(
      valor,
      locale,
      t("common.never"),
      t(
        "common.notInformed"
      )
    );
  }

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
    eventoDetalheAberto,
    setEventoDetalheAberto,
  ] =
    useState<number | null>(
      null
    );

  const [
    detalheEvento,
    setDetalheEvento,
  ] =
    useState<RespostaEventoDetalhe | null>(
      null
    );

  const [
    carregandoDetalheEvento,
    setCarregandoDetalheEvento,
  ] =
    useState(false);

  const [
    reprocessandoSubmissao,
    setReprocessandoSubmissao,
  ] =
    useState(false);

  const [
    detalhesTecnicosAbertos,
    setDetalhesTecnicosAbertos,
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
        t("errors.invalidIntegration")
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
          resposta,
          t("errors.invalidResponse")
        )) as RespostaIntegracao;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
          dados.message ||
          t("errors.loadIntegration")
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
          : t("errors.loadIntegration")
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
          resposta,
          t("errors.invalidResponse")
        )) as RespostaEventos;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
          dados.message ||
          t("errors.loadEvents")
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
          : t("errors.loadEvents")
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
        t("errors.noEditPermission")
      );

      return;
    }

    if (
      !formulario.nome.trim()
    ) {
      mostrarErro(
        t("errors.nameRequired")
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
          resposta,
          t("errors.invalidResponse")
        )) as RespostaPatch;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
          dados.message ||
          t("errors.saveIntegration")
        );
      }

      mostrarSucesso(
        t("success.updated")
      );

      await carregarIntegracao();
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : t("errors.saveIntegration")
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
          resposta,
          t("errors.invalidResponse")
        )) as RespostaPatch;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
          dados.message ||
          t("errors.changeStatus")
        );
      }

      mostrarSucesso(
        estaAtiva
          ? t("success.paused")
          : t("success.activated")
      );

      await carregarIntegracao();
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : t("errors.changeStatus")
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
          resposta,
          t("errors.invalidResponse")
        )) as RespostaPatch;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
          dados.message ||
          t("errors.generateSecret")
        );
      }

      const segredo =
        dados.credenciais
          ?.segredo;

      if (!segredo) {
        throw new Error(
          t("errors.secretMissing")
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
          : t("errors.generateSecret")
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
          resposta,
          t("errors.invalidResponse")
        )) as RespostaPatch;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
          dados.message ||
          t("errors.revoke")
        );
      }

      setModalRevogar(
        false
      );

      mostrarSucesso(
        t("success.revoked")
      );

      await carregarIntegracao();
    } catch (error) {
      mostrarErro(
        error instanceof
          Error
          ? error.message
          : t("errors.revoke")
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
        t("errors.copy")
      );
    }
  }

  async function abrirDetalheEvento(
    eventoId: number
  ) {
    if (
      !permissoes.podeAuditar
    ) {
      mostrarErro(
        t("errors.noAuditPermission")
      );

      return;
    }

    try {
      setEventoDetalheAberto(
        eventoId
      );

      setDetalheEvento(
        null
      );

      setDetalhesTecnicosAbertos(
        false
      );

      setCarregandoDetalheEvento(
        true
      );

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/integracoes/eventos/${eventoId}`,
          {
            cache:
              "no-store",
          }
        );

      const dados =
        (await lerJson(
          resposta,
          t("errors.invalidResponse")
        )) as RespostaEventoDetalhe;

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
          dados.message ||
          t("errors.loadEventDetail")
        );
      }

      setDetalheEvento(
        dados
      );
    } catch (error) {
      setEventoDetalheAberto(
        null
      );

      setDetalheEvento(
        null
      );

      mostrarErro(
        error instanceof Error
          ? error.message
          : t("errors.loadEventDetail")
      );
    } finally {
      setCarregandoDetalheEvento(
        false
      );
    }
  }

  function fecharDetalheEvento() {
    if (
      reprocessandoSubmissao
    ) {
      return;
    }

    setEventoDetalheAberto(
      null
    );

    setDetalheEvento(
      null
    );

    setDetalhesTecnicosAbertos(
      false
    );
  }

  async function reprocessarSubmissaoEvento() {
    const submissaoId =
      detalheEvento?.evento
        .submissao?.id;

    if (
      !submissaoId ||
      !detalheEvento?.acoes
        .submissaoPodeSerReprocessada
    ) {
      mostrarErro(
        t("errors.cannotReprocess")
      );

      return;
    }

    try {
      setReprocessandoSubmissao(
        true
      );

      const resposta =
        await fetch(
          `/api/admin/comercial/captacao/submissoes/${submissaoId}/reprocessar`,
          {
            method:
              "POST",
          }
        );

      const dados =
        (await lerJson(
          resposta,
          t("errors.invalidResponse")
        )) as {
          success: boolean;
          message?: string;
          error?: string;
        };

      if (
        !resposta.ok ||
        !dados.success
      ) {
        throw new Error(
          dados.error ||
          dados.message ||
          t("errors.reprocess")
        );
      }

      mostrarSucesso(
        dados.message ||
        t("success.reprocessed")
      );

      await Promise.all([
        carregarEventos(
          paginaEventos
        ),
        carregarIntegracao(),
      ]);

      if (
        eventoDetalheAberto
      ) {
        await abrirDetalheEvento(
          eventoDetalheAberto
        );
      }
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t("errors.reprocess");

      await Promise.all([
        carregarEventos(
          paginaEventos
        ),
        carregarIntegracao(),
      ]);

      if (
        eventoDetalheAberto
      ) {
        await abrirDetalheEvento(
          eventoDetalheAberto
        );
      }

      mostrarErro(
        mensagem
      );
    } finally {
      setReprocessandoSubmissao(
        false
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
          {t("detail.loading")}
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
              {t("detail.notFound.title")}
            </h1>

            <p>
              {t("detail.notFound.description")}
            </p>

            <Link
              href="/admin/comercial/captacao/integracoes"
              className="ci-button ci-secondary"
            >
              {t("detail.notFound.back")}
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

  const integracaoSaida =
    integracao.tipo ===
    "WEBHOOK_SAIDA";

  function traduzirErroPersistido(
    mensagem:
      | string
      | null
      | undefined
  ) {
    if (!mensagem) {
      return "";
    }

    const campoObrigatorio =
      mensagem.match(
        /^O campo ["“](.+?)["”] é obrigatório\.?$/i
      );

    if (campoObrigatorio) {
      const campo =
        campoObrigatorio[1];

      const campos: Record<
        string,
        string
      > = {
        "Nome completo":
          t(
            "detail.persistedErrors.fields.fullName"
          ),

        "E-mail":
          t(
            "detail.persistedErrors.fields.email"
          ),

        "Telefone":
          t(
            "detail.persistedErrors.fields.phone"
          ),
      };

      return t(
        "detail.persistedErrors.requiredField",
        {
          field:
            campos[campo] ||
            campo,
        }
      );
    }

    return mensagem;
  }

  return (
    <div className="captacao-integracao-detalhe-page">
      {toast && (
        <div
          className={`ci-toast ${toast.tipo ===
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
              {t("detail.back")}
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
                    {rotulo(
                      integracao.status
                    )}
                  </span>
                </div>

                <p>
                  {t("detail.heroDescription")}
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
              {t("common.refresh")}
            </button>

            {permissoes.podeGerenciar &&
              !revogada && (
                <button
                  type="button"
                  className={`ci-button ${ativa
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
                    ? t("common.wait")
                    : ativa
                      ? t("detail.actions.pause")
                      : t("detail.actions.activate")}
                </button>
              )}
          </div>
        </section>

        <section className="ci-summary-grid">
          <div className="ci-card ci-summary-card">
            <span>
              {t("common.status")}
            </span>

            <strong>
              {rotulo(
                integracao.status
              )}
            </strong>

            <small>
              {ativa
                ? t("detail.summary.activeHelp")
                : revogada
                  ? t("detail.summary.revokedHelp")
                  : t("detail.summary.inactiveHelp")}
            </small>
          </div>

          <div className="ci-card ci-summary-card">
            <span>
              {t("detail.summary.receipts")}
            </span>

            <strong>
              {
                integracao
                  ._count
                  .submissoes
              }
            </strong>

            <small>
              {t("detail.summary.receiptsHelp")}
            </small>
          </div>

          <div className="ci-card ci-summary-card">
            <span>
              {t("detail.summary.events")}
            </span>

            <strong>
              {
                integracao
                  ._count
                  .eventos
              }
            </strong>

            <small>
              {t("detail.summary.eventsHelp")}
            </small>
          </div>

          <div className="ci-card ci-summary-card">
            <span>
              {t("common.lastSuccess")}
            </span>

            <strong className="ci-summary-date">
              {dataUi(
                integracao.ultimoSucessoEm
              )}
            </strong>

            <small>
              {t("detail.summary.lastSuccessHelp")}
            </small>
          </div>
        </section>

        {integracao.ultimoErro && (
          <section className="ci-error-panel">
            <div>
              <strong>
                {t("detail.attention")}
              </strong>

              <p>
                {traduzirErroPersistido(
                  integracao.ultimoErro
                )}
              </p>
            </div>

            {integracao.ultimoErroEm && (
              <span>
                {dataUi(
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
                    {t("detail.config.eyebrow")}
                  </span>

                  <h2>
                    {t("detail.config.title")}
                  </h2>

                  <p>
                    {integracaoSaida
                      ? t("detail.config.descriptionOut")
                      : t("detail.config.descriptionIn")}
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
                    {t("common.integrationName")}
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
                    {t("detail.config.method")}
                  </label>

                  <SeletorDetalheIntegracao
                    value={
                      formulario.tipo
                    }
                    disabled={
                      revogada ||
                      !permissoes.podeGerenciar
                    }
                    onChange={(value) =>
                      setFormulario(
                        (
                          atual
                        ) => ({
                          ...atual,
                          tipo:
                            value,
                        })
                      )
                    }
                    options={tiposDisponiveis.map(
                      (tipo) => ({
                        value:
                          tipo,
                        label:
                          rotulo(
                            tipo
                          ),
                      })
                    )}
                  />
                </div>

                <div className="ci-subcard">
                  <div className="ci-subcard-title">
                    <h3>
                      {t("detail.config.captureOrganization")}
                    </h3>

                    <p>
                      {t("detail.config.captureOrganizationHelp")}
                    </p>
                  </div>

                  <div className="ci-form-grid">
                    <div className="ci-field">
                      <label>
                        {t("common.channel")}
                      </label>

                      <SeletorDetalheIntegracao
                        value={
                          formulario.canalId
                        }
                        disabled={
                          revogada ||
                          !permissoes.podeGerenciar
                        }
                        onChange={(value) =>
                          setFormulario(
                            (
                              atual
                            ) => ({
                              ...atual,
                              canalId:
                                value,
                              campanhaId:
                                "",
                              formularioId:
                                "",
                            })
                          )
                        }
                        options={[
                          {
                            value: "",
                            label:
                              t(
                                "common.noLink"
                              ),
                          },
                          ...referencias.canais.map(
                            (
                              canal
                            ) => ({
                              value:
                                String(
                                  canal.id
                                ),
                              label:
                                canal.nome,
                            })
                          ),
                        ]}
                      />
                    </div>

                    <div className="ci-field">
                      <label>
                        {t("common.campaign")}
                      </label>

                      <SeletorDetalheIntegracao
                        value={
                          formulario.campanhaId
                        }
                        disabled={
                          revogada ||
                          !permissoes.podeGerenciar
                        }
                        onChange={(value) =>
                          setFormulario(
                            (
                              atual
                            ) => ({
                              ...atual,
                              campanhaId:
                                value,
                              formularioId:
                                "",
                            })
                          )
                        }
                        options={[
                          {
                            value: "",
                            label:
                              t(
                                "common.noLink"
                              ),
                          },
                          ...campanhasFiltradas.map(
                            (
                              campanha
                            ) => ({
                              value:
                                String(
                                  campanha.id
                                ),
                              label:
                                campanha.nome,
                            })
                          ),
                        ]}
                      />
                    </div>

                    <div className="ci-field ci-field-full">
                      <label>
                        {t("common.form")}
                      </label>

                      <SeletorDetalheIntegracao
                        value={
                          formulario.formularioId
                        }
                        disabled={
                          revogada ||
                          !permissoes.podeGerenciar
                        }
                        onChange={(value) =>
                          setFormulario(
                            (
                              atual
                            ) => ({
                              ...atual,
                              formularioId:
                                value,
                            })
                          )
                        }
                        options={[
                          {
                            value: "",
                            label:
                              t(
                                "common.noLink"
                              ),
                          },
                          ...formulariosFiltrados.map(
                            (
                              item
                            ) => ({
                              value:
                                String(
                                  item.id
                                ),
                              label:
                                item.titulo ||
                                item.nome,
                            })
                          ),
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {formulario.tipo.includes(
                  "SAIDA"
                ) && (
                    <div className="ci-field">
                      <label>
                        {t("detail.config.destinationAddress")}
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
                        {t("detail.config.destinationHelp")}
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
                          ? t("common.saving")
                          : t("common.saveChanges")}
                      </button>
                    </div>
                  )}
              </form>
            </section>

            <section className="ci-card ci-section">
              <div className="ci-section-header">
                <div>
                  <span className="ci-eyebrow">
                    {t("detail.history.eyebrow")}
                  </span>

                  <h2>
                    {t("detail.history.title")}
                  </h2>

                  <p>
                    {t("detail.history.description")}
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
                    {t("common.search")}
                  </label>

                  <input
                    type="text"
                    placeholder={t("detail.history.searchPlaceholder")}
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
                    {t("common.status")}
                  </label>

                  <SeletorDetalheIntegracao
                    value={
                      statusEvento
                    }
                    onChange={
                      setStatusEvento
                    }
                    options={[
                      {
                        value: "",
                        label:
                          t(
                            "common.allFeminine"
                          ),
                      },
                      ...statusDisponiveisEventos.map(
                        (
                          status
                        ) => ({
                          value:
                            status,
                          label:
                            rotulo(
                              status
                            ),
                        })
                      ),
                    ]}
                  />
                </div>

                <div className="ci-field">
                  <label>
                    {t("detail.history.direction")}
                  </label>

                  <SeletorDetalheIntegracao
                    value={
                      direcaoEvento
                    }
                    onChange={
                      setDirecaoEvento
                    }
                    options={[
                      {
                        value: "",
                        label:
                          t(
                            "common.allFeminine"
                          ),
                      },
                      ...direcoesDisponiveis.map(
                        (
                          direcao
                        ) => ({
                          value:
                            direcao,
                          label:
                            rotulo(
                              direcao
                            ),
                        })
                      ),
                    ]}
                  />
                </div>

                <div className="ci-event-filter-actions">
                  <button
                    type="button"
                    className="ci-button ci-secondary"
                    onClick={
                      limparFiltrosEventos
                    }
                  >
                    {t("common.clear")}
                  </button>

                  <button
                    type="submit"
                    className="ci-button ci-primary"
                  >
                    {t("common.filter")}
                  </button>
                </div>
              </form>

              <div className="ci-events-list">
                {carregandoEventos ? (
                  <div className="ci-empty">
                    {t("detail.history.loading")}
                  </div>
                ) : eventos.length ===
                  0 ? (
                  <div className="ci-empty">
                    <strong>
                      {t("detail.history.emptyTitle")}
                    </strong>

                    <p>
                      {t("detail.history.emptyDescription")}
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
                                {rotulo(
                                  evento.status
                                )}
                              </span>

                              <span className="ci-badge">
                                {rotulo(
                                  evento.direcao
                                )}
                              </span>
                            </div>

                            <h3>
                              {evento.tipoEvento ||
                                evento.identificadorEvento ||
                                t("detail.history.eventNumber", { id: evento.id })}
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
                            {dataUi(
                              evento.recebidoEm ||
                              evento.criadoEm
                            )}
                          </time>
                        </div>

                        <div className="ci-event-meta">
                          <div>
                            <span>
                              {t("detail.history.attempts")}
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
                              {t("detail.history.submission")}
                            </span>

                            <strong>
                              {evento.submissaoId
                                ? `#${evento.submissaoId}`
                                : "—"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              {t("detail.history.processed")}
                            </span>

                            <strong>
                              {evento.processadoEm
                                ? dataUi(
                                  evento.processadoEm
                                )
                                : t("common.notYet")}
                            </strong>
                          </div>
                        </div>

                        {evento.submissao && (
                          <div className="ci-event-person">
                            <strong>
                              {evento.submissao
                                .nomeSnapshot ||
                                t("detail.history.unnamedProspect")}
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
                                  {t("detail.history.openLead")}
                                </Link>
                              )}
                          </div>
                        )}

                        {evento.mensagemErro && (
                          <div className="ci-event-error">
                            <strong>
                              {t("common.whatHappened")}
                            </strong>

                            <p>
                              {
                                evento.mensagemErro
                              }
                            </p>
                          </div>
                        )}
                        {permissoes.podeAuditar && (
                          <div className="ci-event-actions">
                            <button
                              type="button"
                              className="ci-button ci-secondary"
                              disabled={
                                carregandoDetalheEvento
                              }
                              onClick={() =>
                                void abrirDetalheEvento(
                                  evento.id
                                )
                              }
                            >
                              {carregandoDetalheEvento &&
                                eventoDetalheAberto ===
                                evento.id
                                ? t("detail.history.opening")
                                : t("common.viewDetails")}
                            </button>
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
                      {t(
                        "detail.history.pagination",
                        {
                          page:
                            paginacao.pagina,
                          pages:
                            Math.max(
                              1,
                              paginacao.totalPaginas
                            ),
                          total:
                            paginacao.total,
                        }
                      )}
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
                        {t("common.previous")}
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
                        {t("common.next")}
                      </button>
                    </div>
                  </div>
                )}
            </section>
          </main>

          <aside className="ci-side-column">
            <section className="ci-card ci-section">
              <span className="ci-eyebrow">
                {t("detail.credential.eyebrow")}
              </span>

              <h2>
                {integracaoSaida
                  ? t("detail.credential.titleOut")
                  : t("detail.credential.titleIn")}
              </h2>

              <p className="ci-section-description">
                {integracaoSaida
                  ? t("detail.credential.descriptionOut")
                  : t("detail.credential.descriptionIn")}
              </p>

              <div className="ci-credential-block">
                <label>
                  {t("credentials.publicKey")}
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
                        t("success.publicKeyCopied")
                      )
                    }
                  >
                    {t("common.copy")}
                  </button>
                </div>
              </div>

              {!integracaoSaida && endpointRecebimento && (
                <div className="ci-credential-block">
                  <label>
                    {t("detail.credential.receiveAddress")}
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
                          t("success.addressCopied")
                        )
                      }
                    >
                      {t("detail.credential.copyAddress")}
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
                      ? t("detail.credential.secretConfigured")
                      : t("detail.credential.secretNotConfigured")}
                  </strong>

                  <p>
                    {t("detail.credential.secretHelp")}
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
                      ? t("detail.credential.generating")
                      : t("detail.credential.generateSecret")}
                  </button>
                )}
            </section>

            <section className="ci-card ci-section">
              <span className="ci-eyebrow">
                {t("detail.links.eyebrow")}
              </span>

              <h2>
                {t("detail.links.title")}
              </h2>

              <dl className="ci-details-list">
                <div>
                  <dt>
                    {t("common.channel")}
                  </dt>

                  <dd>
                    {integracao.canal
                      ?.nome ||
                      t("common.noLink")}
                  </dd>
                </div>

                <div>
                  <dt>
                    {t("common.campaign")}
                  </dt>

                  <dd>
                    {integracao.campanha
                      ?.nome ||
                      t("common.noLink")}
                  </dd>
                </div>

                <div>
                  <dt>
                    {t("common.form")}
                  </dt>

                  <dd>
                    {integracao.formulario
                      ?.titulo ||
                      integracao.formulario
                        ?.nome ||
                      t("common.noLink")}
                  </dd>
                </div>

                <div>
                  <dt>
                    {t("common.type")}
                  </dt>

                  <dd>
                    {rotulo(
                      integracao.tipo
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="ci-card ci-section">
              <span className="ci-eyebrow">
                {t("detail.record.eyebrow")}
              </span>

              <h2>
                {t("detail.record.title")}
              </h2>

              <dl className="ci-details-list">
                <div>
                  <dt>
                    {t("common.createdAt")}
                  </dt>

                  <dd>
                    {dataUi(
                      integracao.criadoEm
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    {t("common.lastUpdate")}
                  </dt>

                  <dd>
                    {dataUi(
                      integracao.atualizadoEm
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    {t("common.lastSuccess")}
                  </dt>

                  <dd>
                    {dataUi(
                      integracao.ultimoSucessoEm
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    {t("common.lastError")}
                  </dt>

                  <dd>
                    {dataUi(
                      integracao.ultimoErroEm
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            {permissoes.podeGerenciar && (
              <section className="ci-card ci-section ci-danger-zone">
                <span className="ci-eyebrow">
                  {t("detail.security.eyebrow")}
                </span>

                <h2>
                  {t("detail.security.title")}
                </h2>

                {revogada ? (
                  <div className="ci-revoked-message">
                    <strong>
                      {t("detail.security.revokedTitle")}
                    </strong>

                    <p>
                      {t("detail.security.revokedDescription")}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="ci-section-description">
                      {t("detail.security.description")}
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
                      {t("detail.security.revoke")}
                    </button>
                  </>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>

      {eventoDetalheAberto !==
        null && (
          <div
            className="ci-modal-backdrop"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                fecharDetalheEvento();
              }
            }}
          >
            <div
              className="ci-modal ci-event-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ci-event-detail-title"
            >
              <div className="ci-event-detail-header">
                <div>
                  <span className="ci-eyebrow">
                    {t("detail.eventModal.eyebrow")}
                  </span>

                  <h2 id="ci-event-detail-title">
                    {detalheEvento
                      ?.evento
                      .tipoEvento ||
                      t("detail.history.eventNumber", { id: eventoDetalheAberto })}
                  </h2>

                  <p>
                    {t("detail.eventModal.description")}
                  </p>
                </div>

                <button
                  type="button"
                  className="ci-modal-close"
                  aria-label={t("detail.eventModal.closeAria")}
                  disabled={
                    reprocessandoSubmissao
                  }
                  onClick={
                    fecharDetalheEvento
                  }
                >
                  ×
                </button>
              </div>

              {carregandoDetalheEvento ? (
                <div className="ci-event-detail-loading">
                  {t("detail.eventModal.loading")}
                </div>
              ) : detalheEvento ? (
                <>
                  <div className="ci-event-detail-badges">
                    <span
                      className={classeStatus(
                        detalheEvento
                          .evento
                          .status
                      )}
                    >
                      {rotulo(
                        detalheEvento
                          .evento
                          .status
                      )}
                    </span>

                    <span className="ci-badge">
                      {rotulo(
                        detalheEvento
                          .evento
                          .direcao
                      )}
                    </span>
                  </div>

                  <div className="ci-event-detail-grid">
                    <div>
                      <span>
                        {t("detail.eventModal.dateTime")}
                      </span>

                      <strong>
                        {dataUi(
                          detalheEvento
                            .evento
                            .recebidoEm ||
                          detalheEvento
                            .evento
                            .criadoEm
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("common.type")}
                      </span>

                      <strong>
                        {rotulo(
                          detalheEvento
                            .evento
                            .tipoEvento
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("detail.eventModal.direction")}
                      </span>

                      <strong>
                        {rotulo(
                          detalheEvento
                            .evento
                            .direcao
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("detail.eventModal.attemptCount")}
                      </span>

                      <strong>
                        {
                          detalheEvento
                            .evento
                            .numeroTentativas
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        HTTP
                      </span>

                      <strong>
                        {detalheEvento
                          .evento
                          .codigoHttp ??
                          t("common.notInformed")}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("detail.eventModal.processedAt")}
                      </span>

                      <strong>
                        {detalheEvento
                          .evento
                          .processadoEm
                          ? dataUi(
                            detalheEvento
                              .evento
                              .processadoEm
                          )
                          : t("common.notYet")}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {t("detail.history.submission")}
                      </span>

                      {detalheEvento
                        .evento
                        .submissao ? (
                        <Link
                          href={`/admin/comercial/captacao/submissoes/${detalheEvento.evento.submissao.id}`}
                          className="ci-inline-link"
                        >
                          #
                          {
                            detalheEvento
                              .evento
                              .submissao
                              .id
                          }
                        </Link>
                      ) : (
                        <strong>
                          {t("common.notLinkedFeminine")}
                        </strong>
                      )}
                    </div>

                    <div>
                      <span>
                        {t("detail.eventModal.lead")}
                      </span>

                      {detalheEvento
                        .evento
                        .submissao
                        ?.leadId ? (
                        <Link
                          href={`/admin/comercial/leads/${detalheEvento.evento.submissao.leadId}`}
                          className="ci-inline-link"
                        >
                          {t("detail.eventModal.openLead")} #
                          {
                            detalheEvento
                              .evento
                              .submissao
                              .leadId
                          }
                        </Link>
                      ) : (
                        <strong>
                          {t("detail.eventModal.notGenerated")}
                        </strong>
                      )}
                    </div>
                  </div>

                  {detalheEvento
                    .evento
                    .submissao && (
                      <div className="ci-event-detail-person">
                        <span>
                          {t("detail.eventModal.prospect")}
                        </span>

                        <strong>
                          {detalheEvento
                            .evento
                            .submissao
                            .nomeSnapshot ||
                            t("detail.eventModal.nameNotInformed")}
                        </strong>

                        <p>
                          {[
                            detalheEvento
                              .evento
                              .submissao
                              .emailSnapshot,
                            detalheEvento
                              .evento
                              .submissao
                              .telefoneSnapshot,
                          ]
                            .filter(Boolean)
                            .join(" · ") ||
                            t("detail.eventModal.contactNotInformed")}
                        </p>
                      </div>
                    )}

                  <div
                    className={`ci-event-detail-result ${detalheEvento
                      .acoes
                      .eventoPossuiFalha
                      ? "ci-event-detail-result-error"
                      : detalheEvento
                        .acoes
                        .eventoPendente
                        ? "ci-event-detail-result-warning"
                        : "ci-event-detail-result-success"
                      }`}
                  >
                    <strong>
                      {t("common.whatHappened")}
                    </strong>

                    <p>
                      {traduzirErroPersistido(
                        detalheEvento
                          .evento
                          .mensagemErro
                      ) ||
                        (detalheEvento
                          .acoes
                          .eventoPendente
                          ? t(
                            "detail.eventModal.pendingMessage"
                          )
                          : t(
                            "detail.eventModal.successMessage"
                          ))}
                    </p>

                    {detalheEvento
                      .evento
                      .proximaTentativaEm && (
                        <small>
                          {t("detail.eventModal.nextAttempt")}{" "}
                          {dataUi(
                            detalheEvento
                              .evento
                              .proximaTentativaEm
                          )}
                        </small>
                      )}
                  </div>

                  {detalheEvento
                    .acoes
                    .submissaoPodeSerReprocessada && (
                      <div className="ci-event-retry">
                        <div>
                          <strong>
                            {t("detail.eventModal.canRetryTitle")}
                          </strong>

                          <p>
                            {t("detail.eventModal.canRetryDescription")}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="ci-button ci-primary"
                          disabled={
                            reprocessandoSubmissao
                          }
                          onClick={() =>
                            void reprocessarSubmissaoEvento()
                          }
                        >
                          {reprocessandoSubmissao
                            ? t("detail.eventModal.retrying")
                            : t("detail.eventModal.retry")}
                        </button>
                      </div>
                    )}

                  {detalheEvento
                    .permissoes
                    .podeVerAuditoria && (
                      <div className="ci-technical-details">
                        <button
                          type="button"
                          className="ci-technical-toggle"
                          aria-expanded={
                            detalhesTecnicosAbertos
                          }
                          onClick={() =>
                            setDetalhesTecnicosAbertos(
                              (
                                valorAtual
                              ) =>
                                !valorAtual
                            )
                          }
                        >
                          <span>
                            {t("detail.eventModal.technicalDetails")}
                          </span>

                          <span aria-hidden="true">
                            {detalhesTecnicosAbertos
                              ? "−"
                              : "+"}
                          </span>
                        </button>

                        {detalhesTecnicosAbertos && (
                          <div className="ci-technical-content">
                            <section>
                              <h3>
                                {t("detail.eventModal.identification")}
                              </h3>

                              <dl>
                                <div>
                                  <dt>
                                    {t("detail.eventModal.event")}
                                  </dt>

                                  <dd>
                                    #
                                    {
                                      detalheEvento
                                        .evento
                                        .id
                                    }
                                  </dd>
                                </div>

                                <div>
                                  <dt>
                                    {t("detail.eventModal.identifier")}
                                  </dt>

                                  <dd>
                                    {detalheEvento
                                      .evento
                                      .identificadorEvento ||
                                      t("common.notInformed")}
                                  </dd>
                                </div>

                                <div>
                                  <dt>
                                    {t("detail.eventModal.integration")}
                                  </dt>

                                  <dd>
                                    {
                                      detalheEvento
                                        .evento
                                        .integracao
                                        .nome
                                    }
                                  </dd>
                                </div>

                                <div>
                                  <dt>
                                    {t("credentials.publicKey")}
                                  </dt>

                                  <dd>
                                    {
                                      detalheEvento
                                        .evento
                                        .integracao
                                        .chavePublica
                                    }
                                  </dd>
                                </div>
                              </dl>
                            </section>

                            <section>
                              <h3>
                                {t("detail.eventModal.headers")}
                              </h3>

                              <pre>
                                {formatarConteudoTecnico(
                                  detalheEvento
                                    .evento
                                    .headers
                                )}
                              </pre>
                            </section>

                            <section>
                              <h3>
                                {t("detail.eventModal.payload")}
                              </h3>

                              <pre>
                                {formatarConteudoTecnico(
                                  detalheEvento
                                    .evento
                                    .payload
                                )}
                              </pre>
                            </section>

                            <section>
                              <h3>
                                {t("detail.eventModal.response")}
                              </h3>

                              <pre>
                                {formatarConteudoTecnico(
                                  detalheEvento
                                    .evento
                                    .resposta
                                )}
                              </pre>
                            </section>

                            <section>
                              <h3>
                                {t("detail.eventModal.integrationConfig")}
                              </h3>

                              <pre>
                                {formatarConteudoTecnico({
                                  configuracao:
                                    detalheEvento
                                      .evento
                                      .integracao
                                      .configuracao,

                                  eventosAssinados:
                                    detalheEvento
                                      .evento
                                      .integracao
                                      .eventosAssinados,

                                  urlEndpoint:
                                    detalheEvento
                                      .evento
                                      .integracao
                                      .urlEndpoint,
                                })}
                              </pre>
                            </section>

                            {detalheEvento
                              .evento
                              .submissao && (
                                <>
                                  <section>
                                    <h3>
                                      {t("detail.eventModal.originalData")}
                                    </h3>

                                    <pre>
                                      {formatarConteudoTecnico(
                                        detalheEvento
                                          .evento
                                          .submissao
                                          .dadosOriginais
                                      )}
                                    </pre>
                                  </section>

                                  <section>
                                    <h3>
                                      {t("detail.eventModal.normalizedData")}
                                    </h3>

                                    <pre>
                                      {formatarConteudoTecnico(
                                        detalheEvento
                                          .evento
                                          .submissao
                                          .dadosNormalizados
                                      )}
                                    </pre>
                                  </section>

                                  <section>
                                    <h3>
                                      {t("detail.eventModal.trackingAudit")}
                                    </h3>

                                    <pre>
                                      {formatarConteudoTecnico({
                                        utmSource:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .utmSource,

                                        utmMedium:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .utmMedium,

                                        utmCampaign:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .utmCampaign,

                                        utmContent:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .utmContent,

                                        utmTerm:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .utmTerm,

                                        gclid:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .gclid,

                                        fbclid:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .fbclid,

                                        msclkid:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .msclkid,

                                        paginaOrigem:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .paginaOrigem,

                                        referrer:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .referrer,

                                        ipHash:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .ipHash,

                                        userAgent:
                                          detalheEvento
                                            .evento
                                            .submissao
                                            .userAgent,
                                      })}
                                    </pre>
                                  </section>
                                </>
                              )}
                          </div>
                        )}
                      </div>
                    )}

                  <div className="ci-modal-actions">
                    <button
                      type="button"
                      className="ci-button ci-secondary"
                      disabled={
                        reprocessandoSubmissao
                      }
                      onClick={
                        fecharDetalheEvento
                      }
                    >
                      {t("common.close")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="ci-event-detail-loading">
                  {t("detail.eventModal.cannotDisplay")}
                </div>
              )}
            </div>
          </div>
        )}

      {modalRevogar && (
        <div className="ci-modal-backdrop">
          <div className="ci-modal">
            <div className="ci-modal-icon ci-modal-icon-danger">
              🔒
            </div>

            <h2>
              {t("detail.revokeModal.title")}
            </h2>

            <p>
              {t("detail.revokeModal.description")}
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
                {t("common.cancel")}
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
                  ? t("detail.revokeModal.revoking")
                  : t("detail.revokeModal.confirm")}
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
                  {t("credentials.saveNow")}
                </strong>

                <p>
                  {t("detail.secretModal.warning")}
                </p>
              </div>

              <div className="ci-secret-field">
                <label>
                  {t("credentials.publicKey")}
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
                      t("success.publicKeyCopied")
                    )
                  }
                >
                  {t("detail.secretModal.copyKey")}
                </button>
              </div>

              <div className="ci-secret-field">
                <label>
                  {t("detail.secretModal.newSecret")}
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
                      t("success.secretCopied")
                    )
                  }
                >
                  {t("detail.secretModal.copySecret")}
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
                  {t("credentials.saved")}
                </button>
              </div>
            </div>
          </div>
        )}
      <style jsx global>{`
        .captacao-integracao-detalhe-page
          .ci-theme-select {
          position: relative;
          width: 100%;
        }

        .captacao-integracao-detalhe-page
          .ci-theme-select-button {
          width: 100%;
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid var(--ci-border);
          border-radius: 12px;
          background: var(--ci-input);
          color: var(--ci-text);
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .captacao-integracao-detalhe-page
          .ci-theme-select-button:disabled {
          cursor: not-allowed;
          opacity: 0.58;
        }

        .captacao-integracao-detalhe-page
          .ci-theme-select-arrow {
          flex: 0 0 auto;
          font-size: 10px;
        }

        .captacao-integracao-detalhe-page
          .ci-theme-select-menu {
          position: absolute;
          z-index: 5200;
          left: 0;
          right: 0;
          top: calc(100% + 5px);
          max-height: 260px;
          overflow-y: auto;
          padding: 5px;
          border: 1px solid var(--ci-border);
          border-radius: 12px;
          background: var(--ci-card);
          color: var(--ci-text);
          box-shadow:
            0 18px 38px rgba(0, 0, 0, 0.28);
        }

        .captacao-integracao-detalhe-page
          .ci-theme-select-option {
          width: 100%;
          display: block;
          padding: 9px 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--ci-text);
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .captacao-integracao-detalhe-page
          .ci-theme-select-option:hover,
        .captacao-integracao-detalhe-page
          .ci-theme-select-option.is-selected {
          background: var(--ci-soft-strong);
        }
      `}</style>

    </div>
  );
}