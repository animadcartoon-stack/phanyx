

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type PlanoBiblioteca = {
  codigo: string;
  nome: string;
  descricao: string;
  valorMensal: number;
  armazenamentoGb: number;
  destaque: boolean;
  recursos: string[];
};

type ArmazenamentoModulo = {
  contratadoBytes: string;
  contratadoGb: number;
  extraBytes: string;
  extraGb: number;
  limiteBytes: string;
  limiteGb: number;
  utilizadoBytes: string;
  utilizadoGb: number;
  disponivelBytes: string;
  disponivelGb: number;
};

type ModuloBiblioteca = {
  id: number;
  plano: string;
  status: string;
  valorMensal: number;
  cortesia: boolean;
  armazenamento: ArmazenamentoModulo;
  inicioEm: string | null;
  testeGratisFimEm: string | null;
  proximaCobrancaEm: string | null;
  suspensoEm: string | null;
  canceladoEm: string | null;
  motivoSuspensao: string | null;
  motivoCancelamento: string | null;
  possuiAssinaturaAsaas: boolean;
};

type ContratacaoBiblioteca = {
  id: string;
  plano: string;
  status: string;
  valorMensal: number;
  armazenamentoGb?: number;
  checkoutUrl: string | null;
  checkoutExpiraEm: string | null;
  criadoEm: string;
};

type DadosContratacao = {
  ok: true;
  planos: PlanoBiblioteca[];
  modulo: ModuloBiblioteca | null;
  contratacaoAtual: ContratacaoBiblioteca | null;
  permissoes: {
    podeGerenciar: boolean;
    podeCancelar: boolean;
    impersonacao: boolean;
  };
};

type RespostaErro = {
  error?: string;
  codigo?: string;
  detalhe?: string;
};

type RespostaCriarContratacao = RespostaErro & {
  ok?: boolean;
  checkoutUrl?: unknown;
  checkout?: {
    url?: unknown;
  } | null;
  contratacao?: {
    checkoutUrl?: unknown;
  } | null;
};

const STATUS_MODULO_ATIVO = new Set([
  "ATIVO",
  "TESTE_GRATIS",
]);

const STATUS_CONTRATACAO_PENDENTE = new Set([
  "CRIADA",
  "AGUARDANDO_PAGAMENTO",
]);

function formatarMoeda(valor: number, locale: string) {
  return Number(valor || 0).toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor: string | null | undefined, locale: string) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function formatarPlano(codigo: string | null | undefined, locale: string) {
  if (!codigo) return "—";

  return codigo
    .replace(/^BIBLIOTECA_/, "")
    .replaceAll("_", " ")
    .toLocaleLowerCase(locale)
    .replace(/(^|\s)\p{L}/gu, (letra) =>
      letra.toLocaleUpperCase(locale)
    );
}

function classeStatus(status?: string | null) {
  switch (String(status || "").toUpperCase()) {
    case "ATIVO":
    case "PAGA":
      return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";

    case "TESTE_GRATIS":
      return "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200";

    case "CRIADA":
    case "PENDENTE":
    case "AGUARDANDO_PAGAMENTO":
      return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200";

    case "EM_ATRASO":
    case "SUSPENSO":
    case "FALHA":
      return "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200";

    default:
      return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function urlCheckoutValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !valor.trim()) {
    return false;
  }

  try {
    const url = new URL(valor);
    const hostname = url.hostname.toLocaleLowerCase("en-US");

    return (
      url.protocol === "https:" &&
      (hostname === "asaas.com" || hostname.endsWith(".asaas.com"))
    );
  } catch {
    return false;
  }
}

async function lerResposta(resposta: Response, mensagemInvalida: string) {
  const contentType = resposta.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(mensagemInvalida);
  }

  return resposta.json();
}

