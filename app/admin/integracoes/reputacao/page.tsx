"use client";

import { useEffect, useMemo, useState } from "react";

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

const [scoreAtual, setScoreAtual] = useState(82);
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
  const timer = setInterval(() => {
    setScoreAtual((valor) => (valor >= 84 ? 82 : valor + 1));
    setAvaliacoes((valor) => (valor >= 7 ? 3 : valor + 1));
    setPendencias((valor) => (valor >= 2 ? 0 : valor + 1));
  }, 3500);

  return () => clearInterval(timer);
}, []);

useEffect(() => {
  const intervalo = setInterval(() => {
    if (!notificacaoFechada) {
  setMostrarNotificacaoIA(true);
}

    setTimeout(() => {
      setMostrarNotificacaoIA(false);

      setTimeout(() => {
        setNotificacaoAtual((valor) =>
          valor >= notificacoesIA.length - 1 ? 0 : valor + 1
        );
      }, 400);
    }, 4200);
  }, 7000);

  return () => clearInterval(intervalo);
}, []);

const graficoDinamico = useMemo(
  () => [
    { nome: "Seg", score: scoreAtual - 10 },
    { nome: "Ter", score: scoreAtual - 7 },
    { nome: "Qua", score: scoreAtual - 8 },
    { nome: "Qui", score: scoreAtual - 4 },
    { nome: "Sex", score: scoreAtual - 2 },
    { nome: "Sáb", score: scoreAtual - 1 },
    { nome: "Hoje", score: scoreAtual },
  ],
  [scoreAtual]
);

const gerarRespostaIA = (avaliacao: any) => {
  if (!avaliacao) return "";

  if (avaliacao.sentimento === "Crítico") {
    return `Olá, ${avaliacao.nome}. Sentimos muito pela experiência relatada. Agradecemos por compartilhar seu feedback, pois ele nos ajuda a melhorar continuamente nosso atendimento. Nossa equipe irá analisar sua situação com atenção para buscar uma solução o mais breve possível.`;
  }

  if (avaliacao.sentimento === "Neutro") {
    return `Olá, ${avaliacao.nome}. Agradecemos pela sua avaliação e pelas observações compartilhadas. Seu feedback é muito importante para continuarmos aprimorando nossos processos e oferecendo uma experiência cada vez melhor.`;
  }

  return `Olá, ${avaliacao.nome}. Ficamos muito felizes em saber que sua experiência foi positiva. Agradecemos pela confiança em nossa instituição e pelo carinho em compartilhar sua avaliação.`;
};

const copiarRespostaIA = async () => {
  const texto = gerarRespostaIA(avaliacaoSelecionada);

  await navigator.clipboard.writeText(texto);

  setToastMensagem("Resposta copiada para a área de transferência.");

setTimeout(() => {
  setToastMensagem("");
}, 3000);
};

    const grafico = [
  { nome: "Seg", score: 72 },
  { nome: "Ter", score: 75 },
  { nome: "Qua", score: 74 },
  { nome: "Qui", score: 78 },
  { nome: "Sex", score: 80 },
  { nome: "Sáb", score: 81 },
  { nome: "Hoje", score: 82 },
];
  
const timeline = [
  {
    titulo: "Google Business conectado",
    descricao: "Integração inicial concluída no PHANYX.",
    tempo: "Agora",
    cor: "bg-green-500",
  },

  {
    titulo: "API Google aguardando aprovação",
    descricao: "O Google ainda está analisando a liberação da API.",
    tempo: "Hoje",
    cor: "bg-amber-500",
  },

  {
    titulo: "Módulo reputacional ativado",
    descricao: "Monitoramento reputacional preparado.",
    tempo: "Hoje",
    cor: "bg-blue-500",
  },
];

