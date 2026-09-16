"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

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
  titulo: "Reputação IA",
  status: "Ativo",
  href: "/admin/integracoes/reputacao",
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
  const t = useTranslations("AdminIntegracoesMarketing");
  const locale = useLocale();

  const formatarNumero = (valor: number) =>
    new Intl.NumberFormat(locale).format(valor);

  const formatarDecimal = (valor: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(valor);

  function formatarTempo(segundos: number) {
    if (!segundos || segundos <= 0) {
      return t("duration.seconds", {
        seconds: 0,
      });
    }

    const horas =
      Math.floor(segundos / 3600);

    const minutos =
      Math.floor(
        (segundos % 3600) / 60
      );

    const secs =
      Math.floor(segundos % 60);

    if (horas > 0) {
      return t(
        "duration.hoursMinutesSeconds",
        {
          hours: horas,
          minutes: minutos,
          seconds: secs,
        }
      );
    }

    if (minutos > 0) {
      return t(
        "duration.minutesSeconds",
        {
          minutes: minutos,
          seconds: secs,
        }
      );
    }

    return t(
      "duration.seconds",
      {
        seconds: secs,
      }
    );
  }
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

const [googleAdsStatus, setGoogleAdsStatus] = useState({
  conectado: false,
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
  carregarGoogleAds();
}, []);

  async function carregarDashboard() {
    try {
      const res = await fetch("/api/admin/integracoes/marketing/dashboard", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("errors.dashboard"));
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

async function carregarGoogleAds() {
  try {
    const res = await fetch("/api/admin/integracoes/google-ads/metricas", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json();

    setGoogleAdsStatus({
      conectado: !!data.conectado,
    });
  } catch (error) {
    console.error(error);
  }
}

  const dashboardCards = [
    {
      titulo: t("metrics.visitors.title"),
      valor: formatarNumero(
        metricas.visitantes
      ),
      detalhe: t(
        "metrics.visitors.detail"
      ),
      cor: "text-blue-700",
    },
    {
      titulo: t("metrics.newUsers.title"),
      valor: formatarNumero(
        metricas.novosUsuarios
      ),
      detalhe: t(
        "metrics.newUsers.detail"
      ),
      cor: "text-emerald-700",
    },
    {
      titulo: t("metrics.sessions.title"),
      valor: formatarNumero(
        metricas.sessoes
      ),
      detalhe: t(
        "metrics.sessions.detail"
      ),
      cor: "text-purple-700",
    },
    {
      titulo: t("metrics.views.title"),
      valor: formatarNumero(
        metricas.visualizacoes
      ),
      detalhe: t(
        "metrics.views.detail"
      ),
      cor: "text-orange-700",
    },
    {
      titulo: t(
        "metrics.averageTime.title"
      ),
      valor: formatarTempo(
        metricas.tempoMedioSessao
      ),
      detalhe: t(
        "metrics.averageTime.detail"
      ),
      cor: "text-slate-900",
    },
    {
      titulo: t(
        "metrics.conversions.title"
      ),
      valor: formatarNumero(
        metricas.conversoes
      ),
      detalhe: t(
        "metrics.conversions.detail"
      ),
      cor: "text-green-700",
    },
    {
      titulo: "Google Business",
      valor: formatarNumero(
        googleBusinessStatus.visualizacoes
      ),
      detalhe:
        googleBusinessStatus.conectado
          ? t(
              "metrics.googleBusiness.connectedDetail"
            )
          : t(
              "metrics.googleBusiness.disconnectedDetail"
            ),
      cor: "text-blue-700",
    },
    {
      titulo: t(
        "metrics.googleClicks.title"
      ),
      valor: formatarNumero(
        metricas.cliquesBusca
      ),
      detalhe: t(
        "metrics.googleClicks.detail"
      ),
      cor: "text-indigo-700",
    },
    {
      titulo: t(
        "metrics.googleImpressions.title"
      ),
      valor: formatarNumero(
        metricas.impressoesBusca
      ),
      detalhe: t(
        "metrics.googleImpressions.detail"
      ),
      cor: "text-cyan-700",
    },
    {
      titulo: "CTR Google",
      valor:
        formatarDecimal(
          metricas.ctrBusca * 100
        ) + "%",
      detalhe: t(
        "metrics.googleCtr.detail"
      ),
      cor: "text-emerald-700",
    },
    {
      titulo: t(
        "metrics.averagePosition.title"
      ),
      valor:
        metricas.posicaoMediaBusca > 0
          ? formatarDecimal(
              metricas.posicaoMediaBusca
            )
          : "-",
      detalhe: t(
        "metrics.averagePosition.detail"
      ),
      cor: "text-violet-700",
    },
    {
      titulo: "Facebook",
      valor: metaStatus.conectado
        ? formatarNumero(
            metaStatus.seguidores
          )
        : t("actions.configure"),
      detalhe: metaStatus.conectado
        ? t(
            "metrics.facebook.connectedDetail",
            {
              likes: formatarNumero(
                metaStatus.curtidas
              ),
            }
          )
        : t(
            "metrics.facebook.disconnectedDetail"
          ),
      cor: "text-blue-700",
    },
  ];

  function traduzirStatus(
    status: string
  ) {
    switch (status) {
      case "Conectado":
        return t("status.connected");

      case "Configura??o":
        return t("status.configuration");

      case "Ativo":
        return t("status.active");

      case "Em breve":
        return t("status.comingSoon");

      default:
        return status;
    }
  }

  function tituloCanal(
    titulo: string
  ) {
    if (
      titulo === "Reputa??o IA"
    ) {
      return t(
        "channels.reputationAi"
      );
    }

    return titulo;
  }

  return (
    <div className="phanyx-marketing-page space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          PHANYX GROWTH
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((item) => (
          <div
            key={item.titulo}
            className="phanyx-marketing-card rounded-2xl p-5 shadow-sm"
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
          {t("channelsTitle")}
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
    : card.titulo === "Google Ads"
? {
    ...card,
    status: googleAdsStatus.conectado
      ? "Conectado"
      : "Configuração",
    href: "/admin/integracoes/google-ads",
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
              <div
  className={`phanyx-marketing-card rounded-2xl p-4 shadow-sm transition hover:border-blue-500 hover:shadow-md ${
    cardAtual.titulo === "Reputação IA"
      ? "border-cyan-200 shadow-cyan-100/50"
      : ""
  }`}
>
                <div className="flex items-center justify-between">
                  <div className="text-2xl">{cardAtual.emoji}</div>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
  cardAtual.status === "Conectado"
    ? "bg-green-100 text-green-700"
    : cardAtual.status === "Configuração"
    ? "bg-blue-100 text-blue-700"
    : cardAtual.status === "Ativo"
    ? "bg-cyan-100 text-cyan-700"
    : "bg-slate-100 text-slate-500"
}`}
                  >
                    {traduzirStatus(cardAtual.status)}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-black text-slate-900">
                  {tituloCanal(cardAtual.titulo)}
                </h3>

                <p className="mt-2 text-xs font-semibold text-blue-600">
                  {bloqueado
                    ? t("actions.comingSoon")
                    : t("actions.open")}
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