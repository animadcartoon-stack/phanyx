"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type IndicadoresBiblioteca = {
  totalItens: number;
  itensPublicados: number;
  itensRascunho: number;
  arquivosDisponiveis: number;
  emprestimosAtivos: number;
  emprestimosAtrasados: number;
  reservasAguardando: number;
  avaliacoesPendentes: number;
  recomendacoesPublicadas: number;
};

type ItemRecente = {
  id: number;
  titulo: string;
  tipo: string;
  status: string;
  capaUrl: string | null;
  criadoEm: string;
};

type DadosDashboard = {
  biblioteca: {
    nome: string;
    plano: string;
    statusModulo: string;
  };
  indicadores: IndicadoresBiblioteca;
  armazenamento: {
    contratadoBytes: string;
    extraBytes: string;
    limiteBytes: string;
    utilizadoBytes: string;
    disponivelBytes: string;
  };
  itensRecentes: ItemRecente[];
};

type ErroApi = {
  error?: string;
  codigo?: string;
};

function formatarBytes(valor: string, locale: string) {
  const bytes = Number(valor || 0);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const unidades = ["B", "KB", "MB", "GB", "TB"];
  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    unidades.length - 1
  );
  const resultado = bytes / Math.pow(1024, indice);

  return `${resultado.toLocaleString(locale, {
    minimumFractionDigits: indice === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} ${unidades[indice]}`;
}