const notificacoesIA = [
  {
    titulo: "Nova avaliação recebida",
    descricao: "Uma nova avaliação foi detectada no Google Business.",
    cor:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    emoji: "⭐",
  },

  {
    titulo: "Engajamento em crescimento",
    descricao: "O perfil institucional teve aumento de visualizações.",
    cor:
      "border-amber-200 bg-amber-50 text-amber-700",
    emoji: "📈",
  },

  {
    titulo: "Resposta pendente",
    descricao: "Existe uma avaliação aguardando retorno.",
    cor:
      "border-red-200 bg-red-50 text-red-700",
    emoji: "⚠️",
  },

  {
    titulo: "IA monitorando reputação",
    descricao: "PHANYX Growth continua analisando sinais reputacionais.",
    cor:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    emoji: "🤖",
  },
];

const [avaliacoesSimuladas, setAvaliacoesSimuladas] = useState([
  {
    nome: "Mariana Silva",
    iniciais: "MS",
    nota: 5,
    sentimento: "Positivo",
    texto: "Atendimento excelente e plataforma muito organizada.",
    status: "Respondida",
  },
  {
    nome: "Carlos Mendes",
    iniciais: "CM",
    nota: 2,
    sentimento: "Crítico",
    texto: "Tive dificuldade para conseguir atendimento e retorno.",
    status: "Pendente",
  },
  {
    nome: "Ana Paula",
    iniciais: "AP",
    nota: 4,
    sentimento: "Neutro",
    texto: "Boa experiência, mas algumas informações poderiam ser mais claras.",
    status: "Pendente",
  },
]);

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

const marcarComoRespondida = () => {
  if (!avaliacaoSelecionada) return;

  setAvaliacoesSimuladas((listaAtual) =>
    listaAtual.map((avaliacao) =>
      avaliacao.nome === avaliacaoSelecionada.nome
        ? { ...avaliacao, status: "Respondida" }
        : avaliacao
    )
  );

  setAvaliacaoSelecionada({
    ...avaliacaoSelecionada,
    status: "Respondida",
  });

  setToastMensagem("Avaliação marcada como respondida.");

  setTimeout(() => {
    setToastMensagem("");
  }, 3000);
};

const obterPrioridadeIA = (avaliacao: any) => {
  if (avaliacao?.sentimento === "Crítico") return "Alta";
  if (avaliacao?.sentimento === "Neutro") return "Média";
  return "Baixa";
};

const obterRiscoIA = (avaliacao: any) => {
  if (avaliacao?.sentimento === "Crítico") return "Médio";
  if (avaliacao?.sentimento === "Neutro") return "Baixo";
  return "Muito baixo";
};

const obterTempoRespostaIA = (avaliacao: any) => {
  if (avaliacao?.sentimento === "Crítico") return "2 horas";
  if (avaliacao?.sentimento === "Neutro") return "12 horas";
  return "24 horas";
};

const obterAnaliseIA = (avaliacao: any) => {
  if (avaliacao?.sentimento === "Crítico") {
    return "Existe risco de impacto reputacional caso a avaliação permaneça sem resposta.";
  }

  if (avaliacao?.sentimento === "Neutro") {
    return "A avaliação apresenta oportunidade de melhoria e fortalecimento institucional.";
  }

  return "A avaliação fortalece a reputação institucional e contribui positivamente para confiança da marca.";
};

const obterTimelineAvaliacao = (avaliacao: any) => {
  if (!avaliacao) return [];

  const respondida = avaliacao.status === "Respondida";

  return [
    {
      titulo: "Avaliação recebida",
      descricao: "A avaliação foi identificada pelo monitoramento reputacional.",
      tempo: "Agora",
      emoji: "⭐",
      cor: "bg-blue-600",
    },
    {
      titulo: "IA analisou sentimento",
      descricao: `Sentimento classificado como ${avaliacao.sentimento}.`,
      tempo: "Após recebimento",
      emoji: "🤖",
      cor:
        avaliacao.sentimento === "Crítico"
          ? "bg-red-600"
          : avaliacao.sentimento === "Neutro"
          ? "bg-amber-500"
          : "bg-emerald-600",
    },
    {
      titulo: respondida ? "Resposta marcada como enviada" : "Resposta pendente",
      descricao: respondida
        ? "A avaliação já foi marcada como respondida no PHANYX Growth."
        : "A IA recomenda responder esta avaliação dentro do prazo indicado.",
      tempo: respondida ? "Concluído" : "Pendente",
      emoji: respondida ? "✅" : "⏳",
      cor: respondida ? "bg-emerald-600" : "bg-slate-400",
    },
    {
      titulo: respondida ? "Caso resolvido" : "Aguardando ação",
      descricao: respondida
        ? "O ciclo reputacional desta avaliação foi encerrado visualmente."
        : "A avaliação ainda precisa de acompanhamento administrativo.",
      tempo: respondida ? "Resolvido" : "Em aberto",
      emoji: respondida ? "🏁" : "⚠️",
      cor: respondida ? "bg-emerald-700" : "bg-red-500",
    },
  ];
};

