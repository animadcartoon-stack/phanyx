"use client";

import { useEffect, useMemo, useState } from "react";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";



export default function ReputacaoPage() {

    const [scoreAtual, setScoreAtual] = useState(82);
const [avaliacoes, setAvaliacoes] = useState(0);
const [pendencias, setPendencias] = useState(0);
const [modalRespostaAberto, setModalRespostaAberto] = useState(false);

useEffect(() => {
  const timer = setInterval(() => {
    setScoreAtual((valor) => (valor >= 84 ? 82 : valor + 1));
    setAvaliacoes((valor) => (valor >= 7 ? 3 : valor + 1));
    setPendencias((valor) => (valor >= 2 ? 0 : valor + 1));
  }, 3500);

  return () => clearInterval(timer);
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

const copiarRespostaIA = async () => {
  const texto =
    "Olá! Sentimos muito pela experiência relatada. Agradecemos por compartilhar seu feedback, pois ele nos ajuda a melhorar nosso atendimento. Nossa equipe irá verificar o ocorrido e buscar uma solução o mais breve possível.";

  await navigator.clipboard.writeText(texto);

  alert("Resposta copiada!");
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

      <button className="mt-5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">
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

      <button className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        Ver análise IA
      </button>
    </div>

  </div>
</div>

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
         {modalRespostaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-red-600">
                  Alerta reputacional
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Responder avaliação negativa
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

              <p className="mt-2 text-sm leading-6 text-slate-700">
                “Tive dificuldade para conseguir atendimento e não recebi retorno
                sobre minha solicitação.”
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-700">
                Sugestão da IA PHANYX
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                Olá! Sentimos muito pela experiência relatada. Agradecemos por
                compartilhar seu feedback, pois ele nos ajuda a melhorar nosso
                atendimento. Nossa equipe irá verificar o ocorrido e buscar uma
                solução o mais breve possível.
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
  onClick={copiarRespostaIA}
  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-blue-700"
>
  Copiar resposta
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}