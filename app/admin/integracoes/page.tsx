"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import IntegracoesTour from "@/components/admin/integracoes/IntegracoesTour";

export default function IntegracoesPage() {
  const t = useTranslations("AdminIntegracoes.home");
  const [tourAberto, setTourAberto] = useState(false);

  const integracoes = [
    {
      titulo: t("cards.growth.title"),
      descricao: t("cards.growth.description"),
      href: "/admin/integracoes/marketing",
      emoji: "\u{1F680}",
      badge: t("cards.growth.badge"),
    },
    {
      titulo: t("cards.analytics.title"),
      descricao: t("cards.analytics.description"),
      href: "/admin/integracoes/google-analytics",
      emoji: "\u{1F4CA}",
      badge: t("cards.analytics.badge"),
    },
    {
      titulo: t("cards.tagManager.title"),
      descricao: t("cards.tagManager.description"),
      href: "/admin/integracoes/google-tag-manager",
      emoji: "\u{1F3F7}\uFE0F",
      badge: t("cards.tagManager.badge"),
    },
    {
      titulo: t("cards.searchConsole.title"),
      descricao: t("cards.searchConsole.description"),
      href: "/admin/integracoes/search-console",
      emoji: "\u{1F50E}",
      badge: t("cards.searchConsole.badge"),
    },
    {
      titulo: t("cards.googleAds.title"),
      descricao: t("cards.googleAds.description"),
      href: "/admin/integracoes/google-ads",
      emoji: "\u{1F4B0}",
      badge: t("cards.googleAds.badge"),
    },
    {
      titulo: t("cards.googleBusiness.title"),
      descricao: t("cards.googleBusiness.description"),
      href: "/admin/integracoes/google-business",
      emoji: "\u{1F4CD}",
      badge: t("cards.googleBusiness.badge"),
    },
  ];

  useEffect(() => {
    const jaViu = localStorage.getItem("tour-integracoes-v1");

    if (!jaViu) {
      setTourAberto(true);
      localStorage.setItem("tour-integracoes-v1", "ok");
    }
  }, []);

  return (
    <>
      <div className="max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              {"\u{1F517}"} {t("title")}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {t("description")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTourAberto(true)}
            className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            {"\u2728"} {t("openTour")}
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
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl">{item.emoji}</span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {item.badge}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
                {item.titulo}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
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
