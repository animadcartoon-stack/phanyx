"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Tema = "light" | "dark" | "system";
type ModoTema = "light" | "dark" | "system-dark";

const STATUS_MODULO = {
  DISPONIVEL: "available",
  INTEGRADO: "integrated",
} as const;

type StatusModuloComercial = keyof typeof STATUS_MODULO;

type ModuloComercial = {
  icone: string;
  chave: string;
  status: StatusModuloComercial;
  href?: string;
};

type ResumoComercial = {
  leadsAtivos: number;
  vendasPeriodo: number;
  metasAtingidas: number;
  metasTotal: number;
  comissoesPendentesQuantidade: number;
  comissoesPendentesValor: number;
  periodo: {
    mes: number;
    ano: number;
  };
};

const RESUMO_INICIAL: ResumoComercial = {
  leadsAtivos: 0,
  vendasPeriodo: 0,
  metasAtingidas: 0,
  metasTotal: 0,
  comissoesPendentesQuantidade: 0,
  comissoesPendentesValor: 0,
  periodo: {
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
  },
};

const MODULOS_COMERCIAIS: ModuloComercial[] = [
  {
    icone: "🎯",
    chave: "leads",
    status: "DISPONIVEL",
    href: "/admin/leads",
  },
  {
    icone: "🧑‍💼",
    chave: "salespeople",
    status: "INTEGRADO",
    href: "/admin/funcionarios",
  },
  {
    icone: "👥",
    chave: "teams",
    status: "DISPONIVEL",
    href: "/admin/comercial/equipes",
  },
  {
    icone: "📈",
    chave: "goals",
    status: "DISPONIVEL",
    href: "/admin/comercial/metas",
  },
  {
    icone: "📝",
    chave: "salesEnrollments",
    status: "INTEGRADO",
    href: "/admin/matriculas",
  },
  {
    icone: "💰",
    chave: "commissions",
    status: "DISPONIVEL",
    href: "/admin/comercial/configuracoes",
  },
  {
    icone: "📊",
    chave: "reports",
    status: "DISPONIVEL",
    href: "/admin/comercial/relatorios",
  },
];

function useModoTema(): ModoTema {
  const [modoTema, setModoTema] =
    useState<ModoTema>("light");

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    function atualizarTema() {
      const escolha = (
        localStorage.getItem("phanyx_tema") ||
        document.documentElement.dataset.themeChoice ||
        "system"
      ) as Tema;

      if (escolha === "dark") {
        setModoTema("dark");
        return;
      }

      if (escolha === "system" && media.matches) {
        setModoTema("system-dark");
        return;
      }

      setModoTema("light");
    }

    atualizarTema();

    window.addEventListener("storage", atualizarTema);
    window.addEventListener(
      "phanyx-theme-change",
      atualizarTema as EventListener
    );
    media.addEventListener("change", atualizarTema);

    const observador = new MutationObserver(atualizarTema);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-theme",
        "data-theme-choice",
        "class",
      ],
    });

    return () => {
      window.removeEventListener("storage", atualizarTema);
      window.removeEventListener(
        "phanyx-theme-change",
        atualizarTema as EventListener
      );
      media.removeEventListener("change", atualizarTema);
      observador.disconnect();
    };
  }, []);

  return modoTema;
}

