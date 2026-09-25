"use client";

import { useLocale, useTranslations } from "next-intl";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type FuncionarioOpcao = {
  id: number;
  nome: string;
  cargo?: string | null;
  codigoFuncionario?: string | null;

  departamento?: {
    nome: string;
  } | null;
};

type MarcacaoPonto = {
  id: number;
  tipo: string;
  dataHora: string;
  dataLocal: string;
  status: string;
  statusLocalizacao: string;
  comprovanteCodigo: string;
  origem: string;
  distanciaMetros?: number | null;
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

type ResponsavelAtual = {
  id: number;
  nome: string;
};

type MarcacaoCorrecaoRH = {
  id: number | null;
  tipo: "ENTRADA" | "SAIDA";
  hora: string;
};

type RegistroPonto = {
  id: number;
  dataLocal: string;

  entrada?: string | null;
  saidaAlmoco?: string | null;
  retornoAlmoco?: string | null;
  saida?: string | null;

  horasTrabalhadas?: string | number | null;
  horasExtras?: string | number | null;
  horasAtraso?: string | number | null;

  status: string;
  observacoes?: string | null;

  funcionario: FuncionarioOpcao;
  marcacoes: MarcacaoPonto[];

  autorizacaoCorrecao?:
    | AutorizacaoCorrecao
    | null;
};

type RespostaPontos = {
  sucesso?: boolean;
  pagina?: number;
  limite?: number;
  total?: number;
  totalPaginas?: number;
  fusoHorario?: string;
  responsavelAtual?: ResponsavelAtual;
  pontos?: RegistroPonto[];
  error?: string;
};

type Filtros = {
  busca: string;
  dataInicio: string;
  dataFim: string;
  tipo: "TODOS" | "ENTRADA" | "SAIDA";
  statusMarcacao:
    | "TODOS"
    | "VALIDA"
    | "INVALIDADA";
  statusPonto: string;
};


const FILTROS_INICIAIS: Filtros = {
  busca: "",
  dataInicio: "",
  dataFim: "",
  tipo: "TODOS",
  statusMarcacao: "TODOS",
  statusPonto: "TODOS",
};

function numero(valor: unknown) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

function formatarDataLocal(dataLocal: string, locale: string) {
  const correspondencia =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dataLocal
    );

  if (!correspondencia) {
    return dataLocal || "-";
  }

  const [, ano, mes, dia] =
    correspondencia;

  return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia))).toLocaleDateString(locale, { timeZone: "UTC" });
}

function formatarHora(dataHora: string, fusoHorario: string, locale: string) {
  const data = new Date(dataHora);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
        timeZone: fusoHorario,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    ).format(data);
  } catch {
    return data.toLocaleTimeString(locale);
  }
}