function CartaoPlano({
  plano,
  planoAtual,
  bloqueado,
  aoSelecionar,
  textos,
  locale,
  traduzirRecurso,
}: {
  plano: PlanoBiblioteca;
  planoAtual: boolean;
  bloqueado: boolean;
  aoSelecionar: (plano: PlanoBiblioteca) => void;
  textos: {
    featured: string;
    storageIncluded: (gb: number) => string;
    description: (gb: number) => string;
    perMonth: string;
    currentPlan: string;
    subscribe: string;
  };
  locale: string;
  traduzirRecurso: (recurso: string) => string;
}) {
  return (
    <article
      className={[
        "relative flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm transition dark:bg-slate-900",
        plano.destaque
          ? "border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-500"
          : "border-slate-200 dark:border-slate-800",
      ].join(" ")}
    >
      {plano.destaque ? (
        <span className="absolute right-5 top-5 rounded-full bg-emerald-700 px-3 py-1 text-xs font-black uppercase tracking-wide text-white dark:bg-emerald-600">
          {textos.featured}
        </span>
      ) : null}

      <div className="pr-24">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
          {textos.storageIncluded(plano.armazenamentoGb)}
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
          {plano.nome}
        </h2>
      </div>

      <p className="mt-4 min-h-16 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {textos.description(plano.armazenamentoGb)}
      </p>

      <div className="mt-5 flex items-end gap-2 border-y border-slate-200 py-5 dark:border-slate-800">
        <strong className="text-3xl font-black text-slate-950 dark:text-white">
          {formatarMoeda(plano.valorMensal, locale)}
        </strong>
        <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">
          {textos.perMonth}
        </span>
      </div>

      <ul className="mt-5 flex-1 space-y-3">
        {plano.recursos.map((recurso) => (
          <li
            key={recurso}
            className="flex gap-3 text-sm leading-5 text-slate-700 dark:text-slate-200"
          >
            <span className="font-black text-emerald-700 dark:text-emerald-300" aria-hidden="true">
              ✓
            </span>
            <span>{traduzirRecurso(recurso)}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={bloqueado || planoAtual}
        onClick={() => aoSelecionar(plano)}
        className={[
          "mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
          planoAtual
            ? "cursor-default border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
            : bloqueado
              ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
              : "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500",
        ].join(" ")}
      >
        {planoAtual ? textos.currentPlan : textos.subscribe}
      </button>
    </article>
  );
}

export default function BibliotecaContratacaoPage() {
  const t = useTranslations("AdminLibraryContracting");
  const locale = useLocale();
  const [dados, setDados] = useState<DadosContratacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [planoSelecionado, setPlanoSelecionado] =
    useState<PlanoBiblioteca | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/biblioteca/contratacao",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const corpo = (await lerResposta(resposta, t("errors.invalidApiResponse"))) as
        | DadosContratacao
        | RespostaErro;

      if (!resposta.ok || !("ok" in corpo)) {
        const mensagem =
          "error" in corpo && typeof corpo.error === "string"
            ? corpo.error
            : t("errors.loadPlans");

        throw new Error(
          mensagem
        );
      }

      setDados(corpo);
    } catch (error) {
      setDados(null);
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.loadPlans")
      );
    } finally {
      setCarregando(false);
    }
  }, [t]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const moduloAtivo = useMemo(
    () =>
      Boolean(
        dados?.modulo &&
          STATUS_MODULO_ATIVO.has(
            String(dados.modulo.status || "").toUpperCase()
          )
      ),
    [dados?.modulo]
  );

  const contratacaoPendente = useMemo(() => {
    const contratacao = dados?.contratacaoAtual;

    if (
      !contratacao ||
      !STATUS_CONTRATACAO_PENDENTE.has(
        String(contratacao.status || "").toUpperCase()
      )
    ) {
      return null;
    }

    return contratacao;
  }, [dados?.contratacaoAtual]);

  function rotuloStatus(status?: string | null) {
    switch (String(status || "").toUpperCase()) {
      case "ATIVO":
        return t("status.active");
      case "PAGA":
        return t("status.paid");
      case "TESTE_GRATIS":
        return t("status.freeTrial");
      case "CRIADA":
        return t("status.created");
      case "PENDENTE":
        return t("status.pending");
      case "AGUARDANDO_PAGAMENTO":
        return t("status.awaitingPayment");
      case "EM_ATRASO":
        return t("status.overdue");
      case "SUSPENSO":
        return t("status.suspended");
      case "FALHA":
        return t("status.failed");
      case "CANCELADO":
        return t("status.cancelled");
      default:
        return status ? status.replaceAll("_", " ") : t("status.unknown");
    }
  }

  function recursoTraduzido(recurso: string) {
    const normalizado = recurso
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");

    if (normalizado.includes("armazen")) return t("features.storage");
    if (normalizado.includes("relatorio")) return t("features.reports");
    if (normalizado.includes("emprest")) return t("features.loans");
    if (normalizado.includes("reserva")) return t("features.reservations");
    if (normalizado.includes("acervo")) return t("features.collection");
    if (normalizado.includes("suporte")) return t("features.support");
    if (normalizado.includes("usuario") || normalizado.includes("aluno")) {
      return t("features.users");
    }

    return recurso;
  }

  const estilos = (
    <style jsx global>{`
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page {
        background: #242424 !important;
        color: #ffffff !important;
        color-scheme: dark;
      }

      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .bg-white,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .dark\\:bg-slate-900 {
        background: #2d2d2d !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .bg-slate-50,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .dark\\:bg-slate-950 {
        background: #383838 !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .text-slate-950,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .text-slate-800,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .text-slate-700,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .dark\\:text-white,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .dark\\:text-slate-200 {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .text-slate-600,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .text-slate-500,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .dark\\:text-slate-300,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .dark\\:text-slate-400 {
        color: #d1d5db !important;
        -webkit-text-fill-color: #d1d5db !important;
      }

      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .border-slate-200,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .border-slate-300,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .dark\\:border-slate-700,
      html[data-theme="system"] .phanyx-biblioteca-contratacao-page .dark\\:border-slate-800 {
        border-color: #505050 !important;
      }
    `}</style>
  );

  function continuarPagamento(url: string | null) {
    if (!urlCheckoutValida(url)) {
      setErro(
        t("errors.checkoutUnavailable")
      );
      return;
    }

    window.location.assign(url);
  }

  async function confirmarContratacao() {
    if (!planoSelecionado || processando) return;

    try {
      setProcessando(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        "/api/admin/biblioteca/contratacao",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planoCodigo: planoSelecionado.codigo,
          }),
        }
      );

      const corpo = (await lerResposta(
        resposta,
        t("errors.invalidApiResponse")
      )) as RespostaCriarContratacao;

      if (!resposta.ok) {
        throw new Error(
          corpo?.error || t("errors.startSubscription")
        );
      }

      const checkoutUrl =
        corpo.checkoutUrl ||
        corpo.checkout?.url ||
        corpo.contratacao?.checkoutUrl ||
        null;

      setPlanoSelecionado(null);

      if (urlCheckoutValida(checkoutUrl)) {
        window.location.assign(checkoutUrl);
        return;
      }

      setSucesso(
        t("success.created")
      );

      await carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.startSubscription")
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <main className="phanyx-biblioteca-contratacao-page min-h-screen bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:p-6">
      {estilos}
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                {t("title")}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/biblioteca"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
              >
                {t("backToLibrary")}
              </Link>

              <button
                type="button"
                onClick={() => void carregarDados()}
                disabled={carregando || processando}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {t("refresh")}
              </button>
            </div>
          </div>
        </header>

        {erro ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
          >
            {erro}
          </div>
        ) : null}

        {sucesso ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
          >
            {sucesso}
          </div>
        ) : null}

        {carregando ? (
          <div className="grid gap-5 md:grid-cols-3" aria-label={t("loadingPlans")}>
            {Array.from({ length: 3 }).map((_, indice) => (
              <div
                key={indice}
                className="h-[520px] animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : !dados ? (
          <section className="rounded-3xl border border-red-300 bg-white p-8 text-center shadow-sm dark:border-red-800 dark:bg-slate-900">
            <div className="text-4xl" aria-hidden="true">
              ⚠️
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
              {t("errors.loadSubscriptionTitle")}
            </h2>
            <button
              type="button"
              onClick={() => void carregarDados()}
              className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {t("retry")}
            </button>
          </section>
        ) : (
          <>
            {dados.modulo ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-slate-950 dark:text-white">
                        {t("current.title")}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${classeStatus(
                          dados.modulo.status
                        )}`}
                      >
                        {rotuloStatus(dados.modulo.status)}
                      </span>
                      {dados.modulo.cortesia ? (
                        <span className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
                          {t("current.complimentary")}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {t("current.plan", { plan: formatarPlano(dados.modulo.plano, locale) })}
                    </p>

                    {dados.modulo.cortesia ? (
                      <p className="mt-2 text-sm font-semibold text-violet-800 dark:text-violet-200">
                        {t("current.complimentaryDescription")}
                      </p>
                    ) : null}

                    {dados.modulo.motivoSuspensao ? (
                      <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
                        {dados.modulo.motivoSuspensao}
                      </p>
                    ) : null}
                  </div>

                  {moduloAtivo ? (
                    <Link
                      href="/admin/biblioteca"
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      {t("current.accessLibrary")}
                    </Link>
                  ) : null}
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("current.storage")}
                    </dt>
                    <dd className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                      {dados.modulo.armazenamento.limiteGb.toLocaleString(locale)} GB
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("current.availableSpace")}
                    </dt>
                    <dd className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                      {dados.modulo.armazenamento.disponivelGb.toLocaleString(locale)} GB
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("current.monthlyPrice")}
                    </dt>
                    <dd className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                      {dados.modulo.cortesia
                        ? t("current.free")
                        : formatarMoeda(dados.modulo.valorMensal, locale)}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("current.nextCharge")}
                    </dt>
                    <dd className="mt-2 text-base font-black text-slate-950 dark:text-white">
                      {dados.modulo.cortesia
                        ? t("current.notApplicable")
                        : formatarData(dados.modulo.proximaCobrancaEm, locale)}
                    </dd>
                  </div>
                </dl>
              </section>
            ) : null}

            {contratacaoPendente ? (
              <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm dark:border-amber-800 dark:bg-amber-950/40">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-amber-950 dark:text-amber-100">
                        {t("pending.title")}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${classeStatus(
                          contratacaoPendente.status
                        )}`}
                      >
                        {rotuloStatus(contratacaoPendente.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-200">
                      {t("pending.summary", {
                        plan: formatarPlano(contratacaoPendente.plano, locale),
                        price: formatarMoeda(contratacaoPendente.valorMensal, locale),
                      })}
                    </p>

                    {contratacaoPendente.checkoutExpiraEm ? (
                      <p className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                        {t("pending.linkAvailableUntil", {
                          date: formatarData(contratacaoPendente.checkoutExpiraEm, locale),
                        })}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      continuarPagamento(contratacaoPendente.checkoutUrl)
                    }
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-950 dark:bg-amber-300 dark:text-amber-950 dark:hover:bg-amber-200"
                  >
                    {t("pending.continuePayment")}
                  </button>
                </div>
              </section>
            ) : null}

            <section aria-labelledby="planos-biblioteca" className="space-y-4">
              <div>
                <h2
                  id="planos-biblioteca"
                  className="text-2xl font-black text-slate-950 dark:text-white"
                >
                  {t("plans.title")}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t("plans.description")}
                </p>
              </div>

              <div className="grid items-stretch gap-5 lg:grid-cols-3">
                {dados.planos.map((plano) => {
                  const planoAtual =
                    moduloAtivo && dados.modulo?.plano === plano.codigo;

                  const bloqueado =
                    moduloAtivo ||
                    Boolean(contratacaoPendente) ||
                    !dados.permissoes.podeGerenciar ||
                    dados.permissoes.impersonacao;

                  return (
                    <CartaoPlano
                      key={plano.codigo}
                      plano={plano}
                      planoAtual={planoAtual}
                      bloqueado={bloqueado}
                      aoSelecionar={setPlanoSelecionado}
                      locale={locale}
                      traduzirRecurso={recursoTraduzido}
                      textos={{
                        featured: t("planCard.featured"),
                        storageIncluded: (gb) => t("planCard.storageIncluded", { gb }),
                        description: (gb) => t("planCard.description", { gb }),
                        perMonth: t("planCard.perMonth"),
                        currentPlan: t("planCard.currentPlan"),
                        subscribe: t("planCard.subscribe"),
                      }}
                    />
                  );
                })}
              </div>

              {!dados.permissoes.podeGerenciar ? (
                <p className="rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {t("permissions.viewOnly")}
                </p>
              ) : null}

              {dados.permissoes.impersonacao ? (
                <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                  {t("permissions.impersonationBlocked")}
                </p>
              ) : null}
            </section>
          </>
        )}
      </div>

      {planoSelecionado ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !processando) {
              setPlanoSelecionado(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmar-plano"
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              {t("modal.eyebrow")}
            </p>

            <h2 id="titulo-confirmar-plano" className="mt-2 text-2xl font-black">
              {planoSelecionado.nome}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("modal.description")}
            </p>

            <dl className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-600 dark:text-slate-300">
                  {t("modal.monthlyFee")}
                </dt>
                <dd className="font-black">
                  {formatarMoeda(planoSelecionado.valorMensal, locale)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-600 dark:text-slate-300">
                  {t("modal.storage")}
                </dt>
                <dd className="font-black">
                  {planoSelecionado.armazenamentoGb} GB
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-600 dark:text-slate-300">
                  {t("modal.renewal")}
                </dt>
                <dd className="font-black">{t("modal.monthly")}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={processando}
                onClick={() => setPlanoSelecionado(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
              >
                {t("modal.back")}
              </button>

              <button
                type="button"
                disabled={processando}
                onClick={() => void confirmarContratacao()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {processando ? t("modal.creatingCheckout") : t("modal.goToPayment")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