const dadosReputacao = [
  { semana: "Seg", reputacao: 48 },
  { semana: "Ter", reputacao: 52 },
  { semana: "Qua", reputacao: 55 },
  { semana: "Qui", reputacao: 61 },
  { semana: "Sex", reputacao: 68 },
  { semana: "Sáb", reputacao: 72 },
  { semana: "Dom", reputacao: 81 },
];

const timelineAvaliacoes = [
  {
    titulo: "Nova avaliação detectada",
    descricao: "A IA PHANYX identificou uma nova avaliação positiva no Google Business.",
    tempo: "Hoje",
    tipo: "positivo",
    emoji: "⭐",
  },
  {
    titulo: "Resposta pendente",
    descricao: "Uma avaliação crítica ainda precisa de resposta administrativa.",
    tempo: "Hoje",
    tipo: "critico",
    emoji: "⚠️",
  },
  {
    titulo: "Análise reputacional concluída",
    descricao: "A IA classificou sentimentos e atualizou o índice reputacional.",
    tempo: "Agora",
    tipo: "ia",
    emoji: "🤖",
  },
  {
    titulo: "Resposta marcada como enviada",
    descricao: "Uma avaliação foi marcada como respondida no PHANYX Growth.",
    tempo: "Hoje",
    tipo: "respondida",
    emoji: "✅",
  },
];

const obterCorTimeline = (tipo: string) => {
  if (tipo === "critico") return "bg-red-600";
  if (tipo === "positivo") return "bg-emerald-600";
  if (tipo === "respondida") return "bg-blue-600";
  return "bg-cyan-600";
};

    const cards = [
    {
      titulo: "Nota média",
      valor: "—",
      detalhe: "Aguardando avaliações conectadas",
      cor: "text-yellow-600",
    },
    {
      titulo: "Avaliações",
      valor: String(avaliacoes),
      detalhe: "Total de avaliações monitoradas",
      cor: "text-blue-700",
    },
    {
      titulo: "Pendências",
      valor: String(pendencias),
      detalhe: "Avaliações aguardando resposta",
      cor: "text-red-600",
    },
    {
      titulo: "Índice PHANYX",
      valor: "Em breve",
      detalhe: "Reputação consolidada da instituição",
      cor: "text-purple-700",
    },
  ];

  <style jsx global>{`
  @keyframes toastBar {
    from {
      transform: scaleX(1);
    }

    to {
      transform: scaleX(0);
    }
  }
`}</style>

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          PHANYX GROWTH
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          ⭐ Reputação
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600">
          Monitore a reputação digital da instituição, acompanhe avaliações,
          respostas pendentes e indicadores de confiança.
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
        A reputação institucional está estável e preparada para expansão
        digital. O PHANYX continuará monitorando futuras avaliações e sinais
        reputacionais.
      </p>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 backdrop-blur">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-300">
        Tendência
      </p>

      <p className="mt-2 text-3xl font-black text-green-400">
        Positiva ↗
      </p>

      <p className="mt-2 text-xs font-semibold text-slate-400">
        Crescimento reputacional saudável
      </p>
    </div>
  </div>
</div>

<div className="rounded-2xl border bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-xl font-black text-slate-900">
        Timeline reputacional
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Eventos recentes monitorados pelo PHANYX Growth.
      </p>
    </div>

    <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
      Em tempo real
    </div>
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

