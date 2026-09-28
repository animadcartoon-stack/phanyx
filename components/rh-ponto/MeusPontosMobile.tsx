"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

type TipoFiltro =
  | "TODOS"
  | "ENTRADA"
  | "SAIDA";

type SituacaoFiltro =
  | "TODOS"
  | "VALIDA"
  | "INVALIDADA"
  | "CORRIGIDA";

type MarcacaoHistorico = {
  id: number;
  tipo: string;
  dataHora: string;
  dataLocal: string;
  status: string;
  statusLocalizacao: string;
  comprovanteCodigo: string;
  distanciaMetros?: number | null;
  origem: string;
  localNome?: string | null;
};

type AutorizacaoCorrecao = {
  id: number;
  status: string;
  motivoAutorizacao: string;
  autorizadoEm: string;
  validoAte: string;
  utilizadoEm?: string | null;
  limiteEnvios: number;
  enviosRealizados: number;

  autorizadoPor: {
    id: number;
    nome: string;
  };
};

type JornadaHistorico = {
  id: number;
  dataLocal: string;
  status: string;
  horasTrabalhadas?: string | null;
  horasExtras?: string | null;
  horasAtraso?: string | null;
  observacoes?: string | null;
  marcacoes: MarcacaoHistorico[];
  autorizacao?: AutorizacaoCorrecao | null;

  ultimaSolicitacao?: {
    id: number;
    status: string;
    motivoFuncionario: string;
    enviadoEm?: string | null;
    aplicadoEm?: string | null;
  } | null;
};

type RespostaHistorico = {
  sucesso?: boolean;
  pagina?: number;
  limite?: number;
  total?: number;
  totalPaginas?: number;
  fusoHorario?: string;
  jornadas?: JornadaHistorico[];
  error?: string;
};

type ItemEdicao = {
  chave: string;
  id: number | null;
  tipo: "ENTRADA" | "SAIDA";
  hora: string;
};

type RespostaCorrecao = {
  sucesso?: boolean;
  mensagem?: string;
  whatsappStatus?: string;
  error?: string;
};

type MeusPontosMobileProps = {
  slug: string;
};

const CHAVE_DISPOSITIVO =
  "phanyx-rh-ponto-dispositivo-v1";

function gerarChaveLocal() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
  ].join("-");
}

function obterDispositivoId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existente =
      window.localStorage.getItem(
        CHAVE_DISPOSITIVO
      );

    if (existente) {
      return existente;
    }

    const novo =
      `dispositivo:${gerarChaveLocal()}`;

    window.localStorage.setItem(
      CHAVE_DISPOSITIVO,
      novo
    );

    return novo;
  } catch {
    return `temporario:${gerarChaveLocal()}`;
  }
}

function formatarDataLocal(dataLocal: string, locale: string) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataLocal);
  if (!partes) return dataLocal || "-";
  const data = new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])));
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric"
  }).format(data);
}

function formatarHora(
  dataHora: string,
  fusoHorario: string,
  locale: string
) {
  const data = new Date(dataHora);

  if (Number.isNaN(data.getTime())) {
    return "--:--";
  }

  try {
    return new Intl.DateTimeFormat(
      locale,
      {
        timeZone: fusoHorario,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    ).format(data);
  } catch {
    return data.toLocaleTimeString(
      locale
    );
  }
}

function horaParaEdicao(
  dataHora: string,
  fusoHorario: string
) {
  const data = new Date(dataHora);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  try {
    const partes =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: fusoHorario,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }
      ).formatToParts(data);

    const hora =
      partes.find(
        (parte) =>
          parte.type === "hour"
      )?.value || "";

    const minuto =
      partes.find(
        (parte) =>
          parte.type === "minute"
      )?.value || "";

    return hora && minuto
      ? `${hora}:${minuto}`
      : "";
  } catch {
    return data
      .toTimeString()
      .slice(0, 5);
  }
}

