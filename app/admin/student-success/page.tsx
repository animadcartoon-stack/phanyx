"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

type NivelRisco =
  | "NORMAL"
  | "ATENCAO"
  | "RISCO"
  | "CRITICO"
  | "DADOS_INSUFICIENTES";

type Confiabilidade =
  | "BAIXA"
  | "MEDIA"
  | "ALTA";

type FiltroNivel =
  | "TODOS"
  | NivelRisco;

type TipoIntervencao =
  | "CONTATO"
  | "ORIENTACAO"
  | "REUNIAO"
  | "ENCAMINHAMENTO"
  | "ACOMPANHAMENTO"
  | "OUTRO";

type CanalIntervencao =
  | "WHATSAPP"
  | "LIGACAO"
  | "EMAIL"
  | "PRESENCIAL"
  | "VIDEOCHAMADA"
  | "SISTEMA"
  | "OUTRO";

type StatusIntervencao =
  | "REGISTRADA"
  | "AGUARDANDO_RETORNO"
  | "EM_ACOMPANHAMENTO"
  | "RESOLVIDA"
  | "CANCELADA";

type FiltroRetorno =
  | "TODOS"
  | "ATRASADOS"
  | "HOJE"
  | "PROXIMOS_7_DIAS"
  | "SEM_RETORNO";

type FiltroPrioridade =
  | "TODOS"
  | "HOJE"
  | "ATRASADOS"
  | "PIORA"
  | "SEM_RETORNO";

type PeriodoIntervencoes =
  | "TODOS"
  | "HOJE"
  | "ULTIMOS_7_DIAS"
  | "ULTIMOS_30_DIAS"
  | "PERSONALIZADO";

type FiltroStatusIntervencao =
  | "TODOS"
  | StatusIntervencao;

type FiltroTipoIntervencao =
  | "TODOS"
  | TipoIntervencao;

type StudentSuccessIntervencao = {
  id: number;

  tipo: TipoIntervencao;
  canal: CanalIntervencao;
  status: StatusIntervencao;

  observacao: string;

  retornoEm:
  | string
  | null;

  resultado:
  | string
  | null;

  /* Fotografia no registro */

  nivelRiscoNoRegistro: string;

  pontuacaoNoRegistro:
  | number
  | null;

  coberturaNoRegistro: number;

  confiabilidadeNoRegistro: string;

  fatoresNoRegistro:
  | unknown[]
  | null;

  indicadoresNoRegistro:
  | {
    frequenciaPercentual:
    | number
    | null;

    quantidadeAulas:
    number;

    mediaPercentual:
    | number
    | null;

    quantidadeAvaliacoes:
    number;

    atividadesVencidas:
    number;

    totalAtividadesConsideradas:
    number;

    mediaAnteriorPercentual:
    | number
    | null;

    mediaRecentePercentual:
    | number
    | null;

    quedaDesempenhoPercentual:
    | number
    | null;
  }
  | null;

  /* Fotografia no encerramento */

  nivelRiscoNoEncerramento:
  | string
  | null;

  pontuacaoNoEncerramento:
  | number
  | null;

  coberturaNoEncerramento:
  | number
  | null;

  confiabilidadeNoEncerramento:
  | string
  | null;

  fatoresNoEncerramento:
  | unknown[]
  | null;

  indicadoresNoEncerramento:
  | {
    frequenciaPercentual:
    | number
    | null;

    quantidadeAulas:
    number;

    mediaPercentual:
    | number
    | null;

    quantidadeAvaliacoes:
    number;

    atividadesVencidas:
    number;

    totalAtividadesConsideradas:
    number;

    mediaAnteriorPercentual:
    | number
    | null;

    mediaRecentePercentual:
    | number
    | null;

    quedaDesempenhoPercentual:
    | number
    | null;
  }
  | null;

  criadoEm: string;

  atualizadoEm: string;

  concluidoEm:
  | string
  | null;

  criadoPor:
  | {
    id: number;
    nome: string;
    email?: string;
  }
  | null;
};

type ComponenteAnalise = {
  codigo:
  | "FREQUENCIA"
  | "DESEMPENHO"
  | "PENDENCIAS"
  | "QUEDA_DESEMPENHO"
  | "PARTICIPACAO";

  titulo: string;
  pontos: number;
  maximo: number;
  disponivel: boolean;
  detalhe: string;
};

type AlunoStudentSuccess = {
  alunoId: number;

  nome: string;

  matricula:
  | string
  | null;

  contato: {
    telefone:
    | string
    | null;

    paisTelefone:
    | string
    | null;

    email:
    | string
    | null;

    responsavel: {
      nome:
      | string
      | null;

      parentesco:
      | string
      | null;

      telefone:
      | string
      | null;

      paisTelefone:
      | string
      | null;

      email:
      | string
      | null;
    };
  };

  indicadores: {
    frequenciaPercentual:
    | number
    | null;

    quantidadeAulas:
    number;

    mediaPercentual:
    | number
    | null;

    quantidadeAvaliacoes:
    number;

    atividadesVencidas:
    number;

    totalAtividadesConsideradas:
    number;

    mediaAnteriorPercentual:
    | number
    | null;

    mediaRecentePercentual:
    | number
    | null;

    quedaDesempenhoPercentual:
    | number
    | null;
  };

  analise: {
    pontuacao: number;

    pontuacaoBruta:
    number;

    maximoDisponivel:
    number;

    nivel:
    NivelRisco;

    coberturaPercentual:
    number;

    confiabilidade:
    Confiabilidade;

    componentes:
    ComponenteAnalise[];

    fatoresPrincipais:
    ComponenteAnalise[];
  };
};

type StudentSuccessResponse = {
  ok: boolean;

  geradoEm:
  string;

  resumo: {
    monitorados:
    number;

    critico:
    number;

    risco:
    number;

    atencao:
    number;

    normal:
    number;

    dadosInsuficientes:
    number;

    alunosComSinais:
    number;
  };

  alunos:
  AlunoStudentSuccess[];
};

type CardResumoProps = {
  valor:
  string;

  titulo:
  string;

  variante:
  | "critical"
  | "risk"
  | "attention"
  | "normal"
  | "insufficient";
};

type ResumoIntervencoesStudentSuccess = {
  ok: boolean;

  acompanhamento: {
    total: number;

    abertas: number;

    registradas: number;

    aguardandoRetorno: number;

    emAcompanhamento: number;

    resolvidas: number;

    canceladas: number;
  };

  efetividade: {
    resolvidasMensuraveis: number;

    evolucaoPositiva: number;

    evolucaoNegativa: number;

    evolucaoNeutra: number;

    naoMensuravel: number;

    percentualEvolucaoPositiva:
    | number
    | null;

    tempoMedioResolucaoDias:
    | number
    | null;

    alunosComPiora: number;

    amostraSuficiente:
    boolean;

    amostraMinima:
    number;
  };
};

type RetornoStudentSuccess = {
  id: number;

  alunoId: number;

  tipo:
  TipoIntervencao;

  canal:
  CanalIntervencao;

  status:
  StatusIntervencao;

  observacao:
  string;

  retornoEm:
  | string
  | null;

  criadoEm:
  string;

  atualizadoEm:
  string;

  aluno: {
    id: number;

    nome: string;

    matricula:
    | string
    | null;
  };

  criadoPor:
  | {
    id: number;
    nome: string;
    email?: string;
  }
  | null;
};

type RetornosStudentSuccessResponse = {
  ok: boolean;

  resumo: {
    abertas: number;

    comRetorno: number;

    semRetorno: number;
  };

  intervencoes:
  RetornoStudentSuccess[];
};

type PrioridadeIntervencaoAberta = {
  id: number;

  alunoId: number;

  tipo:
  TipoIntervencao;

  canal:
  CanalIntervencao;

  status:
  StatusIntervencao;

  observacao:
  string;

  retornoEm:
  | string
  | null;

  criadoEm:
  string;

  atualizadoEm:
  string;

  aluno: {
    id: number;

    nome: string;

    matricula:
    | string
    | null;
  };
};

type PrioridadePioraIntervencao = {
  id: number;

  alunoId: number;

  tipo:
  TipoIntervencao;

  canal:
  CanalIntervencao;

  status:
  StatusIntervencao;

  observacao:
  string;

  resultado:
  | string
  | null;

  criadoEm:
  string;

  concluidoEm:
  | string
  | null;

  aluno: {
    id: number;

    nome: string;

    matricula:
    | string
    | null;
  };

  evolucao:
  unknown;
};

type PrioridadesStudentSuccessResponse = {
  ok: boolean;

  resumo: {
    abertas: number;

    comRetorno: number;

    semRetorno: number;

    pioraAposIntervencao: number;
  };

  comRetorno:
  PrioridadeIntervencaoAberta[];

  semRetorno:
  PrioridadeIntervencaoAberta[];

  pioraAposIntervencao:
  PrioridadePioraIntervencao[];
};

type TipoEventoTimeline =
  | "INTERVENCAO_REGISTRADA"
  | "RETORNO_AGENDADO"
  | "INTERVENCAO_ENCERRADA";

type EventoTimelineStudentSuccess = {
  id: string;

  tipo:
  TipoEventoTimeline;

  data:
  string;

  intervencaoId:
  number;

  tipoIntervencao:
  TipoIntervencao;

  canal:
  CanalIntervencao;

  status:
  StatusIntervencao |
  null;

  observacao:
  string |
  null;

  resultado:
  string |
  null;

  risco:
  | {
    nivel:
    string |
    null;

    pontuacao:
    number |
    null;

    cobertura:
    number |
    null;

    confiabilidade:
    string |
    null;
  }
  | null;

  indicadores:
  | {
    frequenciaPercentual?:
    number |
    null;

    mediaPercentual?:
    number |
    null;

    atividadesVencidas?:
    number;

    quantidadeAulas?:
    number;

    quantidadeAvaliacoes?:
    number;
  }
  | null;

  evolucao:
  | {
    classificacao:
    | "POSITIVA"
    | "NEGATIVA"
    | "NEUTRA"
    | "NAO_MENSURAVEL";

    saldo:
    number;

    criteriosComparados:
    number;

    melhorias:
    unknown[];

    pioras:
    unknown[];
  }
  | null;
};

type TimelineStudentSuccessResponse = {
  ok:
  boolean;

  aluno: {
    id:
    number;

    nome:
    string;

    matricula:
    string |
    null;
  };

  resumo: {
    intervencoes:
    number;

    eventos:
    number;

    abertas:
    number;

    encerradas:
    number;
  };

  eventos:
  EventoTimelineStudentSuccess[];
};

function CardResumo({
  valor,
  titulo,
  variante,
}: CardResumoProps) {

  const estilos = {
    critical:
      "border-red-200 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-100",

    risk:
      "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-900/70 dark:bg-orange-950/35 dark:text-orange-100",

    attention:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-100",

    normal:
      "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-100",

    insufficient:
      "border-slate-200 bg-slate-50 text-slate-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100",
  };

  return (
    <div
      className={[
        "phanyx-student-success-summary-card",
        `phanyx-student-success-${variante}`,
        "rounded-2xl border p-5 shadow-sm transition",
        estilos[variante],
      ].join(" ")}
    >
      <div
        className="
          text-3xl
          font-bold
          tracking-tight
        "
      >
        {valor}
      </div>

      <div
        className="
          mt-2
          text-sm
          font-semibold
        "
      >
        {titulo}
      </div>
    </div>
  );
}

function formatarPercentual(
  valor:
    | number
    | null
) {

  if (
    valor === null ||
    !Number.isFinite(
      valor
    )
  ) {
    return "—";
  }

  return `${Math.round(
    valor
  )}%`;
}

function classeNivel(
  nivel:
    NivelRisco
) {

  switch (nivel) {
    case "CRITICO":
      return "border-red-300 bg-red-100 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200";

    case "RISCO":
      return "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-900 dark:bg-orange-950/60 dark:text-orange-200";

    case "ATENCAO":
      return "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200";

    case "NORMAL":
      return "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";

    case "DADOS_INSUFICIENTES":
    default:
      return "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function emailPodeSerUsado(
  email:
    | string
    | null
) {

  if (!email) {
    return false;
  }

  const normalizado =
    email
      .trim()
      .toLowerCase();

  if (
    !normalizado ||
    normalizado.endsWith(
      "@px.local"
    )
  ) {
    return false;
  }

  return normalizado.includes(
    "@"
  );
}

function telefoneParaLink(
  telefone:
    | string
    | null
) {

  if (!telefone) {
    return null;
  }

  const limpo =
    telefone.replace(
      /[^\d+]/g,
      ""
    );

  return (
    limpo ||
    null
  );
}

function calcularDiasSemAtualizacao(
  data:
    string
) {
  const agora =
    new Date();

  const atualizadoEm =
    new Date(
      data
    );

  const inicioHoje =
    new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    );

  const inicioAtualizacao =
    new Date(
      atualizadoEm.getFullYear(),
      atualizadoEm.getMonth(),
      atualizadoEm.getDate()
    );

  const diferenca =
    inicioHoje.getTime() -
    inicioAtualizacao.getTime();

  return Math.max(
    0,
    Math.floor(
      diferenca /
      (
        1000 *
        60 *
        60 *
        24
      )
    )
  );
}

