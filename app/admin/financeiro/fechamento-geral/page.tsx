"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Movimento = {
  id: number;
  tipo: string;
  descricao?: string | null;
  valor: number;
  formaPagamento?: string | null;
  createdAt?: string;
};

type CaixaFechado = {
  id: number;
  saldoInicial: number;
  saldoSistema: number;
  saldoInformado?: number | null;
  diferenca: number;
  dataAbertura?: string;
  dataFechamento?: string | null;
  observacaoFechamento?: string | null;
  abertoPorId?: number | null;
  fechadoPorId?: number | null;
  movimentos: Movimento[];
};

type RespostaApi = {
  data: string;
  resumo: {
    totalCaixas: number;
    saldoSistema: number;
    saldoInformado: number;
    diferenca: number;
    dinheiro: number;
    pix: number;
    cartao: number;
    boleto: number;
    transferencia: number;
    outro: number;
  };
  caixas: CaixaFechado[];
};

type TourStep = {
  target: string;
  titleKey: string;
  highlightKey: string;
  descriptionKey: string;
  imagem: string;
};

const fechamentoTourSteps: TourStep[] = [
  {
    target: '[data-tour="fechamento-data"]',
    titleKey: "tour.steps.date.title",
    highlightKey: "tour.steps.date.highlight",
    descriptionKey: "tour.steps.date.description",
    imagem: "/images/financeiro.png",
  },
  {
    target: '[data-tour="fechamento-resumo"]',
    titleKey: "tour.steps.summary.title",
    highlightKey: "tour.steps.summary.highlight",
    descriptionKey: "tour.steps.summary.description",
    imagem: "/images/contador.png",
  },
  {
    target: '[data-tour="fechamento-formas"]',
    titleKey: "tour.steps.paymentMethods.title",
    highlightKey: "tour.steps.paymentMethods.highlight",
    descriptionKey: "tour.steps.paymentMethods.description",
    imagem: "/images/formas-de-pagamento.png",
  },
  {
    target: '[data-tour="fechamento-caixas"]',
    titleKey: "tour.steps.closedRegisters.title",
    highlightKey: "tour.steps.closedRegisters.highlight",
    descriptionKey: "tour.steps.closedRegisters.description",
    imagem: "/images/financeiro.png",
  },
];

