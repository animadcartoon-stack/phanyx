"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import IntegracoesTour from "@/components/admin/integracoes/IntegracoesTour";

const integracoes = [
  {
    titulo: "Google Analytics",
    descricao: "Acompanhe acessos, eventos e conversões do PHANYX.",
    href: "/admin/integracoes/google-analytics",
    emoji: "📊",
    badge: "Analytics",
  },
  {
    titulo: "Google Tag Manager",
    descricao: "Gerencie scripts, pixels e rastreamentos.",
    href: "/admin/integracoes/google-tag-manager",
    emoji: "🏷️",
    badge: "Tag Manager",
  },
  {
    titulo: "Google Search Console",
    descricao: "Indexação, sitemap e SEO técnico.",
    href: "/admin/integracoes/search-console",
    emoji: "🔎",
    badge: "SEO",
  },
  {
    titulo: "Google Ads",
    descricao: "Conversões, remarketing e campanhas.",
    href: "/admin/integracoes/google-ads",
    emoji: "💰",
    badge: "Ads",
  },
  {
    titulo: "Google Business",
    descricao: "Presença local, avaliações e mapa.",
    href: "/admin/integracoes/google-business",
    emoji: "📍",
    badge: "Local",
  },
];

export default function IntegracoesPage() {
  const [tourAberto, setTourAberto] = useState(false);

  useEffect(() => {
    const jaViu = localStorage.getItem("tour-integracoes-v1");

    if (!jaViu) {
      setTourAberto(true);
      localStorage.setItem("tour-integracoes-v1", "ok");
    }
  }, []);

  return (
    <>
      <div className="space-y-8 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              🔗 Integrações Google
            </h1>
            <p className="mt-2 text-slate-600">
              Configure SEO, analytics, conversões e presença digital.
            </p>
          </div>

          <button
            onClick={() => setTourAberto(true)}
            className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg hover:bg-blue-700"
          >
            ✨ Abrir tutorial guiado
          </button>
        </div>

        <div
          data-tour="cards-integracoes"
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {integracoes.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl">{item.emoji}</span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                  {item.badge}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900">
                {item.titulo}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.descricao}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <IntegracoesTour
        aberto={tourAberto}
        onClose={() => setTourAberto(false)}
      />
    </>
  );
}