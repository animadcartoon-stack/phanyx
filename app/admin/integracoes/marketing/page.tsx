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

  if (horas > 0) return `${horas}h ${minutos}m ${secs}s`;
  if (minutos > 0) return `${minutos}m ${secs}s`;

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
  ctrBusca: 0,
  posicaoMediaBusca: 0,
});

const [googleBusinessStatus, setGoogleBusinessStatus] = useState({
  conectado: false,
  visualizacoes: 0,
  cliques: 0,
  ligacoes: 0,
  rotas: 0,
  avaliacoes: 0,
  notaMedia: null as number | null,
});

  const [metaStatus, setMetaStatus] = useState({
    conectado: false,
    metricasDisponiveis: false,
    aguardandoPermissao: false,
    paginaNome: "",
    curtidas: 0,
    seguidores: 0,
    falandoSobre: 0,
  });

  useEffect(() => {
    carregarDashboard();
    carregarMetaFacebook();
    carregarGoogleBusiness();
  }, []);

  async function carregarDashboard() {
    try {
      const res = await fetch("/api/admin/integracoes/marketing/dashboard", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

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
  ctrBusca: Number(data.ctrBusca || 0),
  posicaoMediaBusca: Number(data.posicaoMediaBusca || 0),
});
    } catch (error) {
      console.error(error);
    }
  }

  async function carregarMetaFacebook() {
    try {
      const res = await fetch("/api/admin/integracoes/meta/facebook/metricas", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      setMetaStatus({
        conectado: !!data.conectado,
        metricasDisponiveis: !!data.metricasDisponiveis,
        aguardandoPermissao: !!data.aguardandoPermissao,
        paginaNome: data?.pagina?.nome || "",
        curtidas: Number(data?.metricas?.curtidas || 0),
        seguidores: Number(data?.metricas?.seguidores || 0),
        falandoSobre: Number(data?.metricas?.falandoSobre || 0),
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function carregarGoogleBusiness() {
  try {
    const res = await fetch("/api/admin/integracoes/google-business/metricas", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json();

    setGoogleBusinessStatus({
      conectado: !!data.conectado,
      visualizacoes: Number(data.visualizacoes || 0),
      cliques: Number(data.cliques || 0),
      ligacoes: Number(data.ligacoes || 0),
      rotas: Number(data.rotas || 0),
      avaliacoes: Number(data.avaliacoes || 0),
      notaMedia: data.notaMedia,
    });
  } catch (error) {
    console.error(error);
  }
}

  const dashboardCards = [
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
      valor: googleBusinessStatus.visualizacoes.toLocaleString("pt-BR"),
      detalhe: googleBusinessStatus.conectado
    ? "Visualizações do perfil"
    : "Conecte seu perfil comercial",
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
  titulo: "CTR Google",
  valor: `${(metricas.ctrBusca * 100).toFixed(1)}%`,
  detalhe: "Taxa de clique da busca orgânica",
  cor: "text-emerald-700",
},
{
  titulo: "Posição média",
  valor:
    metricas.posicaoMediaBusca > 0
      ? metricas.posicaoMediaBusca.toFixed(1)
      : "-",
  detalhe: "Posição média no Google",
  cor: "text-violet-700",
},
   {
  titulo: "Facebook",
  valor: metaStatus.conectado
    ? metaStatus.seguidores.toLocaleString("pt-BR")
    : "Configurar",
  detalhe: metaStatus.conectado
    ? `Seguidores • ${metaStatus.curtidas.toLocaleString("pt-BR")} curtidas`
    : "Conecte sua página Meta",
  cor: "text-blue-700",
},
  ];

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((item) => (
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

      <div>
        <h2 className="mb-4 text-xl font-black text-slate-900">
          Canais e integrações
        </h2>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => {
           const cardAtual =
  card.titulo === "Meta"
    ? {
        ...card,
        status: metaStatus.conectado ? "Conectado" : "Configuração",
        href: "/api/admin/integracoes/meta/connect",
      }
    : card.titulo === "Google Business"
    ? {
        ...card,
        status: googleBusinessStatus.conectado
          ? "Conectado"
          : "Configuração",
        href: "/admin/integracoes/google-business",
      }
    : card;

            const bloqueado = cardAtual.href === "#";

            const conteudo = (
              <div className="rounded-2xl border bg-white p-4 shadow-sm transition hover:border-blue-500 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-2xl">{cardAtual.emoji}</div>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      cardAtual.status === "Conectado"
                        ? "bg-green-100 text-green-700"
                        : cardAtual.status === "Configuração"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {cardAtual.status}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-black text-slate-900">
                  {cardAtual.titulo}
                </h3>

                <p className="mt-2 text-xs font-semibold text-blue-600">
                  {bloqueado ? "Em breve" : "Abrir"}
                </p>
              </div>
            );

            if (bloqueado) {
              return <div key={cardAtual.titulo}>{conteudo}</div>;
            }

            return (
              <Link key={cardAtual.titulo} href={cardAtual.href}>
                {conteudo}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}