function formatarDataHoraCompleta(
  dataIso: string,
  locale: string
) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return dataIso;
  }

  return data.toLocaleString(
    locale,
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

type TranslatePoint = (key: string, values?: Record<string, string | number>) => string;

function rotuloTipo(tipo: string, tr: TranslatePoint) {
  switch (String(tipo || "").toUpperCase()) {
    case "ENTRADA":
    case "RETORNO_ALMOCO": return tr("history.typeEntry");
    case "SAIDA":
    case "SAIDA_ALMOCO": return tr("history.typeExit");
    default: return tr("history.typeUnknown");
  }
}

function tipoNormalizado(
  tipo: string
): "ENTRADA" | "SAIDA" {
  return String(tipo || "").toUpperCase().startsWith("SAIDA")
    ? "SAIDA"
    : "ENTRADA";
}

function rotuloLocalizacao(status: string, tr: TranslatePoint) {
  const keys: Record<string, string> = {
    DENTRO_DO_RAIO: "history.locationInside",
    FORA_DO_RAIO_PERMITIDA: "history.locationOutsideAllowed",
    CORRECAO_AUTORIZADA: "history.locationCorrectionAuthorized",
    CORRECAO_RH: "history.locationCorrectionRH",
    NAO_EXIGIDA: "history.locationNotRequired",
    SEM_LOCAL_ATIVO: "history.locationNoSite",
    NAO_VERIFICADA: "history.locationUnverified"
  };
  return tr(keys[status] || "history.locationUnknown");
}

function rotuloSituacao(status: string, tr: TranslatePoint) {
  const keys: Record<string, string> = {
    ABERTO: "history.statusOpen",
    FECHADO: "history.statusClosed",
    VALIDA: "history.statusValid",
    INVALIDADA: "history.statusInvalidated",
    CORRIGIDA: "history.statusCorrected",
    ATIVA: "history.statusActive",
    PENDENTE: "history.statusPending",
    APLICADA: "history.statusApplied"
  };
  return tr(keys[status] || "history.statusUnknown");
}

function numero(valor: unknown) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

function formatarHorasDecimais(
  valor: unknown
) {
  const horasDecimais = numero(valor);

  const sinal =
    horasDecimais < 0 ? "-" : "";

  const totalMinutos = Math.round(
    Math.abs(horasDecimais) * 60
  );

  const horas = Math.floor(
    totalMinutos / 60
  );

  const minutos =
    totalMinutos % 60;

  return `${sinal}${horas}h${String(
    minutos
  ).padStart(2, "0")}min`;
}

function limparMotivoAutorizacao(
  valor: unknown,
  tr: TranslatePoint
) {
  const texto = String(valor || "")
    .trim();

  const textoLimpo = texto
    .replace(
      /^Correção aplicada diretamente pelo RH\.?\s*/i,
      ""
    )
    .replace(
      /^Motivo:\s*/i,
      ""
    )
    .trim();

  return (
    textoLimpo ||
    texto ||
    tr("history.reasonNotProvided")
  );
}

export default function MeusPontosMobile({
  slug,
}: MeusPontosMobileProps) {
  const t = useTranslations("RhAppPoint");
  const locale = useLocale();
  const [dataInicio, setDataInicio] =
    useState("");

  const [dataFim, setDataFim] =
    useState("");

  const [tipo, setTipo] =
    useState<TipoFiltro>("TODOS");

  const [situacao, setSituacao] =
    useState<SituacaoFiltro>("TODOS");

  const [pagina, setPagina] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [
    totalPaginas,
    setTotalPaginas,
  ] = useState(1);

  const [
    fusoHorario,
    setFusoHorario,
  ] = useState(
    "America/Sao_Paulo"
  );

  const [jornadas, setJornadas] =
    useState<JornadaHistorico[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [
    filtrosAplicados,
    setFiltrosAplicados,
  ] = useState({
    dataInicio: "",
    dataFim: "",
    tipo:
      "TODOS" as TipoFiltro,
    situacao:
      "TODOS" as SituacaoFiltro,
  });

  const [jornadaEditando, setJornadaEditando] =
    useState<JornadaHistorico | null>(
      null
    );

  const [itensEdicao, setItensEdicao] =
    useState<ItemEdicao[]>([]);

  const [
    motivoFuncionario,
    setMotivoFuncionario,
  ] = useState("");

  const [
    enviandoCorrecao,
    setEnviandoCorrecao,
  ] = useState(false);

  const carregarHistorico =
    useCallback(
      async (
        paginaAlvo: number,
        filtros: {
          dataInicio: string;
          dataFim: string;
          tipo: TipoFiltro;
          situacao: SituacaoFiltro;
        }
      ) => {
        try {
          setLoading(true);
          setErro("");

          const parametros =
            new URLSearchParams();

          parametros.set(
            "pagina",
            String(paginaAlvo)
          );

          parametros.set(
            "limite",
            "10"
          );

          parametros.set(
            "tipo",
            filtros.tipo
          );

          parametros.set(
            "situacao",
            filtros.situacao
          );

          if (filtros.dataInicio) {
            parametros.set(
              "dataInicio",
              filtros.dataInicio
            );
          }

          if (filtros.dataFim) {
            parametros.set(
              "dataFim",
              filtros.dataFim
            );
          }

          const resposta = await fetch(
            `/api/rh-app/${encodeURIComponent(
              slug
            )}/ponto/historico?${parametros.toString()}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

          const dados: RespostaHistorico =
            await resposta.json();

          if (!resposta.ok) {
            if (resposta.status === 401) {
              window.location.href =
                `/rh-app/${encodeURIComponent(
                  slug
                )}/login`;

              return;
            }

            throw new Error(
              t("history.loadFailed")
            );
          }

          setJornadas(
            Array.isArray(dados.jornadas)
              ? dados.jornadas
              : []
          );

          setPagina(
            Number(dados.pagina || 1)
          );

          setTotal(
            Number(dados.total || 0)
          );

          setTotalPaginas(
            Math.max(
              1,
              Number(
                dados.totalPaginas || 1
              )
            )
          );

          setFusoHorario(
            dados.fusoHorario ||
              "America/Sao_Paulo"
          );
        } catch (error) {
          setJornadas([]);

          setErro(
            error instanceof Error
              ? error.message
              : t("history.loadFailed")
          );
        } finally {
          setLoading(false);
        }
      },
      [slug, t]
    );

  useEffect(() => {
    carregarHistorico(
      1,
      filtrosAplicados
    );
  }, [
    carregarHistorico,
    filtrosAplicados,
  ]);

  const quantidadeMarcacoes =
    useMemo(() => {
      return jornadas.reduce(
        (totalAtual, jornada) =>
          totalAtual +
          jornada.marcacoes.filter(
            (marcacao) =>
              marcacao.status !==
              "INVALIDADA"
          ).length,
        0
      );
    }, [jornadas]);

  function buscar() {
    setSucesso("");

    setFiltrosAplicados({
      dataInicio,
      dataFim,
      tipo,
      situacao,
    });
  }

  function limparFiltros() {
    const limpos = {
      dataInicio: "",
      dataFim: "",
      tipo:
        "TODOS" as TipoFiltro,
      situacao:
        "TODOS" as SituacaoFiltro,
    };

    setDataInicio("");
    setDataFim("");
    setTipo("TODOS");
    setSituacao("TODOS");
    setSucesso("");

    setFiltrosAplicados(limpos);
  }

  function mudarPagina(
    novaPagina: number
  ) {
    if (
      novaPagina < 1 ||
      novaPagina > totalPaginas ||
      loading
    ) {
      return;
    }

    carregarHistorico(
      novaPagina,
      filtrosAplicados
    );
  }

  function abrirEditor(
    jornada: JornadaHistorico
  ) {
    if (
      jornada.autorizacao?.status !==
      "ATIVA"
    ) {
      setErro(
        t("history.authorizationRequired")
      );

      return;
    }

    const validas =
      jornada.marcacoes.filter(
        (marcacao) =>
          marcacao.status !==
          "INVALIDADA"
      );

    setItensEdicao(
      validas.map((marcacao) => ({
        chave:
          `original:${marcacao.id}`,

        id: marcacao.id,

        tipo:
          tipoNormalizado(
            marcacao.tipo
          ),

        hora:
          horaParaEdicao(
            marcacao.dataHora,
            fusoHorario
          ),
      }))
    );

    setMotivoFuncionario("");
    setErro("");
    setSucesso("");
    setJornadaEditando(jornada);
  }

  function fecharEditor() {
    if (enviandoCorrecao) {
      return;
    }

    setJornadaEditando(null);
    setItensEdicao([]);
    setMotivoFuncionario("");
  }

  function adicionarMarcacao(
    tipoAdicionar:
      | "ENTRADA"
      | "SAIDA"
  ) {
    setItensEdicao((anteriores) => [
      ...anteriores,

      {
        chave:
          `nova:${gerarChaveLocal()}`,

        id: null,
        tipo: tipoAdicionar,
        hora: "",
      },
    ]);
  }

  function atualizarItem(
    chave: string,
    campo: "tipo" | "hora",
    valor: string
  ) {
    setItensEdicao((anteriores) =>
      anteriores.map((item) =>
        item.chave === chave
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );
  }

  function removerItem(
    chave: string
  ) {
    setItensEdicao((anteriores) =>
      anteriores.filter(
        (item) =>
          item.chave !== chave
      )
    );
  }

  async function enviarCorrecao() {
    if (
      !jornadaEditando?.autorizacao
    ) {
      return;
    }

    try {
      setEnviandoCorrecao(true);
      setErro("");
      setSucesso("");

      if (
        motivoFuncionario
          .trim()
          .length < 10
      ) {
        throw new Error(
          t("history.reasonMinLength")
        );
      }

      if (itensEdicao.length === 0) {
        throw new Error(
          t("history.addAtLeastOne")
        );
      }

      const itemInvalido =
        itensEdicao.find(
          (item) =>
            !item.hora ||
            !/^\d{2}:\d{2}$/.test(
              item.hora
            )
        );

      if (itemInvalido) {
        throw new Error(
          t("history.fillAllTimes")
        );
      }

      const resposta = await fetch(
        `/api/rh-app/${encodeURIComponent(
          slug
        )}/ponto/correcoes`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            autorizacaoId:
              jornadaEditando
                .autorizacao.id,

            motivoFuncionario:
              motivoFuncionario.trim(),

            dispositivoId:
              obterDispositivoId(),

            marcacoes:
              itensEdicao.map(
                (item) => ({
                  id: item.id,
                  tipo: item.tipo,
                  hora: item.hora,
                })
              ),
          }),
        }
      );

      const dados: RespostaCorrecao =
        await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          window.location.href =
            `/rh-app/${encodeURIComponent(
              slug
            )}/login`;

          return;
        }

        throw new Error(
          t("history.submitFailed")
        );
      }

      const complementoWhatsapp =
        dados.whatsappStatus ===
        "PENDENTE_CONFIGURACAO"
          ? " " + t("history.whatsappNotConfigured")
          : dados.whatsappStatus ===
              "SEM_TELEFONE"
            ? " " + t("history.whatsappNoPhone")
            : "";

      setSucesso(
        t("history.correctionSuccess") +
          complementoWhatsapp
      );

      setJornadaEditando(null);
      setItensEdicao([]);
      setMotivoFuncionario("");

      await carregarHistorico(
        pagina,
        filtrosAplicados
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("history.submitFailed")
      );
    } finally {
      setEnviandoCorrecao(false);
    }
  }

  return (
    <section
      id="meus-pontos"
      className="rounded-[30px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{t("history.title")}</p>

          <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{t("history.byDay")}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{t("history.dayDescription")}</p>
        </div>

        <span className="shrink-0 rounded-full border border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 px-3 py-2 text-xs font-black text-blue-800 dark:text-blue-200">
          {t("history.days", {count: total})}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("history.startDate")}</label>

          <input
            type="date"
            value={dataInicio}
            onChange={(evento) =>
              setDataInicio(
                evento.target.value
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("history.endDate")}</label>

          <input
            type="date"
            value={dataFim}
            onChange={(evento) =>
              setDataFim(
                evento.target.value
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("history.type")}</label>

          <select
            value={tipo}
            onChange={(evento) =>
              setTipo(
                evento.target
                  .value as TipoFiltro
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-blue-500"
          >
            <option value="TODOS">{t("history.allTypes")}</option>

            <option value="ENTRADA">{t("history.typeEntry")}</option>

            <option value="SAIDA">{t("history.typeExit")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("history.situation")}</label>

          <select
            value={situacao}
            onChange={(evento) =>
              setSituacao(
                evento.target
                  .value as SituacaoFiltro
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-blue-500"
          >
            <option value="TODOS">{t("history.allSituations")}</option>

            <option value="VALIDA">{t("history.valid")}</option>

            <option value="INVALIDADA">{t("history.invalidated")}</option>

            <option value="CORRIGIDA">{t("history.corrected")}</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={buscar}
          disabled={loading}
          className="min-h-12 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white disabled:opacity-50"
        >
          {loading
            ? t("history.loading")
            : t("history.search")}
        </button>

        <button
          type="button"
          onClick={limparFiltros}
          disabled={loading}
          className="min-h-12 rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-3 font-black text-slate-800 dark:text-slate-200 disabled:opacity-50"
        >{t("history.clearFilters")}</button>
      </div>

      {erro && (
        <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
          {sucesso}
        </div>
      )}

      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60 p-5 text-sm font-bold text-slate-700 dark:text-slate-300">{t("history.loadingHistory")}</div>
        ) : jornadas.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60 p-5 text-sm text-slate-600 dark:text-slate-400">{t("history.empty")}</div>
        ) : (
          jornadas.map((jornada) => {
            const atuais =
              jornada.marcacoes.filter(
                (marcacao) =>
                  marcacao.status !==
                  "INVALIDADA"
              );

            const anteriores =
              jornada.marcacoes.filter(
                (marcacao) =>
                  marcacao.status ===
                  "INVALIDADA"
              );

            const autorizacaoAtiva =
              jornada.autorizacao
                ?.status === "ATIVA";

                const correcaoDiretaRH =
  atuais.some(
    (marcacao) =>
      String(
        marcacao.origem || ""
      ).toUpperCase() ===
      "CORRECAO_RH"
  ) ||
  String(
    jornada.autorizacao
      ?.motivoAutorizacao || ""
  )
    .trim()
    .toLocaleLowerCase("pt-BR")
    .startsWith(
      "correção aplicada diretamente pelo rh"
    );

            return (
              <article
                key={jornada.id}
                className="rounded-[26px] border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("history.day")}</p>

                    <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      {formatarDataLocal(
                        jornada.dataLocal, locale
                      )}
                    </h3>
                  </div>

                  <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                    {rotuloSituacao(jornada.status, t)}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {atuais.length === 0 ? (
                    <p className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-4 text-sm text-slate-600 dark:text-slate-400">{t("history.noValidMarks")}</p>
                  ) : (
                    atuais.map(
                      (
                        marcacao,
                        indice
                      ) => {
                        const entrada =
                          tipoNormalizado(
                            marcacao.tipo
                          ) === "ENTRADA";

                        return (
                          <div
                            key={
                              marcacao.id
                            }
                            className={`rounded-2xl border p-4 ${
                              entrada
                                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/25"
                                : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/25"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                  {t("history.ordinalMark", {number: indice + 1})}
                                </p>

                                <p className="mt-1 font-black text-slate-900 dark:text-white">
                                  {rotuloTipo(
                                    marcacao.tipo, t
                                  )}
                                </p>
                              </div>

                              <p className="font-mono text-sm font-black text-blue-800 dark:text-blue-200">
                                {formatarHora(
                                  marcacao.dataHora,
                                  fusoHorario, locale
                                )}
                              </p>
                            </div>

                            <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
                              {rotuloLocalizacao(
                                marcacao.statusLocalizacao, t
                              )}
                            </p>

                            {marcacao.localNome && (
                              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                {
                                  marcacao.localNome
                                }
                              </p>
                            )}
                          </div>
                        );
                      }
                    )
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-3 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-500">{t("history.worked")}</p>

                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                      {formatarHorasDecimais(
  jornada.horasTrabalhadas
)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-500">{t("history.overtime")}</p>

                    <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">
                      {formatarHorasDecimais(
  jornada.horasExtras
)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-500">{t("history.late")}</p>

                    <p className="mt-1 text-sm font-black text-red-700 dark:text-red-300">
                      {formatarHorasDecimais(
  jornada.horasAtraso
)}
                    </p>
                  </div>
                </div>

                {jornada.autorizacao && (
                  <div
                    className={`mt-4 rounded-2xl border p-4 ${
                      autorizacaoAtiva
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    }`}
                  >
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {autorizacaoAtiva
  ? t("history.correctionAuthorized")
  : correcaoDiretaRH
    ? t("history.correctionByRH")
    : t("history.authorizationStatus", {status: rotuloSituacao(jornada.autorizacao.status, t)})}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-700 dark:text-slate-300">
                      <strong>{t("history.authorizedBy")}</strong>{" "}
                      {
                        jornada
                          .autorizacao
                          .autorizadoPor
                          .nome
                      }
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-slate-300">
                      <strong>{t("history.reason")}</strong>{" "}
                      {limparMotivoAutorizacao(
  jornada.autorizacao.motivoAutorizacao, t
)}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-slate-300">
                      <strong>{t("history.validUntil")}</strong>{" "}
                      {formatarDataHoraCompleta(
                        jornada
                          .autorizacao
                          .validoAte,
                        locale
                      )}
                    </p>

                    {autorizacaoAtiva && (
                      <button
                        type="button"
                        onClick={() =>
                          abrirEditor(
                            jornada
                          )
                        }
                        className="mt-4 min-h-12 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white"
                      >{t("history.edit")}</button>
                    )}
                  </div>
                )}

                {!jornada.autorizacao && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-4">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{t("history.editBlocked")}</p>

                    <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{t("history.editBlockedDescription")}</p>
                  </div>
                )}

                {jornada.ultimaSolicitacao && (
                  <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/25 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">{t("history.latestCorrection")}</p>

                    <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">
                      {
                        jornada
                          .ultimaSolicitacao
                          .motivoFuncionario
                      }
                    </p>

                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t("history.statusLabel")}{" "}
                      {rotuloSituacao(jornada.ultimaSolicitacao.status, t)}
                    </p>
                  </div>
                )}

                {anteriores.length > 0 && (
                  <details className="mt-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-4">
                    <summary className="cursor-pointer text-sm font-black text-slate-700 dark:text-slate-300">
                      {t("history.replacedMarks", {count: anteriores.length})}
                    </summary>

                    <div className="mt-3 space-y-2">
                      {anteriores.map(
                        (marcacao) => (
                          <div
                            key={
                              marcacao.id
                            }
                            className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/25 p-3 text-xs text-red-800 dark:text-red-200 line-through"
                          >
                            <span>
                              {rotuloTipo(
                                marcacao.tipo, t
                              )}
                            </span>

                            <span className="font-mono">
                              {formatarHora(
                                marcacao.dataHora,
                                fusoHorario, locale
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </details>
                )}
              </article>
            );
          })
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={
            pagina <= 1 || loading
          }
          onClick={() =>
            mudarPagina(pagina - 1)
          }
          className="min-h-11 rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-2 text-sm font-black text-slate-800 dark:text-slate-200 disabled:opacity-40"
        >{t("history.previous")}</button>

        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
          {t("history.pagination", {page: pagina, total: totalPaginas})}
          <br />
          {t("history.marksCount", {count: quantidadeMarcacoes})}
        </p>

        <button
          type="button"
          disabled={
            pagina >= totalPaginas ||
            loading
          }
          onClick={() =>
            mudarPagina(pagina + 1)
          }
          className="min-h-11 rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-2 text-sm font-black text-slate-800 dark:text-slate-200 disabled:opacity-40"
        >{t("history.next")}</button>
      </div>

      {jornadaEditando &&
        jornadaEditando.autorizacao && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <section className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[30px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{t("history.correctionAuthorized")}</p>

                <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                  {formatarDataLocal(
                    jornadaEditando.dataLocal, locale
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharEditor}
                disabled={enviandoCorrecao}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 text-xl font-black text-slate-800 dark:text-slate-200 disabled:opacity-50"
                aria-label={t("history.closeEditor")}
              >
                ×
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-4">
              <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">
  {t("history.authorizedBy")}
</p>

<p className="mt-1 text-sm font-bold text-emerald-800 dark:text-emerald-200">
  {jornadaEditando.autorizacao.autorizadoPor.nome ||
    t("history.rhManager")}
</p>

<p className="mt-4 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200">{t("history.authorizationReason")}</p>

<p className="mt-1 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
  {jornadaEditando.autorizacao.motivoAutorizacao}
</p>
            </div>

            <div className="mt-5 space-y-3">
              {itensEdicao.map(
                (item, indice) => (
                  <div
                    key={item.chave}
                    className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        {t("history.ordinalMark", {number: indice + 1})}
                      </p>

                      <button
                        type="button"
                        disabled={
                          enviandoCorrecao
                        }
                        onClick={() =>
                          removerItem(
                            item.chave
                          )
                        }
                        className="rounded-xl border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-3 py-2 text-xs font-black text-red-800 dark:text-red-200 disabled:opacity-50"
                      >{t("history.remove")}</button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <select
                        value={item.tipo}
                        disabled={
                          enviandoCorrecao
                        }
                        onChange={(evento) =>
                          atualizarItem(
                            item.chave,
                            "tipo",
                            evento.target.value
                          )
                        }
                        className="min-h-12 rounded-xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-3 py-2 font-bold text-slate-900 dark:text-white"
                      >
                        <option value="ENTRADA">{t("history.typeEntry")}</option>

                        <option value="SAIDA">{t("history.typeExit")}</option>
                      </select>

                      <input
                        type="time"
                        value={item.hora}
                        disabled={
                          enviandoCorrecao
                        }
                        onChange={(evento) =>
                          atualizarItem(
                            item.chave,
                            "hora",
                            evento.target.value
                          )
                        }
                        className="min-h-12 rounded-xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-3 py-2 font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  enviandoCorrecao
                }
                onClick={() =>
                  adicionarMarcacao(
                    "ENTRADA"
                  )
                }
                className="min-h-12 rounded-2xl border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 px-4 py-3 font-black text-emerald-800 dark:text-emerald-200 disabled:opacity-50"
              >{t("history.addEntry")}</button>

              <button
                type="button"
                disabled={
                  enviandoCorrecao
                }
                onClick={() =>
                  adicionarMarcacao(
                    "SAIDA"
                  )
                }
                className="min-h-12 rounded-2xl border border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30 px-4 py-3 font-black text-blue-800 dark:text-blue-200 disabled:opacity-50"
              >{t("history.addExit")}</button>
            </div>

            <div className="mt-5">
              <label className="mb-1 block text-sm font-black text-slate-800 dark:text-slate-200">{t("history.correctionReason")}</label>

              <textarea
                value={motivoFuncionario}
                disabled={
                  enviandoCorrecao
                }
                onChange={(evento) =>
                  setMotivoFuncionario(
                    evento.target.value
                  )
                }
                placeholder={t("history.reasonPlaceholder")}
                className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 p-4 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/25 p-4">
              <p className="text-xs leading-5 text-amber-800 dark:text-amber-200">{t("history.submitExplanation")}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={fecharEditor}
                disabled={
                  enviandoCorrecao
                }
                className="min-h-12 rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-3 font-black text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >{t("history.cancel")}</button>

              <button
                type="button"
                onClick={enviarCorrecao}
                disabled={
                  enviandoCorrecao
                }
                className="min-h-12 rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-50"
              >
                {enviandoCorrecao
                  ? t("history.sending")
                  : t("history.submitCorrection")}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