function hojeInput() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function FechamentoTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("AdminFinanceClosing");
  const [stepAtual, setStepAtual] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = fechamentoTourSteps[stepAtual];

  useEffect(() => {
    if (!aberto || !step) return;

    function atualizar() {
      const el = document.querySelector(step.target);

      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setTimeout(() => {
        const rect = el.getBoundingClientRect();

        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 250);
    }

    atualizar();

    window.addEventListener("resize", atualizar);
    window.addEventListener("scroll", atualizar, true);

    return () => {
      window.removeEventListener("resize", atualizar);
      window.removeEventListener("scroll", atualizar, true);
    };
  }, [aberto, stepAtual, step]);

  useEffect(() => {
    if (!aberto) {
      setStepAtual(0);
      setTargetRect(null);
    }
  }, [aberto]);

  if (!aberto || !step) return null;

  const spotlight = targetRect
    ? {
        top: targetRect.top - 8,
        left: targetRect.left - 8,
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/70" />

      {spotlight && (
        <div
          className="absolute rounded-2xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)]"
          style={spotlight}
        />
      )}

      <div
        className="absolute w-[min(420px,calc(100vw-32px))] rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        style={{
          top: spotlight
            ? Math.max(
                16,
                Math.min(
                  spotlight.top + spotlight.height + 18,
                  window.innerHeight - 330
                )
              )
            : 180,
          left: spotlight
            ? Math.max(
                16,
                Math.min(spotlight.left, window.innerWidth - 460)
              )
            : Math.max(16, Math.min(360, window.innerWidth - 460)),
        }}
      >
        <div className="absolute -top-2 left-10 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />

        <div className="flex gap-4">
          <img
            src={step.imagem}
            alt=""
            className="h-24 w-24 object-contain"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
              {t("tour.label")}
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {t(step.titleKey)}
            </h3>

            <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
              {t(step.highlightKey)}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {t(step.descriptionKey)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t("tour.step", {
              current: stepAtual + 1,
              total: fechamentoTourSteps.length,
            })}
          </span>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {t("tour.close")}
            </button>

            {stepAtual > 0 && (
              <button
                type="button"
                onClick={() => setStepAtual((p) => p - 1)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {t("tour.previous")}
              </button>
            )}

            {stepAtual < fechamentoTourSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepAtual((p) => p + 1)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("tour.next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = "/admin/financeiro/relatorios";
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("tour.goToReports")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FechamentoGeralPage() {
  const t = useTranslations("AdminFinanceClosing");
  const locale = useLocale();

  const [dataFiltro, setDataFiltro] = useState(hojeInput());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<RespostaApi | null>(null);
  const [tourAberto, setTourAberto] = useState(false);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  }

  function formatarDataHora(valor: string | null | undefined) {
    if (!valor) return "-";

    return new Date(valor).toLocaleString(locale);
  }

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(
        `/api/admin/financeiro/fechamento-geral?data=${dataFiltro}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const texto = await res.text();
      const json = texto ? JSON.parse(texto) : null;

      if (!res.ok) {
        throw new Error(json?.error || t("errors.load"));
      }

      if (!json) {
        throw new Error(t("errors.emptyResponse"));
      }

      setDados(json);
    } catch (e: any) {
      setErro(e?.message || t("errors.load"));
      setDados(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [dataFiltro]);

  useEffect(() => {
    const continuar = sessionStorage.getItem("phanyx-continuar-tour");

    if (continuar === "fechamento-geral") {
      sessionStorage.removeItem("phanyx-continuar-tour");

      setTimeout(() => {
        setTourAberto(true);
      }, 600);
    }
  }, []);

  return (
    <div className="max-w-7xl space-y-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">
          📦 {t("page.title")}
        </h1>

        <button
          type="button"
          onClick={() => setTourAberto(true)}
          className="mt-3 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          ✨ {t("page.openTutorial")}
        </button>

        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {t("page.subtitle")}
        </p>
      </div>

      <div
        data-tour="fechamento-data"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("page.date")}
        </label>

        <input
          type="date"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
          className="mt-1 block rounded-lg border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        />
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("page.loading")}
        </div>
      ) : !dados ? null : (
        <>
          <div
            data-tour="fechamento-resumo"
            className="grid grid-cols-1 gap-4 md:grid-cols-4"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("summary.closedRegisters")}
              </p>
              <p className="text-2xl font-bold">{dados.resumo.totalCaixas}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("summary.systemBalance")}
              </p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.saldoSistema)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("summary.reportedBalance")}
              </p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.saldoInformado)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("summary.totalDifference")}
              </p>
              <p className="text-2xl font-bold">
                {formatarMoeda(dados.resumo.diferenca)}
              </p>
            </div>
          </div>

          <div
            data-tour="fechamento-formas"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold">
              {t("paymentSummary.title")}
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {[
                ["cash", dados.resumo.dinheiro],
                ["pix", dados.resumo.pix],
                ["card", dados.resumo.cartao],
                ["boleto", dados.resumo.boleto],
                ["transfer", dados.resumo.transferencia],
                ["other", dados.resumo.outro],
              ].map(([key, value]) => (
                <div
                  key={String(key)}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(`paymentSummary.${String(key)}`)}
                  </p>
                  <p className="text-xl font-bold">
                    {formatarMoeda(Number(value || 0))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            data-tour="fechamento-caixas"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold">
              {t("closedRegisters.title")}
            </h2>

            {dados.caixas.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {t("closedRegisters.empty")}
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {dados.caixas.map((caixa) => (
                  <div
                    key={caixa.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">
                          {t("closedRegisters.register")}
                        </p>
                        <p className="font-semibold">#{caixa.id}</p>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400">
                          {t("closedRegisters.systemBalance")}
                        </p>
                        <p className="font-semibold">
                          {formatarMoeda(Number(caixa.saldoSistema || 0))}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400">
                          {t("closedRegisters.reportedBalance")}
                        </p>
                        <p className="font-semibold">
                          {formatarMoeda(Number(caixa.saldoInformado || 0))}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400">
                          {t("closedRegisters.difference")}
                        </p>
                        <p className="font-semibold">
                          {formatarMoeda(Number(caixa.diferenca || 0))}
                        </p>
                      </div>
                    </div>

                    {caixa.observacaoFechamento && (
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        <strong>{t("closedRegisters.note")}:</strong>{" "}
                        {caixa.observacaoFechamento}
                      </p>
                    )}

                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {t("closedRegisters.closedAt")}:{" "}
                      {formatarDataHora(caixa.dataFechamento)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <FechamentoTour
        aberto={tourAberto}
        onClose={() => setTourAberto(false)}
      />
    </div>
  );
}
