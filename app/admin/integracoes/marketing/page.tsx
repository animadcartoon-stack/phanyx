"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const cards = [
  {
    titulo: "Analytics",
    status: "Conectado",
    href: "/admin/integracoes/google-analytics",
    emoji: "📊",
  },
  {
    titulo: "GTM",
    status: "Conectado",
    href: "/admin/integracoes/google-tag-manager",
    emoji: "🏷️",
  },
  {
    titulo: "Google Ads",
    status: "Configuração",
    href: "/admin/integracoes/google-ads",
    emoji: "💰",
  },
  {
    titulo: "Search Console",
    status: "Configuração",
    href: "/admin/integracoes/search-console",
    emoji: "🔎",
  },
  {
    titulo: "Google Business",
    status: "Configuração",
    href: "/admin/integracoes/google-business",
    emoji: "📍",
  },
  {
    titulo: "Meta",
    status: "Em breve",
    href: "#",
    emoji: "📘",
  },
  {
    titulo: "TikTok",
    status: "Em breve",
    href: "#",
    emoji: "🎵",
  },
  {
    titulo: "LinkedIn",
    status: "Em breve",
    href: "#",
    emoji: "💼",
  },
  {
    titulo: "YouTube",
    status: "Em breve",
    href: "#",
    emoji: "▶️",
  },
  {
    titulo: "WhatsApp",
    status: "Em breve",
    href: "#",
    emoji: "💬",
  },
  {
    titulo: "Reputação",
    status: "Em breve",
    href: "#",
    emoji: "⭐",
  },
];

export default function MarketingIntegracoesPage() {

    const [metricas, setMetricas] = useState({
    visitantes: 0,
    conversoes: 0,
    googleBusiness: 0,
    reputacao: null as number | null,
  });

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    try {
      const res = await fetch(
        "/api/admin/integracoes/marketing/dashboard"
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar dashboard");
      }

      setMetricas({
        visitantes: data.visitantes || 0,
        conversoes: data.conversoes || 0,
        googleBusiness: data.googleBusinessVisualizacoes || 0,
        reputacao: data.reputacaoMedia,
      });
    } catch (error) {
      console.error("Erro dashboard marketing:", error);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          PHANYX GROWTH
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Central de marketing e presença digital
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600">
          Acompanhe métricas, integrações, campanhas, reputação e canais da
          instituição em um só lugar.
        </p>
      </div>

      {/* DASHBOARD EXECUTIVO */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Visitantes
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">{metricas.visitantes.toLocaleString("pt-BR")}</p>
          <p className="mt-1 text-xs font-semibold text-green-600">
            +18% últimos 30 dias
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Conversões
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">{metricas.conversoes.toLocaleString("pt-BR")}</p>
          <p className="mt-1 text-xs font-semibold text-green-600">
            Leads capturados
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Google Business
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">{metricas.googleBusiness.toLocaleString("pt-BR")}</p>
          <p className="mt-1 text-xs font-semibold text-blue-600">
            visualizações do perfil
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Reputação
          </p>
          <p className="mt-2 text-3xl font-black text-yellow-500">{metricas.reputacao ? `${metricas.reputacao} ★` : "--"}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            média de avaliações
          </p>
        </div>
      </div>

      {/* INTEGRAÇÕES */}
      <div>
        <h2 className="mb-4 text-xl font-black text-slate-900">
          Canais e integrações
        </h2>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => {
            const bloqueado = card.href === "#";

            const conteudo = (
              <div className="rounded-2xl border bg-white p-4 shadow-sm transition hover:border-blue-500 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-2xl">{card.emoji}</div>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      card.status === "Conectado"
                        ? "bg-green-100 text-green-700"
                        : card.status === "Configuração"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {card.status}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-black text-slate-900">
                  {card.titulo}
                </h3>

                <p className="mt-2 text-xs font-semibold text-blue-600">
                  {bloqueado ? "Em breve" : "Abrir"}
                </p>
              </div>
            );

            if (bloqueado) {
              return <div key={card.titulo}>{conteudo}</div>;
            }

            return (
              <Link key={card.titulo} href={card.href}>
                {conteudo}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}