function formatarData(valor: string, locale: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function classeStatus(status: string) {
  switch (status) {
    case "PUBLICADO":
      return "library-status library-status-success";
    case "EM_REVISAO":
      return "library-status library-status-warning";
    case "ARQUIVADO":
    case "INDISPONIVEL":
      return "library-status library-status-neutral";
    case "RESTRITO":
      return "library-status library-status-violet";
    default:
      return "library-status library-status-info";
  }
}

function classeStatusModulo(status: string) {
  switch (status) {
    case "ATIVO":
    case "ATIVA":
      return "library-status library-status-success";
    case "PENDENTE":
      return "library-status library-status-warning";
    case "BLOQUEADO":
    case "BLOQUEADA":
    case "CANCELADO":
    case "CANCELADA":
    case "INATIVO":
    case "INATIVA":
      return "library-status library-status-neutral";
    default:
      return "library-status library-status-info";
  }
}

function CardIndicador({
  titulo,
  valor,
  icone,
  locale,
  alerta = false,
}: {
  titulo: string;
  valor: number;
  icone: string;
  locale: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`library-card rounded-2xl border p-5 shadow-sm transition ${
        alerta && valor > 0 ? "library-card-alert" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="library-muted text-sm font-medium">{titulo}</p>
          <p
            className={`mt-2 text-3xl font-bold ${
              alerta && valor > 0 ? "library-alert-text" : "library-text"
            }`}
          >
            {valor.toLocaleString(locale)}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="library-soft rounded-xl p-2 text-xl"
        >
          {icone}
        </span>
      </div>
    </div>
  );
}

function CarregandoDashboard({ label }: { label: string }) {
  return (
    <div className="space-y-6" aria-label={label} role="status">
      <div className="library-skeleton h-28 animate-pulse rounded-2xl" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, indice) => (
          <div
            key={indice}
            className="library-skeleton h-32 animate-pulse rounded-2xl"
          />
        ))}
      </div>

      <div className="library-skeleton h-64 animate-pulse rounded-2xl" />
    </div>
  );
}

export default function BibliotecaDashboardPage() {
  const t = useTranslations("AdminLibraryDashboard");
  const locale = useLocale();

  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDashboard = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/admin/biblioteca/dashboard", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const corpo = (await resposta.json()) as DadosDashboard | ErroApi;

      if (!resposta.ok) {
        throw new Error(
          "error" in corpo && typeof corpo.error === "string"
            ? corpo.error
            : t("errors.load")
        );
      }

      setDados(corpo as DadosDashboard);
    } catch (error: unknown) {
      setDados(null);
      setErro(error instanceof Error ? error.message : t("errors.load"));
    } finally {
      setCarregando(false);
    }
  }, [t]);

  useEffect(() => {
    void carregarDashboard();
  }, [carregarDashboard]);

  function rotuloTipo(tipo: string) {
    switch (tipo) {
      case "LIVRO":
        return t("types.book");
      case "EBOOK":
        return t("types.ebook");
      case "ARTIGO_CIENTIFICO":
        return t("types.scientificArticle");
      case "REVISTA":
        return t("types.magazine");
      case "PERIODICO":
        return t("types.journal");
      case "APOSTILA":
        return t("types.handout");
      case "TCC":
        return t("types.finalPaper");
      case "MONOGRAFIA":
        return t("types.monograph");
      case "DISSERTACAO":
        return t("types.dissertation");
      case "TESE":
        return t("types.thesis");
      case "PESQUISA":
        return t("types.research");
      case "DOCUMENTO":
        return t("types.document");
      case "VIDEO":
        return t("types.video");
      case "DOCUMENTARIO":
        return t("types.documentary");
      case "AUDIO":
        return t("types.audio");
      case "AUDIOLIVRO":
        return t("types.audiobook");
      case "PODCAST":
        return t("types.podcast");
      case "LINK_EXTERNO":
        return t("types.externalLink");
      case "OUTRO":
        return t("types.other");
      default:
        return tipo;
    }
  }

  function rotuloStatus(status: string) {
    switch (status) {
      case "RASCUNHO":
        return t("itemStatus.draft");
      case "EM_REVISAO":
        return t("itemStatus.inReview");
      case "PUBLICADO":
        return t("itemStatus.published");
      case "RESTRITO":
        return t("itemStatus.restricted");
      case "INDISPONIVEL":
        return t("itemStatus.unavailable");
      case "ARQUIVADO":
        return t("itemStatus.archived");
      default:
        return status;
    }
  }

  function rotuloStatusModulo(status: string) {
    switch (status) {
      case "ATIVO":
      case "ATIVA":
        return t("moduleStatus.active");
      case "PENDENTE":
        return t("moduleStatus.pending");
      case "BLOQUEADO":
      case "BLOQUEADA":
        return t("moduleStatus.blocked");
      case "CANCELADO":
      case "CANCELADA":
        return t("moduleStatus.cancelled");
      case "INATIVO":
      case "INATIVA":
        return t("moduleStatus.inactive");
      default:
        return status;
    }
  }

  const estilos = (
    <style jsx global>{`
      .phanyx-library-dashboard-page {
        --lib-page: #f8fafc;
        --lib-card: #ffffff;
        --lib-soft: #f1f5f9;
        --lib-text: #0f172a;
        --lib-muted: #475569;
        --lib-subtle: #64748b;
        --lib-border: #e2e8f0;
        --lib-strong-border: #cbd5e1;
        --lib-skeleton: #e2e8f0;
        --lib-alert: #b91c1c;
        --lib-alert-border: #fca5a5;
        --lib-error-bg: #fef2f2;
        --lib-error-text: #991b1b;
        min-height: 100vh;
        background: var(--lib-page);
        color: var(--lib-text);
      }

      html[data-theme="dark"] .phanyx-library-dashboard-page {
        --lib-page: #020617;
        --lib-card: #0f172a;
        --lib-soft: #1e293b;
        --lib-text: #f8fafc;
        --lib-muted: #cbd5e1;
        --lib-subtle: #94a3b8;
        --lib-border: #334155;
        --lib-strong-border: #475569;
        --lib-skeleton: #1e293b;
        --lib-alert: #fca5a5;
        --lib-alert-border: #991b1b;
        --lib-error-bg: #450a0a;
        --lib-error-text: #fecaca;
        color-scheme: dark;
      }

      html[data-theme="system"] .phanyx-library-dashboard-page {
        --lib-page: #242424;
        --lib-card: #2d2d2d;
        --lib-soft: #383838;
        --lib-text: #ffffff;
        --lib-muted: #e5e7eb;
        --lib-subtle: #d1d5db;
        --lib-border: #505050;
        --lib-strong-border: #666666;
        --lib-skeleton: #3b3b3b;
        --lib-alert: #fecaca;
        --lib-alert-border: #a85555;
        --lib-error-bg: #4a2222;
        --lib-error-text: #fee2e2;
        color-scheme: dark;
      }

      .phanyx-library-dashboard-page .library-card {
        border-color: var(--lib-border);
        background: var(--lib-card);
      }

      .phanyx-library-dashboard-page .library-card-alert {
        border-color: var(--lib-alert-border);
      }

      .phanyx-library-dashboard-page .library-text {
        color: var(--lib-text);
        -webkit-text-fill-color: var(--lib-text);
      }

      .phanyx-library-dashboard-page .library-muted {
        color: var(--lib-muted);
        -webkit-text-fill-color: var(--lib-muted);
      }

      .phanyx-library-dashboard-page .library-subtle {
        color: var(--lib-subtle);
        -webkit-text-fill-color: var(--lib-subtle);
      }

      .phanyx-library-dashboard-page .library-alert-text {
        color: var(--lib-alert);
        -webkit-text-fill-color: var(--lib-alert);
      }

      .phanyx-library-dashboard-page .library-soft {
        background: var(--lib-soft);
      }

      .phanyx-library-dashboard-page .library-skeleton {
        background: var(--lib-skeleton);
      }

      .phanyx-library-dashboard-page .library-divider {
        border-color: var(--lib-border);
      }

      .phanyx-library-dashboard-page .library-divider > :not([hidden]) ~ :not([hidden]) {
        border-color: var(--lib-border);
      }

      .phanyx-library-dashboard-page .library-status {
        display: inline-flex;
        border: 1px solid;
        border-radius: 9999px;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .phanyx-library-dashboard-page .library-status-success {
        border-color: #86efac;
        background: #f0fdf4;
        color: #166534;
        -webkit-text-fill-color: #166534;
      }

      .phanyx-library-dashboard-page .library-status-warning {
        border-color: #fde68a;
        background: #fffbeb;
        color: #92400e;
        -webkit-text-fill-color: #92400e;
      }

      .phanyx-library-dashboard-page .library-status-neutral {
        border-color: var(--lib-strong-border);
        background: var(--lib-soft);
        color: var(--lib-muted);
        -webkit-text-fill-color: var(--lib-muted);
      }

      .phanyx-library-dashboard-page .library-status-violet {
        border-color: #c4b5fd;
        background: #f5f3ff;
        color: #6d28d9;
        -webkit-text-fill-color: #6d28d9;
      }

      .phanyx-library-dashboard-page .library-status-info {
        border-color: #bae6fd;
        background: #f0f9ff;
        color: #0369a1;
        -webkit-text-fill-color: #0369a1;
      }

      html[data-theme="dark"] .phanyx-library-dashboard-page .library-status-success,
      html[data-theme="system"] .phanyx-library-dashboard-page .library-status-success {
        border-color: #15803d;
        background: #052e16;
        color: #bbf7d0;
        -webkit-text-fill-color: #bbf7d0;
      }

      html[data-theme="dark"] .phanyx-library-dashboard-page .library-status-warning,
      html[data-theme="system"] .phanyx-library-dashboard-page .library-status-warning {
        border-color: #92400e;
        background: #422006;
        color: #fde68a;
        -webkit-text-fill-color: #fde68a;
      }

      html[data-theme="dark"] .phanyx-library-dashboard-page .library-status-violet,
      html[data-theme="system"] .phanyx-library-dashboard-page .library-status-violet {
        border-color: #6d28d9;
        background: #2e1065;
        color: #ddd6fe;
        -webkit-text-fill-color: #ddd6fe;
      }

      html[data-theme="dark"] .phanyx-library-dashboard-page .library-status-info,
      html[data-theme="system"] .phanyx-library-dashboard-page .library-status-info {
        border-color: #0369a1;
        background: #082f49;
        color: #bae6fd;
        -webkit-text-fill-color: #bae6fd;
      }

      .phanyx-library-dashboard-page .library-error-card {
        border-color: var(--lib-alert-border);
        background: var(--lib-error-bg);
        color: var(--lib-error-text);
      }
    `}</style>
  );

  if (carregando) {
    return (
      <main className="phanyx-library-dashboard-page p-4 sm:p-6">
        {estilos}
        <CarregandoDashboard label={t("loadingAria")} />
      </main>
    );
  }

  if (erro || !dados) {
    return (
      <main className="phanyx-library-dashboard-page p-4 sm:p-6">
        {estilos}
        <section className="library-error-card mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span
              className="library-soft rounded-xl p-3 text-2xl"
              aria-hidden="true"
            >
              🔒
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold">{t("errors.unavailableTitle")}</h1>
              <p className="mt-2 text-sm leading-6" role="alert">
                {erro || t("errors.noAccess")}
              </p>
              <button
                type="button"
                onClick={() => void carregarDashboard()}
                className="mt-5 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
              >
                {t("retry")}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const limite = Number(dados.armazenamento.limiteBytes) || 0;
  const utilizado = Number(dados.armazenamento.utilizadoBytes) || 0;
  const percentualArmazenamento =
    limite > 0
      ? Math.min(100, Math.max(0, (utilizado / limite) * 100))
      : 0;
  const indicadores = dados.indicadores;

  return (
    <main className="phanyx-library-dashboard-page p-4 sm:p-6">
      {estilos}
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="library-card rounded-2xl border p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="library-text text-2xl font-bold tracking-tight sm:text-3xl">
                  📚 {dados.biblioteca.nome}
                </h1>
                <span className={classeStatusModulo(dados.biblioteca.statusModulo)}>
                  {rotuloStatusModulo(dados.biblioteca.statusModulo)}
                </span>
              </div>

              <p className="library-muted mt-2 max-w-3xl text-sm leading-6">
                {t("description")}
              </p>
              <p className="library-subtle mt-2 text-xs font-semibold uppercase tracking-wide">
                {t("libraryPlan", { plan: dados.biblioteca.plano })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void carregarDashboard()}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              {t("refreshDashboard")}
            </button>
          </div>
        </header>

        <section aria-labelledby="indicadores-biblioteca" className="space-y-4">
          <h2 id="indicadores-biblioteca" className="library-text text-lg font-bold">
            {t("overview")}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardIndicador titulo={t("indicators.collectionItems")} valor={indicadores.totalItens} icone="📚" locale={locale} />
            <CardIndicador titulo={t("indicators.publishedItems")} valor={indicadores.itensPublicados} icone="✅" locale={locale} />
            <CardIndicador titulo={t("indicators.availableFiles")} valor={indicadores.arquivosDisponiveis} icone="📄" locale={locale} />
            <CardIndicador titulo={t("indicators.activeLoans")} valor={indicadores.emprestimosAtivos} icone="🤝" locale={locale} />
            <CardIndicador titulo={t("indicators.overdueLoans")} valor={indicadores.emprestimosAtrasados} icone="⏰" locale={locale} alerta />
            <CardIndicador titulo={t("indicators.waitingReservations")} valor={indicadores.reservasAguardando} icone="🕒" locale={locale} />
            <CardIndicador titulo={t("indicators.pendingReviews")} valor={indicadores.avaliacoesPendentes} icone="⭐" locale={locale} />
            <CardIndicador titulo={t("indicators.activeRecommendations")} valor={indicadores.recomendacoesPublicadas} icone="🎓" locale={locale} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="library-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="library-divider border-b px-5 py-4">
              <h2 className="library-text text-lg font-bold">{t("recent.title")}</h2>
              <p className="library-muted mt-1 text-sm">{t("recent.description")}</p>
            </div>

            {dados.itensRecentes.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="text-4xl" aria-hidden="true">📖</div>
                <p className="library-text mt-3 font-semibold">{t("recent.emptyTitle")}</p>
                <p className="library-subtle mt-1 text-sm">{t("recent.emptyDescription")}</p>
              </div>
            ) : (
              <div className="library-divider divide-y">
                {dados.itensRecentes.map((item) => (
                  <article key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="library-soft library-divider flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-xl">
                      {item.capaUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.capaUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span aria-hidden="true">📘</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="library-text truncate font-semibold">{item.titulo}</h3>
                      <div className="library-subtle mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span>{rotuloTipo(item.tipo)}</span>
                        <span aria-hidden="true">•</span>
                        <span>{formatarData(item.criadoEm, locale)}</span>
                      </div>
                    </div>

                    <span className={classeStatus(item.status)}>
                      {rotuloStatus(item.status)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="library-card rounded-2xl border p-5 shadow-sm">
            <h2 className="library-text text-lg font-bold">{t("storage.title")}</h2>
            <p className="library-muted mt-1 text-sm">{t("storage.description")}</p>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <span className="library-text text-2xl font-bold">
                  {formatarBytes(dados.armazenamento.utilizadoBytes, locale)}
                </span>
                <span className="library-muted text-sm font-semibold">
                  {percentualArmazenamento.toLocaleString(locale, { maximumFractionDigits: 1 })}%
                </span>
              </div>

              <div className="library-skeleton mt-3 h-3 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentualArmazenamento >= 90
                      ? "bg-red-600"
                      : percentualArmazenamento >= 75
                        ? "bg-amber-500"
                        : "bg-emerald-600"
                  }`}
                  style={{ width: `${percentualArmazenamento}%` }}
                />
              </div>

              <p className="library-muted mt-3 text-sm">
                {t("storage.totalLimit")}: {" "}
                <strong className="library-text">
                  {formatarBytes(dados.armazenamento.limiteBytes, locale)}
                </strong>
              </p>
              <p className="library-muted mt-1 text-sm">
                {t("storage.available")}: {" "}
                <strong className="library-text">
                  {formatarBytes(dados.armazenamento.disponivelBytes, locale)}
                </strong>
              </p>
            </div>

            <div className="library-divider mt-6 border-t pt-5">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="library-muted">{t("storage.contracted")}</dt>
                  <dd className="library-text font-semibold">
                    {formatarBytes(dados.armazenamento.contratadoBytes, locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="library-muted">{t("storage.extraSpace")}</dt>
                  <dd className="library-text font-semibold">
                    {formatarBytes(dados.armazenamento.extraBytes, locale)}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}