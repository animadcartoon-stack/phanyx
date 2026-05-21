import Link from "next/link";

const cards = [
  {
    titulo: "Google Analytics",
    descricao: "Visitantes, páginas acessadas e comportamento no site.",
    status: "Conectado",
    href: "/admin/integracoes/google-analytics",
    emoji: "📊",
  },
  {
    titulo: "Google Tag Manager",
    descricao: "Gerenciamento de scripts, pixels e rastreamentos.",
    status: "Conectado",
    href: "/admin/integracoes/google-tag-manager",
    emoji: "🏷️",
  },
  {
    titulo: "Google Ads",
    descricao: "Campanhas, conversões e anúncios pagos.",
    status: "Configuração",
    href: "/admin/integracoes/google-ads",
    emoji: "💰",
  },
  {
    titulo: "Search Console",
    descricao: "SEO, indexação, palavras-chave e cliques do Google.",
    status: "Configuração",
    href: "/admin/integracoes/search-console",
    emoji: "🔎",
  },
  {
    titulo: "Google Business",
    descricao: "Perfil local, avaliações, rotas, ligações e presença no Maps.",
    status: "Configuração",
    href: "/admin/integracoes/google-business",
    emoji: "📍",
  },
  {
    titulo: "Facebook / Instagram",
    descricao: "Meta Pixel, páginas sociais, anúncios e leads.",
    status: "Em breve",
    href: "#",
    emoji: "📘",
  },
  {
    titulo: "TikTok",
    descricao: "Pixel, campanhas, vídeos e alcance.",
    status: "Em breve",
    href: "#",
    emoji: "🎵",
  },
  {
    titulo: "LinkedIn",
    descricao: "Página institucional, B2B, cliques e seguidores.",
    status: "Em breve",
    href: "#",
    emoji: "💼",
  },
  {
    titulo: "YouTube",
    descricao: "Vídeos, inscritos, visualizações e retenção.",
    status: "Em breve",
    href: "#",
    emoji: "▶️",
  },
  {
    titulo: "WhatsApp Comercial",
    descricao: "Botão de contato, leads e mensagens iniciadas.",
    status: "Em breve",
    href: "#",
    emoji: "💬",
  },
  {
    titulo: "Reputação",
    descricao: "Avaliações, Reclame Aqui, Trustpilot e prova social.",
    status: "Em breve",
    href: "#",
    emoji: "⭐",
  },
];

export default function MarketingIntegracoesPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          PHANYX GROWTH
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Central de presença digital
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600">
          Acompanhe em um só lugar as integrações, canais, métricas e presença
          digital da instituição.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Integrações ativas
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">5</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Canais em preparação
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">6</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Módulo
          </p>
          <p className="mt-2 text-3xl font-black text-blue-600">Growth</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const bloqueado = card.href === "#";

          const conteudo = (
            <div className="h-full rounded-2xl border bg-white p-5 shadow-sm transition hover:border-blue-500">
              <div className="flex items-start justify-between gap-4">
                <div className="text-3xl">{card.emoji}</div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
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

              <h2 className="mt-4 text-lg font-black text-slate-900">
                {card.titulo}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {card.descricao}
              </p>

              <p className="mt-4 text-sm font-bold text-blue-600">
                {bloqueado ? "Em breve" : "Abrir configuração →"}
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
  );
}
