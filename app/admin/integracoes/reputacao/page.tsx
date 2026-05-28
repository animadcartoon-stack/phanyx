"use client";

import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

export default function ReputacaoPage() {

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
      valor: "0",
      detalhe: "Total de avaliações monitoradas",
      cor: "text-blue-700",
    },
    {
      titulo: "Pendências",
      valor: "0",
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

      <h2 className="mt-3 text-5xl font-black">82/100</h2>

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

  <div className="mt-6 h-[320px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={grafico}>
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

      <div className="grid gap-4 lg:grid-cols-2">
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
    </div>
  );
}