<div className="rounded-3xl border bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-xl font-black text-slate-900">
        Evolução reputacional
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Crescimento monitorado pelo PHANYX Growth.
      </p>
    </div>

    <div className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">
      +13% este mês
    </div>
  </div>

  <div className="mt-6 h-[220px] sm:h-[260px] md:h-[320px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={graficoDinamico}>
        <XAxis
          dataKey="nome"
          tickLine={false}
          axisLine={false}
        />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="score"
          stroke="#2563eb"
          strokeWidth={4}
          dot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
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

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-black text-amber-900">
          Google Business em preparação
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          O PHANYX já está pronto para conectar avaliações e métricas do Google
          Business. Algumas informações dependem da liberação da API pelo
          Google.
        </p>
      </div>

<div className="rounded-3xl border bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black text-slate-900">
        Alertas reputacionais
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Monitoramento inteligente de reputação institucional.
      </p>
    </div>

    <div className="rounded-full bg-red-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-700">
      IA Monitorando
    </div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-red-700">
          Crítico
        </span>

        <span className="text-2xl">⚠️</span>
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        Avaliação negativa detectada
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Uma nova avaliação negativa foi detectada no Google Business e ainda
        não recebeu resposta.
      </p>

      <button
  type="button"
  onClick={() => setModalRespostaAberto(true)}
  className="mt-5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-red-700"
>
  Responder agora
</button>
    </div>

    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-amber-700">
          Atenção
        </span>

        <span className="text-2xl">📈</span>
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        Crescimento de engajamento
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        O perfil institucional apresentou aumento de visualizações nesta
        semana.
      </p>

      <button
  onClick={() => setModalEngajamentoAberto(true)}
  className="mt-5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:scale-[1.03] hover:bg-amber-600"
>
  Ver detalhes
</button>
    </div>

    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-emerald-700">
          Positivo
        </span>

        <span className="text-2xl">✅</span>
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        Nota reputacional estável
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        A reputação institucional segue saudável e sem oscilações negativas.
      </p>

      <button
  onClick={() => setModalPositivoAberto(true)}
  className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:scale-[1.03] hover:bg-emerald-700"
>
  Ver análise IA
</button>
    </div>

  </div>
</div>

<div className="rounded-3xl border bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black text-slate-900">
        Central de avaliações
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Avaliações recentes monitoradas pela IA PHANYX.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
    <p className="text-xs font-black uppercase tracking-wide text-blue-700">
      Total
    </p>

    <h3 className="mt-2 text-3xl font-black text-slate-900">
      {totalAvaliacoes}
    </h3>
  </div>

  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
    <p className="text-xs font-black uppercase tracking-wide text-amber-700">
      Pendentes
    </p>

    <h3 className="mt-2 text-3xl font-black text-slate-900">
      {totalPendentes}
    </h3>
  </div>

  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
      Respondidas
    </p>

    <h3 className="mt-2 text-3xl font-black text-slate-900">
      {totalRespondidas}
    </h3>
  </div>

  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
    <p className="text-xs font-black uppercase tracking-wide text-red-700">
      Índice PHANYX
    </p>

    <h3 className="mt-2 text-3xl font-black text-slate-900">
      {percentualRespondidas}%
    </h3>
  </div>
</div>
      
    </div>

    <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
      IA analisando sentimentos
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
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {filtro}
      </button>
    )
  )}
</div>

<div className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
  <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-2xl">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
          Painel executivo IA
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight">
          Reputação institucional saudável
        </h2>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          A IA PHANYX está acompanhando reputação, engajamento,
          avaliações e velocidade de resposta em tempo real.
        </p>
      </div>

      <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-5 text-center backdrop-blur">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
          Score IA
        </p>

        <h3 className="mt-2 text-5xl font-black text-white">
          92
        </h3>

        <p className="mt-1 text-xs font-bold text-emerald-300">
          Excelente reputação
        </p>
      </div>
    </div>

    <div className="mt-8">
      <div className="flex items-center justify-between text-sm font-bold text-slate-300">
        <span>Saúde reputacional</span>
        <span>92%</span>
      </div>

      <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" />
      </div>
    </div>

