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

function formatarTempo(segundos: number) {
  if (!segundos || segundos <= 0) return "0s";

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const secs = Math.floor(segundos % 60);

  if (horas > 0) {
    return `${horas}h ${minutos}m ${secs}s`;
  }

  if (minutos > 0) {
    return `${minutos}m ${secs}s`;
  }

  return `${secs}s`;
}

export default function MarketingIntegracoesPage() {

    const [metricas, setMetricas] = useState({
  visitantes: 0,
  novosUsuarios: 0,
  sessoes: 0,
  visualizacoes: 0,
  tempoMedioSessao: 0,
  conversoes: 0,
  googleBusiness: 0,
  reputacao: null as number | null,
  cliquesBusca: 0,
  impressoesBusca: 0,
});

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
  try {
    const res = await fetch(
      "/api/admin/integracoes/marketing/dashboard",
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const data = await res.json();

    console.log("DASHBOARD DATA:", data);

    if (!res.ok) {
      throw new Error(data.error || "Erro ao carregar dashboard");
    }

    setMetricas({
      visitantes: Number(data.visitantes || 0),
      novosUsuarios: Number(data.novosUsuarios || 0),
      sessoes: Number(data.sessoes || 0),
      visualizacoes: Number(data.visualizacoes || 0),
      tempoMedioSessao: Number(data.tempoMedioSessao || 0),
      conversoes: Number(data.conversoes || 0),
      googleBusiness: Number(data.googleBusiness || 0),
      reputacao: data.reputacao,
      cliquesBusca: Number(data.cliquesBusca || 0),
      impressoesBusca: Number(data.impressoesBusca || 0),
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
  {[
    {
      titulo: "Visitantes",
      valor: metricas.visitantes.toLocaleString("pt-BR"),
      detalhe: "Usuários ativos nos últimos 30 dias",
      cor: "text-blue-700",
    },
    {
      titulo: "Novos usuários",
      valor: metricas.novosUsuarios.toLocaleString("pt-BR"),
      detalhe: "Pessoas que acessaram pela primeira vez",
      cor: "text-emerald-700",
    },
    {
      titulo: "Sessões",
      valor: metricas.sessoes.toLocaleString("pt-BR"),
      detalhe: "Total de visitas registradas",
      cor: "text-purple-700",
    },
    {
      titulo: "Visualizações",
      valor: metricas.visualizacoes.toLocaleString("pt-BR"),
      detalhe: "Páginas visualizadas no site",
      cor: "text-orange-700",
    },
    {
      titulo: "Tempo médio",
      valor: formatarTempo(metricas.tempoMedioSessao),
      detalhe: "Tempo médio por sessão",
      cor: "text-slate-900",
    },
    {
      titulo: "Conversões",
      valor: metricas.conversoes.toLocaleString("pt-BR"),
      detalhe: "Eventos marcados como conversão",
      cor: "text-green-700",
    },
    {
      titulo: "Google Business",
      valor: metricas.googleBusiness.toLocaleString("pt-BR"),
      detalhe: "Visualizações do perfil",
      cor: "text-blue-700",
    },
    {
  titulo: "Cliques Google",
  valor: metricas.cliquesBusca.toLocaleString("pt-BR"),
  detalhe: "Cliques vindos da busca orgânica",
  cor: "text-indigo-700",
},
{
  titulo: "Impressões Google",
  valor: metricas.impressoesBusca.toLocaleString("pt-BR"),
  detalhe: "Vezes que apareceu nas buscas",
  cor: "text-cyan-700",
},
    {
      titulo: "Reputação",
      valor: metricas.reputacao ? `${metricas.reputacao} ★` : "--",
      detalhe: "Média de avaliações",
      cor: "text-yellow-500",
    },
  ].map((item) => (
    <div
      key={item.titulo}
      className="rounded-2xl border bg-white p-5 shadow-sm"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {item.titulo}
      </p>

      <p className={`mt-2 text-3xl font-black ${item.cor}`}>
        {item.valor}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-500">
        {item.detalhe}
      </p>
    </div>
  ))}
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