export default function ComercialPage() {
  const t = useTranslations("AdminCommercialOverview");
  const locale = useLocale();
  const modoTema = useModoTema();

  const [resumo, setResumo] =
    useState<ResumoComercial>(RESUMO_INICIAL);

  const [carregandoResumo, setCarregandoResumo] =
    useState(true);

  const [erroResumo, setErroResumo] =
    useState("");

  const c = useMemo(() => {
    if (modoTema === "dark") {
      return {
        pagina: "text-blue-50",
        kicker: "text-blue-300",
        titulo: "text-white",
        texto: "text-blue-100/80",
        muted: "text-blue-200/60",
        card: "border-blue-900 bg-blue-950/55",
        cardSoft: "border-blue-900 bg-blue-950/35",
        statusAvailable:
          "border-emerald-700 bg-emerald-950/55 text-emerald-200",
        statusIntegrated:
          "border-amber-700 bg-amber-950/55 text-amber-200",
        notice:
          "border-amber-800 bg-amber-950/45 text-amber-100",
        integration:
          "border-blue-800 bg-blue-950/45 text-blue-100",
      };
    }

    if (modoTema === "system-dark") {
      return {
        pagina: "text-neutral-100",
        kicker: "text-neutral-300",
        titulo: "text-white",
        texto: "text-neutral-300",
        muted: "text-neutral-400",
        card: "border-neutral-700 bg-neutral-900",
        cardSoft: "border-neutral-700 bg-neutral-800/70",
        statusAvailable:
          "border-emerald-700 bg-emerald-950/45 text-emerald-200",
        statusIntegrated:
          "border-amber-700 bg-amber-950/40 text-amber-200",
        notice:
          "border-amber-800 bg-amber-950/35 text-amber-100",
        integration:
          "border-neutral-700 bg-neutral-900 text-neutral-200",
      };
    }

    return {
      pagina: "text-slate-900",
      kicker: "text-blue-700",
      titulo: "text-slate-950",
      texto: "text-slate-600",
      muted: "text-slate-500",
      card: "border-slate-200 bg-white",
      cardSoft: "border-slate-200 bg-slate-50",
      statusAvailable:
        "border-emerald-700 bg-emerald-100 text-emerald-950",
      statusIntegrated:
        "border-amber-700 bg-amber-100 text-amber-950",
      notice:
        "border-amber-300 bg-amber-50 text-amber-900",
      integration:
        "border-blue-200 bg-blue-50 text-blue-950",
    };
  }, [modoTema]);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  }

  useEffect(() => {
    let ativo = true;

    async function carregarResumo() {
      try {
        setCarregandoResumo(true);
        setErroResumo("");

        const resposta = await fetch(
          "/api/admin/comercial/resumo",
          {
            cache: "no-store",
          }
        );

        const json = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            json?.error ||
              t("errors.loadSummary")
          );
        }

        if (!ativo) {
          return;
        }

        setResumo({
          ...RESUMO_INICIAL,
          ...json,
          periodo: {
            ...RESUMO_INICIAL.periodo,
            ...(json?.periodo || {}),
          },
        });
      } catch (error: unknown) {
        if (!ativo) {
          return;
        }

        setErroResumo(
          error instanceof Error
            ? error.message
            : t("errors.loadSummary")
        );
      } finally {
        if (ativo) {
          setCarregandoResumo(false);
        }
      }
    }

    void carregarResumo();

    return () => {
      ativo = false;
    };
  }, [t]);

  return (
    <main
      className={`phanyx-comercial-page mx-auto w-full max-w-7xl space-y-7 p-6 lg:p-8 ${c.pagina}`}
    >
      <header>
        <p
          className={`text-xs font-black uppercase tracking-[0.24em] ${c.kicker}`}
        >
          {t("header.kicker")}
        </p>

        <h1
          className={`mt-2 text-3xl font-black ${c.titulo}`}
        >
          📈 {t("header.title")}
        </h1>

        <p
          className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
        >
          {t("header.description")}
        </p>
      </header>

      {erroResumo && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${c.notice}`}
        >
          {erroResumo}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
          >
            {t("metrics.activeLeads.title")}
          </p>

          <p
            className={`mt-3 text-3xl font-black ${c.titulo}`}
          >
            {carregandoResumo
              ? "..."
              : resumo.leadsAtivos}
          </p>

          <p className={`mt-2 text-xs ${c.muted}`}>
            {t("metrics.activeLeads.description")}
          </p>
        </article>

        <article
          className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
          >
            {t("metrics.periodSales.title")}
          </p>

          <p
            className={`mt-3 text-3xl font-black ${c.titulo}`}
          >
            {carregandoResumo
              ? "..."
              : resumo.vendasPeriodo}
          </p>

          <p className={`mt-2 text-xs ${c.muted}`}>
            {t("metrics.periodSales.description")}
          </p>
        </article>

        <article
          className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
          >
            {t("metrics.goals.title")}
          </p>

          <p
            className={`mt-3 text-3xl font-black ${c.titulo}`}
          >
            {carregandoResumo
              ? "..."
              : resumo.metasAtingidas}
          </p>

          <p className={`mt-2 text-xs ${c.muted}`}>
            {resumo.metasTotal > 0
              ? t("metrics.goals.progress", {
                  achieved: resumo.metasAtingidas,
                  total: resumo.metasTotal,
                })
              : t("metrics.goals.none")}
          </p>
        </article>

        <article
          className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
          >
            {t("metrics.pendingCommissions.title")}
          </p>

          <p
            className={`mt-3 text-3xl font-black ${c.titulo}`}
          >
            {carregandoResumo
              ? "..."
              : formatarMoeda(
                  resumo.comissoesPendentesValor
                )}
          </p>

          <p className={`mt-2 text-xs ${c.muted}`}>
            {resumo.comissoesPendentesQuantidade > 0
              ? t(
                  "metrics.pendingCommissions.pending",
                  {
                    count:
                      resumo.comissoesPendentesQuantidade,
                  }
                )
              : t(
                  "metrics.pendingCommissions.none"
                )}
          </p>
        </article>
      </section>

      <section
        className={`rounded-3xl border p-6 shadow-sm ${c.card}`}
      >
        <div>
          <h2
            className={`text-xl font-black ${c.titulo}`}
          >
            {t("resources.title")}
          </h2>

          <p
            className={`mt-1 text-sm ${c.texto}`}
          >
            {t("resources.description")}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULOS_COMERCIAIS.map((modulo) => {
            const statusKey =
              STATUS_MODULO[modulo.status];

            const statusClasses =
              modulo.status === "DISPONIVEL"
                ? c.statusAvailable
                : c.statusIntegrated;

            return (
              <article
                key={modulo.chave}
                className={`flex min-h-[230px] flex-col rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${c.cardSoft}`}
              >
                <div
                  className="text-2xl"
                  aria-hidden="true"
                >
                  {modulo.icone}
                </div>

                <h3
                  className={`mt-4 text-base font-black ${c.titulo}`}
                >
                  {t(
                    `modules.${modulo.chave}.title`
                  )}
                </h3>

                <p
                  className={`mt-2 text-sm leading-6 ${c.texto}`}
                >
                  {t(
                    `modules.${modulo.chave}.description`
                  )}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses}`}
                  >
                    {t(`statuses.${statusKey}`)}
                  </span>

                  {modulo.href && (
                    <Link
                      href={modulo.href}
                      className="inline-flex min-h-9 items-center rounded-xl border border-blue-700 bg-blue-700 px-3 text-sm font-black text-white shadow-sm transition hover:border-blue-800 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    >
                      {t(
                        `modules.${modulo.chave}.action`
                      )}

                      <span
                        className="ml-1"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className={`rounded-3xl border p-6 ${c.integration}`}
      >
        <h2 className="text-base font-black">
          {t("hrIntegration.title")}
        </h2>

        <p className="mt-2 text-sm leading-6">
          {t("hrIntegration.description")}
        </p>
      </section>
    </main>
  );
}