<div className="mt-8 overflow-hidden rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
  <div className="mb-3 flex items-center justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
        Monitoramento IA
      </p>

      <h4 className="mt-1 text-lg font-black text-white">
        Tendência reputacional
      </h4>
    </div>

    <div className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
      Tempo real
    </div>
  </div>

  <div className="h-32">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={[
          { dia: "Seg", valor: 48 },
          { dia: "Ter", valor: 52 },
          { dia: "Qua", valor: 55 },
          { dia: "Qui", valor: 61 },
          { dia: "Sex", valor: 68 },
          { dia: "Sáb", valor: 72 },
          { dia: "Dom", valor: 81 },
        ]}
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
          stroke="#22d3ee"
          strokeWidth={3}
          fill="url(#colorIA)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</div>

    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
          Tendência
        </p>

        <h3 className="mt-2 text-2xl font-black text-white">
          +18%
        </h3>

        <p className="mt-2 text-xs leading-5 text-slate-300">
          Crescimento reputacional identificado pela IA.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-amber-300">
          Tempo médio
        </p>

        <h3 className="mt-2 text-2xl font-black text-white">
          4h
        </h3>

        <p className="mt-2 text-xs leading-5 text-slate-300">
          Tempo médio estimado para resposta administrativa.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
          Status IA
        </p>

        <h3 className="mt-2 text-2xl font-black text-white">
          Ativo
        </h3>

        <p className="mt-2 text-xs leading-5 text-slate-300">
          Monitoramento reputacional funcionando normalmente.
        </p>
      </div>
    </div>
  </div>

  <div className="grid gap-5">
    <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
        Avaliações positivas
      </p>

      <h3 className="mt-3 text-5xl font-black text-emerald-900">
        78%
      </h3>

      <p className="mt-3 text-sm leading-7 text-emerald-800">
        A maior parte das avaliações recebidas possui sentimento positivo.
      </p>
    </div>

    <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6">
      <p className="text-xs font-black uppercase tracking-wide text-red-700">
        Atenção necessária
      </p>

      <h3 className="mt-3 text-5xl font-black text-red-900">
        2
      </h3>

      <p className="mt-3 text-sm leading-7 text-red-800">
        Existem avaliações aguardando resposta institucional.
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
      Nenhuma avaliação encontrada
    </h3>

    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
      O filtro selecionado não possui avaliações no momento.
      A IA PHANYX continuará monitorando novos sinais reputacionais automaticamente.
    </p>

    <div className="mt-6 inline-flex rounded-full bg-blue-100 px-5 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
      Monitoramento ativo
    </div>
  </div>
) : (
  avaliacoesFiltradas.map((avaliacao) => (
    <div
      key={avaliacao.nome}
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
            {avaliacao.sentimento}
          </span>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            {avaliacao.status}
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
          Ver detalhes
        </button>

        <button
          type="button"
          onClick={() => {
            setAvaliacaoSelecionada(avaliacao);
            setModalRespostaAberto(true);
          }}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          Responder com IA
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
      <h2 className="text-2xl font-black text-slate-900">
        Evolução reputacional
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        A IA PHANYX acompanha tendências reputacionais e crescimento institucional.
      </p>
    </div>

    <div className="rounded-2xl bg-emerald-100 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
        Tendência IA
      </p>

      <p className="mt-1 text-2xl font-black text-emerald-700">
        +18%
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
          stroke="#2563eb"
          strokeWidth={4}
          dot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>

<div className="rounded-3xl border bg-wte p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black text-slate-900">
        Timeline reputacional IA
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Eventos recentes acompanhados automaticamente pelo PHANYX Growth.
      </p>
    </div>

    <span className="rounded-full bg-cyan-100 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-700">
      Monitoramento em tempo real
    </span>
  </div>

  <div className="mt-8 space-y-6">
    {timelineAvaliacoes.map((item, index) => (
      <div key={`${item.titulo}-${index}`} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg text-white shadow-lg ${obterCorTimeline(
              item.tipo
            )}`}
          >
            {item.emoji}
          </div>

          {index < timelineAvaliacoes.length - 1 && (
            <div className="mt-2 h-full min-h-10 w-px bg-slate-200" />
          )}
        </div>

        <div className="flex-1 rounded-2xl border bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-900">
              {item.titulo}
            </h3>

            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
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

<section className="mt-8 rounded-[2rem] border bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-3xl font-black text-slate-900">
        Insights automáticos IA
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        A IA PHANYX identificou tendências reputacionais relevantes.
      </p>
    </div>

    <div className="rounded-full bg-blue-100 px-5 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
      Inteligência reputacional ativa
    </div>
  </div>

  <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
        Crescimento positivo
      </p>

      <h3 className="mt-3 text-3xl font-black text-emerald-900">
        +18%
      </h3>

      <p className="mt-3 text-sm leading-6 text-emerald-800">
        As avaliações positivas aumentaram nesta semana.
      </p>
    </div>

    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-amber-700">
        Respostas pendentes
      </p>

      <h3 className="mt-3 text-3xl font-black text-amber-900">
        2
      </h3>

      <p className="mt-3 text-sm leading-6 text-amber-800">
        Existem avaliações aguardando retorno administrativo.
      </p>
    </div>

    <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-sky-700">
        Melhor desempenho
      </p>

      <h3 className="mt-3 text-2xl font-black text-sky-900">
        Sexta-feira
      </h3>

      <p className="mt-3 text-sm leading-6 text-sky-800">
        O maior volume de engajamento ocorreu neste dia.
      </p>
    </div>

    <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
        Tempo médio
      </p>

      <h3 className="mt-3 text-2xl font-black text-violet-900">
        4h
      </h3>

      <p className="mt-3 text-sm leading-6 text-violet-800">
        Tempo médio estimado para resposta reputacional.
      </p>
    </div>
  </div>
</section>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Fontes de reputação
          </h2>

          <div className="mt-4 space-y-3">
            {[
              "Google Business",
              "Meta / Facebook",
              "Instagram",
              "Reclamações internas",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <span className="font-semibold text-slate-700">{item}</span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  Em preparação
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Próximos recursos
          </h2>

          <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
            <li>✅ Últimas avaliações recebidas</li>
            <li>✅ Respostas pendentes</li>
            <li>✅ Alerta de avaliação negativa</li>
            <li>✅ Nota média por canal</li>
            <li>✅ Índice reputacional PHANYX</li>
          </ul>
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
                <p className="text-xs font-black uppercase tracking-[0.25em] text-red-600">
                  Alerta reputacional
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Responder avaliação com IA
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  O PHANYX preparou uma sugestão profissional para responder com
                  empatia, clareza e proteção da reputação institucional.
                </p>
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
              <p className="text-sm font-bold text-red-700">
                Avaliação recebida
              </p>

<div className="mt-3 flex flex-wrap gap-2">
  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
    {avaliacaoSelecionada?.nome}
  </span>

  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-yellow-600">
    {avaliacaoSelecionada?.nota} estrelas
  </span>

  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-red-600">
    {avaliacaoSelecionada?.sentimento}
  </span>
</div>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                “{avaliacaoSelecionada?.texto}”
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-700">
                Sugestão da IA PHANYX
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {gerarRespostaIA(avaliacaoSelecionada)}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalRespostaAberto(false)}
                className="rounded-xl border px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

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
    ? "Respondida"
    : "Marcar como respondida"}
</button>

              <button
  type="button"
  onClick={copiarRespostaIA}
  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-blue-700"
>
  Copiar resposta
</button>
            </div>
          </div>
        </div>
      )}

{modalEngajamentoAberto && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-[2rem] border border-amber-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">
            INSIGHT DE ENGAJAMENTO
          </p>

          <h2 className="mt-3 text-4xl font-black text-slate-900">
            Crescimento detectado
          </h2>
        </div>

        <button
          onClick={() => setModalEngajamentoAberto(false)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:rotate-90 hover:bg-slate-200"
        >
          ×
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-amber-700">
          Crescimento identificado
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-700">
          O perfil institucional apresentou aumento de visualizações,
          pesquisas e interações nesta semana.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-blue-700">
          Sugestão da IA PHANYX
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-700">
          Aproveite este momento para publicar novos conteúdos,
          responder mensagens rapidamente e incentivar alunos a deixarem
          avaliações positivas.
        </p>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setModalEngajamentoAberto(false)}
          className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-white transition hover:scale-[1.03] hover:bg-amber-600"
        >
          Entendi
        </button>
      </div>
    </div>
  </div>
)}

{modalPositivoAberto && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">
            RELATÓRIO POSITIVO
          </p>

          <h2 className="mt-3 text-4xl font-black text-slate-900">
            Reputação saudável
          </h2>
        </div>

        <button
          onClick={() => setModalPositivoAberto(false)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:rotate-90 hover:bg-slate-200"
        >
          ×
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
          Análise IA PHANYX
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-700">
          A reputação institucional permanece estável e positiva.
          Nenhuma oscilação crítica foi detectada nos últimos dias.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-cyan-700">
          Recomendações
        </p>

        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
          <li>✅ Continue incentivando avaliações positivas</li>
          <li>✅ Responda comentários rapidamente</li>
          <li>✅ Mantenha constância nas redes sociais</li>
          <li>✅ Preserve tempo de resposta saudável</li>
        </ul>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setModalPositivoAberto(false)}
          className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:scale-[1.03] hover:bg-emerald-700"
        >
          Fechar análise
        </button>
      </div>
    </div>
  </div>
)}

{modalDetalhesAberto && (
  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-[2rem] border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-700">
            DETALHES DA AVALIAÇÃO
          </p>

          <h2 className="mt-3 text-4xl font-black text-slate-900">
            Análise reputacional IA
          </h2>
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
            {avaliacaoSelecionada?.nota} estrelas
          </span>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700">
            {avaliacaoSelecionada?.status}
          </span>
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-700">
          “{avaliacaoSelecionada?.texto}”
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">
            Prioridade IA
          </p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {obterPrioridadeIA(avaliacaoSelecionada)}
          </h3>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">
            Risco reputacional
          </p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {obterRiscoIA(avaliacaoSelecionada)}
          </h3>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
            Canal
          </p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
            Google Business
          </h3>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
            Tempo recomendado
          </p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {obterTempoRespostaIA(avaliacaoSelecionada)}
          </h3>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-blue-700">
          Análise IA PHANYX
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-700">
          {obterAnaliseIA(avaliacaoSelecionada)}
        </p>
      </div>

<div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
    Timeline da avaliação
  </p>

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
        >
          Fechar análise
        </button>
      </div>

    </div>
  </div>
)}

{mostrarNotificacaoIA && (
  <div className="fixed right-6 top-6 z-[99999] animate-in slide-in-from-right-10 fade-in duration-500">
    <div
      className={`w-[380px] rounded-3xl border p-5 shadow-2xl backdrop-blur-xl ${notificacoesIA[notificacaoAtual].cor}`}
    >

<div className="mb-3 flex justify-end">
  <button
    type="button"
    onClick={() => {
      setMostrarNotificacaoIA(false);
      setNotificacaoFechada(true);
    }}
    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-lg font-black text-current transition hover:rotate-90 hover:bg-black/10"
  >
    ×
  </button>
</div>

      <div className="flex items-start gap-4">
        <div className="text-3xl">
          {notificacoesIA[notificacaoAtual].emoji}
        </div>

        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-[0.25em]">
            PHANYX IA
          </p>

          <h3 className="mt-2 text-lg font-black">
            {notificacoesIA[notificacaoAtual].titulo}
          </h3>

          <p className="mt-2 text-sm leading-6 opacity-90">
            {notificacoesIA[notificacaoAtual].descricao}
          </p>
        </div>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-black/10">
        <div className="h-full w-full origin-left animate-[toastBar_4s_linear] rounded-full bg-current" />
      </div>
    </div>
  </div>
)}

    </div>
  );
}