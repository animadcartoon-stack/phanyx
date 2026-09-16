"use client";


import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { planoTemRecurso } from "@/lib/plano-acesso";

import {
  Area,
  AreaChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ReputacaoPage() {
  const t = useTranslations(
    "AdminIntegracoesReputacao"
  );

  function traduzirFiltro(
    filtro: string
  ) {
    switch (filtro) {
      case "Todos":
        return t("evaluationCenter.filters.all");

      case "Pendentes":
        return t("evaluationCenter.filters.pending");

      case "Respondidas":
        return t("evaluationCenter.filters.answered");

      case "Críticas":
        return t("evaluationCenter.filters.critical");

      case "Positivas":
        return t("evaluationCenter.filters.positive");

      case "Neutras":
        return t("evaluationCenter.filters.neutral");

      default:
        return filtro;
    }
  }

  function traduzirSentimento(
    sentimento: string
  ) {
    switch (sentimento) {
      case "Crítico":
        return t("sentiment.critical");

      case "Positivo":
        return t("sentiment.positive");

      case "Neutro":
        return t("sentiment.neutral");

      default:
        return sentimento;
    }
  }

  function traduzirStatusAvaliacao(
    status: string
  ) {
    switch (status) {
      case "Respondida":
        return t("reviewStatus.answered");

      case "Pendente":
        return t("reviewStatus.pending");

      default:
        return status;
    }
  }

  function traduzirTipoManifestacao(
  tipo: unknown
) {
  switch (String(tipo ?? "")) {
    case "Reclama\u00e7\u00e3o":
      return t(
        "manifestationTypes.complaint"
      );

    case "Sugest\u00e3o":
      return t(
        "manifestationTypes.suggestion"
      );

    case "Elogio":
      return t(
        "manifestationTypes.praise"
      );

    default:
      return t(
        "manifestationTypes.record"
      );
  }
}

function traduzirOrigem(
  origem: unknown
) {
  switch (String(origem ?? "")) {
    case "ALUNO":
      return t("origins.student");

    case "PROFESSOR":
      return t("origins.teacher");

    default:
      return t("origins.ombudsman");
  }
}

function traduzirIniciaisOrigem(
  origem: unknown
) {
  switch (String(origem ?? "")) {
    case "ALUNO":
      return t(
        "origins.studentInitial"
      );

    case "PROFESSOR":
      return t(
        "origins.teacherInitial"
      );

    default:
      return t(
        "origins.ombudsmanInitial"
      );
  }
}

const [scoreAnimado, setScoreAnimado] = useState(0);

  const [planoInstituicao, setPlanoInstituicao] = useState("ESSENCIAL");
const [statusAssinatura, setStatusAssinatura] = useState("ATIVA");

const [porcentagemAnimada, setPorcentagemAnimada] = useState(0);
const [scoreAtual, setScoreAtual] = useState(0);
useEffect(() => {
  const intervalo = setInterval(() => {
    setScoreAnimado((valorAtual) => {
      if (valorAtual >= scoreAtual) return scoreAtual;
      return valorAtual + 1;
    });

    setPorcentagemAnimada((valorAtual) => {
      if (valorAtual >= scoreAtual) return scoreAtual;
      return valorAtual + 1;
    });
  }, 25);

  return () => clearInterval(intervalo);
}, [scoreAtual]);



const [resumoReputacao, setResumoReputacao] = useState<any>(null);
const [avaliacoes, setAvaliacoes] = useState(0);
const [pendencias, setPendencias] = useState(0);
const [modalRespostaAberto, setModalRespostaAberto] = useState(false);
const [toastMensagem, setToastMensagem] = useState("");

const [filtroAvaliacoes, setFiltroAvaliacoes] = useState("Todos");

const [avaliacaoSelecionada, setAvaliacaoSelecionada] =
  useState<any | null>(null);

const [modalAberto, setModalAberto] = useState(false);

const [modalEngajamentoAberto, setModalEngajamentoAberto] =
  useState(false);

const [modalPositivoAberto, setModalPositivoAberto] =
  useState(false);

const [modalDetalhesAberto, setModalDetalhesAberto] =
  useState(false);

const [notificacaoAtual, setNotificacaoAtual] = useState(0);
const [mostrarNotificacaoIA, setMostrarNotificacaoIA] =
  useState(false);

  const [notificacaoFechada, setNotificacaoFechada] =
  useState(false);

useEffect(() => {
  async function carregarPlano() {
    try {
      const res = await fetch("/api/admin/plano", {
        cache: "no-store",
      });

      const data = await res.json();

      setPlanoInstituicao(data?.plano || "ESSENCIAL");
      setStatusAssinatura(data?.statusAssinatura || "ATIVA");
    } catch {
      setPlanoInstituicao("ESSENCIAL");
      setStatusAssinatura("ATIVA");
    }
  }

  carregarPlano();
}, []);

const podeUsarReputacao =
  planoTemRecurso(planoInstituicao, "REPUTACAO") &&
  statusAssinatura !== "SUSPENSA" &&
  statusAssinatura !== "CANCELADA";

  useEffect(() => {
  carregarResumoReputacao();
}, []);

async function carregarResumoReputacao() {
  try {
    const res = await fetch("/api/ouvidoria/resumo-reputacao", {
      cache: "no-store",
    });

    const data = await res.json();

    console.log("RESUMO REPUTAÇÃO:", data);

    setResumoReputacao(data);
    setScoreAtual(data.score || 0);
    setAvaliacoes(data.total || 0);
    setPendencias(data.reclamacoesAbertas || 0);
  } catch (error) {
    console.error(error);
  }
}

useEffect(() => {
  if (notificacaoFechada) return;

  const intervalo = setInterval(() => {
    setMostrarNotificacaoIA(true);

    setTimeout(() => {
      setMostrarNotificacaoIA(false);

      setTimeout(() => {
        setNotificacaoAtual((valor) =>
          valor >= 1 ? 0 : valor + 1
        );
      }, 400);
    }, 4200);
  }, 7000);

  return () => clearInterval(intervalo);
}, [notificacaoFechada]);

  
function traduzirDiaCurto(
  valor: unknown
) {
  const chave =
    String(valor ?? "")
      .trim()
      .toLowerCase()
      .replace(/\.$/, "");

  switch (chave) {
    case "seg":
    case "segunda":
    case "segunda-feira":
      return t("weekdays.mon");

    case "ter":
    case "ter\u00e7a":
    case "ter\u00e7a-feira":
      return t("weekdays.tue");

    case "qua":
    case "quarta":
    case "quarta-feira":
      return t("weekdays.wed");

    case "qui":
    case "quinta":
    case "quinta-feira":
      return t("weekdays.thu");

    case "sex":
    case "sexta":
    case "sexta-feira":
      return t("weekdays.fri");

    case "s\u00e1b":
    case "sab":
    case "s\u00e1bado":
      return t("weekdays.sat");

    case "dom":
    case "domingo":
      return t("weekdays.sun");

    case "hoje":
      return t("weekdays.today");

    default:
      return String(valor ?? "");
  }
}

const graficoDinamico = useMemo(
  () => [
    {
      nome: t("weekdays.mon"),
      score: scoreAtual - 10,
    },
    {
      nome: t("weekdays.tue"),
      score: scoreAtual - 7,
    },
    {
      nome: t("weekdays.wed"),
      score: scoreAtual - 8,
    },
    {
      nome: t("weekdays.thu"),
      score: scoreAtual - 4,
    },
    {
      nome: t("weekdays.fri"),
      score: scoreAtual - 2,
    },
    {
      nome: t("weekdays.sat"),
      score: scoreAtual - 1,
    },
    {
      nome: t("weekdays.today"),
      score: scoreAtual,
    },
  ],
  [scoreAtual, t]
);

const gerarRespostaIA = (
  avaliacao: any
) => {
  if (!avaliacao) return "";

  if (
    avaliacao.sentimento ===
    "Crítico"
  ) {
    return t(
      "replyAi.responses.critical",
      {
        name: avaliacao.nome,
      }
    );
  }

  if (
    avaliacao.sentimento ===
    "Neutro"
  ) {
    return t(
      "replyAi.responses.neutral",
      {
        name: avaliacao.nome,
      }
    );
  }

  return t(
    "replyAi.responses.positive",
    {
      name: avaliacao.nome,
    }
  );
};

const copiarRespostaIA = async () => {
  const texto = gerarRespostaIA(avaliacaoSelecionada);

  await navigator.clipboard.writeText(texto);

  setToastMensagem(t("toasts.copied"));

setTimeout(() => {
  setToastMensagem("");
}, 3000);
};

const timeline = (
  resumoReputacao?.ultimos || []
).map((item: any) => ({
  titulo:
    item.tipo === "Reclamação"
      ? t("timeline.items.newComplaint")
      : item.tipo === "Sugestão"
      ? t("timeline.items.newSuggestion")
      : item.tipo === "Elogio"
      ? t("timeline.items.newPraise")
      : t("timeline.items.newRecord"),

  descricao: item.mensagem,

  tempo: t("timeline.now"),

  cor:
    item.sentimento === "CRITICO"
      ? "bg-red-500"
      : item.sentimento === "POSITIVO"
      ? "bg-emerald-500"
      : "bg-blue-500",
}));

const avaliacoesSimuladas = (resumoReputacao?.ultimos || []).map((item: any) => ({
  id: item.id,
  origem: item.origem,
  tipo: item.tipo,
  nome: `${traduzirTipoManifestacao(
    item.tipo
  )} \u2022 ${traduzirOrigem(
    item.origem
  )}`,
  iniciais:
    traduzirIniciaisOrigem(
      item.origem
    ),
  nota: item.sentimento === "CRITICO" ? 2 : item.sentimento === "POSITIVO" ? 5 : 4,
  sentimento:
    item.sentimento === "CRITICO"
      ? "Crítico"
      : item.sentimento === "POSITIVO"
      ? "Positivo"
      : "Neutro",
  texto: item.mensagem,
  status: item.status === "RESOLVIDO" ? "Respondida" : "Pendente",
}));

const avaliacoesFiltradas = avaliacoesSimuladas.filter((avaliacao) => {
  if (filtroAvaliacoes === "Todos") return true;
  if (filtroAvaliacoes === "Pendentes") return avaliacao.status === "Pendente";
  if (filtroAvaliacoes === "Respondidas") return avaliacao.status === "Respondida";
  if (filtroAvaliacoes === "Críticas") return avaliacao.sentimento === "Crítico";
  if (filtroAvaliacoes === "Positivas") return avaliacao.sentimento === "Positivo";
  if (filtroAvaliacoes === "Neutras") return avaliacao.sentimento === "Neutro";

  return true;
});

const totalAvaliacoes = avaliacoesSimuladas.length;

const totalPendentes = avaliacoesSimuladas.filter(
  (item) => item.status === "Pendente"
).length;

const totalRespondidas = avaliacoesSimuladas.filter(
  (item) => item.status === "Respondida"
).length;

const totalCriticas = avaliacoesSimuladas.filter(
  (item) => item.sentimento === "Crítico"
).length;

const percentualRespondidas =
  totalAvaliacoes > 0
    ? Math.round((totalRespondidas / totalAvaliacoes) * 100)
    : 0;

const marcarComoRespondida = async () => {
  if (!avaliacaoSelecionada?.id) return;

  try {
    const res = await fetch(`/api/ouvidoria/${avaliacaoSelecionada.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "RESOLVIDO",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || t("toasts.markError"));
    }

    setAvaliacaoSelecionada({
      ...avaliacaoSelecionada,
      status: "Respondida",
    });

    setToastMensagem(t("toasts.markedAnswered"));

    await carregarResumoReputacao();

    setTimeout(() => {
      setToastMensagem("");
    }, 3000);
  } catch (error) {
    console.error(error);
    setToastMensagem(t("toasts.markError"));
  }
};

const obterPrioridadeIA = (
  avaliacao: any
) => {
  if (
    avaliacao?.sentimento ===
    "Crítico"
  ) {
    return t("details.priority.high");
  }

  if (
    avaliacao?.sentimento ===
    "Neutro"
  ) {
    return t("details.priority.medium");
  }

  return t("details.priority.low");
};

const obterRiscoIA = (
  avaliacao: any
) => {
  if (
    avaliacao?.sentimento ===
    "Crítico"
  ) {
    return t("details.risk.medium");
  }

  if (
    avaliacao?.sentimento ===
    "Neutro"
  ) {
    return t("details.risk.low");
  }

  return t("details.risk.veryLow");
};

const obterTempoRespostaIA = (
  avaliacao: any
) => {
  if (
    avaliacao?.sentimento ===
    "Crítico"
  ) {
    return t(
      "details.responseTime",
      { hours: 2 }
    );
  }

  if (
    avaliacao?.sentimento ===
    "Neutro"
  ) {
    return t(
      "details.responseTime",
      { hours: 12 }
    );
  }

  return t(
    "details.responseTime",
    { hours: 24 }
  );
};

const obterAnaliseIA = (
  avaliacao: any
) => {
  if (
    avaliacao?.sentimento ===
    "Crítico"
  ) {
    return t(
      "details.analysis.critical"
    );
  }

  if (
    avaliacao?.sentimento ===
    "Neutro"
  ) {
    return t(
      "details.analysis.neutral"
    );
  }

  return t(
    "details.analysis.positive"
  );
};

const obterTimelineAvaliacao = (
  avaliacao: any
) => {
  if (!avaliacao) return [];

  const respondida =
    avaliacao.status === "Respondida";

  return [
    {
      titulo: t(
        "details.timeline.received.title"
      ),
      descricao: t(
        "details.timeline.received.description"
      ),
      tempo: t(
        "details.timeline.now"
      ),
      emoji: "\u2B50",
      cor: "bg-blue-600",
    },
    {
      titulo: t(
        "details.timeline.sentiment.title"
      ),
      descricao: t(
        "details.timeline.sentiment.description",
        {
          sentiment:
            traduzirSentimento(
              avaliacao.sentimento
            ),
        }
      ),
      tempo: t(
        "details.timeline.afterReceipt"
      ),
      emoji: "\u{1F916}",
      cor:
        avaliacao.sentimento ===
        "Crítico"
          ? "bg-red-600"
          : avaliacao.sentimento ===
            "Neutro"
          ? "bg-amber-500"
          : "bg-emerald-600",
    },
    {
      titulo: respondida
        ? t(
            "details.timeline.response.sentTitle"
          )
        : t(
            "details.timeline.response.pendingTitle"
          ),

      descricao: respondida
        ? t(
            "details.timeline.response.sentDescription"
          )
        : t(
            "details.timeline.response.pendingDescription"
          ),

      tempo: respondida
        ? t(
            "details.timeline.completed"
          )
        : t(
            "details.timeline.pending"
          ),

      emoji: respondida
        ? "\u2705"
        : "\u23F3",

      cor: respondida
        ? "bg-emerald-600"
        : "bg-slate-400",
    },
    {
      titulo: respondida
        ? t(
            "details.timeline.case.resolvedTitle"
          )
        : t(
            "details.timeline.case.waitingTitle"
          ),

      descricao: respondida
        ? t(
            "details.timeline.case.resolvedDescription"
          )
        : t(
            "details.timeline.case.waitingDescription"
          ),

      tempo: respondida
        ? t(
            "details.timeline.resolved"
          )
        : t(
            "details.timeline.open"
          ),

      emoji: respondida
        ? "\u{1F3C1}"
        : "\u26A0\uFE0F",

      cor: respondida
        ? "bg-emerald-700"
        : "bg-red-500",
    },
  ];
};

const dadosReputacao = useMemo(() => {
  const evolucao = resumoReputacao?.evolucao7Dias || [];

  if (!evolucao.length) return [];

  return evolucao.map((item: any) => ({
    semana: traduzirDiaCurto(item.dia),
    reputacao: Math.max(
      0,
      Math.min(100, 80 + item.resolvidos * 5 - item.criticos * 10)
    ),
  }));
}, [resumoReputacao, t]);

const timelineAvaliacoes = (
  resumoReputacao?.ultimos || []
).map((item: any) => ({
  titulo:
    item.status === "RESOLVIDO"
      ? t("timelineAi.items.answered")
      : item.tipo === "Reclamação"
      ? t("timelineAi.items.complaint")
      : item.tipo === "Sugestão"
      ? t("timelineAi.items.suggestion")
      : item.tipo === "Elogio"
      ? t("timelineAi.items.praise")
      : t("timelineAi.items.record"),

  descricao: item.mensagem,

  tempo:
    item.status === "RESOLVIDO"
      ? t("reviewStatus.answered")
      : t("reviewStatus.pending"),

  tipo:
    item.status === "RESOLVIDO"
      ? "respondida"
      : item.sentimento === "CRITICO"
      ? "critico"
      : item.sentimento === "POSITIVO"
      ? "positivo"
      : "ia",

  emoji:
    item.status === "RESOLVIDO"
      ? "\u2705"
      : item.sentimento === "CRITICO"
      ? "\u26A0\uFE0F"
      : item.sentimento === "POSITIVO"
      ? "\u2B50"
      : "\u{1F916}",
}));

const obterCorTimeline = (tipo: string) => {
  if (tipo === "critico") return "bg-red-600";
  if (tipo === "positivo") return "bg-emerald-600";
  if (tipo === "respondida") return "bg-blue-600";
  return "bg-cyan-600";
};

    const cards = [
    {
      titulo: t(
        "summaryCards.averageRating.title"
      ),
      valor: "—",
      detalhe: t(
        "summaryCards.averageRating.detail"
      ),
      cor: "text-yellow-900",
    },
    {
      titulo: t(
        "summaryCards.evaluations.title"
      ),
      valor: String(avaliacoes),
      detalhe: t(
        "summaryCards.evaluations.detail"
      ),
      cor: "text-blue-900",
    },
    {
      titulo: t(
        "summaryCards.pending.title"
      ),
      valor: String(pendencias),
      detalhe: t(
        "summaryCards.pending.detail"
      ),
      cor: "text-red-900",
    },
    {
      titulo: t(
        "summaryCards.phanyxIndex.title"
      ),
      valor: `${scoreAtual}/100`,
      detalhe: t(
        "summaryCards.phanyxIndex.detail"
      ),
      cor: "text-purple-900",
    },
  ];

const crescimentoReal =
  resumoReputacao?.evolucao7Dias?.length >= 2
    ? resumoReputacao.evolucao7Dias[6].total -
      resumoReputacao.evolucao7Dias[0].total
    : 0;

const melhorDiaReal =
  resumoReputacao?.evolucao7Dias?.length
    ? traduzirDiaCurto(
        resumoReputacao.evolucao7Dias.reduce(
          (
            melhor: any,
            atual: any
          ) =>
            atual.total > melhor.total
              ? atual
              : melhor
        ).dia
      )
    : "\u2014";

const tempoMedioReal =
  resumoReputacao?.tempoMedioHoras !== null &&
  resumoReputacao?.tempoMedioHoras !== undefined
    ? `${resumoReputacao.tempoMedioHoras}h`
    : "—";

const temRespostaLenta =
  (resumoReputacao?.tempoMedioHoras || 0) > 24;

  return (
    <div className="phanyx-reputacao-page space-y-8">

      <style jsx global>{`
  .phanyx-reputacao-page .rep-dark-card {
    background: linear-gradient(135deg, #0f172a, #020617) !important;
    border-color: rgba(59, 130, 246, 0.35) !important;
    color: #f8fafc !important;
  }

  .phanyx-reputacao-page .rep-dark-card,
.phanyx-reputacao-page .rep-dark-card :is(h1,h2,h3,h4,p,span,div) {
  color: #f8fafc !important;
  opacity: 1 !important;
}

.phanyx-reputacao-page .rep-dark-card .text-slate-300,
.phanyx-reputacao-page .rep-dark-card .text-slate-400,
.phanyx-reputacao-page .rep-dark-card p {
  color: #cbd5e1 !important;
}

.phanyx-reputacao-page .rep-dark-card .text-white,
.phanyx-reputacao-page .rep-dark-card h3 {
  color: #ffffff !important;
}

.phanyx-reputacao-page .rep-inner-dark-card {
  background: rgba(30, 41, 59, 0.72) !important;
  border-color: rgba(148, 163, 184, 0.24) !important;
  color: #f8fafc !important;
}

.phanyx-reputacao-page .rep-inner-dark-card :is(h1,h2,h3,h4,p,span,div) {
  color: #f8fafc !important;
  opacity: 1 !important;
}

.phanyx-reputacao-page .rep-inner-dark-card p {
  color: #e2e8f0 !important;
}

.phanyx-reputacao-page .rep-inner-dark-card .text-cyan-300 {
  color: #67e8f9 !important;
}

.phanyx-reputacao-page .rep-inner-dark-card .text-amber-300 {
  color: #fcd34d !important;
}

.phanyx-reputacao-page .rep-inner-dark-card .text-emerald-300 {
  color: #86efac !important;
}

html[data-theme="system"] .phanyx-reputacao-page .rep-inner-dark-card {
  background: #303030 !important;
  border-color: #525252 !important;
  color: #f8fafc !important;
}

 /* TEMA CLARO */
html:not(.dark) .phanyx-reputacao-page .rep-ai-score,
html[data-theme="light"] .phanyx-reputacao-page .rep-ai-score {
  background: #ecfdf5 !important;
  border-color: #6ee7b7 !important;
  color: #064e3b !important;
}

html:not(.dark) .phanyx-reputacao-page .rep-ai-score :is(h1,h2,h3,h4,p,span,div),
html[data-theme="light"] .phanyx-reputacao-page .rep-ai-score :is(h1,h2,h3,h4,p,span,div) {
  color: #064e3b !important;
  opacity: 1 !important;
}

html:not(.dark) .phanyx-reputacao-page .rep-ai-score h3,
html[data-theme="light"] .phanyx-reputacao-page .rep-ai-score h3 {
  color: #064e3b !important;
}

/* TEMA ESCURO / SISTEMA ESCURO */
html.dark .phanyx-reputacao-page .rep-ai-score {
  background: #064e3b !important;
  border-color: #10b981 !important;
  color: #f0fdf4 !important;
}

html.dark .phanyx-reputacao-page .rep-ai-score :is(h1,h2,h3,h4,p,span,div) {
  color: #f0fdf4 !important;
  opacity: 1 !important;
}

html.dark .phanyx-reputacao-page .rep-ai-score h3 {
  color: #ffffff !important;
}

  .phanyx-reputacao-page .rep-timeline-item {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
  }

  .phanyx-reputacao-page .rep-timeline-item :is(h1,h2,h3,h4) {
    color: #0f172a !important;
  }

  .phanyx-reputacao-page .rep-timeline-item p {
    color: #475569 !important;
    opacity: 1 !important;
  }

  .phanyx-reputacao-page .rep-timeline-pill {
    background: #e2e8f0 !important;
    color: #334155 !important;
  }

  .phanyx-reputacao-page .rep-pastel-amber {
    background: #fffbeb !important;
    border-color: #fcd34d !important;
    color: #92400e !important;
  }

  .phanyx-reputacao-page .rep-pastel-blue {
    background: #eff6ff !important;
    border-color: #93c5fd !important;
    color: #1e3a8a !important;
  }

  .phanyx-reputacao-page .rep-pastel-emerald {
    background: #ecfdf5 !important;
    border-color: #6ee7b7 !important;
    color: #064e3b !important;
  }

  .phanyx-reputacao-page .rep-pastel-red {
    background: #fef2f2 !important;
    border-color: #fca5a5 !important;
    color: #991b1b !important;
  }

  .phanyx-reputacao-page .rep-pastel-sky {
    background: #f0f9ff !important;
    border-color: #7dd3fc !important;
    color: #075985 !important;
  }

  .phanyx-reputacao-page .rep-pastel-violet {
    background: #f5f3ff !important;
    border-color: #c4b5fd !important;
    color: #4c1d95 !important;
  }

  .phanyx-reputacao-page :is(
    .rep-pastel-amber,
    .rep-pastel-blue,
    .rep-pastel-emerald,
    .rep-pastel-red,
    .rep-pastel-sky,
    .rep-pastel-violet
  ) :is(h1,h2,h3,h4,p,span) {
    color: inherit !important;
    opacity: 1 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-reputacao-page .rep-ai-score {
    background: #064e3b !important;
    border-color: #10b981 !important;
    color: #f0fdf4 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-reputacao-page .rep-ai-score :is(h1,h2,h3,h4,p,span) {
    color: #f0fdf4 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-reputacao-page .rep-timeline-item {
    background: #172554 !important;
    border-color: #2563eb !important;
    color: #f8fafc !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-reputacao-page .rep-timeline-item :is(h1,h2,h3,h4) {
    color: #ffffff !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-reputacao-page .rep-timeline-item p {
    color: #cbd5e1 !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-reputacao-page .rep-timeline-pill {
    background: #1e3a8a !important;
    color: #bfdbfe !important;
  }

  html.dark:not([data-theme="system"]) .phanyx-reputacao-page :is(
    .rep-pastel-amber,
    .rep-pastel-blue,
    .rep-pastel-emerald,
    .rep-pastel-red,
    .rep-pastel-sky,
    .rep-pastel-violet
  ) {
    background: #172554 !important;
    border-color: #2563eb !important;
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-reputacao-page .rep-dark-card {
    background: linear-gradient(135deg, #262626, #171717) !important;
    border-color: #525252 !important;
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-reputacao-page .rep-ai-score {
    background: #303030 !important;
    border-color: #525252 !important;
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-reputacao-page .rep-ai-score :is(h1,h2,h3,h4,p,span) {
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-reputacao-page .rep-timeline-item {
    background: #303030 !important;
    border-color: #525252 !important;
    color: #f8fafc !important;
  }

  html[data-theme="system"] .phanyx-reputacao-page .rep-timeline-item :is(h1,h2,h3,h4) {
    color: #ffffff !important;
  }

  html[data-theme="system"] .phanyx-reputacao-page .rep-timeline-item p {
    color: #d4d4d4 !important;
  }

  html[data-theme="system"] .phanyx-reputacao-page .rep-timeline-pill {
    background: #404040 !important;
    color: #f5f5f5 !important;
  }

  html[data-theme="system"] .phanyx-reputacao-page :is(
    .rep-pastel-amber,
    .rep-pastel-blue,
    .rep-pastel-emerald,
    .rep-pastel-red,
    .rep-pastel-sky,
    .rep-pastel-violet
  ) {
    background: #303030 !important;
    border-color: #525252 !important;
    color: #f8fafc !important;
  }

  /* AJUSTE FINAL — SCORE IA NO TEMA CLARO */
html[data-theme="light"] .phanyx-reputacao-page .rep-ai-score,
html:not(.dark):not([data-theme="system"]) .phanyx-reputacao-page .rep-ai-score {
  background: #ecfdf5 !important;
  border-color: #6ee7b7 !important;
  color: #064e3b !important;
}

html[data-theme="light"] .phanyx-reputacao-page .rep-ai-score p,
html[data-theme="light"] .phanyx-reputacao-page .rep-ai-score h3,
html[data-theme="light"] .phanyx-reputacao-page .rep-ai-score span,
html[data-theme="light"] .phanyx-reputacao-page .rep-ai-score div,
html:not(.dark):not([data-theme="system"]) .phanyx-reputacao-page .rep-ai-score p,
html:not(.dark):not([data-theme="system"]) .phanyx-reputacao-page .rep-ai-score h3,
html:not(.dark):not([data-theme="system"]) .phanyx-reputacao-page .rep-ai-score span,
html:not(.dark):not([data-theme="system"]) .phanyx-reputacao-page .rep-ai-score div {
  color: #064e3b !important;
  opacity: 1 !important;
}

  .phanyx-reputacao-page .rep-tempo-real-badge {
  background: #67e8f9 !important;
  border: 1px solid #22d3ee !important;
  color: #083344 !important;
  opacity: 1 !important;
}

.phanyx-reputacao-page .rep-tempo-real-badge * {
  color: #083344 !important;
  opacity: 1 !important;
}

html.dark:not([data-theme="system"]) .phanyx-reputacao-page .rep-tempo-real-badge,
html[data-theme="system"] .phanyx-reputacao-page .rep-tempo-real-badge {
  background: #22d3ee !important;
  border-color: #67e8f9 !important;
  color: #083344 !important;
}


  /* REP FILTER I18N */
  .phanyx-reputacao-page .rep-filter-inactive {
    background: #ffffff !important;
    color: #334155 !important;
    border: 1px solid #cbd5e1 !important;
    opacity: 1 !important;
  }

  .phanyx-reputacao-page .rep-filter-inactive:hover {
    background: #f1f5f9 !important;
    color: #0f172a !important;
    border-color: #94a3b8 !important;
  }

  html.dark:not([data-theme="system"])
    .phanyx-reputacao-page
    .rep-filter-inactive {
    background: #1e293b !important;
    color: #f8fafc !important;
    border-color: #475569 !important;
  }

  html.dark:not([data-theme="system"])
    .phanyx-reputacao-page
    .rep-filter-inactive:hover {
    background: #334155 !important;
    color: #ffffff !important;
  }

  html[data-theme="system"]
    .phanyx-reputacao-page
    .rep-filter-inactive {
    background: #303030 !important;
    color: #f5f5f5 !important;
    border-color: #525252 !important;
  }

  html[data-theme="system"]
    .phanyx-reputacao-page
    .rep-filter-inactive:hover {
    background: #404040 !important;
    color: #ffffff !important;
  }

`}</style>

      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          PHANYX GROWTH
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          {"\u2B50"} {t("header.title")}
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600">
          {t("header.description")}
        </p>
      </div>

<div className="rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-white shadow-2xl">
  <div className="flex flex-wrap items-center justify-between gap-6">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
        SCORE PHANYX
      </p>

      <h2 className="mt-3 text-4xl font-black tracking-tight transition-all duration-500 sm:text-5xl md:text-6xl">
  {scoreAtual}/100
</h2>

      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
        {t("score.description")}
      </p>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 backdrop-blur">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-300">
        {t("score.trend")}
      </p>

      <p className="mt-2 text-3xl font-black text-green-400">
  {scoreAtual >= 80
    ? t("score.positive")
    : scoreAtual >= 60
    ? t("score.stable")
    : t("score.critical")}
</p>

      <p className="mt-2 text-xs font-semibold text-slate-400">
        {t("score.healthyGrowth")}
      </p>
    </div>
  </div>
</div>

<div className="rounded-2xl border bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-xl font-black text-slate-900">{t("timeline.title")}</h2>

      <p className="mt-1 text-sm text-slate-500">{t("timeline.description")}</p>
    </div>

    <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-500">{t("timeline.realTime")}</div>
  </div>

  <div className="mt-8 space-y-6">
    {timeline.map((item) => (
      <div key={item.titulo} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className={`h-4 w-4 rounded-full ${item.cor}`} />

          <div className="mt-2 h-full w-px bg-slate-200" />
        </div>

        <div className="pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-black text-slate-900">
              {item.titulo}
            </p>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
              {item.tempo}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.descricao}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.titulo}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {card.titulo}
            </p>

            <p className={`mt-2 text-3xl font-black ${card.cor}`}>
              {card.valor}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {card.detalhe}
            </p>
          </div>
        ))}
      </div>

      <div className="rep-pastel-amber rounded-2xl border p-6">
        <h2 className="text-lg font-black text-amber-900">
          {t("googleBusinessPreparation.title")}
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          {t("googleBusinessPreparation.description")}
        </p>
      </div>

<div className="rounded-3xl border bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black text-slate-900">{t("alerts.title")}</h2>

      <p className="mt-1 text-sm text-slate-500">{t("alerts.description")}</p>
    </div>

    <div className="rounded-full bg-red-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-700">{t("alerts.aiMonitoring")}</div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  {resumoReputacao?.criticos > 0 && (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-red-700">{t("alerts.critical")}</span>
        <span className="text-2xl">⚠️</span>
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        {t("alerts.criticalCount", {
    count: resumoReputacao.criticos,
  })}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{t("alerts.criticalDescription")}</p>
    </div>
  )}

  {resumoReputacao?.reclamacoesAbertas > 0 && (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-amber-700">{t("alerts.attention")}</span>
        <span className="text-2xl">📣</span>
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        {t("alerts.openComplaints", {
    count: resumoReputacao.reclamacoesAbertas,
  })}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{t("alerts.openComplaintsDescription")}</p>
    </div>
  )}

  {resumoReputacao?.resolvidos > 0 && (
  <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-black uppercase tracking-wide !text-emerald-800">{t("alerts.resolved")}</span>
      <span className="text-2xl">✅</span>
    </div>

    <h3 className="mt-4 text-lg font-black !text-slate-900">
      {t("alerts.resolvedCount", {
    count: resumoReputacao.resolvidos,
  })}
    </h3>

    <p className="mt-2 text-sm leading-6 !text-slate-700">{t("alerts.resolvedDescription")}</p>
  </div>
)}

  {resumoReputacao &&
  resumoReputacao.criticos === 0 &&
  resumoReputacao.reclamacoesAbertas === 0 && (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 md:col-span-2 xl:col-span-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide !text-emerald-800">{t("alerts.allGood")}</span>
        <span className="text-2xl">🟢</span>
      </div>

      <h3 className="mt-4 text-lg font-black !text-slate-900">{t("alerts.noAlertsTitle")}</h3>

      <p className="mt-2 text-sm leading-6 !text-slate-700">{t("alerts.noAlertsDescription")}</p>
    </div>
  )}
</div>
</div>

<div className="rounded-3xl border bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black text-slate-900">
        {t("evaluationCenter.title")}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {t("evaluationCenter.description")}
      </p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
  <div className="rep-pastel-blue rounded-2xl border p-4">
    <p className="text-xs font-black uppercase tracking-wide text-blue-700">
      {t("evaluationCenter.total")}
    </p>

    <h3 className="mt-2 text-3xl font-black !text-blue-700">
  {totalAvaliacoes}
</h3>
  </div>

  <div className="rep-pastel-amber rounded-2xl border p-4">
    <p className="text-xs font-black uppercase tracking-wide text-amber-700">
      {t("evaluationCenter.pending")}
    </p>

    <h3 className="mt-2 text-3xl font-black !text-amber-700">
      {totalPendentes}
    </h3>
  </div>

  <div className="rep-pastel-emerald rounded-2xl border p-4">
    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
      {t("evaluationCenter.answered")}
    </p>

    <h3 className="mt-2 text-3xl font-black !text-emerald-700">
      {totalRespondidas}
    </h3>
  </div>

  <div className="rep-pastel-red rounded-2xl border p-4">
    <p className="text-xs font-black uppercase tracking-wide text-red-700">
      {t("evaluationCenter.index")}
    </p>

    <h3 className="mt-2 text-3xl font-black !text-red-700">
      {percentualRespondidas}%
    </h3>
  </div>
</div>
      
    </div>

    <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
      {t("evaluationCenter.aiAnalyzing")}
    </span>

<div className="flex flex-wrap gap-2">
  {["Todos", "Pendentes", "Respondidas", "Críticas", "Positivas", "Neutras"].map(
    (filtro) => (
      <button
        key={filtro}
        type="button"
        onClick={() => setFiltroAvaliacoes(filtro)}
        className={`rounded-full px-4 py-2 text-xs font-black transition-all ${
          filtroAvaliacoes === filtro
            ? "bg-blue-600 text-white shadow-lg"
            : "rep-filter-inactive"
        }`}
      >
        {traduzirFiltro(filtro)}
      </button>
    )
  )}
</div>

<div className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
  <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-2xl">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">{t("executive.eyebrow")}</p>

        <h2 className="mt-4 text-4xl font-black leading-tight">{t("executive.title")}</h2>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{t("executive.description")}</p>
      </div>

      <div className="rep-ai-score rounded-3xl border px-6 py-5 text-center backdrop-blur">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-300">{t("executive.aiScore")}</p>

        <h3 className="mt-2 text-5xl font-black text-white">
         {scoreAnimado}
        </h3>

        <p className="mt-1 text-xs font-bold text-emerald-300">{t("executive.excellentReputation")}</p>
      </div>
    </div>

    <div className="mt-8">
  <div className="flex items-center justify-between text-sm font-bold text-slate-300">
    <span>{t("executive.reputationHealth")}</span>
    <span>{porcentagemAnimada}%</span>
  </div>

  <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all duration-500"
      style={{ width: `${porcentagemAnimada}%` }}
    />
  </div>
</div>

<div className="rep-inner-dark-card mt-8 overflow-hidden rounded-2xl border p-4">
  <div className="mb-3 flex items-center justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.25em] !text-cyan-300">{t("executive.aiMonitoring")}</p>

      <h4 className="mt-1 text-lg font-black !text-white">{t("executive.reputationTrend")}</h4>
    </div>

    <div className="rep-tempo-real-badge rounded-full px-3 py-1 text-xs font-black">{t("executive.realTime")}</div>
  </div>

  <div className="h-32">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
  data={(resumoReputacao?.evolucao7Dias || []).map((item: any) => ({
    dia: traduzirDiaCurto(item.dia),
    valor: item.total,
  }))}
>
        <defs>
          <linearGradient id="colorIA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="dia"
          stroke="#67e8f9"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />

        <YAxis hide />

        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid rgba(34,211,238,0.2)",
            borderRadius: "16px",
            color: "#fff",
          }}
        />

        <Area
          type="monotone"
          dataKey="valor"
          name={t("executive.recordsLabel")}
          stroke="#22d3ee"
          strokeWidth={3}
          fill="url(#colorIA)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</div>

    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <div className="rep-inner-dark-card rounded-2xl border p-4">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
          {t("executive.trend")}
        </p>

        <h3 className="mt-2 text-2xl font-black !text-white">
          {crescimentoReal >= 0 ? `+${crescimentoReal}` : crescimentoReal}
        </h3>

        <p className="mt-2 text-xs leading-5 !text-slate-200">{t("executive.trendDetail")}</p>
      </div>

      <div className="rep-inner-dark-card rounded-2xl border p-4">
        <p className="text-xs font-black uppercase tracking-wide text-amber-300">
          {t("executive.averageTime")}
        </p>

        <h3 className="mt-2 text-2xl font-black !text-white">
  {tempoMedioReal}
</h3>

        <p className="mt-2 text-xs leading-5 !text-slate-200">{t("executive.averageTimeDetail")}</p>
      </div>

      <div className="rep-inner-dark-card rounded-2xl border p-4">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-300">{t("executive.aiStatus")}</p>

        <h3 className="mt-2 text-2xl font-black !text-white">
          {t("executive.active")}
        </h3>

        <p className="mt-2 text-xs leading-5 !text-slate-200">{t("executive.monitoringNormal")}</p>
      </div>
    </div>
  </div>

  <div className="grid gap-5">
    <div className="rep-pastel-emerald rounded-[2rem] border p-6">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{t("executive.positiveReviews")}</p>

      <h3 className="mt-3 text-5xl font-black text-emerald-900">
  {resumoReputacao?.total
    ? Math.round(
        ((resumoReputacao.elogios || 0) /
          resumoReputacao.total) *
          100
      )
    : 0}
  %
</h3>

      <p className="mt-3 text-sm leading-7 text-emerald-800">
  {t("executive.positiveReviewsDetail", {
    count: resumoReputacao?.elogios || 0,
  })}
</p>
    </div>

    <div className="rep-pastel-red rounded-[2rem] border p-6">
      <p className="text-xs font-black uppercase tracking-wide text-red-700">{t("executive.attentionNeeded")}</p>

      <h3 className="mt-3 text-5xl font-black text-red-900">
        {totalPendentes}
      </h3>

      <p className="mt-3 text-sm leading-7 text-red-800">
        {totalPendentes > 0
    ? t("executive.pendingExists")
    : t("executive.noPending")}
      </p>
    </div>
  </div>
</div>

  </div>

  <div className="mt-6 space-y-4">
   {avaliacoesFiltradas.length === 0 ? (
  <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
      🎉
    </div>

    <h3 className="mt-6 text-2xl font-black text-slate-900">
      {t("evaluationCenter.emptyTitle")}
    </h3>

    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
      {t("evaluationCenter.emptyDescription")}
    </p>

    <div className="mt-6 inline-flex rounded-full bg-blue-100 px-5 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
      {t("evaluationCenter.monitoringActive")}
    </div>
  </div>
) : (
  avaliacoesFiltradas.map((avaliacao) => (
    <div
      key={avaliacao.id}
      className="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
            {avaliacao.iniciais}
          </div>

          <div>
            <p className="font-black text-slate-900">{avaliacao.nome}</p>
            <p className="mt-1 text-sm text-yellow-500">
              {"★".repeat(avaliacao.nota)}
              <span className="text-slate-300">
                {"★".repeat(5 - avaliacao.nota)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {traduzirSentimento(avaliacao.sentimento)}
          </span>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            {traduzirStatusAvaliacao(avaliacao.status)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        “{avaliacao.texto}”
      </p>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setAvaliacaoSelecionada(avaliacao);
            setModalDetalhesAberto(true);
          }}
          className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          {t("evaluationCenter.viewDetails")}
        </button>

        <button
          type="button"
          onClick={() => {
            setAvaliacaoSelecionada(avaliacao);
            setModalRespostaAberto(true);
          }}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          {t("evaluationCenter.replyWithAi")}
        </button>
      </div>
    </div>
  ))
)}
  </div>
</div>

<div className="rounded-3xl border bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black text-slate-900">{t("evolution.title")}</h2>

      <p className="mt-1 text-sm text-slate-500">{t("evolution.description")}</p>
    </div>

    <div className="rep-pastel-emerald rounded-2xl border px-4 py-3">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{t("evolution.aiTrend")}</p>

      <p className="mt-1 text-2xl font-black text-emerald-700">
  {crescimentoReal >= 0 ? `+${crescimentoReal}` : crescimentoReal}
</p>
    </div>
  </div>

  <div className="mt-8 h-[320px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dadosReputacao}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="semana" />

        <YAxis />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="reputacao"
          name={t("evolution.reputationLabel")}
          stroke="#2563eb"
          strokeWidth={4}
          dot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>

<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <div className="rep-dark-card rounded-3xl border p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-red-600">{t("analysisCards.alertLabel")}</p>

        <h3 className="mt-3 text-lg font-black text-white">
  {resumoReputacao?.criticos > 0
    ? t("analysisCards.criticalDetected")
    : t("analysisCards.noCriticalAlert")}
</h3>

        <p className="mt-2 text-sm leading-6 text-slate-300">
  {resumoReputacao?.criticos > 0
    ? t("analysisCards.criticalPending")
    : t("analysisCards.noCriticalPending")}
</p>
      </div>

      <div className="text-3xl">🚨</div>
    </div>

    <div className="mt-5 h-2 overflow-hidden rounded-full bg-red-100">
      <div
  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
  style={{ width: `${Math.min(100, (resumoReputacao?.criticos || 0) * 25)}%` }}
/>
    </div>
  </div>

  <div className="rep-dark-card rounded-3xl border p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">{t("analysisCards.growthLabel")}</p>

        <h3 className="mt-3 text-lg font-black text-white">
  {crescimentoReal > 0
    ? t("analysisCards.growthDetected")
    : crescimentoReal < 0
    ? t("analysisCards.dropDetected")
    : t("analysisCards.stable")}
</h3>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {crescimentoReal > 0
    ? t("analysisCards.growthDescription")
    : crescimentoReal < 0
    ? t("analysisCards.dropDescription")
    : t("analysisCards.stableDescription")}
        </p>
      </div>

      <div className="text-3xl">🚀</div>
    </div>

    <div className="mt-5 h-2 overflow-hidden rounded-full bg-emerald-100">
      <div
  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
  style={{ width: `${Math.min(100, Math.abs(crescimentoReal) * 20)}%` }}
/>
    </div>
  </div>

  <div className="rep-dark-card rounded-3xl border p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">{t("analysisCards.responseTimeLabel")}</p>

        <h3 className="mt-3 text-lg font-black text-white">{t("analysisCards.slowResponses")}</h3>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {temRespostaLenta
    ? t("analysisCards.responseSlow")
    : t("analysisCards.responseNormal")}
        </p>
      </div>

      <div className="text-3xl">⏱️</div>
    </div>

    <div className="mt-5 h-2 overflow-hidden rounded-full bg-amber-100">
      <div
  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
  style={{ width: `${temRespostaLenta ? 100 : 35}%` }}
/>
    </div>
  </div>

  <div className="rep-dark-card rounded-3xl border p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">{t("analysisCards.scoreLabel")}</p>

        <h3 className="mt-3 text-lg font-black text-white">{t("analysisCards.excellent")}</h3>

        <p className="mt-2 text-sm leading-6 text-slate-300">{t("analysisCards.excellentDescription")}</p>
      </div>

      <div className="text-3xl">⭐</div>
    </div>

    <div className="mt-5 h-2 overflow-hidden rounded-full bg-cyan-100">
      <div
  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
  style={{ width: `${scoreAtual}%` }}
/>
    </div>
  </div>
</div>

<div className="phanyx-theme-card rounded-3xl border p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black">{t("timelineAi.title")}</h2>

      <p className="mt-1 text-sm opacity-70">{t("timelineAi.description")}</p>
    </div>

    <span className="rounded-full bg-cyan-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-700">{t("timelineAi.realTimeMonitoring")}</span>
  </div>

  <div className="mt-8 space-y-6">
    {timelineAvaliacoes.map((item, index) => (
      <div key={item.id} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg text-white shadow-lg ${obterCorTimeline(
              item.tipo
            )}`}
          >
            {item.emoji}
          </div>

          {index < timelineAvaliacoes.length - 1 && (
            <div className="mt-2 h-full min-h-10 w-px bg-slate-500/40" />
          )}
        </div>

        <div className="rep-timeline-item flex-1 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black">
              {item.titulo}
            </h3>

            <span className="rep-timeline-pill rounded-full px-3 py-1 text-[11px] font-bold">
              {item.tempo}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6">
            {item.descricao}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

<section className="mt-8 rounded-[2rem] border bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-3xl font-black text-slate-900">{t("insights.title")}</h2>

      <p className="mt-2 text-sm text-slate-500">{t("insights.description")}</p>
    </div>

    <div className="rounded-full bg-blue-100 px-5 py-2 text-xs font-black uppercase tracking-wide text-blue-700">{t("insights.activeIntelligence")}</div>
  </div>

  <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
    <div className="rep-pastel-emerald rounded-3xl border p-5">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{t("insights.positiveGrowth")}</p>

      <h3 className="mt-3 text-3xl font-black text-emerald-900">
  {crescimentoReal >= 0 ? `+${crescimentoReal}` : crescimentoReal}
</h3>

      <p className="mt-3 text-sm leading-6 text-emerald-800">{t("insights.positiveGrowthDescription")}</p>
    </div>

    <div className="rep-pastel-amber rounded-3xl border p-5">
      <p className="text-xs font-black uppercase tracking-wide text-amber-700">{t("insights.pendingResponses")}</p>

      <h3 className="mt-3 text-3xl font-black text-amber-900">
        {totalPendentes}
      </h3>

      <p className="mt-3 text-sm leading-6 text-amber-800">
        {totalPendentes > 0
    ? t("insights.pendingExists")
    : t("insights.allAnswered")}
      </p>
    </div>

    <div className="rep-pastel-sky rounded-3xl border p-5">
      <p className="text-xs font-black uppercase tracking-wide text-sky-700">{t("insights.bestPerformance")}</p>

      <h3 className="mt-3 text-2xl font-black text-sky-900">
        {melhorDiaReal}
      </h3>

      <p className="mt-3 text-sm leading-6 text-sky-800">{t("insights.bestPerformanceDescription")}</p>
    </div>

    <div className="rep-pastel-violet rounded-3xl border p-5">
      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
        {t("insights.averageTime")}
      </p>

      <h3 className="mt-3 text-2xl font-black text-violet-900">
        {tempoMedioReal}
      </h3>

      <p className="mt-3 text-sm leading-6 text-violet-800">{t("insights.averageTimeDescription")}</p>
    </div>
  </div>
</section>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">{t("sources.title")}</h2>

          <div className="mt-4 space-y-3">
  {[
    {
      nome: "Google Business",
      status: t("sources.preparing"),
      cor: "bg-amber-100 text-amber-700",
    },
    {
      nome: "Meta / Facebook",
      status: t("sources.preparing"),
      cor: "bg-amber-100 text-amber-700",
    },
    {
      nome: "Instagram",
      status: t("sources.preparing"),
      cor: "bg-amber-100 text-amber-700",
    },
    {
      nome: t("sources.internalComplaints"),
      status: t("sources.active"),
      cor: "bg-emerald-100 text-emerald-700",
    },
  ].map((item) => (
    <div
      key={item.nome}
      className="flex items-center justify-between rounded-xl border p-4"
    >
      <span className="font-semibold text-slate-700">
        {item.nome}
      </span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${item.cor}`}
      >
        {item.status}
      </span>
    </div>
  ))}
</div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
  <h2 className="text-lg font-black text-slate-900">{t("resources.title")}</h2>

  <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
    <li>{"\u2705"} {t("resources.ombudsmanActive")}</li>
    <li>{"\u2705"} {t("resources.pendingCalculated")}</li>
    <li>{"\u2705"} {t("resources.indexCalculated")}</li>
    <li>{"\u{1F7E1}"} {t("resources.googleBusinessWaiting")}</li>
    <li>{"\u{1F7E1}"} {t("resources.metaWaiting")}</li>
  </ul>
</div>
            </div>
    </div>

{toastMensagem && (
  <div className="fixed right-5 top-5 z-[60] rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800 shadow-2xl">
    ✅ {toastMensagem}
  </div>
)}

         {modalRespostaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-red-600">{t("replyAi.eyebrow")}</p>

                <h2 className="mt-2 text-2xl font-black text-slate-900">{t("replyAi.title")}</h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">{t("replyAi.description")}</p>
              </div>

              <button
                type="button"
                onClick={() => setModalRespostaAberto(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-lg font-black text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-700">{t("replyAi.received")}</p>

<div className="mt-3 flex flex-wrap gap-2">
  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
    {avaliacaoSelecionada?.nome}
  </span>

  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-yellow-600">
    {t("common.stars", {
    count: avaliacaoSelecionada?.nota || 0,
  })}
  </span>

  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-red-600">
    {avaliacaoSelecionada?.sentimento
    ? traduzirSentimento(
        avaliacaoSelecionada.sentimento
      )
    : ""}
  </span>
</div>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                “{avaliacaoSelecionada?.texto}”
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-700">{t("replyAi.suggestion")}</p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {gerarRespostaIA(avaliacaoSelecionada)}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalRespostaAberto(false)}
                className="rounded-xl border px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >{t("common.cancel")}</button>

<button
  type="button"
  onClick={marcarComoRespondida}
  disabled={avaliacaoSelecionada?.status === "Respondida"}
  className={`rounded-xl px-5 py-3 text-sm font-bold text-white transition-all duration-300 ${
    avaliacaoSelecionada?.status === "Respondida"
      ? "cursor-not-allowed bg-emerald-400"
      : "bg-emerald-600 hover:scale-105 hover:bg-emerald-700"
  }`}
>
  {avaliacaoSelecionada?.status === "Respondida"
    ? t("reviewStatus.answered")
    : t("replyAi.markAnswered")}
</button>

              <button
  type="button"
  onClick={copiarRespostaIA}
  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-blue-700"
>{t("replyAi.copyResponse")}</button>
            </div>
          </div>
        </div>
      )}

{modalEngajamentoAberto && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-[2rem] border border-amber-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">{t("engagementModal.eyebrow")}</p>

          <h2 className="mt-3 text-4xl font-black text-slate-900">{t("engagementModal.title")}</h2>
        </div>

        <button
          onClick={() => setModalEngajamentoAberto(false)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:rotate-90 hover:bg-slate-200"
        >
          ×
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-amber-700">{t("engagementModal.growthIdentified")}</p>

        <p className="mt-3 text-sm leading-7 text-slate-700">{t("engagementModal.growthDescription")}</p>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-blue-700">{t("engagementModal.aiSuggestion")}</p>

        <p className="mt-3 text-sm leading-7 text-slate-700">{t("engagementModal.suggestionDescription")}</p>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setModalEngajamentoAberto(false)}
          className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-white transition hover:scale-[1.03] hover:bg-amber-600"
        >{t("common.understood")}</button>
      </div>
    </div>
  </div>
)}

{modalPositivoAberto && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">{t("positiveModal.eyebrow")}</p>

          <h2 className="mt-3 text-4xl font-black text-slate-900">{t("positiveModal.title")}</h2>
        </div>

        <button
          onClick={() => setModalPositivoAberto(false)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:rotate-90 hover:bg-slate-200"
        >
          ×
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-emerald-700">{t("positiveModal.aiAnalysis")}</p>

        <p className="mt-3 text-sm leading-7 text-slate-700">{t("positiveModal.analysisDescription")}</p>
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-cyan-700">{t("positiveModal.recommendations")}</p>

        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
          <li>{"\u2705"} {t("positiveModal.recommendation1")}</li>
          <li>{"\u2705"} {t("positiveModal.recommendation2")}</li>
          <li>{"\u2705"} {t("positiveModal.recommendation3")}</li>
          <li>{"\u2705"} {t("positiveModal.recommendation4")}</li>
        </ul>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setModalPositivoAberto(false)}
          className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:scale-[1.03] hover:bg-emerald-700"
        >{t("common.closeAnalysis")}</button>
      </div>
    </div>
  </div>
)}

{modalDetalhesAberto && (
  <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="mx-auto my-6 max-h-[calc(100vh-48px)] w-full max-w-3xl overflow-y-auto rounded-[2rem] border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-700">{t("details.eyebrow")}</p>

          <h2 className="mt-3 text-4xl font-black text-slate-900">{t("details.title")}</h2>
        </div>

        <button
          onClick={() => setModalDetalhesAberto(false)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:rotate-90 hover:bg-slate-200"
        >
          ×
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700">
            {avaliacaoSelecionada?.nome}
          </span>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-yellow-600">
            {t("common.stars", {
    count: avaliacaoSelecionada?.nota || 0,
  })}
          </span>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700">
            {avaliacaoSelecionada?.status
    ? traduzirStatusAvaliacao(
        avaliacaoSelecionada.status
      )
    : ""}
          </span>
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-700">
          “{avaliacaoSelecionada?.texto}”
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">{t("details.priorityLabel")}</p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {obterPrioridadeIA(avaliacaoSelecionada)}
          </h3>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">{t("details.riskLabel")}</p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {obterRiscoIA(avaliacaoSelecionada)}
          </h3>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">{t("details.channelLabel")}</p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
    {t("details.internalOmbudsman")}
  </h3>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{t("details.recommendedTime")}</p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {obterTempoRespostaIA(avaliacaoSelecionada)}
          </h3>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-blue-700">{t("details.aiAnalysis")}</p>

        <p className="mt-3 text-sm leading-7 text-slate-700">
          {obterAnaliseIA(avaliacaoSelecionada)}
        </p>
      </div>

<div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
  <p className="text-xs font-black uppercase tracking-wide text-slate-500">{t("details.timelineTitle")}</p>

  <div className="mt-5 space-y-5">
    {obterTimelineAvaliacao(avaliacaoSelecionada).map((item, index, lista) => (
      <div key={item.titulo} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm text-white shadow-lg ${item.cor}`}
          >
            {item.emoji}
          </div>

          {index < lista.length - 1 && (
            <div className="mt-2 h-full min-h-8 w-px bg-slate-200" />
          )}
        </div>

        <div className="flex-1 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-slate-900">{item.titulo}</p>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
              {item.tempo}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {item.descricao}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setModalDetalhesAberto(false)}
          className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:scale-[1.03] hover:bg-blue-700"
        >{t("common.closeAnalysis")}</button>
      </div>

    </div>
  </div>
)}

    </div>
  );
  
}