function formatarHoraParaEdicao(
  dataHora: string,
  fusoHorario: string
) {
  const data = new Date(dataHora);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  try {
    const partes =
      new Intl.DateTimeFormat("pt-BR", {
        timeZone: fusoHorario,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(data);

    const hora =
      partes.find(
        (parte) => parte.type === "hour"
      )?.value || "";

    const minuto =
      partes.find(
        (parte) => parte.type === "minute"
      )?.value || "";

    if (!hora || !minuto) {
      return "";
    }

    return `${hora}:${minuto}`;
  } catch {
    return "";
  }
}

function ehEntrada(tipo: string) {
  return ["ENTRADA", "RETORNO_ALMOCO"].includes(String(tipo || "").toUpperCase());
}

function rotuloTipo(tipo: string, entrada: string, saida: string, marcacao: string) {
  const valor = String(tipo || "").toUpperCase();
  if (ehEntrada(valor)) return entrada;
  if (["SAIDA", "SAIDA_ALMOCO"].includes(valor)) return saida;
  return tipo || marcacao;
}

function valorDataHoraLocalPadrao() {
  const data = new Date(
    Date.now() +
      24 * 60 * 60 * 1000
  );

  const deslocamento =
    data.getTimezoneOffset() *
    60 *
    1000;

  return new Date(
    data.getTime() - deslocamento
  )
    .toISOString()
    .slice(0, 16);
}

function formatarDataHoraCompleta(dataIso: string, locale: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return dataIso;
  }

  return data.toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function saldoBanco(
  ponto: RegistroPonto
) {
  return (
    numero(ponto.horasExtras) -
    numero(ponto.horasAtraso)
  );
}

function marcacoesParaExibir(
  ponto: RegistroPonto
) {
  if (
    Array.isArray(ponto.marcacoes) &&
    ponto.marcacoes.length > 0
  ) {
    return ponto.marcacoes;
  }

  /*
   * Registros antigos ou manuais podem existir
   * somente nos quatro campos do resumo diário.
   */
  const marcacoes: MarcacaoPonto[] =
    [];

  const adicionar = (
    tipo: string,
    dataHora?: string | null
  ) => {
    if (!dataHora) return;

    marcacoes.push({
      id:
        marcacoes.length * -1 - 1,
      tipo,
      dataHora,
      dataLocal:
        ponto.dataLocal,
      status: "VALIDA",
      statusLocalizacao:
        "NAO_VERIFICADA",
      comprovanteCodigo:
        "REGISTRO-LEGADO",
      origem: "MANUAL",
      distanciaMetros: null,
      localNome: null,
    });
  };

  adicionar(
    "ENTRADA",
    ponto.entrada
  );

  adicionar(
    "SAIDA_ALMOCO",
    ponto.saidaAlmoco
  );

  adicionar(
    "RETORNO_ALMOCO",
    ponto.retornoAlmoco
  );

  adicionar(
    "SAIDA",
    ponto.saida
  );

  return marcacoes;
}

function classeStatusPonto(status: string) {
  switch (String(status || "").toUpperCase()) {
    case "REGISTRADO":
      return "border-emerald-300 bg-emerald-100 !text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:!text-emerald-200";

    case "ABERTO":
      return "border-amber-300 bg-amber-100 !text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:!text-amber-200";

    case "CORRIGIDO":
      return "border-blue-300 bg-blue-100 !text-blue-800 dark:border-blue-700 dark:bg-blue-950/60 dark:!text-blue-200";

    case "INCONSISTENTE":
    case "PENDENTE":
      return "border-orange-300 bg-orange-100 !text-orange-800 dark:border-orange-700 dark:bg-orange-950/60 dark:!text-orange-200";

    case "INVALIDADO":
    case "CANCELADO":
      return "border-red-300 bg-red-100 !text-red-800 dark:border-red-700 dark:bg-red-950/60 dark:!text-red-200";

    default:
      return "border-slate-300 bg-slate-100 !text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:!text-slate-200";
  }
}

function formatarHorasDecimais(
  valor: number | string | null | undefined,
  mostrarSinal = false
) {
  const horasDecimais = Number(valor || 0);

  if (!Number.isFinite(horasDecimais)) {
    return mostrarSinal
      ? "+0h00min"
      : "0h00min";
  }

  const totalMinutos = Math.round(
    Math.abs(horasDecimais) * 60
  );

  const horas = Math.floor(
    totalMinutos / 60
  );

  const minutos =
    totalMinutos % 60;

  const sinal =
    horasDecimais < 0
      ? "-"
      : mostrarSinal
        ? "+"
        : "";

  return `${sinal}${horas}h${String(
    minutos
  ).padStart(2, "0")}min`;
}

export default function PontoRHPage() {
  const t = useTranslations("AdminHRTimeTracking");
  const locale = useLocale();
  const displayDate = (value: string) => formatarDataLocal(value, locale);
  const displayTime = (value: string, zone: string) => formatarHora(value, zone, locale);
  const displayDateTime = (value: string) => formatarDataHoraCompleta(value, locale);
  const displayType = (value: string) => rotuloTipo(value, t("entry"), t("exit"), t("marking"));
  const statusLabels: Record<string, string> = {
    REGISTRADO: t("statusRecorded"), ABERTO: t("statusOpen"), CORRIGIDO: t("statusCorrected"),
    INCONSISTENTE: t("statusInconsistent"), PENDENTE: t("statusPending"),
    INVALIDADO: t("statusInvalidated"), CANCELADO: t("statusCancelled"),
    VALIDA: t("statusValid"), INVALIDADA: t("statusInvalid"),
    ATIVA: t("statusActive"), UTILIZADA: t("statusUsed"), EXPIRADA: t("statusExpired"),
  };
  const locationLabels: Record<string, string> = {
    NAO_VERIFICADA: t("locationNotChecked"), VALIDADA: t("locationValidated"),
    FORA_DO_RAIO: t("locationOutside"), SEM_LOCALIZACAO: t("locationMissing"),
  };
  const originLabels: Record<string, string> = {
    MANUAL: t("originManual"), MOBILE: t("originMobile"), AFD: t("originAfd"),
  };
  const labelStatus = (value: string) => statusLabels[String(value || "").toUpperCase()] || value;
  const labelLocation = (value: string) => locationLabels[String(value || "").toUpperCase()] || value;
  const labelOrigin = (value: string) => originLabels[String(value || "").toUpperCase()] || value;
  const [pontos, setPontos] =
    useState<RegistroPonto[]>([]);

  const [filtros, setFiltros] =
    useState<Filtros>(
      FILTROS_INICIAIS
    );

  const [
    filtrosAplicados,
    setFiltrosAplicados,
  ] = useState<Filtros>(
    FILTROS_INICIAIS
  );

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

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

    const [
  erroModalAutorizacao,
  setErroModalAutorizacao,
] = useState("");

  const [
    responsavelAtual,
    setResponsavelAtual,
  ] = useState<ResponsavelAtual | null>(
    null
  );

  const [sucesso, setSucesso] =
    useState("");

  const [
    modalAutorizacaoAberto,
    setModalAutorizacaoAberto,
  ] = useState(false);

  const [
    modoModalAutorizacao,
    setModoModalAutorizacao,
  ] = useState<
    "AUTORIZAR" | "CANCELAR"
  >("AUTORIZAR");

  const [
    pontoAutorizacao,
    setPontoAutorizacao,
  ] = useState<RegistroPonto | null>(
    null
  );

  const [
    motivoAutorizacao,
    setMotivoAutorizacao,
  ] = useState("");

  const [
    validoAte,
    setValidoAte,
  ] = useState(
    valorDataHoraLocalPadrao()
  );

  const [
    motivoCancelamento,
    setMotivoCancelamento,
  ] = useState("");

  const [
    processandoAutorizacao,
    setProcessandoAutorizacao,
  ] = useState(false);

  const [
  modalCorrecaoRHAberto,
  setModalCorrecaoRHAberto,
] = useState(false);

const [
  pontoCorrecaoRH,
  setPontoCorrecaoRH,
] = useState<RegistroPonto | null>(
  null
);

const [
  marcacoesCorrecaoRH,
  setMarcacoesCorrecaoRH,
] = useState<MarcacaoCorrecaoRH[]>(
  []
);

const [
  motivoCorrecaoRH,
  setMotivoCorrecaoRH,
] = useState("");

const [
  processandoCorrecaoRH,
  setProcessandoCorrecaoRH,
] = useState(false);

const [
  erroModalCorrecaoRH,
  setErroModalCorrecaoRH,
] = useState("");

  const [
    pontoExpandidoId,
    setPontoExpandidoId,
  ] = useState<number | null>(null);


  const carregarPontos =
    useCallback(
      async (
        paginaAlvo: number,
        filtrosAtuais: Filtros
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
            "20"
          );

          if (
            filtrosAtuais.busca.trim()
          ) {
            parametros.set(
              "busca",
              filtrosAtuais.busca.trim()
            );
          }

          if (
            filtrosAtuais.dataInicio
          ) {
            parametros.set(
              "dataInicio",
              filtrosAtuais.dataInicio
            );
          }

          if (filtrosAtuais.dataFim) {
            parametros.set(
              "dataFim",
              filtrosAtuais.dataFim
            );
          }

          parametros.set(
            "tipo",
            filtrosAtuais.tipo
          );

          parametros.set(
            "statusMarcacao",
            filtrosAtuais
              .statusMarcacao
          );

          parametros.set(
            "statusPonto",
            filtrosAtuais.statusPonto
          );

          const resposta = await fetch(
            `/api/admin/rh/ponto?${parametros.toString()}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

          const dados: RespostaPontos =
            await resposta.json();

          if (!resposta.ok) {
            throw new Error(
              (locale.startsWith("pt") && dados.error) || t("loadError")
            );
          }

          setPontos(
            Array.isArray(dados.pontos)
              ? dados.pontos
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

          setResponsavelAtual(
            dados.responsavelAtual ||
              null
          );
        } catch (error) {
          setPontos([]);

          setErro(
            error instanceof Error
              ? error.message
              : t("loadError")
          );
        } finally {
          setLoading(false);
        }
      },
      [t, locale]
    );

  useEffect(() => {
    carregarPontos(
      1,
      FILTROS_INICIAIS
    );
  }, [carregarPontos]);

  const quantidadeMarcacoes =
    useMemo(() => {
      return pontos.reduce(
        (totalAtual, ponto) =>
          totalAtual +
          marcacoesParaExibir(
            ponto
          ).length,
        0
      );
    }, [pontos]);

  function aplicarFiltros() {
    setPontoExpandidoId(null);
    setFiltrosAplicados(filtros);

    carregarPontos(1, filtros);
  }

  function limparFiltros() {
    setFiltros(
      FILTROS_INICIAIS
    );

    setFiltrosAplicados(
      FILTROS_INICIAIS
    );

    setPontoExpandidoId(null);

    carregarPontos(
      1,
      FILTROS_INICIAIS
    );
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

    setPontoExpandidoId(null);

    carregarPontos(
      novaPagina,
      filtrosAplicados
    );
  }

  function abrirModalAutorizar(
    ponto: RegistroPonto
  ) {
    setPontoAutorizacao(ponto);
    setModoModalAutorizacao(
      "AUTORIZAR"
    );

    setMotivoAutorizacao("");
    setMotivoCancelamento("");

    setValidoAte(
      valorDataHoraLocalPadrao()
    );

    setErro("");
    setErroModalAutorizacao("");
    setSucesso("");

    setModalAutorizacaoAberto(
      true
    );
  }

  function abrirModalCancelar(
    ponto: RegistroPonto
  ) {
    setPontoAutorizacao(ponto);
    setModoModalAutorizacao(
      "CANCELAR"
    );

    setMotivoCancelamento("");
    setErro("");
    setErroModalAutorizacao("");
    setSucesso("");

    setModalAutorizacaoAberto(
      true
    );
  }

  function fecharModalAutorizacao() {
    if (processandoAutorizacao) {
      return;
    }

    setModalAutorizacaoAberto(
      false
    );
    setErroModalAutorizacao("");
    setPontoAutorizacao(null);
  }

  async function enviarAutorizacao() {
    if (!pontoAutorizacao) {
      return;
    }

    try {
      setProcessandoAutorizacao(
        true
      );

      setErroModalAutorizacao("");
      setSucesso("");

      if (
        motivoAutorizacao
          .trim()
          .length < 10
      ) {
        throw new Error(
          t("authorizationReasonMin")
        );
      }

      if (!validoAte) {
        throw new Error(
          t("authorizationExpiryRequired")
        );
      }

      const validadeIso =
        new Date(
          validoAte
        ).toISOString();

      const resposta = await fetch(
        "/api/admin/rh/ponto/autorizacoes",
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            pontoFuncionarioRHId:
              pontoAutorizacao.id,

            motivoAutorizacao:
              motivoAutorizacao.trim(),

            validoAte:
              validadeIso,
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          (locale.startsWith("pt") && dados.error) || t("authorizationError")
        );
      }

      setSucesso(
        (locale.startsWith("pt") && dados.mensagem) || t("authorizationSuccess")
      );

      setModalAutorizacaoAberto(
        false
      );

      setPontoAutorizacao(null);

      await carregarPontos(
        pagina,
        filtrosAplicados
      );
    } catch (error) {
      setErroModalAutorizacao(
  error instanceof Error
    ? error.message
    : t("authorizationError")
);
    } finally {
      setProcessandoAutorizacao(
        false
      );
    }
  }

  async function cancelarAutorizacao() {
    const autorizacao =
      pontoAutorizacao
        ?.autorizacaoCorrecao;

    if (
      !pontoAutorizacao ||
      !autorizacao
    ) {
      return;
    }

    try {
      setProcessandoAutorizacao(
        true
      );

      setErro("");
      setSucesso("");

      if (
        motivoCancelamento
          .trim()
          .length < 5
      ) {
        throw new Error(
          t("cancellationReasonRequired")
        );
      }

      const resposta = await fetch(
        "/api/admin/rh/ponto/autorizacoes",
        {
          method: "DELETE",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            autorizacaoId:
              autorizacao.id,

            motivoCancelamento:
              motivoCancelamento
                .trim(),
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          (locale.startsWith("pt") && dados.error) || t("cancellationError")
        );
      }

      setSucesso(
        (locale.startsWith("pt") && dados.mensagem) || t("cancellationSuccess")
      );

      setModalAutorizacaoAberto(
        false
      );

      setPontoAutorizacao(null);

      await carregarPontos(
        pagina,
        filtrosAplicados
      );
    } catch (error) {
      setErroModalAutorizacao(
  error instanceof Error
    ? error.message
    : t("cancellationError")
);
    } finally {
      setProcessandoAutorizacao(
        false
      );
    }
  }

  function abrirModalCorrecaoRH(
  ponto: RegistroPonto
) {
  const marcacoesValidas =
    marcacoesParaExibir(ponto)
      .filter(
        (marcacao) =>
          String(
            marcacao.status || ""
          ).toUpperCase() !==
          "INVALIDADA"
      )
      .map((marcacao) => ({
        id:
          marcacao.id > 0
            ? marcacao.id
            : null,

        tipo:
          ehEntrada(marcacao.tipo)
            ? ("ENTRADA" as const)
            : ("SAIDA" as const),

        hora:
          formatarHoraParaEdicao(
            marcacao.dataHora,
            fusoHorario
          ),
      }));

  setPontoCorrecaoRH(ponto);

  setMarcacoesCorrecaoRH(
    marcacoesValidas
  );

  setMotivoCorrecaoRH("");
  setErroModalCorrecaoRH("");
  setErro("");
  setSucesso("");

  setModalCorrecaoRHAberto(true);
}

function fecharModalCorrecaoRH() {
  if (processandoCorrecaoRH) {
    return;
  }

  setModalCorrecaoRHAberto(false);
  setPontoCorrecaoRH(null);
  setMarcacoesCorrecaoRH([]);
  setMotivoCorrecaoRH("");
  setErroModalCorrecaoRH("");
}

function adicionarMarcacaoCorrecaoRH(
  tipo: "ENTRADA" | "SAIDA"
) {
  setMarcacoesCorrecaoRH(
    (marcacoesAtuais) => [
      ...marcacoesAtuais,
      {
        id: null,
        tipo,
        hora: "",
      },
    ]
  );
}

function alterarMarcacaoCorrecaoRH(
  indice: number,
  alteracao: Partial<MarcacaoCorrecaoRH>
) {
  setMarcacoesCorrecaoRH(
    (marcacoesAtuais) =>
      marcacoesAtuais.map(
        (marcacao, indiceAtual) =>
          indiceAtual === indice
            ? {
                ...marcacao,
                ...alteracao,
              }
            : marcacao
      )
  );
}

function removerMarcacaoCorrecaoRH(
  indice: number
) {
  setMarcacoesCorrecaoRH(
    (marcacoesAtuais) =>
      marcacoesAtuais.filter(
        (_, indiceAtual) =>
          indiceAtual !== indice
      )
  );
}

async function enviarCorrecaoRH() {
  if (!pontoCorrecaoRH) {
    return;
  }

  try {
    setProcessandoCorrecaoRH(true);
    setErroModalCorrecaoRH("");
    setSucesso("");

    if (
      motivoCorrecaoRH.trim().length <
      10
    ) {
      throw new Error(
        t("correctionReasonMin")
      );
    }

    if (
      marcacoesCorrecaoRH.length === 0
    ) {
      throw new Error(
        t("markingRequired")
      );
    }

    if (
      marcacoesCorrecaoRH.length > 20
    ) {
      throw new Error(
        t("markingLimit")
      );
    }

    const possuiHorarioVazio =
      marcacoesCorrecaoRH.some(
        (marcacao) =>
          !marcacao.hora.trim()
      );

    if (possuiHorarioVazio) {
      throw new Error(
        t("markingTimeRequired")
      );
    }

    const resposta = await fetch(
      "/api/admin/rh/ponto/correcoes-rh",
      {
        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          pontoFuncionarioRHId:
            pontoCorrecaoRH.id,

          motivoCorrecaoRH:
            motivoCorrecaoRH.trim(),

          marcacoes:
            marcacoesCorrecaoRH.map(
              (marcacao) => ({
                id: marcacao.id,
                tipo: marcacao.tipo,
                hora: marcacao.hora,
              })
            ),
        }),
      }
    );

    const dados =
      await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        (locale.startsWith("pt") && dados?.error) || t("correctionError")
      );
    }

    setSucesso(
      (locale.startsWith("pt") && dados?.mensagem) || t("correctionSuccess")
    );

    setModalCorrecaoRHAberto(false);
    setPontoCorrecaoRH(null);
    setMarcacoesCorrecaoRH([]);
    setMotivoCorrecaoRH("");

    await carregarPontos(
      pagina,
      filtrosAplicados
    );
  } catch (error) {
    setErroModalCorrecaoRH(
      error instanceof Error
        ? error.message
        : t("correctionError")
    );
  } finally {
    setProcessandoCorrecaoRH(false);
  }
}

  return (
    <div className="phanyx-rh-page w-full max-w-full space-y-6 overflow-x-hidden px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{t("title")}</h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {sucesso}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("shiftsFound")}</p>

          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {total}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("pageMarkings")}</p>

          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {quantidadeMarcacoes}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("timeZone")}</p>

          <p className="mt-2 break-words text-sm font-black text-slate-950 dark:text-white">
            {fusoHorario}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("employee")}</label>

            <input
              value={filtros.busca}
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,
                    busca:
                      evento.target.value,
                  })
                )
              }
              placeholder={t("employeeSearchPlaceholder")}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("startDate")}</label>

            <input
              type="date"
              value={
                filtros.dataInicio
              }
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,
                    dataInicio:
                      evento.target.value,
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("endDate")}</label>

            <input
              type="date"
              value={filtros.dataFim}
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,
                    dataFim:
                      evento.target.value,
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("type")}</label>

            <select
              value={filtros.tipo}
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,
                    tipo:
                      evento.target
                        .value as Filtros["tipo"],
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="TODOS">{t("entryAndExit")}</option>

              <option value="ENTRADA">{t("entry")}</option>

              <option value="SAIDA">{t("exit")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("situation")}</label>

            <select
              value={
                filtros.statusMarcacao
              }
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,

                    statusMarcacao:
                      evento.target
                        .value as Filtros["statusMarcacao"],
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="TODOS">{t("all")}</option>

              <option value="VALIDA">{t("validPlural")}</option>

              <option value="INVALIDADA">{t("invalidPlural")}</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={aplicarFiltros}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? t("loading")
              : t("search")}
          </button>

          <button
            type="button"
            onClick={limparFiltros}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >{t("clearFilters")}</button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">{t("records")}</h2>

        {loading ? (
  <div className="rounded-2xl border !border-slate-200 !bg-slate-50 p-5 text-sm font-bold !text-slate-700 shadow-sm dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200">{t("loadingRecords")}</div>
) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700">
                  <th className="px-3 py-3">{t("employee")}</th>

                  <th className="px-3 py-3">{t("date")}</th>

                  <th className="px-3 py-3">{t("dayMarkings")}</th>

                  <th className="px-3 py-3">{t("worked")}</th>

                  <th className="px-3 py-3">{t("overtime")}</th>

                  <th className="px-3 py-3">{t("late")}</th>

                  <th className="px-3 py-3">{t("balance")}</th>

                  <th className="px-3 py-3">{t("status")}</th>

                  <th className="min-w-[190px] px-3 py-3 text-center">{t("actions")}</th>
                </tr>
              </thead>

              <tbody>
                {pontos.map((ponto) => {
                  const marcacoes =
                    marcacoesParaExibir(
                      ponto
                    );

                    const marcacoesValidas =
  marcacoes.filter(
    (marcacao) =>
      marcacao.status !==
      "INVALIDADA"
  );

const marcacoesSubstituidas =
  marcacoes.filter(
    (marcacao) =>
      marcacao.status ===
      "INVALIDADA"
  );

                  const expandido =
                    pontoExpandidoId ===
                    ponto.id;

                  const saldo =
                    saldoBanco(ponto);

                  return (
                    <Fragment key={ponto.id}>
                      <tr
                        className="border-b border-slate-100 align-top text-slate-700 dark:border-slate-800 dark:text-slate-200"
                      >
                        <td className="px-3 py-4">
                          <div className="font-bold">
                            {ponto.funcionario
                              ?.nome || "-"}
                          </div>

                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {ponto.funcionario
                              ?.cargo || "-"}

                            {ponto.funcionario
                              ?.departamento
                              ?.nome
                              ? ` • ${ponto.funcionario.departamento.nome}`
                              : ""}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 font-bold">
                          {displayDate(
                            ponto.dataLocal
                          )}
                        </td>

                        <td className="px-3 py-4">
                          {marcacoesValidas.length === 0 ? (
                            <span className="text-slate-500">{t("noMarkings")}</span>
                          ) : (
                            <div className="flex max-w-[420px] flex-wrap gap-2">
                              {marcacoesValidas.map(
                                (marcacao) => (
                                  <span
                                    key={
                                      marcacao.id
                                    }
                                    className={`rounded-full border px-3 py-1.5 text-xs font-black ${
  ehEntrada(marcacao.tipo)
    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
    : "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
}`}
                                  >
                                    {displayTime(
                                      marcacao.dataHora,
                                      fusoHorario
                                    )}{" "}
                                    {displayType(
                                      marcacao.tipo
                                    )}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 font-bold">
  {formatarHorasDecimais(
    ponto.horasTrabalhadas
  )}
</td>

<td className="whitespace-nowrap px-3 py-4 font-bold text-emerald-600 dark:text-emerald-400">
  {formatarHorasDecimais(
    ponto.horasExtras
  )}
</td>

<td className="whitespace-nowrap px-3 py-4 font-bold text-red-600 dark:text-red-400">
  {formatarHorasDecimais(
    ponto.horasAtraso
  )}
</td>

                        <td
                          className={`px-3 py-4 font-black ${
                            saldo >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatarHorasDecimais(
  saldo,
  true
)}
                        </td>

                        <td className="px-3 py-4">
                          <span
  className={`inline-flex min-w-[104px] items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide ${classeStatusPonto(
    ponto.status
  )}`}
>
  {labelStatus(ponto.status)}
</span>
                        </td>

                        <td className="min-w-[190px] px-3 py-4">
  <div className="mx-auto flex w-[175px] flex-col gap-2">
    <button
      type="button"
      onClick={() =>
        setPontoExpandidoId(
          expandido ? null : ponto.id
        )
      }
      className="min-h-9 w-full rounded-xl border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-black !text-white shadow-sm transition hover:border-blue-700 hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
    >
      {expandido
        ? t("hideDetails")
        : t("viewDetails")}
    </button>

    {ponto.autorizacaoCorrecao?.status ===
    "ATIVA" ? (
      <>
        <span className="flex min-h-9 w-full items-center justify-center rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">{t("correctionAuthorized")}</span>

        <button
          type="button"
          onClick={() =>
            abrirModalCancelar(ponto)
          }
          className="min-h-9 w-full rounded-xl border border-red-600 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/60"
        >{t("cancelAuthorization")}</button>
      </>
    ) : (
      <button
        type="button"
        onClick={() =>
          abrirModalAutorizar(ponto)
        }
        className="min-h-9 w-full rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-black !text-white shadow-sm transition hover:border-emerald-700 hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >{t("authorizeCorrection")}</button>
    )}
    <button
  type="button"
  onClick={() =>
    abrirModalCorrecaoRH(ponto)
  }
  className="min-h-9 w-full rounded-xl border border-amber-500 bg-amber-500 px-3 py-2 text-xs font-black !text-slate-950 shadow-sm transition hover:border-amber-600 hover:bg-amber-600 dark:border-amber-400 dark:bg-amber-500 dark:!text-slate-950 dark:hover:bg-amber-400"
>{t("correctByHr")}</button>
  </div>
</td>
                      </tr>

                      {expandido && (
                        <tr
                          key={`${ponto.id}-detalhes`}
                          className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50"
                        >
                          <td
  colSpan={9}
  className="sticky left-0 z-10 bg-slate-50 px-4 py-5 dark:bg-slate-950"
>
                            <div className="grid gap-3 lg:grid-cols-2">
                              {marcacoesValidas.map(
                                (
                                  marcacao,
                                  indice
                                ) => (
                                  <div
                                    key={
                                      marcacao.id
                                    }
                                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-black text-slate-950 dark:text-white">
                                          {t("markingNumberWithType", { number: indice + 1, type: displayType(marcacao.tipo) })}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                          {displayTime(
                                            marcacao.dataHora,
                                            fusoHorario
                                          )}
                                        </p>
                                      </div>

                                      <span
                                        className={`rounded-full px-3 py-1 text-xs font-black ${
                                          marcacao.status ===
                                          "INVALIDADA"
                                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200"
                                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                                        }`}
                                      >
                                        {labelStatus(marcacao.status)}
                                      </span>
                                    </div>

                                    <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                      <p>
                                        {t("locationLabel")}{" "}
                                        {marcacao.localNome ||
                                          t("notProvided")}
                                      </p>

                                      <p>
                                        {t("locationSituationLabel")}{" "}
                                        {labelLocation(marcacao.statusLocalizacao)}
                                      </p>

                                      <p>
                                        {t("originLabel")}{" "}
                                        {labelOrigin(marcacao.origem)}
                                      </p>

                                      <p className="break-all">
                                        {t("receiptLabel")}{" "}
                                        {
                                          marcacao.comprovanteCodigo
                                        }
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

{marcacoesSubstituidas.length > 0 && (
  <details className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
    <summary className="cursor-pointer font-black text-red-700 dark:text-red-200">
      {t("replacedMarkings", { count: marcacoesSubstituidas.length })}
    </summary>

    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {marcacoesSubstituidas.map(
        (marcacao) => (
          <div
            key={marcacao.id}
            className="rounded-2xl border border-red-300 bg-white p-4 text-red-700 line-through dark:border-red-900 dark:bg-slate-900 dark:text-red-200"
          >
            <p className="font-black">
              {displayType(
                marcacao.tipo
              )}
            </p>

            <p className="mt-1 text-sm">
              {displayTime(
                marcacao.dataHora,
                fusoHorario
              )}
            </p>

            <p className="mt-2 text-xs no-underline">{t("originalPreserved")}</p>
          </div>
        )
      )}
    </div>
  </details>
)}

                            {marcacoesValidas.length === 0 && (
                              <p className="text-sm text-slate-500">{t("noIndividualMarkings")}</p>
                            )}

                            {ponto
                              .autorizacaoCorrecao && (
                              <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                                <p className="font-black">{t("correctionAuthorization")}</p>

                                <p className="mt-2">
                                  <strong>{t("situationLabel")}</strong>{" "}
                                  {labelStatus(ponto.autorizacaoCorrecao.status)}
                                </p>

                                <p className="mt-1">
                                  <strong>{t("authorizedByLabel")}</strong>{" "}
                                  {
                                    ponto
                                      .autorizacaoCorrecao
                                      .autorizadoPor
                                      .nome
                                  }
                                </p>

                                <p className="mt-1">
                                  <strong>{t("validUntilLabel")}</strong>{" "}
                                  {displayDateTime(
                                    ponto
                                      .autorizacaoCorrecao
                                      .validoAte
                                  )}
                                </p>

                                <p className="mt-1">
                                  <strong>{t("reasonLabel")}</strong>{" "}
                                  {
                                    ponto
                                      .autorizacaoCorrecao
                                      .motivoAutorizacao
                                  }
                                </p>
                              </div>
                            )}

                            {ponto.observacoes && (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                <strong>{t("notesLabel")}</strong>{" "}
                                {
                                  ponto.observacoes
                                }
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            disabled={
              pagina <= 1 || loading
            }
            onClick={() =>
              mudarPagina(pagina - 1)
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >{t("previous")}</button>

          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {t("pagination", { page: pagina, total: totalPaginas })}
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
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >{t("next")}</button>
        </div>
      </section>

      {modalAutorizacaoAberto &&
        pontoAutorizacao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-300 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">{t("timeCorrection")}</p>

                <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                  {modoModalAutorizacao ===
                  "AUTORIZAR"
                    ? t("authorizeEmployee")
                    : t("cancelAuthorization")}
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  processandoAutorizacao
                }
                onClick={
                  fecharModalAutorizacao
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-xl font-black text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                aria-label={t("close")}
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <p className="font-black text-slate-950 dark:text-white">
                {
                  pontoAutorizacao
                    .funcionario.nome
                }
              </p>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("recordOf")}{" "}
                {displayDate(
                  pontoAutorizacao
                    .dataLocal
                )}
              </p>
            </div>

{erroModalAutorizacao && (
  <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
    {erroModalAutorizacao}
  </div>
)}

            {modoModalAutorizacao ===
            "AUTORIZAR" ? (
              <>
                <div className="mt-5">
                  <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("authorizedBy")}</label>

                  <div className="rounded-xl border border-slate-300 bg-slate-100 p-3 font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    {responsavelAtual?.nome ||
                      t("connectedHrUser")}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {t("authorizedByExplanation")}
                  </p>
                </div>

                <div className="mt-5">
                  <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("authorizationReason")}</label>

                  <textarea
                    value={
                      motivoAutorizacao
                    }
                    onChange={(evento) =>
                      setMotivoAutorizacao(
                        evento.target
                          .value
                      )
                    }
                    placeholder={t("authorizationReasonPlaceholder")}
                    className="min-h-[120px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
  {t("minimumCharacters", { count: motivoAutorizacao.trim().length })}
</p>
                </div>

                <div className="mt-5">
                  <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("authorizationValidUntil")}</label>

                  <input
                    type="datetime-local"
                    value={validoAte}
                    onChange={(evento) =>
                      setValidoAte(
                        evento.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <p>
                    <strong>{t("authorizedByLabel")}</strong>{" "}
                    {
                      pontoAutorizacao
                        .autorizacaoCorrecao
                        ?.autorizadoPor
                        .nome
                    }
                  </p>

                  <p className="mt-1">
                    <strong>{t("validUntilLabel")}</strong>{" "}
                    {pontoAutorizacao
                      .autorizacaoCorrecao
                      ? displayDateTime(
                          pontoAutorizacao
                            .autorizacaoCorrecao
                            .validoAte
                        )
                      : "-"}
                  </p>
                </div>

                <div className="mt-5">
                  <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("cancellationReason")}</label>

                  <textarea
                    value={
                      motivoCancelamento
                    }
                    onChange={(evento) =>
                      setMotivoCancelamento(
                        evento.target
                          .value
                      )
                    }
                    placeholder={t("cancellationReasonPlaceholder")}
                    className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  processandoAutorizacao
                }
                onClick={
                  fecharModalAutorizacao
                }
                className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-black text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >{t("back")}</button>

              <button
                type="button"
                disabled={
                  processandoAutorizacao
                }
                onClick={
                  modoModalAutorizacao ===
                  "AUTORIZAR"
                    ? enviarAutorizacao
                    : cancelarAutorizacao
                }
                className={`min-h-12 rounded-xl px-4 py-3 font-black text-white disabled:opacity-50 ${
                  modoModalAutorizacao ===
                  "AUTORIZAR"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processandoAutorizacao
                  ? t("processing")
                  : modoModalAutorizacao ===
                      "AUTORIZAR"
                    ? t("authorizeCorrection")
                    : t("cancelAuthorization")}
              </button>
            </div>
          </section>
        </div>
      
      
      )}
      {modalCorrecaoRHAberto &&
  pontoCorrecaoRH && (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-300 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">{t("administrativeCorrection")}</p>

            <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{t("correctRecordByHr")}</h2>
          </div>

          <button
            type="button"
            disabled={
              processandoCorrecaoRH
            }
            onClick={
              fecharModalCorrecaoRH
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-xl font-black text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
            aria-label={t("close")}
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
          <p className="font-black text-slate-950 dark:text-white">
            {
              pontoCorrecaoRH
                .funcionario.nome
            }
          </p>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("recordOf")}{" "}
            {displayDate(
              pontoCorrecaoRH.dataLocal
            )}
          </p>
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("correctedBy")}</label>

          <div className="rounded-xl border border-slate-300 bg-slate-100 p-3 font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            {responsavelAtual?.nome ||
              t("connectedHrManager")}
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t("correctedByExplanation")}
          </p>
        </div>

        {erroModalCorrecaoRH && (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {erroModalCorrecaoRH}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {marcacoesCorrecaoRH.map(
            (marcacao, indice) => (
              <div
                key={`${marcacao.id || "nova"}-${indice}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-900 dark:text-white">
                    {t("markingNumber", { number: indice + 1 })}
                  </p>

                  <button
                    type="button"
                    disabled={
                      processandoCorrecaoRH
                    }
                    onClick={() =>
                      removerMarcacaoCorrecaoRH(
                        indice
                      )
                    }
                    className="rounded-xl border border-red-500 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-200 dark:hover:bg-red-950/30"
                  >{t("remove")}</button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select
                    value={marcacao.tipo}
                    disabled={
                      processandoCorrecaoRH
                    }
                    onChange={(evento) =>
                      alterarMarcacaoCorrecaoRH(
                        indice,
                        {
                          tipo:
                            evento.target
                              .value as
                              | "ENTRADA"
                              | "SAIDA",
                        }
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="ENTRADA">{t("entry")}</option>

                    <option value="SAIDA">{t("exit")}</option>
                  </select>

                  <input
                    type="time"
                    value={marcacao.hora}
                    disabled={
                      processandoCorrecaoRH
                    }
                    onChange={(evento) =>
                      alterarMarcacaoCorrecaoRH(
                        indice,
                        {
                          hora:
                            evento.target
                              .value,
                        }
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            )
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={
              processandoCorrecaoRH
            }
            onClick={() =>
              adicionarMarcacaoCorrecaoRH(
                "ENTRADA"
              )
            }
            className="min-h-12 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-3 font-black text-emerald-800 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-200"
          >{t("addEntry")}</button>

          <button
            type="button"
            disabled={
              processandoCorrecaoRH
            }
            onClick={() =>
              adicionarMarcacaoCorrecaoRH(
                "SAIDA"
              )
            }
            className="min-h-12 rounded-xl border border-blue-600 bg-blue-50 px-4 py-3 font-black text-blue-800 disabled:opacity-50 dark:bg-blue-950/30 dark:text-blue-200"
          >{t("addExit")}</button>
        </div>

        <div className="mt-6">
          <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">{t("requiredCorrectionReason")}</label>

          <textarea
            value={motivoCorrecaoRH}
            disabled={
              processandoCorrecaoRH
            }
            onChange={(evento) =>
              setMotivoCorrecaoRH(
                evento.target.value
              )
            }
            placeholder={t("correctionReasonPlaceholder")}
            className="min-h-[130px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t("minimumCharacters", { count: motivoCorrecaoRH.trim().length })}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{t("auditPreservation")}</div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={
              processandoCorrecaoRH
            }
            onClick={
              fecharModalCorrecaoRH
            }
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-black text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >{t("back")}</button>

          <button
            type="button"
            disabled={
              processandoCorrecaoRH
            }
            onClick={enviarCorrecaoRH}
            className="min-h-12 rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950 hover:bg-amber-600 disabled:opacity-50"
          >
            {processandoCorrecaoRH
              ? t("applyingCorrection")
              : t("confirmCorrection")}
          </button>
        </div>
      </section>
    </div>
  )}
    </div>
  );
}