export default function AdminStudentSuccessPage() {
  const t =
    useTranslations(
      "AdminStudentSuccess"
    );

  const [
    dados,
    setDados,
  ] =
    useState<StudentSuccessResponse | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(
      true
    );

  const [
    erro,
    setErro,
  ] =
    useState(
      false
    );

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    filtroNivel,
    setFiltroNivel,
  ] =
    useState<FiltroNivel>(
      "TODOS"
    );

  const [
    alunoSelecionado,
    setAlunoSelecionado,
  ] =
    useState<AlunoStudentSuccess | null>(
      null
    );

  const [
    modalIntervencaoAberto,
    setModalIntervencaoAberto,
  ] =
    useState(false);

  const [
    tipoIntervencao,
    setTipoIntervencao,
  ] =
    useState<TipoIntervencao>(
      "CONTATO"
    );

  const [
    canalIntervencao,
    setCanalIntervencao,
  ] =
    useState<CanalIntervencao>(
      "LIGACAO"
    );

  const [
    statusIntervencao,
    setStatusIntervencao,
  ] =
    useState<StatusIntervencao>(
      "REGISTRADA"
    );

  const [
    observacaoIntervencao,
    setObservacaoIntervencao,
  ] =
    useState("");

  const [
    retornoIntervencao,
    setRetornoIntervencao,
  ] =
    useState("");

  const [
    prioridades,
    setPrioridades,
  ] =
    useState<PrioridadesStudentSuccessResponse | null>(
      null
    );

  const [
    filtroPrioridades,
    setFiltroPrioridades,
  ] =
    useState<FiltroPrioridade>(
      "TODOS"
    );

  const [
    carregandoPrioridades,
    setCarregandoPrioridades,
  ] =
    useState(true);

  const [
    erroPrioridades,
    setErroPrioridades,
  ] =
    useState<string | null>(
      null
    );

  const [
    intervencoes,
    setIntervencoes,
  ] =
    useState<
      StudentSuccessIntervencao[]
    >([]);

  const [
    timeline,
    setTimeline,
  ] =
    useState<
      EventoTimelineStudentSuccess[]
    >([]);

  const [
    resumoTimeline,
    setResumoTimeline,
  ] =
    useState<
      TimelineStudentSuccessResponse["resumo"] |
      null
    >(null);

  const [
    carregandoTimeline,
    setCarregandoTimeline,
  ] =
    useState(
      false
    );

  const [
    erroTimeline,
    setErroTimeline,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    carregandoIntervencoes,
    setCarregandoIntervencoes,
  ] =
    useState(false);

  const [
    erroIntervencoes,
    setErroIntervencoes,
  ] =
    useState<string | null>(
      null
    );

  const [
    versaoIntervencoes,
    setVersaoIntervencoes,
  ] =
    useState(0);

  const [
    salvandoIntervencao,
    setSalvandoIntervencao,
  ] =
    useState(false);

  const [
    mensagemIntervencao,
    setMensagemIntervencao,
  ] =
    useState<
      | {
        tipo:
        | "sucesso"
        | "erro";

        texto: string;
      }
      | null
    >(null);

  const [
    intervencaoEmEdicao,
    setIntervencaoEmEdicao,
  ] =
    useState<StudentSuccessIntervencao | null>(
      null
    );

  const [
    alunoAtualizacaoIntervencao,
    setAlunoAtualizacaoIntervencao,
  ] =
    useState<AlunoStudentSuccess | null>(
      null
    );

  const [
    statusAtualizacaoIntervencao,
    setStatusAtualizacaoIntervencao,
  ] =
    useState<StatusIntervencao>(
      "REGISTRADA"
    );

  const [
    retornoAtualizacaoIntervencao,
    setRetornoAtualizacaoIntervencao,
  ] =
    useState("");

  const [
    resultadoAtualizacaoIntervencao,
    setResultadoAtualizacaoIntervencao,
  ] =
    useState("");

  const [
    salvandoAtualizacaoIntervencao,
    setSalvandoAtualizacaoIntervencao,
  ] =
    useState(false);

  const [
    mensagemAtualizacaoIntervencao,
    setMensagemAtualizacaoIntervencao,
  ] =
    useState<
      | {
        tipo:
        | "sucesso"
        | "erro";

        texto: string;
      }
      | null
    >(null);

  const [
    resumoIntervencoes,
    setResumoIntervencoes,
  ] =
    useState<ResumoIntervencoesStudentSuccess | null>(
      null
    );

  const [
    periodoIntervencoes,
    setPeriodoIntervencoes,
  ] =
    useState<PeriodoIntervencoes>(
      "TODOS"
    );

  const [
    filtroStatusIntervencoes,
    setFiltroStatusIntervencoes,
  ] =
    useState<FiltroStatusIntervencao>(
      "TODOS"
    );

  const [
    filtroTipoIntervencoes,
    setFiltroTipoIntervencoes,
  ] =
    useState<FiltroTipoIntervencao>(
      "TODOS"
    );

  const [
    dataInicialIntervencoes,
    setDataInicialIntervencoes,
  ] =
    useState("");

  const [
    dataFinalIntervencoes,
    setDataFinalIntervencoes,
  ] =
    useState("");

  const [
    carregandoResumoIntervencoes,
    setCarregandoResumoIntervencoes,
  ] =
    useState(true);

  const [
    erroResumoIntervencoes,
    setErroResumoIntervencoes,
  ] =
    useState<string | null>(
      null
    );

  const [
    retornos,
    setRetornos,
  ] =
    useState<
      RetornoStudentSuccess[]
    >([]);

  const [
    carregandoRetornos,
    setCarregandoRetornos,
  ] =
    useState(true);

  const [
    erroRetornos,
    setErroRetornos,
  ] =
    useState<string | null>(
      null
    );

  const [
    filtroRetornos,
    setFiltroRetornos,
  ] =
    useState<FiltroRetorno>(
      "TODOS"
    );

  const carregarDados =
    useCallback(
      async () => {
        setCarregando(
          true
        );

        setErro(
          false
        );

        try {
          const resposta =
            await fetch(
              "/api/admin/student-success",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          if (
            !resposta.ok
          ) {
            throw new Error(
              `HTTP ${resposta.status}`
            );
          }

          const json =
            (
              await resposta.json()
            ) as StudentSuccessResponse;

          if (
            !json.ok
          ) {
            throw new Error(
              "STUDENT_SUCCESS_LOAD_ERROR"
            );
          }

          setDados(
            json
          );
        }
        catch (
        error
        ) {
          console.error(
            "[STUDENT_SUCCESS_PAGE]",
            error
          );

          setErro(
            true
          );
        }
        finally {
          setCarregando(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      void carregarDados();
    },
    [
      carregarDados,
    ]
  );

  useEffect(
    () => {
      if (
        !alunoSelecionado
      ) {
        return;
      }

      const fecharComEsc =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setAlunoSelecionado(
              null
            );
          }
        };

      const overflowAnterior =
        document.body.style
          .overflow;

      document.body.style.overflow =
        "hidden";

      window.addEventListener(
        "keydown",
        fecharComEsc
      );

      return () => {
        document.body.style.overflow =
          overflowAnterior;

        window.removeEventListener(
          "keydown",
          fecharComEsc
        );
      };
    },
    [
      alunoSelecionado,
    ]
  );

  useEffect(
    () => {
      if (
        !alunoSelecionado
      ) {
        setIntervencoes(
          []
        );

        return;
      }

      let cancelado =
        false;

      const carregar =
        async () => {
          setCarregandoIntervencoes(
            true
          );

          setErroIntervencoes(
            null
          );

          try {
            const resposta =
              await fetch(
                `/api/admin/student-success/intervencoes?alunoId=${alunoSelecionado.alunoId}`,
                {
                  credentials:
                    "include",
                }
              );

            const json =
              await resposta.json();

            if (
              !resposta.ok ||
              !json?.ok
            ) {
              throw new Error(
                json?.error ??
                "INTERVENTIONS_ERROR"
              );
            }

            if (
              !cancelado
            ) {
              setIntervencoes(
                Array.isArray(
                  json.intervencoes
                )
                  ? json.intervencoes
                  : []
              );
            }
          }
          catch (error) {
            console.error(
              "[STUDENT_SUCCESS_INTERVENTIONS_LOAD]",
              error
            );

            if (
              !cancelado
            ) {
              setIntervencoes(
                []
              );

              setErroIntervencoes(
                t(
                  "intervention.error"
                )
              );
            }
          }
          finally {
            if (
              !cancelado
            ) {
              setCarregandoIntervencoes(
                false
              );
            }
          }
        };

      void carregar();

      return () => {
        cancelado =
          true;
      };
    },
    [
      alunoSelecionado,
      versaoIntervencoes,
      t,
    ]
  );

  useEffect(
    () => {
      if (
        !alunoSelecionado
      ) {
        setTimeline(
          []
        );

        setResumoTimeline(
          null
        );

        setErroTimeline(
          null
        );

        return;
      }

      let cancelado =
        false;

      const carregarTimeline =
        async () => {
          setCarregandoTimeline(
            true
          );

          setErroTimeline(
            null
          );

          try {
            const resposta =
              await fetch(
                `/api/admin/student-success/alunos/${alunoSelecionado.alunoId}/timeline`,
                {
                  method:
                    "GET",

                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              );

            const json =
              (
                await resposta.json()
              ) as TimelineStudentSuccessResponse;

            if (
              !resposta.ok ||
              !json?.ok
            ) {
              throw new Error(
                "TIMELINE_LOAD_ERROR"
              );
            }

            if (
              cancelado
            ) {
              return;
            }

            setTimeline(
              Array.isArray(
                json.eventos
              )
                ? json.eventos
                : []
            );

            setResumoTimeline(
              json.resumo ??
              null
            );
          }
          catch (error) {
            console.error(
              "[STUDENT_SUCCESS_TIMELINE]",
              error
            );

            if (
              !cancelado
            ) {
              setTimeline(
                []
              );

              setResumoTimeline(
                null
              );

              setErroTimeline(
                "TIMELINE_LOAD_ERROR"
              );
            }
          }
          finally {
            if (
              !cancelado
            ) {
              setCarregandoTimeline(
                false
              );
            }
          }
        };

      void carregarTimeline();

      return () => {
        cancelado =
          true;
      };
    },
    [
      alunoSelecionado,
      versaoIntervencoes,
    ]
  );

  useEffect(
    () => {
      let cancelado =
        false;

      const carregarResumoIntervencoes =
        async () => {
          setCarregandoResumoIntervencoes(
            true
          );

          setErroResumoIntervencoes(
            null
          );

          try {
            const parametros =
              new URLSearchParams();

            if (
              filtroStatusIntervencoes !==
              "TODOS"
            ) {
              parametros.set(
                "status",
                filtroStatusIntervencoes
              );
            }

            if (
              filtroTipoIntervencoes !==
              "TODOS"
            ) {
              parametros.set(
                "tipo",
                filtroTipoIntervencoes
              );
            }

            /*
             * Datas sempre calculadas no horário
             * local do navegador.
             *
             * O backend recebe ISO em UTC,
             * mas representando corretamente o
             * início/fim do dia local do usuário.
             */
            const hoje =
              new Date();

            const inicioHoje =
              new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                hoje.getDate()
              );

            const inicioAmanha =
              new Date(
                inicioHoje
              );

            inicioAmanha.setDate(
              inicioAmanha.getDate() +
              1
            );

            let inicioPeriodo:
              Date |
              null =
              null;

            let fimPeriodo:
              Date |
              null =
              null;

            if (
              periodoIntervencoes ===
              "HOJE"
            ) {
              inicioPeriodo =
                inicioHoje;

              fimPeriodo =
                inicioAmanha;
            }

            if (
              periodoIntervencoes ===
              "ULTIMOS_7_DIAS"
            ) {
              inicioPeriodo =
                new Date(
                  inicioHoje
                );

              inicioPeriodo.setDate(
                inicioPeriodo.getDate() -
                6
              );

              fimPeriodo =
                inicioAmanha;
            }

            if (
              periodoIntervencoes ===
              "ULTIMOS_30_DIAS"
            ) {
              inicioPeriodo =
                new Date(
                  inicioHoje
                );

              inicioPeriodo.setDate(
                inicioPeriodo.getDate() -
                29
              );

              fimPeriodo =
                inicioAmanha;
            }

            if (
              periodoIntervencoes ===
              "PERSONALIZADO"
            ) {
              if (
                dataInicialIntervencoes
              ) {
                inicioPeriodo =
                  new Date(
                    `${dataInicialIntervencoes}T00:00:00`
                  );
              }

              if (
                dataFinalIntervencoes
              ) {
                fimPeriodo =
                  new Date(
                    `${dataFinalIntervencoes}T00:00:00`
                  );

                fimPeriodo.setDate(
                  fimPeriodo.getDate() +
                  1
                );
              }
            }

            if (
              inicioPeriodo
            ) {
              parametros.set(
                "inicio",
                inicioPeriodo.toISOString()
              );
            }

            if (
              fimPeriodo
            ) {
              parametros.set(
                "fim",
                fimPeriodo.toISOString()
              );
            }

            const query =
              parametros.toString();

            const url =
              query
                ? `/api/admin/student-success/intervencoes/resumo?${query}`
                : "/api/admin/student-success/intervencoes/resumo";

            const resposta =
              await fetch(
                url,
                {
                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              );

            const json =
              await resposta.json();

            if (
              !resposta.ok ||
              !json?.ok
            ) {
              throw new Error(
                json?.error ??
                "INTERVENTION_SUMMARY_ERROR"
              );
            }

            if (
              !cancelado
            ) {
              setResumoIntervencoes(
                json
              );
            }
          }
          catch (error) {
            console.error(
              "[STUDENT_SUCCESS_INTERVENTION_SUMMARY]",
              error
            );

            if (
              !cancelado
            ) {
              setResumoIntervencoes(
                null
              );

              setErroResumoIntervencoes(
                t(
                  "intervention.dashboard.error"
                )
              );
            }
          }
          finally {
            if (
              !cancelado
            ) {
              setCarregandoResumoIntervencoes(
                false
              );
            }
          }
        };

      void carregarResumoIntervencoes();

      return () => {
        cancelado =
          true;
      };
    },
    [
      versaoIntervencoes,
      periodoIntervencoes,
      filtroStatusIntervencoes,
      filtroTipoIntervencoes,
      dataInicialIntervencoes,
      dataFinalIntervencoes,
      t,
    ]
  );

  useEffect(
    () => {
      let cancelado =
        false;

      const carregarRetornos =
        async () => {
          setCarregandoRetornos(
            true
          );

          setErroRetornos(
            null
          );

          try {
            const resposta =
              await fetch(
                "/api/admin/student-success/intervencoes/retornos",
                {
                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              );

            const json =
              (
                await resposta.json()
              ) as RetornosStudentSuccessResponse;

            if (
              !resposta.ok ||
              !json?.ok
            ) {
              throw new Error(
                "RETURNS_LOAD_ERROR"
              );
            }

            if (
              !cancelado
            ) {
              setRetornos(
                Array.isArray(
                  json.intervencoes
                )
                  ? json.intervencoes
                  : []
              );
            }
          }
          catch (error) {
            console.error(
              "[STUDENT_SUCCESS_RETURNS]",
              error
            );

            if (
              !cancelado
            ) {
              setRetornos(
                []
              );

              setErroRetornos(
                t(
                  "intervention.returns.error"
                )
              );
            }
          }
          finally {
            if (
              !cancelado
            ) {
              setCarregandoRetornos(
                false
              );
            }
          }
        };

      void carregarRetornos();

      return () => {
        cancelado =
          true;
      };
    },
    [
      versaoIntervencoes,
      t,
    ]
  );

  useEffect(
    () => {
      let cancelado =
        false;

      const carregarPrioridades =
        async () => {
          setCarregandoPrioridades(
            true
          );

          setErroPrioridades(
            null
          );

          try {
            const resposta =
              await fetch(
                "/api/admin/student-success/intervencoes/prioridades",
                {
                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              );

            const json =
              (
                await resposta.json()
              ) as PrioridadesStudentSuccessResponse;

            if (
              !resposta.ok ||
              !json?.ok
            ) {
              throw new Error(
                "PRIORITIES_LOAD_ERROR"
              );
            }

            if (
              !cancelado
            ) {
              setPrioridades(
                json
              );
            }
          }
          catch (error) {
            console.error(
              "[STUDENT_SUCCESS_PRIORITIES]",
              error
            );

            if (
              !cancelado
            ) {
              setPrioridades(
                null
              );

              setErroPrioridades(
                "PRIORITIES_LOAD_ERROR"
              );
            }
          }
          finally {
            if (
              !cancelado
            ) {
              setCarregandoPrioridades(
                false
              );
            }
          }
        };

      void carregarPrioridades();

      return () => {
        cancelado =
          true;
      };
    },
    [
      versaoIntervencoes,
    ]
  );

  const retornosClassificados =
    useMemo(
      () => {
        const agora =
          new Date();

        const inicioHoje =
          new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
          );

        const inicioAmanha =
          new Date(
            inicioHoje
          );

        inicioAmanha.setDate(
          inicioAmanha.getDate() +
          1
        );

        const limite7Dias =
          new Date(
            inicioHoje
          );

        limite7Dias.setDate(
          limite7Dias.getDate() +
          8
        );

        const atrasados:
          RetornoStudentSuccess[] =
          [];

        const hoje:
          RetornoStudentSuccess[] =
          [];

        const proximos7Dias:
          RetornoStudentSuccess[] =
          [];

        const semRetorno:
          RetornoStudentSuccess[] =
          [];

        for (
          const intervencao
          of retornos
        ) {
          if (
            !intervencao.retornoEm
          ) {
            semRetorno.push(
              intervencao
            );

            continue;
          }

          const data =
            new Date(
              intervencao.retornoEm
            );

          if (
            data <
            inicioHoje
          ) {
            atrasados.push(
              intervencao
            );

            continue;
          }

          if (
            data <
            inicioAmanha
          ) {
            hoje.push(
              intervencao
            );

            continue;
          }

          if (
            data <
            limite7Dias
          ) {
            proximos7Dias.push(
              intervencao
            );
          }
        }

        return {
          atrasados,
          hoje,
          proximos7Dias,
          semRetorno,
        };
      },
      [
        retornos,
      ]
    );

  const prioridadesClassificadas =
    useMemo(
      () => {
        const agora =
          new Date();

        const inicioHoje =
          new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
          );

        const inicioAmanha =
          new Date(
            inicioHoje
          );

        inicioAmanha.setDate(
          inicioAmanha.getDate() +
          1
        );

        const atrasados:
          PrioridadeIntervencaoAberta[] =
          [];

        const hoje:
          PrioridadeIntervencaoAberta[] =
          [];

        for (
          const intervencao
          of prioridades
            ?.comRetorno ??
          []
        ) {
          if (
            !intervencao.retornoEm
          ) {
            continue;
          }

          const retorno =
            new Date(
              intervencao.retornoEm
            );

          if (
            retorno <
            inicioHoje
          ) {
            atrasados.push(
              intervencao
            );

            continue;
          }

          if (
            retorno <
            inicioAmanha
          ) {
            hoje.push(
              intervencao
            );
          }
        }

        return {
          atrasados,

          hoje,

          semRetorno:
            prioridades
              ?.semRetorno ??
            [],

          pioraAposIntervencao:
            prioridades
              ?.pioraAposIntervencao ??
            [],

          maisAntigaSemRetorno:
            prioridades
              ?.semRetorno
            ?.[0] ??
            null,
        };
      },
      [
        prioridades,
      ]
    );

  const alternarFiltroPrioridades =
    (
      filtro:
        Exclude<
          FiltroPrioridade,
          "TODOS"
        >
    ) => {
      setFiltroPrioridades(
        (
          atual
        ) =>
          atual === filtro
            ? "TODOS"
            : filtro
      );
    };

  const existeFiltroPrioridadeAtivo =
    filtroPrioridades !==
    "TODOS";

  const prioridadeFiltradaVazia =
    filtroPrioridades ===
      "HOJE"
      ? prioridadesClassificadas
        .hoje.length ===
      0

      : filtroPrioridades ===
        "ATRASADOS"
        ? prioridadesClassificadas
          .atrasados
          .length ===
        0

        : filtroPrioridades ===
          "PIORA"
          ? prioridadesClassificadas
            .pioraAposIntervencao
            .length ===
          0

          : filtroPrioridades ===
            "SEM_RETORNO"
            ? prioridadesClassificadas
              .semRetorno
              .length ===
            0

            : prioridadesClassificadas
              .hoje.length ===
            0 &&
            prioridadesClassificadas
              .atrasados
              .length ===
            0 &&
            prioridadesClassificadas
              .pioraAposIntervencao
              .length ===
            0 &&
            prioridadesClassificadas
              .semRetorno
              .length ===
            0;

  const quantidadeGruposPrioridadeVisiveis =
    [
      filtroPrioridades ===
        "TODOS" ||
        filtroPrioridades ===
        "HOJE"
        ? prioridadesClassificadas
          .hoje.length
        : 0,

      filtroPrioridades ===
        "TODOS" ||
        filtroPrioridades ===
        "ATRASADOS"
        ? prioridadesClassificadas
          .atrasados.length
        : 0,

      filtroPrioridades ===
        "TODOS" ||
        filtroPrioridades ===
        "PIORA"
        ? prioridadesClassificadas
          .pioraAposIntervencao
          .length
        : 0,

      filtroPrioridades ===
        "TODOS" ||
        filtroPrioridades ===
        "SEM_RETORNO"
        ? prioridadesClassificadas
          .semRetorno.length
        : 0,
    ].filter(
      (
        quantidade
      ) =>
        quantidade >
        0
    ).length;

  const gruposRetornos =
    [
      {
        chave:
          "ATRASADOS" as const,

        titulo:
          t(
            "intervention.returns.overdue"
          ),

        itens:
          retornosClassificados
            .atrasados,

        classe:
          "phanyx-student-success-return-group-overdue",
      },

      {
        chave:
          "HOJE" as const,

        titulo:
          t(
            "intervention.returns.today"
          ),

        itens:
          retornosClassificados
            .hoje,

        classe:
          "phanyx-student-success-return-group-today",
      },

      {
        chave:
          "PROXIMOS_7_DIAS" as const,

        titulo:
          t(
            "intervention.returns.next7Days"
          ),

        itens:
          retornosClassificados
            .proximos7Dias,

        classe:
          "phanyx-student-success-return-group-upcoming",
      },

      {
        chave:
          "SEM_RETORNO" as const,

        titulo:
          t(
            "intervention.returns.unscheduled"
          ),


        itens:
          retornosClassificados
            .semRetorno,

        classe:
          "phanyx-student-success-return-group-unscheduled",
      },
    ];

  const gruposRetornosVisiveis =
    filtroRetornos ===
      "TODOS"
      ? gruposRetornos
      : gruposRetornos.filter(
        (
          grupo
        ) =>
          grupo.chave ===
          filtroRetornos
      );

  const filtroRetornosVazio =
    gruposRetornosVisiveis.every(
      (
        grupo
      ) =>
        grupo.itens.length ===
        0
    );

  const alternarFiltroRetornos =
    (
      filtro:
        Exclude<
          FiltroRetorno,
          "TODOS"
        >
    ) => {
      setFiltroRetornos(
        (
          atual
        ) =>
          atual === filtro
            ? "TODOS"
            : filtro
      );
    };

  /*
   * Mostramos aqui:
   *
   * - risco crítico
   * - risco
   * - atenção
   * - dados insuficientes
   *
   * DADOS_INSUFICIENTES NÃO significa
   * risco acadêmico.
   *
   * Ele aparece porque a instituição
   * precisa saber quais alunos ainda
   * não possuem dados suficientes para
   * uma análise confiável.
   */
  const alunosFiltrados =
    useMemo(
      () => {
        const termo =
          busca
            .trim()
            .toLocaleLowerCase();

        return (
          dados?.alunos ??
          []
        ).filter(
          (aluno) => {
            const correspondeNivel =
              filtroNivel ===
              "TODOS" ||
              aluno.analise
                .nivel ===
              filtroNivel;

            if (
              !correspondeNivel
            ) {
              return false;
            }

            if (!termo) {
              return true;
            }

            const nome =
              aluno.nome
                .toLocaleLowerCase();

            const matricula =
              (
                aluno.matricula ??
                ""
              )
                .toLocaleLowerCase();

            const telefone =
              (
                aluno.contato
                  ?.telefone ??
                ""
              )
                .toLocaleLowerCase();

            return (
              nome.includes(
                termo
              ) ||
              matricula.includes(
                termo
              ) ||
              telefone.includes(
                termo
              )
            );
          }
        );
      },
      [
        busca,
        dados,
        filtroNivel,
      ]
    );

  const abrirAlunoDaFila =
    (
      alunoId:
        number
    ) => {
      const aluno =
        dados?.alunos.find(
          (
            item
          ) =>
            item.alunoId ===
            alunoId
        );

      if (!aluno) {
        return;
      }

      setAlunoSelecionado(
        aluno
      );
    };

  const atualizarIntervencaoDaFila =
    async (
      retorno: {
        id: number;
        alunoId: number;
      }
    ) => {
      const aluno =
        dados?.alunos.find(
          (
            item
          ) =>
            item.alunoId ===
            retorno.alunoId
        );

      if (!aluno) {
        return;
      }

      /*
       * Precisamos do objeto completo da intervenção,
       * porque a fila possui apenas os dados resumidos.
       */
      try {
        const resposta =
          await fetch(
            `/api/admin/student-success/intervencoes?alunoId=${retorno.alunoId}`,
            {
              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const json =
          await resposta.json();

        if (
          !resposta.ok ||
          !json?.ok ||
          !Array.isArray(
            json.intervencoes
          )
        ) {
          throw new Error(
            "INTERVENTION_LOAD_ERROR"
          );
        }

        const intervencao =
          (
            json.intervencoes as
            StudentSuccessIntervencao[]
          ).find(
            (
              item
            ) =>
              item.id ===
              retorno.id
          );

        if (!intervencao) {
          throw new Error(
            "INTERVENTION_NOT_FOUND"
          );
        }

        /*
         * O aluno precisa estar selecionado
         * para que, ao encerrar a intervenção,
         * a fotografia acadêmica atual seja
         * enviada ao PATCH.
         */
        abrirAtualizacaoIntervencao(
          intervencao,
          aluno
        );
      }
      catch (error) {
        console.error(
          "[STUDENT_SUCCESS_RETURN_UPDATE]",
          error
        );
      }
    };

  const registrarIntervencao =
    async () => {
      if (
        !alunoSelecionado ||
        salvandoIntervencao
      ) {
        return;
      }

      const observacao =
        observacaoIntervencao
          .trim();

      if (
        observacao.length < 3
      ) {
        setMensagemIntervencao({
          tipo:
            "erro",

          texto:
            t(
              "intervention.error"
            ),
        });

        return;
      }

      setSalvandoIntervencao(
        true
      );

      setMensagemIntervencao(
        null
      );

      try {
        const retornoEm =
          retornoIntervencao
            ? new Date(
              `${retornoIntervencao}T12:00:00`
            ).toISOString()
            : null;

        const resposta =
          await fetch(
            "/api/admin/student-success/intervencoes",
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  alunoId:
                    alunoSelecionado
                      .alunoId,

                  tipo:
                    tipoIntervencao,

                  canal:
                    canalIntervencao,

                  status:
                    statusIntervencao,

                  observacao,

                  retornoEm,

                  analise: {
                    nivel:
                      alunoSelecionado
                        .analise
                        .nivel,

                    pontuacao:
                      alunoSelecionado
                        .analise
                        .pontuacao,

                    coberturaPercentual:
                      alunoSelecionado
                        .analise
                        .coberturaPercentual,

                    confiabilidade:
                      alunoSelecionado
                        .analise
                        .confiabilidade,

                    fatoresPrincipais:
                      alunoSelecionado
                        .analise
                        .fatoresPrincipais,
                  },

                  indicadores:
                    alunoSelecionado
                      .indicadores,
                }),
            }
          );

        const json =
          await resposta.json();

        if (
          !resposta.ok ||
          !json?.ok
        ) {
          throw new Error(
            json?.error ??
            "INTERVENTION_ERROR"
          );
        }

        setMensagemIntervencao({
          tipo:
            "sucesso",

          texto:
            t(
              "intervention.success"
            ),
        });

        setVersaoIntervencoes(
          (valor) =>
            valor + 1
        );

        setObservacaoIntervencao(
          ""
        );

        setRetornoIntervencao(
          ""
        );

        setTimeout(
          () => {
            setModalIntervencaoAberto(
              false
            );

            setMensagemIntervencao(
              null
            );
          },
          900
        );
      }
      catch (error) {
        console.error(
          "[STUDENT_SUCCESS_INTERVENTION]",
          error
        );

        setMensagemIntervencao({
          tipo:
            "erro",

          texto:
            t(
              "intervention.error"
            ),
        });
      }
      finally {
        setSalvandoIntervencao(
          false
        );
      }
    };

  const abrirAtualizacaoIntervencao =
    (
      intervencao:
        StudentSuccessIntervencao,

      alunoContexto?:
        AlunoStudentSuccess | null
    ) => {
      setIntervencaoEmEdicao(
        intervencao
      );

      setAlunoAtualizacaoIntervencao(
        alunoContexto ??
        alunoSelecionado
      );

      setStatusAtualizacaoIntervencao(
        intervencao.status
      );

      setRetornoAtualizacaoIntervencao(
        intervencao.retornoEm
          ? intervencao.retornoEm.slice(
            0,
            10
          )
          : ""
      );

      setResultadoAtualizacaoIntervencao(
        intervencao.resultado ??
        ""
      );

      setMensagemAtualizacaoIntervencao(
        null
      );
    };

  const salvarAtualizacaoIntervencao =
    async () => {
      if (
        !intervencaoEmEdicao ||
        salvandoAtualizacaoIntervencao
      ) {
        return;
      }

      const resultado =
        resultadoAtualizacaoIntervencao
          .trim();

      const exigeResultado =
        statusAtualizacaoIntervencao ===
        "RESOLVIDA" ||
        statusAtualizacaoIntervencao ===
        "CANCELADA";

      if (
        exigeResultado &&
        resultado.length < 3
      ) {
        setMensagemAtualizacaoIntervencao({
          tipo:
            "erro",

          texto:
            statusAtualizacaoIntervencao ===
              "RESOLVIDA"
              ? t(
                "intervention.update.resultRequiredResolved"
              )
              : t(
                "intervention.update.resultRequiredCancelled"
              ),
        });

        return;
      }

      setSalvandoAtualizacaoIntervencao(
        true
      );

      setMensagemAtualizacaoIntervencao(
        null
      );

      try {
        const retornoEm =
          retornoAtualizacaoIntervencao
            ? new Date(
              `${retornoAtualizacaoIntervencao}T12:00:00`
            ).toISOString()
            : null;

        const resposta =
          await fetch(
            `/api/admin/student-success/intervencoes/${intervencaoEmEdicao.id}`,
            {
              method:
                "PATCH",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  status:
                    statusAtualizacaoIntervencao,

                  retornoEm,

                  resultado,

                  analiseAtual:
                    alunoAtualizacaoIntervencao
                      ? {
                        nivel:
                          alunoAtualizacaoIntervencao
                            .analise
                            .nivel,

                        pontuacao:
                          alunoAtualizacaoIntervencao
                            .analise
                            .pontuacao,

                        coberturaPercentual:
                          alunoAtualizacaoIntervencao
                            .analise
                            .coberturaPercentual,

                        confiabilidade:
                          alunoAtualizacaoIntervencao
                            .analise
                            .confiabilidade,

                        fatoresPrincipais:
                          alunoAtualizacaoIntervencao
                            .analise
                            .fatoresPrincipais,
                      }
                      : null,

                  indicadoresAtuais:
                    alunoAtualizacaoIntervencao
                      ?.indicadores ??
                    null,
                }),
            }
          );

        const json =
          await resposta.json();

        if (
          !resposta.ok ||
          !json?.ok
        ) {
          throw new Error(
            json?.error ??
            "INTERVENTION_UPDATE_ERROR"
          );
        }

        setIntervencoes(
          (
            atuais
          ) =>
            atuais.map(
              (
                item
              ) =>
                item.id ===
                  json.intervencao.id
                  ? json.intervencao
                  : item
            )
        );

        setMensagemAtualizacaoIntervencao({
          tipo:
            "sucesso",

          texto:
            t(
              "intervention.update.success"
            ),
        });

        setVersaoIntervencoes(
          (
            valor
          ) =>
            valor + 1
        );

        setTimeout(
          () => {
            setIntervencaoEmEdicao(
              null
            );

            setAlunoAtualizacaoIntervencao(
              null
            );

            setMensagemAtualizacaoIntervencao(
              null
            );
          },
          800
        );
      }
      catch (error) {
        console.error(
          "[STUDENT_SUCCESS_INTERVENTION_UPDATE]",
          error
        );

        setMensagemAtualizacaoIntervencao({
          tipo:
            "erro",

          texto:
            t(
              "intervention.update.error"
            ),
        });
      }
      finally {
        setSalvandoAtualizacaoIntervencao(
          false
        );
      }
    };

  const renderComparacaoAcademica =
    (
      intervencao:
        StudentSuccessIntervencao
    ) => {
      /*
       * Só existe comparação quando
       * a intervenção possui uma fotografia
       * acadêmica de encerramento.
       *
       * Intervenções antigas continuam
       * funcionando normalmente.
       */
      if (
        !intervencao
          .nivelRiscoNoEncerramento
      ) {
        return null;
      }

      const inicio =
        intervencao
          .indicadoresNoRegistro;

      const fim =
        intervencao
          .indicadoresNoEncerramento;

      type Mudanca = {
        texto: string;

        tipo:
        | "positiva"
        | "negativa";
      };

      const mudancas:
        Mudanca[] =
        [];

      /* ---------------------------------------
   NÍVEL DE RISCO
   --------------------------------------- */

      /*
       * DADOS_INSUFICIENTES não é considerado
       * um nível de risco maior ou menor.
       *
       * Ele representa ausência de evidência
       * suficiente para classificar o aluno.
       */
      const ordemRisco:
        Partial<
          Record<
            NivelRisco,
            number
          >
        > = {
        NORMAL: 0,
        ATENCAO: 1,
        RISCO: 2,
        CRITICO: 3,
      };

      const nivelAntes =
        intervencao
          .nivelRiscoNoRegistro as NivelRisco;

      const nivelDepois =
        intervencao
          .nivelRiscoNoEncerramento as NivelRisco;

      const ordemAntes =
        ordemRisco[
        nivelAntes
        ];

      const ordemDepois =
        ordemRisco[
        nivelDepois
        ];

      if (
        ordemAntes !==
        undefined &&
        ordemDepois !==
        undefined &&
        ordemAntes !==
        ordemDepois
      ) {
        if (
          ordemDepois <
          ordemAntes
        ) {
          mudancas.push({
            tipo:
              "positiva",

            texto:
              `${t(
                "intervention.comparison.riskImproved"
              )}: ${t(
                `levels.${nivelAntes}`
              )} → ${t(
                `levels.${nivelDepois}`
              )}`,
          });
        }
        else {
          mudancas.push({
            tipo:
              "negativa",

            texto:
              `${t(
                "intervention.comparison.riskIncreased"
              )}: ${t(
                `levels.${nivelAntes}`
              )} → ${t(
                `levels.${nivelDepois}`
              )}`,
          });
        }
      }

      /* ---------------------------------------
         PONTUAÇÃO DE RISCO
         --------------------------------------- */

      if (
        intervencao
          .pontuacaoNoRegistro !==
        null &&
        intervencao
          .pontuacaoNoEncerramento !==
        null
      ) {
        const antes =
          intervencao
            .pontuacaoNoRegistro;

        const depois =
          intervencao
            .pontuacaoNoEncerramento;

        const diferenca =
          depois -
          antes;

        /*
         * Na pontuação de risco:
         * quanto menor, melhor.
         */
        if (
          diferenca < 0
        ) {
          mudancas.push({
            tipo:
              "positiva",

            texto:
              `${t(
                "intervention.comparison.scoreReduced"
              )}: ${antes} → ${depois} (${diferenca})`,
          });
        }

        if (
          diferenca > 0
        ) {
          mudancas.push({
            tipo:
              "negativa",

            texto:
              `${t(
                "intervention.comparison.scoreIncreased"
              )}: ${antes} → ${depois} (+${diferenca})`,
          });
        }
      }

      /* ---------------------------------------
         COBERTURA
         --------------------------------------- */

      if (
        intervencao
          .coberturaNoEncerramento !==
        null
      ) {
        const antes =
          intervencao
            .coberturaNoRegistro;

        const depois =
          intervencao
            .coberturaNoEncerramento;

        const diferenca =
          depois -
          antes;

        if (
          diferenca > 0
        ) {
          mudancas.push({
            tipo:
              "positiva",

            texto:
              `${t(
                "intervention.comparison.coverageImproved"
              )}: ${antes}% → ${depois}% (+${diferenca} ${t(
                "intervention.comparison.percentagePoints"
              )})`,
          });
        }

        if (
          diferenca < 0
        ) {
          mudancas.push({
            tipo:
              "negativa",

            texto:
              `${t(
                "intervention.comparison.coverageReduced"
              )}: ${antes}% → ${depois}% (${diferenca} ${t(
                "intervention.comparison.percentagePoints"
              )})`,
          });
        }
      }

      /* ---------------------------------------
         ATIVIDADES PENDENTES
         --------------------------------------- */

      if (
        inicio &&
        fim
      ) {
        const antes =
          inicio
            .atividadesVencidas;

        const depois =
          fim
            .atividadesVencidas;

        if (
          depois <
          antes
        ) {
          mudancas.push({
            tipo:
              "positiva",

            texto:
              `${t(
                "intervention.comparison.pendingReduced"
              )}: ${antes} → ${depois}`,
          });
        }

        if (
          depois >
          antes
        ) {
          mudancas.push({
            tipo:
              "negativa",

            texto:
              `${t(
                "intervention.comparison.pendingIncreased"
              )}: ${antes} → ${depois}`,
          });
        }
      }

      /* ---------------------------------------
         FREQUÊNCIA
         --------------------------------------- */

      if (
        inicio
          ?.frequenciaPercentual !==
        null &&
        inicio
          ?.frequenciaPercentual !==
        undefined &&
        fim
          ?.frequenciaPercentual !==
        null &&
        fim
          ?.frequenciaPercentual !==
        undefined
      ) {
        const antes =
          inicio
            .frequenciaPercentual;

        const depois =
          fim
            .frequenciaPercentual;

        const diferenca =
          Math.round(
            depois -
            antes
          );

        if (
          diferenca > 0
        ) {
          mudancas.push({
            tipo:
              "positiva",

            texto:
              `${t(
                "intervention.comparison.attendanceImproved"
              )}: ${Math.round(
                antes
              )}% → ${Math.round(
                depois
              )}% (+${diferenca} ${t(
                "intervention.comparison.percentagePoints"
              )})`,
          });
        }

        if (
          diferenca < 0
        ) {
          mudancas.push({
            tipo:
              "negativa",

            texto:
              `${t(
                "intervention.comparison.attendanceReduced"
              )}: ${Math.round(
                antes
              )}% → ${Math.round(
                depois
              )}% (${diferenca} ${t(
                "intervention.comparison.percentagePoints"
              )})`,
          });
        }
      }

      /* ---------------------------------------
         DESEMPENHO
         --------------------------------------- */

      if (
        inicio
          ?.mediaPercentual !==
        null &&
        inicio
          ?.mediaPercentual !==
        undefined &&
        fim
          ?.mediaPercentual !==
        null &&
        fim
          ?.mediaPercentual !==
        undefined
      ) {
        const antes =
          inicio
            .mediaPercentual;

        const depois =
          fim
            .mediaPercentual;

        const diferenca =
          Math.round(
            depois -
            antes
          );

        if (
          diferenca > 0
        ) {
          mudancas.push({
            tipo:
              "positiva",

            texto:
              `${t(
                "intervention.comparison.performanceImproved"
              )}: ${Math.round(
                antes
              )}% → ${Math.round(
                depois
              )}% (+${diferenca} ${t(
                "intervention.comparison.percentagePoints"
              )})`,
          });
        }

        if (
          diferenca < 0
        ) {
          mudancas.push({
            tipo:
              "negativa",

            texto:
              `${t(
                "intervention.comparison.performanceReduced"
              )}: ${Math.round(
                antes
              )}% → ${Math.round(
                depois
              )}% (${diferenca} ${t(
                "intervention.comparison.percentagePoints"
              )})`,
          });
        }
      }

      return (
        <div
          className="
          phanyx-student-success-comparison
          mt-4
          rounded-xl
          border
          p-3
        "
        >
          <div
            className="
            phanyx-student-success-comparison-title
            text-xs
            font-bold
            uppercase
            tracking-wide
          "
          >
            {t(
              "intervention.comparison.title"
            )}
          </div>

          <div
            className="
            mt-3
            grid
            gap-3
            sm:grid-cols-[1fr_auto_1fr]
            sm:items-stretch
          "
          >
            {/* NO REGISTRO */}

            <div
              className="
              phanyx-student-success-comparison-snapshot
              rounded-xl
              border
              p-3
            "
            >
              <div
                className="
                text-xs
                font-bold
                uppercase
                tracking-wide
              "
              >
                {t(
                  "intervention.comparison.registration"
                )}
              </div>

              <dl
                className="
                mt-3
                space-y-2
                text-xs
              "
              >
                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.risk"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {t(
                      `levels.${intervencao.nivelRiscoNoRegistro as NivelRisco}`
                    )}
                  </dd>
                </div>

                <div>
                  <dt
                    className="
      font-semibold
    "
                  >
                    {t(
                      "intervention.comparison.score"
                    )}
                  </dt>

                  <dd
                    className="
      mt-0.5
      font-bold
    "
                  >
                    {intervencao
                      .pontuacaoNoRegistro !==
                      null
                      ? intervencao
                        .pontuacaoNoRegistro
                      : "—"}
                  </dd>
                </div>

                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.coverage"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {
                      intervencao
                        .coberturaNoRegistro
                    }
                    %
                  </dd>
                </div>

                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.attendance"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {formatarPercentual(
                      inicio
                        ?.frequenciaPercentual ??
                      null
                    )}
                  </dd>
                </div>

                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.performance"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {formatarPercentual(
                      inicio
                        ?.mediaPercentual ??
                      null
                    )}
                  </dd>
                </div>

                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.pending"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {inicio
                      ? inicio
                        .atividadesVencidas
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* SETA */}

            <div
              className="
              phanyx-student-success-comparison-arrow
              flex
              items-center
              justify-center
              text-xl
              font-bold
            "
              aria-hidden="true"
            >
              →
            </div>

            {/* NO ENCERRAMENTO */}

            <div
              className="
              phanyx-student-success-comparison-snapshot
              rounded-xl
              border
              p-3
            "
            >
              <div
                className="
                text-xs
                font-bold
                uppercase
                tracking-wide
              "
              >
                {t(
                  "intervention.comparison.closure"
                )}
              </div>

              <dl
                className="
                mt-3
                space-y-2
                text-xs
              "
              >
                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.risk"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {t(
                      `levels.${intervencao.nivelRiscoNoEncerramento as NivelRisco}`
                    )}
                  </dd>
                </div>

                <div>
                  <dt
                    className="
      font-semibold
    "
                  >
                    {t(
                      "intervention.comparison.score"
                    )}
                  </dt>

                  <dd
                    className="
      mt-0.5
      font-bold
    "
                  >
                    {intervencao
                      .pontuacaoNoEncerramento !==
                      null
                      ? intervencao
                        .pontuacaoNoEncerramento
                      : "—"}
                  </dd>
                </div>

                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.coverage"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {
                      intervencao
                        .coberturaNoEncerramento ??
                      0
                    }
                    %
                  </dd>
                </div>

                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.attendance"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {formatarPercentual(
                      fim
                        ?.frequenciaPercentual ??
                      null
                    )}
                  </dd>
                </div>

                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.performance"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {formatarPercentual(
                      fim
                        ?.mediaPercentual ??
                      null
                    )}
                  </dd>
                </div>

                <div>
                  <dt
                    className="
                    font-semibold
                  "
                  >
                    {t(
                      "intervention.comparison.pending"
                    )}
                  </dt>

                  <dd
                    className="
                    mt-0.5
                    font-bold
                  "
                  >
                    {fim
                      ? fim
                        .atividadesVencidas
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* EVOLUÇÃO CALCULADA */}

          <div
            className="
            phanyx-student-success-comparison-evolution
            mt-3
            rounded-xl
            border
            p-3
          "
          >
            <div
              className="
              text-xs
              font-bold
              uppercase
              tracking-wide
            "
            >
              {t(
                "intervention.comparison.evolution"
              )}
            </div>

            {mudancas.length >
              0 ? (
              <div
                className="
                mt-2
                space-y-2
              "
              >
                {mudancas.map(
                  (
                    mudanca,
                    indice
                  ) => (
                    <div
                      key={
                        `${mudanca.tipo}-${indice}`
                      }
                      className={[
                        "phanyx-student-success-comparison-change rounded-lg border px-3 py-2 text-xs font-semibold",

                        mudanca.tipo ===
                          "positiva"
                          ? "phanyx-student-success-comparison-positive"
                          : "phanyx-student-success-comparison-negative",
                      ].join(
                        " "
                      )}
                    >
                      <span
                        aria-hidden="true"
                      >
                        {mudanca.tipo ===
                          "positiva"
                          ? "✓"
                          : "⚠"}
                      </span>{" "}
                      {
                        mudanca.texto
                      }
                    </div>
                  )
                )}
              </div>
            ) : (
              <p
                className="
                phanyx-student-success-comparison-neutral
                mt-2
                text-xs
                font-semibold
              "
              >
                {t(
                  "intervention.comparison.noMeasurableChange"
                )}
              </p>
            )}
          </div>
        </div>
      );
    };

  const limparFiltrosIntervencoes =
    () => {
      setPeriodoIntervencoes(
        "TODOS"
      );

      setFiltroStatusIntervencoes(
        "TODOS"
      );

      setFiltroTipoIntervencoes(
        "TODOS"
      );

      setDataInicialIntervencoes(
        ""
      );

      setDataFinalIntervencoes(
        ""
      );
    };

  const existemFiltrosIntervencoes =
    periodoIntervencoes !==
    "TODOS" ||
    filtroStatusIntervencoes !==
    "TODOS" ||
    filtroTipoIntervencoes !==
    "TODOS";

  const resumo =
    dados?.resumo;

  return (
    <main
      className="
        phanyx-student-success-page
        min-h-full
        bg-slate-50
        text-slate-950
        dark:bg-slate-950
        dark:text-slate-100
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          space-y-6
          p-4
          sm:p-6
          lg:p-8
        "
      >
        {/* CABEÇALHO */}
        <section
          className="
            phanyx-student-success-hero
            overflow-hidden
            rounded-3xl
            border
            p-6
            shadow-sm
            sm:p-8
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                max-w-3xl
              "
            >
              <div
                className="
                  mb-3
                  inline-flex
                  rounded-full
                  border
                  border-blue-200
                  bg-blue-100
                  px-3
                  py-1
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-blue-900
                  dark:border-blue-800
                  dark:bg-blue-950
                  dark:text-blue-200
                "
              >
                PHANYX
              </div>

              <h1
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                  dark:text-white
                  sm:text-3xl
                "
              >
                {t(
                  "title"
                )}
              </h1>

              <p
                className="
                  mt-2
                  text-base
                  font-semibold
                  text-blue-800
                  dark:text-blue-300
                "
              >
                {t(
                  "subtitle"
                )}
              </p>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-700
                  dark:text-slate-300
                  sm:text-base
                "
              >
                {t(
                  "description"
                )}
              </p>
            </div>

            <div
              className="
                flex
                h-20
                w-20
                shrink-0
                items-center
                justify-center
                self-start
                rounded-3xl
                border
                border-blue-200
                bg-white
                shadow-sm
                dark:border-blue-800
                dark:bg-slate-900
                lg:self-center
              "
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="
                  h-10
                  w-10
                  text-blue-700
                  dark:text-blue-300
                "
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 19V9m5 10V5m5 14v-7m5 7V3"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3 7 5-3 5 4 7-5"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* VISÃO GERAL */}
        <section>
          <div
            className="
              mb-4
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <h2
              className="
                phanyx-student-success-section-title
                text-lg
                font-bold
                text-slate-950
                dark:text-white
              "
            >
              {t(
                "overview.title"
              )}
            </h2>

            <button
              type="button"
              onClick={
                () =>
                  void carregarDados()
              }
              disabled={
                carregando
              }
              className="
              phanyx-student-success-refresh-button
                inline-flex
                items-center
                justify-center
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-sm
                font-semibold
                text-slate-700
                shadow-sm
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-200
                dark:hover:bg-slate-800
              "
            >
              {t(
                "actions.refresh"
              )}
            </button>
          </div>

          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              xl:grid-cols-5
            "
          >
            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.critico ??
                    0
                  )
              }
              titulo={t(
                "cards.critical"
              )}
              variante="critical"
            />

            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.risco ??
                    0
                  )
              }
              titulo={t(
                "cards.risk"
              )}
              variante="risk"
            />

            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.atencao ??
                    0
                  )
              }
              titulo={t(
                "cards.attention"
              )}
              variante="attention"
            />

            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.normal ??
                    0
                  )
              }
              titulo={t(
                "cards.normal"
              )}
              variante="normal"
            />

            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.dadosInsuficientes ??
                    0
                  )
              }
              titulo={t(
                "cards.insufficient"
              )}
              variante="insufficient"
            />
          </div>
        </section>

        <section
          className="
    phanyx-student-success-effectiveness
    mt-6
    rounded-2xl
    border
    p-5
  "
        >
          <div>
            <h2
              className="
        phanyx-student-success-effectiveness-title
        text-lg
        font-bold
      "
            >
              {t(
                "intervention.dashboard.title"
              )}
            </h2>

            <p
              className="
        phanyx-student-success-effectiveness-description
        mt-1
        text-sm
      "
            >
              {t(
                "intervention.dashboard.description"
              )}
            </p>
          </div>

          <div
            className="
    phanyx-student-success-management-filters
    mt-5
    rounded-2xl
    border
    p-4
  "
          >
            <div
              className="
      flex
      flex-col
      gap-3
      lg:flex-row
      lg:items-start
      lg:justify-between
    "
            >
              <div>
                <h3
                  className="
          phanyx-student-success-management-filters-title
          text-sm
          font-bold
        "
                >
                  {t(
                    "intervention.dashboard.filters.title"
                  )}
                </h3>

                <p
                  className="
          phanyx-student-success-management-filters-description
          mt-1
          text-xs
        "
                >
                  {t(
                    "intervention.dashboard.filters.description"
                  )}
                </p>
              </div>

              {existemFiltrosIntervencoes ? (
                <button
                  type="button"
                  onClick={
                    limparFiltrosIntervencoes
                  }
                  className="
          phanyx-student-success-management-clear
          inline-flex
          shrink-0
          items-center
          justify-center
          rounded-lg
          border
          px-3
          py-2
          text-xs
          font-bold
          transition
        "
                >
                  ×{" "}
                  {t(
                    "intervention.dashboard.filters.clear"
                  )}
                </button>
              ) : null}
            </div>

            <div
              className="
      mt-4
      grid
      gap-4
      md:grid-cols-2
      xl:grid-cols-3
    "
            >
              {/* PERÍODO */}
              <label
                className="
        block
      "
              >
                <span
                  className="
          phanyx-student-success-management-filter-label
          mb-1.5
          block
          text-xs
          font-bold
        "
                >
                  {t(
                    "intervention.dashboard.filters.period"
                  )}
                </span>

                <select
                  value={
                    periodoIntervencoes
                  }
                  onChange={
                    (
                      event
                    ) => {
                      const valor =
                        event.target
                          .value as PeriodoIntervencoes;

                      setPeriodoIntervencoes(
                        valor
                      );

                      if (
                        valor !==
                        "PERSONALIZADO"
                      ) {
                        setDataInicialIntervencoes(
                          ""
                        );

                        setDataFinalIntervencoes(
                          ""
                        );
                      }
                    }
                  }
                  className="
          phanyx-student-success-management-filter-field
          w-full
          rounded-xl
          border
          px-3
          py-2.5
          text-sm
          font-semibold
          outline-none
        "
                >
                  <option value="TODOS">
                    {t(
                      "intervention.dashboard.filters.allPeriods"
                    )}
                  </option>

                  <option value="HOJE">
                    {t(
                      "intervention.dashboard.filters.today"
                    )}
                  </option>

                  <option value="ULTIMOS_7_DIAS">
                    {t(
                      "intervention.dashboard.filters.last7Days"
                    )}
                  </option>

                  <option value="ULTIMOS_30_DIAS">
                    {t(
                      "intervention.dashboard.filters.last30Days"
                    )}
                  </option>

                  <option value="PERSONALIZADO">
                    {t(
                      "intervention.dashboard.filters.custom"
                    )}
                  </option>
                </select>
              </label>

              {/* STATUS */}
              <label
                className="
        block
      "
              >
                <span
                  className="
          phanyx-student-success-management-filter-label
          mb-1.5
          block
          text-xs
          font-bold
        "
                >
                  {t(
                    "intervention.dashboard.filters.status"
                  )}
                </span>

                <select
                  value={
                    filtroStatusIntervencoes
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setFiltroStatusIntervencoes(
                        event.target
                          .value as FiltroStatusIntervencao
                      )
                  }
                  className="
          phanyx-student-success-management-filter-field
          w-full
          rounded-xl
          border
          px-3
          py-2.5
          text-sm
          font-semibold
          outline-none
        "
                >
                  <option value="TODOS">
                    {t(
                      "intervention.dashboard.filters.allStatuses"
                    )}
                  </option>

                  {[
                    "REGISTRADA",
                    "AGUARDANDO_RETORNO",
                    "EM_ACOMPANHAMENTO",
                    "RESOLVIDA",
                    "CANCELADA",
                  ].map(
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
                        {t(
                          `intervention.statuses.${status}`
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* TIPO */}
              <label
                className="
        block
      "
              >
                <span
                  className="
          phanyx-student-success-management-filter-label
          mb-1.5
          block
          text-xs
          font-bold
        "
                >
                  {t(
                    "intervention.dashboard.filters.type"
                  )}
                </span>

                <select
                  value={
                    filtroTipoIntervencoes
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setFiltroTipoIntervencoes(
                        event.target
                          .value as FiltroTipoIntervencao
                      )
                  }
                  className="
          phanyx-student-success-management-filter-field
          w-full
          rounded-xl
          border
          px-3
          py-2.5
          text-sm
          font-semibold
          outline-none
        "
                >
                  <option value="TODOS">
                    {t(
                      "intervention.dashboard.filters.allTypes"
                    )}
                  </option>

                  {[
                    "CONTATO",
                    "ORIENTACAO",
                    "REUNIAO",
                    "ENCAMINHAMENTO",
                    "ACOMPANHAMENTO",
                    "OUTRO",
                  ].map(
                    (
                      tipo
                    ) => (
                      <option
                        key={
                          tipo
                        }
                        value={
                          tipo
                        }
                      >
                        {t(
                          `intervention.types.${tipo}`
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            {periodoIntervencoes ===
              "PERSONALIZADO" ? (
              <div
                className="
        mt-4
        grid
        gap-4
        md:grid-cols-2
      "
              >
                <label
                  className="
          block
        "
                >
                  <span
                    className="
            phanyx-student-success-management-filter-label
            mb-1.5
            block
            text-xs
            font-bold
          "
                  >
                    {t(
                      "intervention.dashboard.filters.startDate"
                    )}
                  </span>

                  <input
                    type="date"
                    value={
                      dataInicialIntervencoes
                    }
                    max={
                      dataFinalIntervencoes ||
                      undefined
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setDataInicialIntervencoes(
                          event.target
                            .value
                        )
                    }
                    className="
            phanyx-student-success-management-filter-field
            w-full
            rounded-xl
            border
            px-3
            py-2.5
            text-sm
            font-semibold
            outline-none
          "
                  />
                </label>

                <label
                  className="
          block
        "
                >
                  <span
                    className="
            phanyx-student-success-management-filter-label
            mb-1.5
            block
            text-xs
            font-bold
          "
                  >
                    {t(
                      "intervention.dashboard.filters.endDate"
                    )}
                  </span>

                  <input
                    type="date"
                    value={
                      dataFinalIntervencoes
                    }
                    min={
                      dataInicialIntervencoes ||
                      undefined
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setDataFinalIntervencoes(
                          event.target
                            .value
                        )
                    }
                    className="
            phanyx-student-success-management-filter-field
            w-full
            rounded-xl
            border
            px-3
            py-2.5
            text-sm
            font-semibold
            outline-none
          "
                  />
                </label>
              </div>
            ) : null}
          </div>

          {carregandoResumoIntervencoes ? (
            <div
              className="
        phanyx-student-success-effectiveness-state
        mt-4
        rounded-xl
        border
        p-4
        text-sm
      "
            >
              {t(
                "intervention.dashboard.loading"
              )}
            </div>
          ) : erroResumoIntervencoes ? (
            <div
              className="
        mt-4
        rounded-xl
        border
        border-red-300
        bg-red-50
        p-4
        text-sm
        font-semibold
        text-red-800
      "
            >
              {
                erroResumoIntervencoes
              }
            </div>
          ) : resumoIntervencoes ? (
            <>
              <div
                className="
          mt-5
          grid
          gap-3
          sm:grid-cols-2
          xl:grid-cols-5
        "
              >
                <div
                  className="
            phanyx-student-success-management-card
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {
                      resumoIntervencoes
                        .acompanhamento
                        .total
                    }
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-semibold
            "
                  >
                    {t(
                      "intervention.dashboard.total"
                    )}
                  </div>
                </div>

                <div
                  className="
            phanyx-student-success-management-card
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {
                      resumoIntervencoes
                        .acompanhamento
                        .abertas
                    }
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-semibold
            "
                  >
                    {t(
                      "intervention.dashboard.open"
                    )}
                  </div>
                </div>

                <div
                  className="
            phanyx-student-success-management-card
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {
                      resumoIntervencoes
                        .acompanhamento
                        .aguardandoRetorno
                    }
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-semibold
            "
                  >
                    {t(
                      "intervention.dashboard.awaitingResponse"
                    )}
                  </div>
                </div>

                <div
                  className="
            phanyx-student-success-management-card
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {
                      resumoIntervencoes
                        .acompanhamento
                        .emAcompanhamento
                    }
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-semibold
            "
                  >
                    {t(
                      "intervention.dashboard.inProgress"
                    )}
                  </div>
                </div>

                <div
                  className="
            phanyx-student-success-management-card
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {
                      resumoIntervencoes
                        .acompanhamento
                        .resolvidas
                    }
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-semibold
            "
                  >
                    {t(
                      "intervention.dashboard.resolved"
                    )}
                  </div>
                </div>
              </div>

              <div
                className="
          mt-7
        "
              >
                <h3
                  className="
            phanyx-student-success-effectiveness-title
            text-base
            font-bold
          "
                >
                  {t(
                    "intervention.dashboard.effectivenessTitle"
                  )}
                </h3>

                <p
                  className="
            phanyx-student-success-effectiveness-description
            mt-1
            text-sm
          "
                >
                  {t(
                    "intervention.dashboard.effectivenessDescription"
                  )}
                </p>
              </div>

              <div
                className="
          mt-4
          grid
          gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
              >
                <div
                  className="
            phanyx-student-success-effectiveness-card
            phanyx-student-success-effectiveness-positive
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {resumoIntervencoes
                      .efetividade
                      .percentualEvolucaoPositiva !==
                      null
                      ? `${resumoIntervencoes.efetividade.percentualEvolucaoPositiva}%`
                      : t(
                        "intervention.dashboard.unavailable"
                      )}
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-bold
            "
                  >
                    {t(
                      "intervention.dashboard.positiveEvolution"
                    )}
                  </div>

                  <div
                    className="
    mt-1
    text-xs
  "
                  >
                    {resumoIntervencoes
                      .efetividade
                      .amostraSuficiente
                      ? t(
                        "intervention.dashboard.positiveEvolutionSubtitle",
                        {
                          count:
                            resumoIntervencoes
                              .efetividade
                              .resolvidasMensuraveis,
                        }
                      )
                      : t(
                        "intervention.dashboard.sampleInsufficient",
                        {
                          count:
                            resumoIntervencoes
                              .efetividade
                              .resolvidasMensuraveis,
                        }
                      )}
                  </div>
                </div>

                <div
                  className="
            phanyx-student-success-effectiveness-card
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {resumoIntervencoes
                      .efetividade
                      .tempoMedioResolucaoDias ===
                      null
                      ? t(
                        "intervention.dashboard.unavailable"
                      )
                      : resumoIntervencoes
                        .efetividade
                        .tempoMedioResolucaoDias <
                        1
                        ? t(
                          "intervention.dashboard.lessThanOneDay"
                        )
                        : t(
                          "intervention.dashboard.days",
                          {
                            value:
                              Math.round(
                                resumoIntervencoes
                                  .efetividade
                                  .tempoMedioResolucaoDias *
                                10
                              ) /
                              10,
                          }
                        )}
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-bold
            "
                  >
                    {t(
                      "intervention.dashboard.averageResolutionTime"
                    )}
                  </div>
                </div>

                <div
                  className="
            phanyx-student-success-effectiveness-card
            phanyx-student-success-effectiveness-negative
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {
                      resumoIntervencoes
                        .efetividade
                        .alunosComPiora
                    }
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-bold
            "
                  >
                    {t(
                      "intervention.dashboard.studentsWorsened"
                    )}
                  </div>

                  <div
                    className="
              mt-1
              text-xs
            "
                  >
                    {t(
                      "intervention.dashboard.studentsWorsenedSubtitle"
                    )}
                  </div>
                </div>

                <div
                  className="
            phanyx-student-success-effectiveness-card
            rounded-xl
            border
            p-4
          "
                >
                  <div
                    className="
              text-2xl
              font-bold
            "
                  >
                    {
                      resumoIntervencoes
                        .efetividade
                        .naoMensuravel
                    }
                  </div>

                  <div
                    className="
              mt-1
              text-sm
              font-bold
            "
                  >
                    {t(
                      "intervention.dashboard.notMeasurable"
                    )}
                  </div>

                  <div
                    className="
              mt-1
              text-xs
            "
                  >
                    {t(
                      "intervention.dashboard.notMeasurableSubtitle"
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </section>

        {/* PRIORIDADES DO ACOMPANHAMENTO */}
        <section
          className="
    phanyx-student-success-priorities
    rounded-2xl
    border
    p-5
  "
        >
          <div>
            <h2
              className="
        phanyx-student-success-priorities-title
        text-lg
        font-bold
      "
            >
              {t(
                "intervention.priorities.title"
              )}
            </h2>

            <p
              className="
        phanyx-student-success-priorities-description
        mt-1
        text-sm
      "
            >
              {t(
                "intervention.priorities.description"
              )}
            </p>
          </div>

          {carregandoPrioridades ? (
            <div
              className="
        phanyx-student-success-priorities-state
        mt-4
        rounded-xl
        border
        p-4
        text-sm
        font-semibold
      "
            >
              {t(
                "intervention.priorities.loading"
              )}
            </div>
          ) : erroPrioridades ? (
            <div
              className="
        mt-4
        rounded-xl
        border
        border-red-300
        bg-red-50
        p-4
        text-sm
        font-semibold
        text-red-800
      "
            >
              {t(
                "intervention.priorities.error"
              )}
            </div>
          ) : (
            <>
              {/* RESUMO DAS PRIORIDADES */}
              {/* RESUMO DAS PRIORIDADES */}
              <div
                className="
    mt-5
    grid
    gap-3
    sm:grid-cols-2
    xl:grid-cols-4
  "
              >
                <button
                  type="button"
                  aria-pressed={
                    filtroPrioridades ===
                    "HOJE"
                  }
                  onClick={() =>
                    alternarFiltroPrioridades(
                      "HOJE"
                    )
                  }
                  className="
      phanyx-student-success-priority-summary
      phanyx-student-success-priority-summary-button
      phanyx-student-success-priority-today
      relative
      rounded-xl
      border
      p-4
      text-left
      transition
    "
                >
                  <div
                    className="
        text-2xl
        font-bold
      "
                  >
                    {
                      prioridadesClassificadas
                        .hoje.length
                    }
                  </div>

                  <div
                    className="
        mt-1
        text-sm
        font-bold
      "
                  >
                    {t(
                      "intervention.priorities.today"
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={
                    filtroPrioridades ===
                    "ATRASADOS"
                  }
                  onClick={() =>
                    alternarFiltroPrioridades(
                      "ATRASADOS"
                    )
                  }
                  className="
      phanyx-student-success-priority-summary
      phanyx-student-success-priority-summary-button
      phanyx-student-success-priority-overdue
      relative
      rounded-xl
      border
      p-4
      text-left
      transition
    "
                >
                  <div
                    className="
        text-2xl
        font-bold
      "
                  >
                    {
                      prioridadesClassificadas
                        .atrasados.length
                    }
                  </div>

                  <div
                    className="
        mt-1
        text-sm
        font-bold
      "
                  >
                    {t(
                      "intervention.priorities.overdue"
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={
                    filtroPrioridades ===
                    "PIORA"
                  }
                  onClick={() =>
                    alternarFiltroPrioridades(
                      "PIORA"
                    )
                  }
                  className="
      phanyx-student-success-priority-summary
      phanyx-student-success-priority-summary-button
      phanyx-student-success-priority-worsened
      relative
      rounded-xl
      border
      p-4
      text-left
      transition
    "
                >
                  <div
                    className="
        text-2xl
        font-bold
      "
                  >
                    {
                      prioridadesClassificadas
                        .pioraAposIntervencao
                        .length
                    }
                  </div>

                  <div
                    className="
        mt-1
        text-sm
        font-bold
      "
                  >
                    {t(
                      "intervention.priorities.worsened"
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={
                    filtroPrioridades ===
                    "SEM_RETORNO"
                  }
                  onClick={() =>
                    alternarFiltroPrioridades(
                      "SEM_RETORNO"
                    )
                  }
                  className="
      phanyx-student-success-priority-summary
      phanyx-student-success-priority-summary-button
      phanyx-student-success-priority-unscheduled
      relative
      rounded-xl
      border
      p-4
      text-left
      transition
    "
                >
                  <div
                    className="
        text-2xl
        font-bold
      "
                  >
                    {
                      prioridadesClassificadas
                        .semRetorno.length
                    }
                  </div>

                  <div
                    className="
        mt-1
        text-sm
        font-bold
      "
                  >
                    {t(
                      "intervention.priorities.unscheduled"
                    )}
                  </div>
                </button>
              </div>

              {existeFiltroPrioridadeAtivo ? (
                <div
                  className="
      mt-3
      flex
      justify-end
    "
                >
                  <button
                    type="button"
                    onClick={() =>
                      setFiltroPrioridades(
                        "TODOS"
                      )
                    }
                    className="
        phanyx-student-success-priority-clear-filter
        rounded-lg
        border
        px-3
        py-2
        text-xs
        font-bold
        transition
      "
                  >
                    ×{" "}
                    {t(
                      "intervention.priorities.showAll"
                    )}
                  </button>
                </div>
              ) : null}

              {prioridadeFiltradaVazia ? (
                <div
                  className="
            phanyx-student-success-priorities-state
            mt-4
            rounded-xl
            border
            p-4
            text-sm
            font-semibold
          "
                >
                  {t(
                    "intervention.priorities.empty"
                  )}
                </div>
              ) : (
                <div
                  className={[
                    "mt-5 grid gap-4",

                    quantidadeGruposPrioridadeVisiveis ===
                      1
                      ? "grid-cols-1"
                      : "xl:grid-cols-2",
                  ].join(
                    " "
                  )}
                >
                  {[
                    {
                      chave:
                        "today",

                      filtro:
                        "HOJE" as const,

                      titulo:
                        t(
                          "intervention.priorities.today"
                        ),

                      descricao:
                        t(
                          "intervention.priorities.todayDescription"
                        ),

                      itens:
                        prioridadesClassificadas
                          .hoje,

                      classe:
                        "phanyx-student-success-priority-group-today",

                      piora:
                        false,
                    },

                    {
                      chave:
                        "overdue",

                      filtro:
                        "ATRASADOS" as const,


                      titulo:
                        t(
                          "intervention.priorities.overdue"
                        ),

                      descricao:
                        t(
                          "intervention.priorities.overdueDescription"
                        ),

                      itens:
                        prioridadesClassificadas
                          .atrasados,

                      classe:
                        "phanyx-student-success-priority-group-overdue",

                      piora:
                        false,
                    },

                    {
                      chave:
                        "unscheduled",

                      filtro:
                        "SEM_RETORNO" as const,

                      titulo:
                        t(
                          "intervention.priorities.unscheduled"
                        ),

                      descricao:
                        t(
                          "intervention.priorities.unscheduledDescription"
                        ),

                      itens:
                        prioridadesClassificadas
                          .semRetorno,

                      classe:
                        "phanyx-student-success-priority-group-unscheduled",

                      piora:
                        false,
                    },
                  ]
                    .filter(
                      (
                        grupo
                      ) =>
                        grupo.itens.length >
                        0 &&
                        (
                          filtroPrioridades ===
                          "TODOS" ||
                          filtroPrioridades ===
                          grupo.filtro
                        )
                    ).filter(
                      (
                        grupo
                      ) =>
                        grupo.itens.length >
                        0
                    )
                    .map(
                      (
                        grupo
                      ) => (
                        <div
                          key={
                            grupo.chave
                          }
                          className={[
                            "phanyx-student-success-priority-group rounded-xl border p-4",
                            grupo.classe,
                          ].join(
                            " "
                          )}
                        >
                          <h3
                            className="
                      text-sm
                      font-bold
                    "
                          >
                            {
                              grupo.titulo
                            }
                          </h3>

                          <p
                            className="
                      phanyx-student-success-priority-muted
                      mt-1
                      text-xs
                    "
                          >
                            {
                              grupo.descricao
                            }
                          </p>

                          <div
                            className="
                      mt-3
                      space-y-3
                    "
                          >
                            {grupo.itens.map(
                              (
                                item
                              ) => (
                                <article
                                  key={
                                    item.id
                                  }
                                  className="
                            phanyx-student-success-priority-item
                            rounded-xl
                            border
                            p-3
                          "
                                >
                                  <div
                                    className="
                              flex
                              flex-wrap
                              items-start
                              justify-between
                              gap-2
                            "
                                  >
                                    <div>
                                      <div
                                        className="
                                  phanyx-student-success-priority-student
                                  font-bold
                                "
                                      >
                                        {
                                          item
                                            .aluno
                                            .nome
                                        }
                                      </div>

                                      {item
                                        .aluno
                                        .matricula ? (
                                        <div
                                          className="
                                    phanyx-student-success-priority-muted
                                    mt-0.5
                                    text-xs
                                  "
                                        >
                                          {
                                            item
                                              .aluno
                                              .matricula
                                          }
                                        </div>
                                      ) : null}
                                    </div>

                                    <span
                                      className="
                                phanyx-student-success-priority-status
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-xs
                                font-bold
                              "
                                    >
                                      {t(
                                        `intervention.statuses.${item.status}`
                                      )}
                                    </span>
                                  </div>

                                  <div
                                    className="
                              phanyx-student-success-priority-muted
                              mt-3
                              text-xs
                            "
                                  >
                                    {item.retornoEm ? (
                                      <>
                                        {t(
                                          grupo.chave ===
                                            "overdue"
                                            ? "intervention.priorities.overdueSince"
                                            : "intervention.priorities.scheduledFor"
                                        )}
                                        :{" "}

                                        {new Intl.DateTimeFormat(
                                          undefined,
                                          {
                                            dateStyle:
                                              "medium",
                                          }
                                        ).format(
                                          new Date(
                                            item.retornoEm
                                          )
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {t(
                                          "intervention.priorities.withoutDate"
                                        )}

                                        {" · "}

                                        {calcularDiasSemAtualizacao(
                                          item.atualizadoEm
                                        ) === 0
                                          ? t(
                                            "intervention.priorities.updatedToday"
                                          )
                                          : t(
                                            "intervention.priorities.daysWithoutUpdate",
                                            {
                                              count:
                                                calcularDiasSemAtualizacao(
                                                  item.atualizadoEm
                                                ),
                                            }
                                          )}
                                      </>
                                    )}
                                  </div>

                                  <div
                                    className="
                              mt-3
                              grid
                              gap-2
                              sm:grid-cols-2
                            "
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirAlunoDaFila(
                                          item.alunoId
                                        )
                                      }
                                      className="
                                phanyx-student-success-priority-view
                                rounded-lg
                                border
                                px-3
                                py-2
                                text-xs
                                font-bold
                                transition
                              "
                                    >
                                      {t(
                                        "intervention.priorities.viewStudent"
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void atualizarIntervencaoDaFila(
                                          item
                                        )
                                      }
                                      className="
                                phanyx-student-success-priority-update
                                rounded-lg
                                border
                                px-3
                                py-2
                                text-xs
                                font-bold
                                transition
                              "
                                    >
                                      {t(
                                        "intervention.priorities.update"
                                      )}
                                    </button>
                                  </div>
                                </article>
                              )
                            )}
                          </div>
                        </div>
                      )
                    )}

                  {/* PIORA APÓS INTERVENÇÃO */}
                  {(
                    filtroPrioridades ===
                    "TODOS" ||
                    filtroPrioridades ===
                    "PIORA"
                  ) &&
                    prioridadesClassificadas
                      .pioraAposIntervencao
                      .length >
                    0 ? (
                    <div
                      className="
                phanyx-student-success-priority-group
                phanyx-student-success-priority-group-worsened
                rounded-xl
                border
                p-4
              "
                    >
                      <h3
                        className="
                  text-sm
                  font-bold
                "
                      >
                        {t(
                          "intervention.priorities.worsened"
                        )}
                      </h3>

                      <p
                        className="
                  phanyx-student-success-priority-muted
                  mt-1
                  text-xs
                "
                      >
                        {t(
                          "intervention.priorities.worsenedDescription"
                        )}
                      </p>

                      <div
                        className="
                  mt-3
                  space-y-3
                "
                      >
                        {prioridadesClassificadas
                          .pioraAposIntervencao
                          .map(
                            (
                              item
                            ) => (
                              <article
                                key={
                                  item.id
                                }
                                className="
                          phanyx-student-success-priority-item
                          rounded-xl
                          border
                          p-3
                        "
                              >
                                <div
                                  className="
                            phanyx-student-success-priority-student
                            font-bold
                          "
                                >
                                  {
                                    item
                                      .aluno
                                      .nome
                                  }
                                </div>

                                {item
                                  .aluno
                                  .matricula ? (
                                  <div
                                    className="
                              phanyx-student-success-priority-muted
                              mt-0.5
                              text-xs
                            "
                                  >
                                    {
                                      item
                                        .aluno
                                        .matricula
                                    }
                                  </div>
                                ) : null}

                                <div
                                  className="
                            phanyx-student-success-priority-warning
                            mt-3
                            rounded-lg
                            border
                            px-3
                            py-2
                            text-xs
                            font-semibold
                          "
                                >
                                  ⚠{" "}
                                  {t(
                                    "intervention.priorities.needsReview"
                                  )}
                                </div>

                                {item.concluidoEm ? (
                                  <div
                                    className="
                              phanyx-student-success-priority-muted
                              mt-2
                              text-xs
                            "
                                  >
                                    {t(
                                      "intervention.priorities.completedAt"
                                    )}
                                    :{" "}

                                    {new Intl.DateTimeFormat(
                                      undefined,
                                      {
                                        dateStyle:
                                          "medium",
                                      }
                                    ).format(
                                      new Date(
                                        item.concluidoEm
                                      )
                                    )}
                                  </div>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirAlunoDaFila(
                                      item.alunoId
                                    )
                                  }
                                  className="
                            phanyx-student-success-priority-view
                            mt-3
                            w-full
                            rounded-lg
                            border
                            px-3
                            py-2
                            text-xs
                            font-bold
                            transition
                          "
                                >
                                  {t(
                                    "intervention.priorities.viewStudent"
                                  )}
                                </button>
                              </article>
                            )
                          )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </section>

        {/* RETORNOS E ACOMPANHAMENTOS */}
        <section
          className="
            phanyx-student-success-returns
            rounded-2xl
            border
            p-5
          "
        >
          <div>
            <h2
              className="
                phanyx-student-success-returns-title
                text-lg
                font-bold
              "
            >
              {t(
                "intervention.returns.title"
              )}
            </h2>

            <p
              className="
                phanyx-student-success-returns-description
                mt-1
                text-sm
              "
            >
              {t(
                "intervention.returns.description"
              )}
            </p>
          </div>

          {carregandoRetornos ? (
            <div
              className="
                phanyx-student-success-returns-state
                mt-4
                rounded-xl
                border
                p-4
                text-sm
              "
            >
              {t(
                "intervention.returns.loading"
              )}
            </div>
          ) : erroRetornos ? (
            <div
              className="
                mt-4
                rounded-xl
                border
                border-red-300
                bg-red-50
                p-4
                text-sm
                font-semibold
                text-red-800
              "
            >
              {
                erroRetornos
              }
            </div>
          ) : (
            <>
              {/* RESUMO */}

              <div
                className="
    mt-5
    grid
    gap-3
    sm:grid-cols-2
    xl:grid-cols-4
  "
              >
                <button
                  type="button"
                  aria-pressed={
                    filtroRetornos ===
                    "ATRASADOS"
                  }
                  onClick={() =>
                    alternarFiltroRetornos(
                      "ATRASADOS"
                    )
                  }
                  className="
      phanyx-student-success-return-summary
      phanyx-student-success-return-summary-button
      phanyx-student-success-return-overdue
      rounded-xl
      border
      p-4
      text-left
      transition
    "
                >
                  <div
                    className="
        text-2xl
        font-bold
      "
                  >
                    {
                      retornosClassificados
                        .atrasados
                        .length
                    }
                  </div>

                  <div
                    className="
        mt-1
        text-sm
        font-bold
      "
                  >
                    {t(
                      "intervention.returns.overdue"
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={
                    filtroRetornos ===
                    "HOJE"
                  }
                  onClick={() =>
                    alternarFiltroRetornos(
                      "HOJE"
                    )
                  }
                  className="
      phanyx-student-success-return-summary
      phanyx-student-success-return-summary-button
      phanyx-student-success-return-today
      rounded-xl
      border
      p-4
      text-left
      transition
    "
                >
                  <div
                    className="
        text-2xl
        font-bold
      "
                  >
                    {
                      retornosClassificados
                        .hoje
                        .length
                    }
                  </div>

                  <div
                    className="
        mt-1
        text-sm
        font-bold
      "
                  >
                    {t(
                      "intervention.returns.today"
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={
                    filtroRetornos ===
                    "PROXIMOS_7_DIAS"
                  }
                  onClick={() =>
                    alternarFiltroRetornos(
                      "PROXIMOS_7_DIAS"
                    )
                  }
                  className="
      phanyx-student-success-return-summary
      phanyx-student-success-return-summary-button
      phanyx-student-success-return-upcoming
      rounded-xl
      border
      p-4
      text-left
      transition
    "
                >
                  <div
                    className="
        text-2xl
        font-bold
      "
                  >
                    {
                      retornosClassificados
                        .proximos7Dias
                        .length
                    }
                  </div>

                  <div
                    className="
        mt-1
        text-sm
        font-bold
      "
                  >
                    {t(
                      "intervention.returns.next7Days"
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={
                    filtroRetornos ===
                    "SEM_RETORNO"
                  }
                  onClick={() =>
                    alternarFiltroRetornos(
                      "SEM_RETORNO"
                    )
                  }
                  className="
      phanyx-student-success-return-summary
      phanyx-student-success-return-summary-button
      phanyx-student-success-return-unscheduled
      rounded-xl
      border
      p-4
      text-left
      transition
    "
                >
                  <div
                    className="
        text-2xl
        font-bold
      "
                  >
                    {
                      retornosClassificados
                        .semRetorno
                        .length
                    }
                  </div>

                  <div
                    className="
        mt-1
        text-sm
        font-bold
      "
                  >
                    {t(
                      "intervention.returns.unscheduled"
                    )}

                  </div>
                </button>
              </div>

              {filtroRetornos !==
                "TODOS" ? (
                <div
                  className="
      mt-3
      flex
      justify-end
    "
                >
                  <button
                    type="button"
                    onClick={() =>
                      setFiltroRetornos(
                        "TODOS"
                      )
                    }
                    className="
        phanyx-student-success-return-clear-filter
        inline-flex
        items-center
        justify-center
        rounded-lg
        border
        px-3
        py-2
        text-xs
        font-bold
        transition
      "
                  >
                    <span
                      aria-hidden="true"
                      className="
          mr-1.5
        "
                    >
                      ×
                    </span>

                    {t(
                      "intervention.returns.showAll"
                    )}
                  </button>
                </div>
              ) : null}

              {/* FILA */}
              {filtroRetornosVazio ? (
                <div
                  className="
                    phanyx-student-success-returns-empty
                    mt-4
                    rounded-xl
                    border
                    p-4
                    text-sm
                    font-semibold
                  "
                >
                  {t(
                    "intervention.returns.empty"
                  )}
                </div>
              ) : (
                <div
                  className={[
                    "mt-5 grid gap-4",

                    gruposRetornosVisiveis
                      .filter(
                        (
                          grupo
                        ) =>
                          grupo.itens.length >
                          0
                      )
                      .length === 1
                      ? "grid-cols-1"
                      : "xl:grid-cols-2",
                  ].join(
                    " "
                  )}
                >
                  {gruposRetornosVisiveis
                    .filter(
                      (
                        grupo
                      ) =>
                        grupo.itens.length >
                        0
                    )
                    .map(
                      (
                        grupo
                      ) => (
                        <div
                          key={
                            grupo.chave
                          }
                          className={[
                            "phanyx-student-success-return-group rounded-xl border p-4",
                            grupo.classe,
                          ].join(
                            " "
                          )}
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              gap-3
                            "
                          >
                            <h3
                              className="
                                text-sm
                                font-bold
                              "
                            >
                              {
                                grupo.titulo
                              }
                            </h3>

                            <span
                              className="
                                phanyx-student-success-return-count
                                inline-flex
                                min-w-7
                                items-center
                                justify-center
                                rounded-full
                                border
                                px-2
                                py-1
                                text-xs
                                font-bold
                              "
                            >
                              {
                                grupo
                                  .itens
                                  .length
                              }
                            </span>
                          </div>

                          <div
                            className="
                              mt-3
                              space-y-2
                            "
                          >
                            {grupo.itens.map(
                              (
                                intervencao
                              ) => (
                                <div
                                  key={
                                    intervencao.id
                                  }
                                  className="
                                    phanyx-student-success-return-item
                                    rounded-xl
                                    border
                                    p-3
                                  "
                                >
                                  <div
                                    className="
                                      flex
                                      flex-col
                                      gap-2
                                      sm:flex-row
                                      sm:items-start
                                      sm:justify-between
                                    "
                                  >
                                    <div
                                      className="
                                        min-w-0
                                      "
                                    >
                                      <div
                                        className="
                                          phanyx-student-success-return-student
                                          font-bold
                                        "
                                      >
                                        {
                                          intervencao
                                            .aluno
                                            .nome
                                        }
                                      </div>

                                      {intervencao
                                        .aluno
                                        .matricula ? (
                                        <div
                                          className="
                                            phanyx-student-success-return-muted
                                            mt-0.5
                                            text-xs
                                          "
                                        >
                                          {
                                            intervencao
                                              .aluno
                                              .matricula
                                          }
                                        </div>
                                      ) : null}
                                    </div>

                                    <span
                                      className="
                                        phanyx-student-success-return-status
                                        inline-flex
                                        self-start
                                        rounded-full
                                        border
                                        px-2.5
                                        py-1
                                        text-xs
                                        font-bold
                                      "
                                    >
                                      {t(
                                        `intervention.statuses.${intervencao.status}`
                                      )}
                                    </span>
                                  </div>

                                  <div
                                    className="
                                      phanyx-student-success-return-muted
                                      mt-3
                                      text-xs
                                    "
                                  >
                                    {intervencao
                                      .retornoEm ? (
                                      <>
                                        <strong>
                                          {t(
                                            "intervention.returns.scheduledFor"
                                          )}
                                          :
                                        </strong>{" "}

                                        {new Intl.DateTimeFormat(
                                          undefined,
                                          {
                                            dateStyle:
                                              "medium",
                                          }
                                        ).format(
                                          new Date(
                                            intervencao
                                              .retornoEm
                                          )
                                        )}
                                      </>
                                    ) : (
                                      t(
                                        "intervention.returns.noScheduledDate"
                                      )
                                    )}
                                  </div>

                                  <div
                                    className="
                                      phanyx-student-success-return-muted
                                      mt-2
                                      text-xs
                                      font-semibold
                                    "
                                  >
                                    {t(
                                      `intervention.types.${intervencao.tipo}`
                                    )}

                                    {" · "}

                                    {t(
                                      `intervention.channels.${intervencao.canal}`
                                    )}
                                  </div>
                                  <div
                                    className="
    mt-3
    grid
    gap-2
    sm:grid-cols-2
  "
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirAlunoDaFila(
                                          intervencao.alunoId
                                        )
                                      }
                                      className="
      phanyx-student-success-return-action
      phanyx-student-success-return-view
      rounded-lg
      border
      px-3
      py-2
      text-xs
      font-bold
      transition
    "
                                    >
                                      {t(
                                        "intervention.returns.viewStudent"
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void atualizarIntervencaoDaFila(
                                          intervencao
                                        )
                                      }
                                      className="
      phanyx-student-success-return-action
      phanyx-student-success-return-update
      rounded-lg
      border
      px-3
      py-2
      text-xs
      font-bold
      transition
    "
                                    >
                                      {t(
                                        "intervention.returns.update"
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ALUNOS PARA ACOMPANHAMENTO */}
        <section
          className="
            phanyx-student-success-panel
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div
            className="
              border-b
              border-slate-200
              px-5
              py-5
              dark:border-slate-800
              sm:px-6
            "
          >
            <h2
              className="
                phanyx-student-success-panel-title
                text-lg
                font-bold
                text-slate-950
                dark:text-white
              "
            >
              {t(
                "studentsAttention.title"
              )}
            </h2>

            <p
              className="
                phanyx-student-success-muted
                mt-1
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-300
              "
            >
              {t(
                "studentsAttention.description"
              )}
            </p>
          </div>

          {!carregando &&
            !erro ? (
            <div
              className="
      border-b
      border-slate-200
      p-4
      dark:border-slate-800
      sm:p-5
    "
            >
              <div
                className="
        flex
        flex-col
        gap-4
      "
              >
                <div
                  className="
          relative
        "
                >
                  <span
                    className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
                    aria-hidden="true"
                  >
                    🔎
                  </span>

                  <input

                    type="search"
                    value={
                      busca
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setBusca(
                          event
                            .target
                            .value
                        )
                    }
                    placeholder={t(
                      "filters.searchPlaceholder"
                    )}
                    className="
                     phanyx-student-success-search
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            py-3
            pl-11
            pr-4
            text-sm
            font-medium
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500/20
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-white
          "
                  />
                </div>

                <div
                  className="
    flex
    flex-wrap
    gap-2
  "
                >
                  {(
                    [
                      [
                        "TODOS",
                        t("filters.all"),
                        dados?.resumo.monitorados ?? 0,
                      ],
                      [
                        "CRITICO",
                        t("levels.CRITICO"),
                        dados?.resumo.critico ?? 0,
                      ],
                      [
                        "RISCO",
                        t("levels.RISCO"),
                        dados?.resumo.risco ?? 0,
                      ],
                      [
                        "ATENCAO",
                        t("levels.ATENCAO"),
                        dados?.resumo.atencao ?? 0,
                      ],
                      [
                        "NORMAL",
                        t("levels.NORMAL"),
                        dados?.resumo.normal ?? 0,
                      ],
                      [
                        "DADOS_INSUFICIENTES",
                        t("levels.DADOS_INSUFICIENTES"),
                        dados?.resumo.dadosInsuficientes ?? 0,
                      ],
                    ] as const
                  ).map(
                    ([
                      valor,
                      titulo,
                      quantidade,
                    ]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() =>
                          setFiltroNivel(
                            valor
                          )
                        }
                        className={[
                          "phanyx-student-success-filter rounded-full border px-4 py-2 text-sm font-semibold transition",

                          filtroNivel === valor
                            ? "phanyx-student-success-filter-active"
                            : "phanyx-student-success-filter-inactive",
                        ].join(" ")}
                      >
                        {titulo}

                        <span
                          className="
            ml-2
            opacity-100
          "
                        >
                          {quantidade}
                        </span>
                      </button>
                    )
                  )}
                </div>

              </div>
            </div>
          ) : null}

          {carregando ? (
            <div
              className="
                flex
                min-h-[280px]
                items-center
                justify-center
                p-6
              "
            >
              <div
                className="
                  max-w-md
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    h-10
                    w-10
                    animate-spin
                    rounded-full
                    border-4
                    border-slate-200
                    border-t-blue-600
                    dark:border-slate-700
                    dark:border-t-blue-400
                  "
                  aria-hidden="true"
                />

                <p
                  className="
                    phanyx-student-success-muted
                    mt-4
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  {t(
                    "states.loading"
                  )}
                </p>
              </div>
            </div>
          ) : erro ? (
            <div
              className="
                flex
                min-h-[240px]
                items-center
                justify-center
                p-6
              "
            >
              <div
                className="
                  max-w-md
                  text-center
                "
              >
                <p
                  className="
                    font-semibold
                    text-red-700
                    dark:text-red-300
                  "
                >
                  {t(
                    "states.error"
                  )}
                </p>

                <button
                  type="button"
                  onClick={
                    () =>
                      void carregarDados()
                  }
                  className="
                    mt-4
                    rounded-xl
                    bg-blue-700
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-800
                  "
                >
                  {t(
                    "actions.refresh"
                  )}
                </button>
              </div>
            </div>
          ) : alunosFiltrados.length ===
            0 ? (
            <div
              className="
                flex
                min-h-[240px]
                items-center
                justify-center
                p-6
              "
            >
              <p
                className="
                  phanyx-student-success-muted
                  text-center
                  text-sm
                  font-semibold
                  text-slate-700
                  dark:text-slate-200
                "
              >
                {t(
                  "states.noRisk"
                )}
              </p>
            </div>
          ) : (
            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
    phanyx-student-success-table
    w-full
    min-w-[900px]
    border-collapse
  "
              >
                <thead
                  className="
                    bg-slate-50
                    dark:bg-slate-950/60
                  "
                >
                  <tr>
                    <th
                      className="
                        px-5
                        py-3
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.student"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.risk"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.score"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.frequency"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.performance"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.pendingActivities"
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-slate-200
                    dark:divide-slate-800
                  "
                >
                  {alunosFiltrados.map(
                    (
                      aluno
                    ) => {
                      const dadosInsuficientes =
                        aluno
                          .analise
                          .nivel ===
                        "DADOS_INSUFICIENTES";

                      return (
                        <tr
                          key={
                            aluno.alunoId
                          }
                          onClick={() =>
                            setAlunoSelecionado(
                              aluno
                            )
                          }
                          onKeyDown={
                            (
                              event
                            ) => {
                              if (
                                event.key ===
                                "Enter" ||
                                event.key ===
                                " "
                              ) {
                                event.preventDefault();

                                setAlunoSelecionado(
                                  aluno
                                );
                              }
                            }
                          }
                          tabIndex={0}
                          className="
  phanyx-student-success-row
  cursor-pointer
  transition-colors
  focus:outline-none
  focus:ring-2
  focus:ring-inset
  focus:ring-blue-500
"
                        >

                          <td
                            className="
                              px-5
                              py-4
                            "
                          >
                            <div
                              className="
    phanyx-student-success-student-name
    font-semibold
    text-slate-950
    dark:text-white
  "
                            >
                              {
                                aluno.nome
                              }
                            </div>

                            {aluno.matricula ? (
                              <div
                                className="
    phanyx-student-success-student-registration
    mt-1
    text-xs
    text-slate-500
    dark:text-slate-400
  "
                              >
                                {
                                  aluno.matricula
                                }
                              </div>
                            ) : null}
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                            "
                          >
                            <span
                              className={[
                                "phanyx-student-success-risk-badge inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                classeNivel(
                                  aluno
                                    .analise
                                    .nivel
                                ),
                              ].join(
                                " "
                              )}
                            >
                              {t(
                                `levels.${aluno.analise.nivel}`
                              )}
                            </span>
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                              text-center
                              text-sm
                              font-bold
                              text-slate-800
                              dark:text-slate-100
                            "
                          >
                            {dadosInsuficientes
                              ? "—"
                              : aluno
                                .analise
                                .pontuacao}
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                              text-center
                              text-sm
                              font-semibold
                              text-slate-700
                              dark:text-slate-200
                            "
                          >
                            {formatarPercentual(
                              aluno
                                .indicadores
                                .frequenciaPercentual
                            )}
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                              text-center
                              text-sm
                              font-semibold
                              text-slate-700
                              dark:text-slate-200
                            "
                          >
                            {formatarPercentual(
                              aluno
                                .indicadores
                                .mediaPercentual
                            )}
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                              text-center
                              text-sm
                              font-bold
                              text-slate-800
                              dark:text-slate-100
                            "
                          >
                            {
                              aluno
                                .indicadores
                                .atividadesVencidas
                            }
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* APOIO À DECISÃO */}
        <section
          className="
          phanyx-student-success-disclaimer
            rounded-2xl
            border
            border-blue-200
            bg-blue-50
            p-5
            text-blue-950
            dark:border-blue-900/70
            dark:bg-blue-950/30
            dark:text-blue-100
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
              phanyx-student-success-disclaimer-icon
                mt-0.5
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-800
                dark:bg-blue-900/70
                dark:text-blue-200
              "
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="
                  h-5
                  w-5
                "
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />

                <path
                  strokeLinecap="round"
                  d="M12 10v6"
                />

                <path
                  strokeLinecap="round"
                  d="M12 7h.01"
                />
              </svg>
            </div>

            <div>
              <h3
                className="
    phanyx-student-success-disclaimer-title
    font-bold
  "
              >
                {t(
                  "disclaimer.title"
                )}
              </h3>

              <p
                className="
                phanyx-student-success-disclaimer-text
                  mt-1
                  text-sm
                  leading-6
                  text-blue-900
                  dark:text-blue-200
                "
              >
                {t(
                  "disclaimer.text"
                )}
              </p>
            </div>
          </div>
        </section>
      </div >
      {alunoSelecionado ? (
        <div
          className="
      fixed
      inset-0
      z-[120]
      flex
      justify-end
    "
          role="presentation"
        >
          {/* FUNDO */}
          <button
            type="button"
            aria-label={t(
              "drawer.close"
            )}
            onClick={() =>
              setAlunoSelecionado(
                null
              )
            }
            className="
        absolute
        inset-0
        cursor-default
        bg-black/45
        backdrop-blur-[1px]
      "
          />

          {/* DRAWER */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-success-drawer-title"
            className="
        phanyx-student-success-drawer
        relative
        z-10
        flex
        h-full
        w-full
        max-w-[560px]
        flex-col
        overflow-hidden
        border-l
        border-slate-200
        bg-white
        shadow-2xl
        dark:border-slate-700
        dark:bg-slate-950
      "
          >
            {/* CABEÇALHO */}
            <div
              className="
          phanyx-student-success-drawer-header
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-slate-200
          px-5
          py-5
          dark:border-slate-800
          sm:px-6
        "
            >
              <div
                className="
            min-w-0
          "
              >
                <p
                  className="
              text-xs
              font-bold
              uppercase
              tracking-[0.14em]
              text-blue-600
              dark:text-blue-300
            "
                >
                  {t(
                    "drawer.analysis"
                  )}
                </p>

                <h2
                  id="student-success-drawer-title"
                  className="
              phanyx-student-success-drawer-name
              mt-1
              break-words
              text-xl
              font-bold
              text-slate-950
              dark:text-white
            "
                >
                  {
                    alunoSelecionado.nome
                  }
                </h2>

                {alunoSelecionado.matricula ? (
                  <p
                    className="
                phanyx-student-success-drawer-muted
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
                  >
                    {
                      alunoSelecionado.matricula
                    }
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() =>
                  setAlunoSelecionado(
                    null
                  )
                }
                aria-label={t(
                  "drawer.close"
                )}
                className="
            phanyx-student-success-drawer-close
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            border-slate-300
            bg-white
            text-xl
            font-bold
            text-slate-700
            transition
            hover:bg-slate-100
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-white
            dark:hover:bg-slate-800
          "
              >
                ×
              </button>
            </div>

            {/* CONTEÚDO */}
            <div
              className="
          flex-1
          space-y-5
          overflow-y-auto
          p-5
          sm:p-6
        "
            >
              {/* CLASSIFICAÇÃO */}
              <section
                className="
            phanyx-student-success-drawer-card
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-4
            dark:border-slate-800
            dark:bg-slate-900
          "
              >
                <div
                  className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
            "
                >
                  <span
                    className={[
                      "inline-flex rounded-full border px-3 py-1.5 text-xs font-bold",
                      classeNivel(
                        alunoSelecionado
                          .analise
                          .nivel
                      ),
                    ].join(
                      " "
                    )}
                  >
                    {t(
                      `levels.${alunoSelecionado.analise.nivel}`
                    )}
                  </span>

                  {alunoSelecionado.analise
                    .nivel !==
                    "DADOS_INSUFICIENTES" ? (
                    <div
                      className="
                  text-right
                "
                    >
                      <div
                        className="
                    phanyx-student-success-drawer-muted
                    text-xs
                    font-semibold
                    text-slate-500
                    dark:text-slate-400
                  "
                      >
                        {t(
                          "drawer.score"
                        )}
                      </div>

                      <div
                        className="
                    text-2xl
                    font-bold
                    text-slate-950
                    dark:text-white
                  "
                      >
                        {
                          alunoSelecionado
                            .analise
                            .pontuacao
                        }
                      </div>
                    </div>
                  ) : null}
                </div>

                {alunoSelecionado.analise
                  .nivel ===
                  "DADOS_INSUFICIENTES" ? (
                  <p
                    className="
                phanyx-student-success-drawer-muted
                mt-3
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-300
              "
                  >
                    {t(
                      "drawer.scoreUnavailable"
                    )}
                  </p>
                ) : null}

                <div
                  className="
              mt-4
              grid
              grid-cols-2
              gap-3
            "
                >
                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-3
                dark:border-slate-700
                dark:bg-slate-950
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.dataCoverage"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-lg
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {
                        alunoSelecionado
                          .analise
                          .coberturaPercentual
                      }%
                    </div>
                  </div>

                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-3
                dark:border-slate-700
                dark:bg-slate-950
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.reliability"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-lg
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {t(
                        `reliability.${alunoSelecionado.analise.confiabilidade}`
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="
              mt-4
              overflow-hidden
              rounded-full
              bg-slate-200
              dark:bg-slate-800
            "
                >
                  <div
                    className="
                h-2
                rounded-full
                bg-blue-600
                transition-all
              "
                    style={{
                      width:
                        `${Math.max(
                          0,
                          Math.min(
                            100,
                            alunoSelecionado
                              .analise
                              .coberturaPercentual
                          )
                        )}%`,
                    }}
                  />
                </div>
              </section>

              {/* INDICADORES */}
              <section>
                <h3
                  className="
              phanyx-student-success-drawer-title
              text-sm
              font-bold
              uppercase
              tracking-wide
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "drawer.indicators"
                  )}
                </h3>

                <div
                  className="
              mt-3
              grid
              gap-3
              sm:grid-cols-2
            "
                >
                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "components.FREQUENCIA"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {formatarPercentual(
                        alunoSelecionado
                          .indicadores
                          .frequenciaPercentual
                      )}
                    </div>

                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  mt-1
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.classes"
                      )}:{" "}
                      {
                        alunoSelecionado
                          .indicadores
                          .quantidadeAulas
                      }
                    </div>
                  </div>

                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "components.DESEMPENHO"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {formatarPercentual(
                        alunoSelecionado
                          .indicadores
                          .mediaPercentual
                      )}
                    </div>

                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  mt-1
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.assessments"
                      )}:{" "}
                      {
                        alunoSelecionado
                          .indicadores
                          .quantidadeAvaliacoes
                      }
                    </div>
                  </div>

                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.pendingActivities"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {
                        alunoSelecionado
                          .indicadores
                          .atividadesVencidas
                      }
                    </div>
                  </div>

                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.recentEvolution"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {alunoSelecionado
                        .indicadores
                        .quedaDesempenhoPercentual ===
                        null
                        ? "—"
                        : `${Math.round(
                          alunoSelecionado
                            .indicadores
                            .quedaDesempenhoPercentual
                        )}%`}
                    </div>
                  </div>
                </div>
              </section>

              {/* SINAIS */}
              <section>
                <h3
                  className="
              phanyx-student-success-drawer-title
              text-sm
              font-bold
              uppercase
              tracking-wide
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "drawer.mainSignals"
                  )}
                </h3>

                <div
                  className="
              mt-3
              space-y-2
            "
                >
                  {alunoSelecionado
                    .analise
                    .fatoresPrincipais
                    .length > 0 ? (
                    alunoSelecionado
                      .analise
                      .fatoresPrincipais
                      .map(
                        (
                          fator
                        ) => (
                          <div
                            key={
                              fator.codigo
                            }
                            className="
                        phanyx-student-success-drawer-signal
                        flex
                        items-start
                        gap-3
                        rounded-xl
                        border
                        border-amber-200
                        bg-amber-50
                        p-3
                        text-amber-950
                        dark:border-amber-900/60
                        dark:bg-amber-950/30
                        dark:text-amber-100
                      "
                          >
                            <span
                              aria-hidden="true"
                            >
                              ⚠️
                            </span>

                            <div>
                              <div
                                className="
                            font-semibold
                          "
                              >
                                {t(
                                  `components.${fator.codigo}`
                                )}
                              </div>

                              {fator.codigo ===
                                "PENDENCIAS" ? (
                                <div
                                  className="
                              mt-1
                              text-sm
                            "
                                >
                                  {
                                    alunoSelecionado
                                      .indicadores
                                      .atividadesVencidas
                                  }{" "}
                                  {t(
                                    "drawer.pendingActivities"
                                  ).toLocaleLowerCase()}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )
                      )
                  ) : (
                    <div
                      className="
                  phanyx-student-success-drawer-empty
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-4
                  text-sm
                  text-slate-600
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:text-slate-300
                "
                    >
                      {t(
                        "drawer.noMainSignals"
                      )}
                    </div>
                  )}
                </div>

                {alunoSelecionado
                  .analise
                  .componentes
                  .some(
                    (
                      componente
                    ) =>
                      !componente.disponivel
                  ) ? (
                  <div
                    className="
                phanyx-student-success-drawer-empty
                mt-3
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-title
                  text-sm
                  font-bold
                  text-slate-900
                  dark:text-white
                "
                    >
                      {t(
                        "drawer.missingData"
                      )}
                    </div>

                    <div
                      className="
                  mt-2
                  flex
                  flex-wrap
                  gap-2
                "
                    >
                      {alunoSelecionado
                        .analise
                        .componentes
                        .filter(
                          (
                            componente
                          ) =>
                            !componente.disponivel
                        )
                        .map(
                          (
                            componente
                          ) => (
                            <span
                              key={
                                componente.codigo
                              }
                              className="
                          rounded-full
                          border
                          border-slate-300
                          bg-white
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-slate-700
                          dark:border-slate-700
                          dark:bg-slate-950
                          dark:text-slate-200
                        "
                            >
                              {t(
                                `components.${componente.codigo}`
                              )}
                            </span>
                          )
                        )}
                    </div>
                  </div>
                ) : null}
              </section>

              {/* CONTATO */}
              <section>
                <h3
                  className="
              phanyx-student-success-drawer-title
              text-sm
              font-bold
              uppercase
              tracking-wide
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "drawer.contact"
                  )}
                </h3>

                <div
                  className="
              phanyx-student-success-drawer-card
              mt-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              dark:border-slate-800
              dark:bg-slate-900
            "
                >
                  <h4
                    className="
                font-bold
                text-slate-950
                dark:text-white
              "
                  >
                    {t(
                      "drawer.studentContact"
                    )}
                  </h4>

                  <dl
                    className="
                mt-3
                space-y-3
                text-sm
              "
                  >
                    <div>
                      <dt
                        className="
                    phanyx-student-success-drawer-muted
                    text-xs
                    font-semibold
                    text-slate-500
                    dark:text-slate-400
                  "
                      >
                        {t(
                          "drawer.phone"
                        )}
                      </dt>

                      <dd
                        className="
                    mt-1
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                      >
                        {alunoSelecionado
                          .contato
                          .telefone ??
                          t(
                            "drawer.unavailable"
                          )}
                      </dd>
                    </div>

                    <div>
                      <dt
                        className="
                    phanyx-student-success-drawer-muted
                    text-xs
                    font-semibold
                    text-slate-500
                    dark:text-slate-400
                  "
                      >
                        {t(
                          "drawer.email"
                        )}
                      </dt>

                      <dd
                        className="
                    mt-1
                    break-all
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                      >
                        {emailPodeSerUsado(
                          alunoSelecionado
                            .contato
                            .email
                        )
                          ? alunoSelecionado
                            .contato
                            .email
                          : t(
                            "drawer.unavailable"
                          )}
                      </dd>
                    </div>
                  </dl>

                  {alunoSelecionado
                    .contato
                    .responsavel
                    .nome ||
                    alunoSelecionado
                      .contato
                      .responsavel
                      .telefone ||
                    alunoSelecionado
                      .contato
                      .responsavel
                      .email ? (
                    <div
                      className="
                  mt-5
                  border-t
                  border-slate-200
                  pt-4
                  dark:border-slate-700
                "
                    >
                      <h4
                        className="
                    font-bold
                    text-slate-950
                    dark:text-white
                  "
                      >
                        {t(
                          "drawer.responsibleContact"
                        )}
                      </h4>

                      <div
                        className="
                    mt-3
                    space-y-2
                    text-sm
                    text-slate-800
                    dark:text-slate-200
                  "
                      >
                        <p>
                          <strong>
                            {t(
                              "drawer.responsible"
                            )}:
                          </strong>{" "}
                          {alunoSelecionado
                            .contato
                            .responsavel
                            .nome ??
                            t(
                              "drawer.unavailable"
                            )}
                        </p>

                        <p>
                          <strong>
                            {t(
                              "drawer.relationship"
                            )}:
                          </strong>{" "}
                          {alunoSelecionado
                            .contato
                            .responsavel
                            .parentesco ??
                            t(
                              "drawer.unavailable"
                            )}
                        </p>

                        <p>
                          <strong>
                            {t(
                              "drawer.phone"
                            )}:
                          </strong>{" "}
                          {alunoSelecionado
                            .contato
                            .responsavel
                            .telefone ??
                            t(
                              "drawer.unavailable"
                            )}
                        </p>

                        <p>
                          <strong>
                            {t(
                              "drawer.email"
                            )}:
                          </strong>{" "}
                          {alunoSelecionado
                            .contato
                            .responsavel
                            .email ??
                            t(
                              "drawer.unavailable"
                            )}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* AÇÕES */}
              <section>
                <h3
                  className="
              phanyx-student-success-drawer-title
              text-sm
              font-bold
              uppercase
              tracking-wide
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "drawer.actions"
                  )}
                </h3>

                <div
                  className="
              mt-3
              grid
              gap-2
              sm:grid-cols-3
            "
                >
                  <button
                    type="button"
                    disabled
                    title={t(
                      "drawer.actionComingSoon"
                    )}
                    className="
                    phanyx-student-success-action
  phanyx-student-success-action-disabled
                rounded-xl
                border
                border-emerald-300
                bg-emerald-50
                px-3
                py-3
                text-sm
                font-bold
                text-emerald-800
                
                dark:border-emerald-900
                dark:bg-emerald-950/30
                dark:text-emerald-200
              "
                  >
                    💬{" "}
                    {t(
                      "drawer.whatsapp"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={
                      !telefoneParaLink(
                        alunoSelecionado
                          .contato
                          .telefone
                      )
                    }
                    onClick={() => {
                      const telefone =
                        telefoneParaLink(
                          alunoSelecionado
                            .contato
                            .telefone
                        );

                      if (!telefone) {
                        return;
                      }

                      window.location.href =
                        `tel:${telefone}`;
                    }}
                    className="
                    phanyx-student-success-action
  phanyx-student-success-action-call
                rounded-xl
                border
                border-blue-300
                bg-blue-50
                px-3
                py-3
                text-sm
                font-bold
                text-blue-800
                transition
                hover:bg-blue-100
                disabled:cursor-not-allowed
                disabled:opacity-40
                dark:border-blue-900
                dark:bg-blue-950/30
                dark:text-blue-200
              "
                  >
                    📞{" "}
                    {t(
                      "drawer.call"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={
                      !emailPodeSerUsado(
                        alunoSelecionado
                          .contato
                          .email
                      )
                    }
                    onClick={() => {
                      const email =
                        alunoSelecionado
                          .contato
                          .email;

                      if (
                        !emailPodeSerUsado(
                          email
                        ) ||
                        !email
                      ) {
                        return;
                      }

                      window.location.href =
                        `mailto:${email}`;
                    }}
                    className="
                    phanyx-student-success-action
  phanyx-student-success-action-email
                rounded-xl
                border
                border-violet-300
                bg-violet-50
                px-3
                py-3
                text-sm
                font-bold
                text-violet-800
                transition
                hover:bg-violet-100
                disabled:cursor-not-allowed
                disabled:opacity-40
                dark:border-violet-900
                dark:bg-violet-950/30
                dark:text-violet-200
              "
                  >
                    ✉️{" "}
                    {t(
                      "drawer.sendEmail"
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMensagemIntervencao(
                      null
                    );

                    setTipoIntervencao(
                      "CONTATO"
                    );

                    setCanalIntervencao(
                      alunoSelecionado
                        .contato
                        .telefone
                        ? "LIGACAO"
                        : "EMAIL"
                    );

                    setStatusIntervencao(
                      "REGISTRADA"
                    );

                    setObservacaoIntervencao(
                      ""
                    );

                    setRetornoIntervencao(
                      ""
                    );

                    setModalIntervencaoAberto(
                      true
                    );
                  }}
                  className="
    mt-3
    w-full
    rounded-xl
    bg-blue-700
    px-4
    py-3
    text-sm
    font-bold
    text-white
    transition
    hover:bg-blue-800
  "
                >
                  +{" "}
                  {t(
                    "drawer.registerIntervention"
                  )}
                </button>
              </section>
              {/* LINHA DO TEMPO DO ALUNO */}
              <section
                className="
    phanyx-student-success-timeline
    mt-6
  "
              >
                <div
                  className="
      mb-4
      flex
      flex-col
      gap-3
      sm:flex-row
      sm:items-start
      sm:justify-between
    "
                >
                  <div>
                    <h3
                      className="
          phanyx-student-success-timeline-title
          text-sm
          font-bold
          uppercase
          tracking-wide
        "
                    >
                      {t(
                        "intervention.timeline.title"
                      )}
                    </h3>

                    <p
                      className="
          phanyx-student-success-timeline-description
          mt-1
          text-xs
          leading-5
        "
                    >
                      {t(
                        "intervention.timeline.description"
                      )}
                    </p>
                  </div>

                  {!carregandoTimeline &&
                    resumoTimeline ? (
                    <span
                      className="
          phanyx-student-success-timeline-count
          inline-flex
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          px-2.5
          py-1
          text-xs
          font-bold
        "
                    >
                      {
                        resumoTimeline
                          .eventos
                      }
                    </span>
                  ) : null}
                </div>

                {/* RESUMO */}
                {!carregandoTimeline &&
                  resumoTimeline ? (
                  <div
                    className="
        mb-5
        grid
        grid-cols-2
        gap-2
        sm:grid-cols-4
      "
                  >
                    <div
                      className="
          phanyx-student-success-timeline-summary
          rounded-xl
          border
          p-3
        "
                    >
                      <div
                        className="
            text-lg
            font-bold
          "
                      >
                        {
                          resumoTimeline
                            .intervencoes
                        }
                      </div>

                      <div
                        className="
            mt-0.5
            text-[11px]
            font-semibold
          "
                      >
                        {t(
                          "intervention.timeline.summaryInterventions"
                        )}
                      </div>
                    </div>

                    <div
                      className="
          phanyx-student-success-timeline-summary
          rounded-xl
          border
          p-3
        "
                    >
                      <div
                        className="
            text-lg
            font-bold
          "
                      >
                        {
                          resumoTimeline
                            .eventos
                        }
                      </div>

                      <div
                        className="
            mt-0.5
            text-[11px]
            font-semibold
          "
                      >
                        {t(
                          "intervention.timeline.summaryEvents"
                        )}
                      </div>
                    </div>

                    <div
                      className="
          phanyx-student-success-timeline-summary
          rounded-xl
          border
          p-3
        "
                    >
                      <div
                        className="
            text-lg
            font-bold
          "
                      >
                        {
                          resumoTimeline
                            .abertas
                        }
                      </div>

                      <div
                        className="
            mt-0.5
            text-[11px]
            font-semibold
          "
                      >
                        {t(
                          "intervention.timeline.summaryOpen"
                        )}
                      </div>
                    </div>

                    <div
                      className="
          phanyx-student-success-timeline-summary
          rounded-xl
          border
          p-3
        "
                    >
                      <div
                        className="
            text-lg
            font-bold
          "
                      >
                        {
                          resumoTimeline
                            .encerradas
                        }
                      </div>

                      <div
                        className="
            mt-0.5
            text-[11px]
            font-semibold
          "
                      >
                        {t(
                          "intervention.timeline.summaryClosed"
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {carregandoTimeline ? (
                  <div
                    className="
        phanyx-student-success-timeline-state
        rounded-xl
        border
        p-4
        text-sm
        font-semibold
      "
                  >
                    {t(
                      "intervention.timeline.loading"
                    )}
                  </div>
                ) : erroTimeline ? (
                  <div
                    className="
        rounded-xl
        border
        border-red-300
        bg-red-50
        p-4
        text-sm
        font-semibold
        text-red-800
        dark:border-red-900
        dark:bg-red-950/30
        dark:text-red-200
      "
                  >
                    {t(
                      "intervention.timeline.error"
                    )}
                  </div>
                ) : timeline.length ===
                  0 ? (
                  <div
                    className="
        phanyx-student-success-timeline-state
        rounded-xl
        border
        p-4
        text-sm
      "
                  >
                    {t(
                      "intervention.timeline.empty"
                    )}
                  </div>
                ) : (
                  <div
                    className="
        relative
        space-y-0
      "
                  >
                    {timeline.map(
                      (
                        evento,
                        indice
                      ) => {
                        const intervencao =
                          intervencoes.find(
                            (
                              item
                            ) =>
                              item.id ===
                              evento.intervencaoId
                          );

                        const encerrada =
                          evento.tipo ===
                          "INTERVENCAO_ENCERRADA";

                        const retorno =
                          evento.tipo ===
                          "RETORNO_AGENDADO";

                        const registrada =
                          evento.tipo ===
                          "INTERVENCAO_REGISTRADA";

                        const tituloEvento =
                          registrada
                            ? t(
                              "intervention.timeline.registered"
                            )
                            : retorno
                              ? t(
                                "intervention.timeline.returnScheduled"
                              )
                              : t(
                                "intervention.timeline.closed"
                              );

                        const classificacao =
                          evento.evolucao
                            ?.classificacao ??
                          null;

                        const podeAtualizar =
                          registrada &&
                          intervencao &&
                          intervencao.status !==
                          "RESOLVIDA" &&
                          intervencao.status !==
                          "CANCELADA";

                        return (
                          <div
                            key={
                              evento.id
                            }
                            className="
                phanyx-student-success-timeline-row
                relative
                flex
                gap-3
                pb-5
              "
                          >
                            {/* LINHA VERTICAL */}
                            {indice <
                              timeline.length -
                              1 ? (
                              <div
                                className="
                    phanyx-student-success-timeline-line
                    absolute
                    bottom-0
                    left-[15px]
                    top-8
                    w-px
                  "
                                aria-hidden="true"
                              />
                            ) : null}

                            {/* MARCADOR */}
                            <div
                              className={[
                                "phanyx-student-success-timeline-dot relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",

                                registrada
                                  ? "phanyx-student-success-timeline-dot-registered"
                                  : retorno
                                    ? "phanyx-student-success-timeline-dot-return"
                                    : "phanyx-student-success-timeline-dot-closed",
                              ].join(
                                " "
                              )}
                              aria-hidden="true"
                            >
                              {registrada
                                ? "+"
                                : retorno
                                  ? "↗"
                                  : "✓"}
                            </div>

                            {/* EVENTO */}
                            <article
                              className="
                  phanyx-student-success-timeline-card
                  min-w-0
                  flex-1
                  rounded-xl
                  border
                  p-4
                "
                            >
                              <div
                                className="
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                  "
                              >
                                <div
                                  className="
                      min-w-0
                    "
                                >
                                  <div
                                    className="
                        phanyx-student-success-timeline-event-title
                        font-bold
                      "
                                  >
                                    {
                                      tituloEvento
                                    }
                                  </div>

                                  <div
                                    className="
                        phanyx-student-success-timeline-muted
                        mt-1
                        text-xs
                        font-semibold
                      "
                                  >
                                    {t(
                                      `intervention.types.${evento.tipoIntervencao}`
                                    )}

                                    {" · "}

                                    {t(
                                      `intervention.channels.${evento.canal}`
                                    )}
                                  </div>
                                </div>

                                <time
                                  dateTime={
                                    evento.data
                                  }
                                  className="
                      phanyx-student-success-timeline-date
                      shrink-0
                      text-xs
                      font-semibold
                    "
                                >
                                  {new Intl.DateTimeFormat(
                                    undefined,
                                    {
                                      dateStyle:
                                        "medium",

                                      timeStyle:
                                        "short",
                                    }
                                  ).format(
                                    new Date(
                                      evento.data
                                    )
                                  )}
                                </time>
                              </div>

                              {/* STATUS SOMENTE QUANDO HISTORICAMENTE CONHECIDO */}
                              {evento.status ? (
                                <div
                                  className="
                      mt-3
                    "
                                >
                                  <span
                                    className="
                        phanyx-student-success-timeline-status
                        inline-flex
                        rounded-full
                        border
                        px-2.5
                        py-1
                        text-xs
                        font-bold
                      "
                                  >
                                    {t(
                                      `intervention.statuses.${evento.status}`
                                    )}
                                  </span>
                                </div>
                              ) : null}

                              {/* RETORNO PROGRAMADO */}
                              {retorno ? (
                                <div
                                  className="
                      phanyx-student-success-timeline-scheduled
                      mt-3
                      rounded-lg
                      border
                      px-3
                      py-2
                      text-xs
                      font-semibold
                    "
                                >
                                  {t(
                                    "intervention.timeline.scheduledFor"
                                  )}
                                  :{" "}

                                  {new Intl.DateTimeFormat(
                                    undefined,
                                    {
                                      dateStyle:
                                        "long",
                                    }
                                  ).format(
                                    new Date(
                                      evento.data
                                    )
                                  )}
                                </div>
                              ) : null}

                              {/* OBSERVAÇÃO */}
                              {evento.observacao &&
                                !retorno ? (
                                <div
                                  className="
                      mt-3
                    "
                                >
                                  <div
                                    className="
                        phanyx-student-success-timeline-label
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wide
                      "
                                  >
                                    {t(
                                      "intervention.timeline.observation"
                                    )}
                                  </div>

                                  <p
                                    className="
                        phanyx-student-success-timeline-text
                        mt-1
                        whitespace-pre-wrap
                        text-sm
                        leading-5
                      "
                                  >
                                    {
                                      evento.observacao
                                    }
                                  </p>
                                </div>
                              ) : null}

                              {/* FOTOGRAFIA ACADÊMICA */}
                              {evento.risco ? (
                                <div
                                  className="
                      phanyx-student-success-timeline-snapshot
                      mt-4
                      rounded-xl
                      border
                      p-3
                    "
                                >
                                  <div
                                    className="
                        phanyx-student-success-timeline-label
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wide
                      "
                                  >
                                    {t(
                                      "intervention.timeline.academicSnapshot"
                                    )}
                                  </div>

                                  <div
                                    className="
                        mt-3
                        grid
                        grid-cols-2
                        gap-3
                      "
                                  >
                                    <div>
                                      <div
                                        className="
                            phanyx-student-success-timeline-muted
                            text-[11px]
                            font-semibold
                          "
                                      >
                                        {t(
                                          "intervention.timeline.risk"
                                        )}
                                      </div>

                                      <div
                                        className="
                            mt-0.5
                            text-xs
                            font-bold
                          "
                                      >
                                        {evento
                                          .risco
                                          .nivel
                                          ? t(
                                            `levels.${evento.risco.nivel as NivelRisco}`
                                          )
                                          : "—"}
                                      </div>
                                    </div>

                                    <div>
                                      <div
                                        className="
                            phanyx-student-success-timeline-muted
                            text-[11px]
                            font-semibold
                          "
                                      >
                                        {t(
                                          "intervention.timeline.score"
                                        )}
                                      </div>

                                      <div
                                        className="
                            mt-0.5
                            text-xs
                            font-bold
                          "
                                      >
                                        {evento
                                          .risco
                                          .pontuacao ??
                                          "—"}
                                      </div>
                                    </div>

                                    <div>
                                      <div
                                        className="
                            phanyx-student-success-timeline-muted
                            text-[11px]
                            font-semibold
                          "
                                      >
                                        {t(
                                          "intervention.timeline.coverage"
                                        )}
                                      </div>

                                      <div
                                        className="
                            mt-0.5
                            text-xs
                            font-bold
                          "
                                      >
                                        {evento
                                          .risco
                                          .cobertura !==
                                          null
                                          ? `${evento.risco.cobertura}%`
                                          : "—"}
                                      </div>
                                    </div>

                                    <div>
                                      <div
                                        className="
                            phanyx-student-success-timeline-muted
                            text-[11px]
                            font-semibold
                          "
                                      >
                                        {t(
                                          "intervention.timeline.reliability"
                                        )}
                                      </div>

                                      <div
                                        className="
                            mt-0.5
                            text-xs
                            font-bold
                          "
                                      >
                                        {evento
                                          .risco
                                          .confiabilidade
                                          ? t(
                                            `reliability.${evento.risco.confiabilidade as Confiabilidade}`
                                          )
                                          : "—"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {/* RESULTADO */}
                              {evento.resultado ? (
                                <div
                                  className="
                      phanyx-student-success-timeline-result
                      mt-4
                      rounded-xl
                      border
                      p-3
                    "
                                >
                                  <div
                                    className="
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wide
                      "
                                  >
                                    {t(
                                      "intervention.timeline.result"
                                    )}
                                  </div>

                                  <p
                                    className="
                        mt-1
                        whitespace-pre-wrap
                        text-sm
                        leading-5
                      "
                                  >
                                    {
                                      evento.resultado
                                    }
                                  </p>
                                </div>
                              ) : null}

                              {/* EVOLUÇÃO */}
                              {encerrada &&
                                classificacao ? (
                                <div
                                  className={[
                                    "phanyx-student-success-timeline-evolution mt-4 rounded-xl border px-3 py-2 text-xs font-bold",

                                    classificacao ===
                                      "POSITIVA"
                                      ? "phanyx-student-success-timeline-evolution-positive"
                                      : classificacao ===
                                        "NEGATIVA"
                                        ? "phanyx-student-success-timeline-evolution-negative"
                                        : classificacao ===
                                          "NEUTRA"
                                          ? "phanyx-student-success-timeline-evolution-neutral"
                                          : "phanyx-student-success-timeline-evolution-unavailable",
                                  ].join(
                                    " "
                                  )}
                                >
                                  <span
                                    aria-hidden="true"
                                  >
                                    {classificacao ===
                                      "POSITIVA"
                                      ? "✓ "
                                      : classificacao ===
                                        "NEGATIVA"
                                        ? "⚠ "
                                        : "• "}
                                  </span>

                                  {t(
                                    "intervention.timeline.evolution"
                                  )}
                                  :{" "}

                                  {classificacao ===
                                    "POSITIVA"
                                    ? t(
                                      "intervention.timeline.positive"
                                    )
                                    : classificacao ===
                                      "NEGATIVA"
                                      ? t(
                                        "intervention.timeline.negative"
                                      )
                                      : classificacao ===
                                        "NEUTRA"
                                        ? t(
                                          "intervention.timeline.neutral"
                                        )
                                        : t(
                                          "intervention.timeline.notMeasurable"
                                        )}
                                </div>
                              ) : null}

                              {/* COMPARAÇÃO COMPLETA JÁ EXISTENTE */}
                              {encerrada &&
                                intervencao ? (
                                renderComparacaoAcademica(
                                  intervencao
                                )
                              ) : null}

                              {/* ATUALIZAÇÃO SOMENTE PARA INTERVENÇÃO ABERTA */}
                              {podeAtualizar &&
                                intervencao ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirAtualizacaoIntervencao(
                                      intervencao
                                    )
                                  }
                                  className="
                      phanyx-student-success-timeline-update
                      mt-4
                      w-full
                      rounded-xl
                      border
                      px-3
                      py-2
                      text-sm
                      font-bold
                      transition
                    "
                                >
                                  {t(
                                    "intervention.history.update"
                                  )}
                                </button>
                              ) : null}
                            </article>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      ) : null}

      {modalIntervencaoAberto &&
        alunoSelecionado ? (
        <div
          className="
      fixed
      inset-0
      z-[150]
      flex
      items-center
      justify-center
      bg-black/55
      p-4
    "
        >
          <div
            role="dialog"
            aria-modal="true"
            className="
    phanyx-student-success-intervention-modal
    w-full
    max-w-2xl
    rounded-2xl
    border
    border-slate-200
    bg-white
    shadow-2xl
    dark:border-slate-700
    dark:bg-slate-950
  "
          >
            <div
              className="
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-slate-200
          p-5
          dark:border-slate-800
        "
            >
              <div>
                <h2
                  className="
              text-lg
              font-bold
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "intervention.title"
                  )}
                </h2>

                <p
                  className="
              mt-1
              text-sm
              text-slate-600
              dark:text-slate-300
            "
                >
                  {alunoSelecionado.nome}
                </p>

                <p
                  className="
              mt-1
              text-xs
              text-slate-500
              dark:text-slate-400
            "
                >
                  {t(
                    "intervention.description"
                  )}
                </p>
              </div>

              <button
                type="button"
                aria-label={t("drawer.close")}
                disabled={
                  salvandoIntervencao
                }
                onClick={() =>
                  setModalIntervencaoAberto(
                    false
                  )
                }
                className="
    flex
    h-9
    w-9
    items-center
    justify-center
    rounded-xl
    border
    border-slate-300
    bg-white
    text-lg
    font-bold
    text-slate-700
    dark:border-slate-700
    dark:bg-slate-900
    dark:text-white
  "
              >
                ×
              </button>
            </div>

            <div
              className="
          space-y-4
          p-5
        "
            >
              <div
                className="
            grid
            gap-4
            sm:grid-cols-2
          "
              >
                <label
                  className="
              block
            "
                >
                  <span
                    className="
                mb-1
                block
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
                  >
                    {t(
                      "intervention.type"
                    )}
                  </span>

                  <select
                    value={
                      tipoIntervencao
                    }
                    onChange={
                      (event) =>
                        setTipoIntervencao(
                          event.target
                            .value as TipoIntervencao
                        )
                    }
                    className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-slate-900
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-white
              "
                  >
                    {[
                      "CONTATO",
                      "ORIENTACAO",
                      "REUNIAO",
                      "ENCAMINHAMENTO",
                      "ACOMPANHAMENTO",
                      "OUTRO",
                    ].map(
                      (tipo) => (
                        <option
                          key={
                            tipo
                          }
                          value={
                            tipo
                          }
                        >
                          {t(
                            `intervention.types.${tipo}`
                          )}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label
                  className="
              block
            "
                >
                  <span
                    className="
                mb-1
                block
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
                  >
                    {t(
                      "intervention.channel"
                    )}
                  </span>

                  <select
                    value={
                      canalIntervencao
                    }
                    onChange={
                      (event) =>
                        setCanalIntervencao(
                          event.target
                            .value as CanalIntervencao
                        )
                    }
                    className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-slate-900
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-white
              "
                  >
                    {[
                      "WHATSAPP",
                      "LIGACAO",
                      "EMAIL",
                      "PRESENCIAL",
                      "VIDEOCHAMADA",
                      "SISTEMA",
                      "OUTRO",
                    ].map(
                      (canal) => (
                        <option
                          key={
                            canal
                          }
                          value={
                            canal
                          }
                        >
                          {t(
                            `intervention.channels.${canal}`
                          )}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label
                  className="
              block
            "
                >
                  <span
                    className="
                mb-1
                block
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
                  >
                    {t(
                      "intervention.status"
                    )}
                  </span>

                  <select
                    value={
                      statusIntervencao
                    }
                    onChange={
                      (event) =>
                        setStatusIntervencao(
                          event.target
                            .value as StatusIntervencao
                        )
                    }
                    className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-slate-900
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-white
              "
                  >
                    {[
                      "REGISTRADA",
                      "AGUARDANDO_RETORNO",
                      "EM_ACOMPANHAMENTO",
                      "RESOLVIDA",
                      "CANCELADA",
                    ].map(
                      (status) => (
                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {t(
                            `intervention.statuses.${status}`
                          )}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label
                  className="
              block
            "
                >
                  <span
                    className="
                mb-1
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
                  >
                    {t(
                      "intervention.returnDate"
                    )}

                    <span
                      className="
                  text-xs
                  font-normal
                  text-slate-500
                "
                    >
                      {t(
                        "intervention.returnDateOptional"
                      )}
                    </span>
                  </span>

                  <input
                    type="date"
                    value={
                      retornoIntervencao
                    }
                    onChange={
                      (event) =>
                        setRetornoIntervencao(
                          event.target
                            .value
                        )
                    }
                    className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-3
                py-2.5
                text-sm
                text-slate-900
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-white
              "
                  />
                </label>
              </div>

              <label
                className="
            block
          "
              >
                <span
                  className="
              mb-1
              block
              text-sm
              font-semibold
              text-slate-700
              dark:text-slate-200
            "
                >
                  {t(
                    "intervention.observation"
                  )}
                </span>

                <textarea
                  value={
                    observacaoIntervencao
                  }
                  onChange={
                    (event) =>
                      setObservacaoIntervencao(
                        event.target
                          .value
                      )
                  }
                  rows={5}
                  maxLength={5000}
                  placeholder={t(
                    "intervention.observationPlaceholder"
                  )}
                  className="
              w-full
              resize-y
              rounded-xl
              border
              border-slate-300
              bg-white
              px-3
              py-3
              text-sm
              text-slate-900
              placeholder:text-slate-400
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-white
            "
                />
              </label>

              {mensagemIntervencao ? (
                <div
                  className={[
                    "rounded-xl border px-4 py-3 text-sm font-semibold",

                    mensagemIntervencao
                      .tipo ===
                      "sucesso"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200",
                  ].join(
                    " "
                  )}
                >
                  {
                    mensagemIntervencao
                      .texto
                  }
                </div>
              ) : null}
            </div>

            <div
              className="
          flex
          justify-end
          gap-3
          border-t
          border-slate-200
          p-5
          dark:border-slate-800
        "
            >
              <button
                type="button"
                disabled={
                  salvandoIntervencao
                }
                onClick={() =>
                  setModalIntervencaoAberto(
                    false
                  )
                }
                className="
    phanyx-student-success-intervention-cancel
    rounded-xl
    border
    border-slate-300
    bg-white
    px-4
    py-2.5
    text-sm
    font-semibold
    text-slate-700
    dark:border-slate-700
    dark:bg-slate-900
    dark:text-slate-200
  "
              >
                {t(
                  "intervention.cancel"
                )}
              </button>

              <button
                type="button"
                disabled={
                  salvandoIntervencao ||
                  observacaoIntervencao
                    .trim()
                    .length < 3
                }
                onClick={() =>
                  void registrarIntervencao()
                }
                className="
    phanyx-student-success-intervention-save
    rounded-xl
    bg-blue-700
    px-4
    py-2.5
    text-sm
    font-bold
    text-white
    transition
    hover:bg-blue-800
    disabled:cursor-not-allowed
    disabled:opacity-50
  "
              >
                {salvandoIntervencao
                  ? t(
                    "intervention.saving"
                  )
                  : t(
                    "intervention.save"
                  )}
              </button>

            </div>
          </div>
        </div>
      ) : null}
      {intervencaoEmEdicao ? (
        <div
          className="
      fixed
      inset-0
      z-[160]
      flex
      items-center
      justify-center
      bg-black/55
      p-4
    "
        >
          <div
            role="dialog"
            aria-modal="true"
            className="
        phanyx-student-success-intervention-modal
        w-full
        max-w-xl
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-2xl
        dark:border-slate-700
        dark:bg-slate-950
      "
          >
            <div
              className="
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-slate-200
          p-5
          dark:border-slate-800
        "
            >
              <div>
                <h2
                  className="
              text-lg
              font-bold
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "intervention.update.edit"
                  )}
                </h2>

                <p
                  className="
              mt-1
              text-sm
              text-slate-600
              dark:text-slate-300
            "
                >
                  {t(
                    `intervention.types.${intervencaoEmEdicao.tipo}`
                  )}
                  {" · "}
                  {t(
                    `intervention.channels.${intervencaoEmEdicao.canal}`
                  )}
                </p>
              </div>

              <button
                type="button"
                aria-label={t(
                  "drawer.close"
                )}
                disabled={
                  salvandoAtualizacaoIntervencao
                }
                onClick={() => {
                  setIntervencaoEmEdicao(
                    null
                  );

                  setAlunoAtualizacaoIntervencao(
                    null
                  );
                }}
                className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              border
              border-slate-300
              bg-white
              text-lg
              font-bold
              text-slate-700
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-white
              "
              >
                ×
              </button>
            </div>

            <div
              className="
          space-y-4
          p-5
        "
            >
              <label
                className="
            block
          "
              >
                <span
                  className="
              mb-1
              block
              text-sm
              font-semibold
            "
                >
                  {t(
                    "intervention.status"
                  )}
                </span>

                <select
                  value={
                    statusAtualizacaoIntervencao
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setStatusAtualizacaoIntervencao(
                        event.target
                          .value as StatusIntervencao
                      )
                  }
                  className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-900
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-white
            "
                >
                  {[
                    "REGISTRADA",
                    "AGUARDANDO_RETORNO",
                    "EM_ACOMPANHAMENTO",
                    "RESOLVIDA",
                    "CANCELADA",
                  ].map(
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
                        {t(
                          `intervention.statuses.${status}`
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label
                className="
            block
          "
              >
                <span
                  className="
              mb-1
              block
              text-sm
              font-semibold
            "
                >
                  {t(
                    "intervention.returnDate"
                  )}
                </span>

                <input
                  type="date"
                  value={
                    retornoAtualizacaoIntervencao
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setRetornoAtualizacaoIntervencao(
                        event.target
                          .value
                      )
                  }
                  className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-900
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-white
            "
                />
              </label>

              <label
                className="
            block
          "
              >
                <span
                  className="
              mb-1
              block
              text-sm
              font-semibold
            "
                >
                  {t(
                    "intervention.update.result"
                  )}
                </span>

                <textarea
                  value={
                    resultadoAtualizacaoIntervencao
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setResultadoAtualizacaoIntervencao(
                        event.target
                          .value
                      )
                  }
                  rows={5}
                  maxLength={5000}
                  placeholder={t(
                    "intervention.update.resultPlaceholder"
                  )}
                  className="
              w-full
              resize-y
              rounded-xl
              border
              border-slate-300
              bg-white
              px-3
              py-3
              text-sm
              text-slate-900
              placeholder:text-slate-400
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-white
            "
                />
              </label>

              {statusAtualizacaoIntervencao ===
                "RESOLVIDA" &&
                resultadoAtualizacaoIntervencao
                  .trim()
                  .length < 3 ? (
                <p
                  className="
              text-sm
              font-semibold
              text-amber-700
              dark:text-amber-300
            "
                >
                  {t(
                    "intervention.update.resultRequiredResolved"
                  )}
                </p>
              ) : null}

              {statusAtualizacaoIntervencao ===
                "CANCELADA" &&
                resultadoAtualizacaoIntervencao
                  .trim()
                  .length < 3 ? (
                <p
                  className="
              text-sm
              font-semibold
              text-amber-700
              dark:text-amber-300
            "
                >
                  {t(
                    "intervention.update.resultRequiredCancelled"
                  )}
                </p>
              ) : null}

              {mensagemAtualizacaoIntervencao ? (
                <div
                  className={[
                    "rounded-xl border px-4 py-3 text-sm font-semibold",

                    mensagemAtualizacaoIntervencao
                      .tipo ===
                      "sucesso"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200",
                  ].join(
                    " "
                  )}
                >
                  {
                    mensagemAtualizacaoIntervencao
                      .texto
                  }
                </div>
              ) : null}
            </div>

            <div
              className="
          flex
          justify-end
          gap-3
          border-t
          border-slate-200
          p-5
          dark:border-slate-800
        "
            >
              <button
                type="button"
                disabled={
                  salvandoAtualizacaoIntervencao
                }
                onClick={() => {
                  setIntervencaoEmEdicao(
                    null
                  );

                  setAlunoAtualizacaoIntervencao(
                    null
                  );
                }}
                className="
            phanyx-student-success-intervention-cancel
            rounded-xl
            border
            px-4
            py-2.5
            text-sm
            font-semibold
            "
              >
                {t(
                  "intervention.cancel"
                )}
              </button>

              <button
                type="button"
                disabled={
                  salvandoAtualizacaoIntervencao ||
                  (
                    (
                      statusAtualizacaoIntervencao ===
                      "RESOLVIDA" ||
                      statusAtualizacaoIntervencao ===
                      "CANCELADA"
                    ) &&
                    resultadoAtualizacaoIntervencao
                      .trim()
                      .length < 3
                  )
                }
                onClick={() =>
                  void salvarAtualizacaoIntervencao()
                }
                className="
            phanyx-student-success-intervention-save
            rounded-xl
            px-4
            py-2.5
            text-sm
            font-bold
            transition
            disabled:cursor-not-allowed
          "
              >
                {salvandoAtualizacaoIntervencao
                  ? t(
                    "intervention.update.saving"
                  )
                  : t(
                    "intervention.update.save"
                  )}
              </button>
            </div>
          </div>
        </div >
      ) : null
      }
    </main >
  );
}