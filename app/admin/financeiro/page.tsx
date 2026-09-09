"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type ResumoFinanceiro = {
  quantidadeLancamentos: number;
  totalLancado: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
  alunosInadimplentes: number;
};

type FinanceiroTourStepId =
  | "recebimentos"
  | "caixa"
  | "inadimplentes"
  | "fechamento"
  | "relatorios";

type FinanceiroTourStep = {
  id: FinanceiroTourStepId;
  selector: string;
  mascoteSrc: string;
};

const financeiroTourSteps: FinanceiroTourStep[] = [
  {
    id: "recebimentos",
    selector: '[data-tour="financeiro-recebimentos"]',
    mascoteSrc: "/images/financeiro.png",
  },
  {
    id: "caixa",
    selector: '[data-tour="financeiro-caixa"]',
    mascoteSrc: "/images/financeiro.png",
  },
  {
    id: "inadimplentes",
    selector: '[data-tour="financeiro-inadimplentes"]',
    mascoteSrc: "/images/calculadora.png",
  },
  {
    id: "fechamento",
    selector: '[data-tour="financeiro-fechamento"]',
    mascoteSrc: "/images/calculadora.png",
  },
  {
    id: "relatorios",
    selector: '[data-tour="financeiro-relatorios"]',
    mascoteSrc: "/images/relatorios.png",
  },
];

function getRectFromSelector(selector: string) {
  const elemento = document.querySelector(selector);
  if (!elemento) return null;

  const rect = elemento.getBoundingClientRect();

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function FinanceiroTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: (naoMostrarNovamente?: boolean) => void;
}) {
  const t = useTranslations("AdminFinance");
  const [stepIndex, setStepIndex] = useState(0);
  const [tourConcluido, setTourConcluido] = useState(false);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = financeiroTourSteps[stepIndex];

  const stepTexts: Record<
    FinanceiroTourStepId,
    {
      title: string;
      description: string;
      alt: string;
      highlight: string;
    }
  > = {
    recebimentos: {
      title: t("tour.steps.recebimentos.title"),
      description: t("tour.steps.recebimentos.description"),
      alt: t("tour.steps.recebimentos.alt"),
      highlight: t("tour.steps.recebimentos.highlight"),
    },
    caixa: {
      title: t("tour.steps.caixa.title"),
      description: t("tour.steps.caixa.description"),
      alt: t("tour.steps.caixa.alt"),
      highlight: t("tour.steps.caixa.highlight"),
    },
    inadimplentes: {
      title: t("tour.steps.inadimplentes.title"),
      description: t("tour.steps.inadimplentes.description"),
      alt: t("tour.steps.inadimplentes.alt"),
      highlight: t("tour.steps.inadimplentes.highlight"),
    },
    fechamento: {
      title: t("tour.steps.fechamento.title"),
      description: t("tour.steps.fechamento.description"),
      alt: t("tour.steps.fechamento.alt"),
      highlight: t("tour.steps.fechamento.highlight"),
    },
    relatorios: {
      title: t("tour.steps.relatorios.title"),
      description: t("tour.steps.relatorios.description"),
      alt: t("tour.steps.relatorios.alt"),
      highlight: t("tour.steps.relatorios.highlight"),
    },
  };

  const stepText = stepTexts[step.id];

  useEffect(() => {
    if (!aberto) return;

    function atualizarPosicao() {
      const rect = getRectFromSelector(step.selector);
      setTargetRect(rect);

      const elemento = document.querySelector(step.selector);
      if (elemento) {
        elemento.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }

    const timer = setTimeout(atualizarPosicao, 250);

    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
    };
  }, [aberto, step]);

  useEffect(() => {
    if (!aberto) {
      setStepIndex(0);
      setTargetRect(null);
      setTourConcluido(false);
    }
  }, [aberto]);

  if (!aberto) return null;

  const spotlightPadding = 8;

  const spotlight =
    !tourConcluido && targetRect
      ? {
          top: Math.max(targetRect.top - spotlightPadding, 8),
          left: Math.max(targetRect.left - spotlightPadding, 8),
          width: targetRect.width + spotlightPadding * 2,
          height: targetRect.height + spotlightPadding * 2,
        }
      : null;

  const bubbleWidth = 420;
  const bubbleHeight = 290;

  const bubbleStyle = spotlight
    ? (() => {
        let top = spotlight.top + spotlight.height + 18;
        let left = spotlight.left;

        top = Math.max(
          16,
          Math.min(top, window.innerHeight - bubbleHeight - 16)
        );

        left = Math.max(
          16,
          Math.min(left, window.innerWidth - bubbleWidth - 16)
        );

        return {
          top: `${top}px`,
          left: `${left}px`,
        };
      })()
    : {
        top: "120px",
        left: "50%",
        transform: "translateX(-50%)",
      };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/70" />

      {spotlight && (
        <div
          className="absolute rounded-2xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)] transition-all"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      <div
        className="absolute w-[min(420px,calc(100vw-32px))] rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-2xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-950"
        style={
          tourConcluido
            ? {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
            : bubbleStyle
        }
      >
        {!tourConcluido && (
          <div
            className="absolute h-3 w-3 rotate-45 border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
            style={{
              left: "40px",
              top: "-6px",
            }}
          />
        )}

        {!tourConcluido ? (
          <>
            <div className="flex items-start gap-4">
              <img
                src={step.mascoteSrc}
                alt={stepText.alt}
                className="h-32 w-32 shrink-0 object-contain drop-shadow-lg"
              />

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
                  {t("tour.label")}
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                  {stepText.title}
                </h3>

                <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                  {stepText.highlight}
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {stepText.description}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {t("tour.stepCounter", {
                  current: stepIndex + 1,
                  total: financeiroTourSteps.length,
                })}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  {t("tour.close")}
                </button>

                <button
                  type="button"
                  onClick={() => onClose(true)}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  {t("tour.hideForever")}
                </button>

                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIndex((prev) => prev - 1)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    {t("tour.previous")}
                  </button>
                )}

                {stepIndex < financeiroTourSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((prev) => prev + 1)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {t("tour.next")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTourConcluido(true)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {t("tour.finish")}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <img
              src="/images/formix-bemvindo.png"
              alt="Formix"
              className="mx-auto h-28 w-28 object-contain"
            />

            <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t("tour.completedTitle")}
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {t("tour.completedDescription")}
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(
                    "phanyx-continuar-tour",
                    "recebimentos"
                  );
                  onClose(false);
                  window.location.href =
                    "/admin/financeiro/recebimentos";
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                {t("tour.goToReceipts")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function hojeInput() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatarMoeda(
  valor: number,
  locale: string
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function primeiroDiaMes() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

export default function AdminFinanceiroPage() {
  const router = useRouter();
  const t = useTranslations("AdminFinance");
  const locale = useLocale();

  const [tourAberto, setTourAberto] = useState(false);

useEffect(() => {
  const abrirTour = () => {
    setTourAberto(true);
  };

  window.addEventListener("phanyx:abrir-tour-financeiro", abrirTour);

  try {
    const oculto = localStorage.getItem("phanyx_financeiro_tour_oculto_v1");

    if (oculto !== "true") {
      const timer = setTimeout(() => {
        setTourAberto(true);
      }, 600);

      return () => {
        clearTimeout(timer);
        window.removeEventListener(
          "phanyx:abrir-tour-financeiro",
          abrirTour
        );
      };
    }
  } catch {
    setTourAberto(true);
  }

  return () => {
    window.removeEventListener(
      "phanyx:abrir-tour-financeiro",
      abrirTour
    );
  };
}, []);

function fecharTourFinanceiro(naoMostrarNovamente?: boolean) {
  if (naoMostrarNovamente) {
    try {
      localStorage.setItem("phanyx_financeiro_tour_oculto_v1", "true");
    } catch {}
  }

  setTourAberto(false);
}

  const [loadingAtualizacao, setLoadingAtualizacao] = useState(false);
  const [loadingResumo, setLoadingResumo] = useState(true);
  const [loadingMensalidades, setLoadingMensalidades] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    quantidadeLancamentos: 0,
    totalLancado: 0,
    totalPago: 0,
    totalPendente: 0,
    totalAtrasado: 0,
    alunosInadimplentes: 0,
  });

  async function gerarMensalidades() {
    try {
      setLoadingMensalidades(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        "/api/admin/financeiro/lancamentos/gerar-mensalidades",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            mes: new Date().getMonth() + 1,
            ano: new Date().getFullYear(),
            diaVencimento: 10,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Finance monthly fees API error:",
          data?.error
        );
        throw new Error(
          t("errors.generateMonthlyFees")
        );
      }

      setMensagem(
        t("messages.generateSuccess")
      );
      await carregarResumo();
    } catch (err: any) {
      console.error(err);
      setErro(err?.message || t("errors.generateMonthlyFees"));
    } finally {
      setLoadingMensalidades(false);
    }
  }

  async function carregarResumo() {
  try {
    setLoadingResumo(true);
    setErro("");

      const inicio = primeiroDiaMes();
      const fim = hojeInput();

      const res = await fetch(
        `/api/admin/financeiro/relatorios?inicio=${inicio}&fim=${fim}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Finance summary API error:",
          data?.error
        );
        throw new Error(
          t("errors.loadSummary")
        );
      }

      setResumo(data.resumo);
setErro("");
    } catch (e: any) {
      setErro(e?.message || t("errors.loadSummary"));
    } finally {
      setLoadingResumo(false);
    }
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  async function atualizarStatusFinanceiro() {
    try {
      setLoadingAtualizacao(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        "/api/admin/financeiro/lancamentos/atualizar-status",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Finance status API error:",
          data?.error
        );
        throw new Error(
          t("errors.updateStatus")
        );
      }

      setMensagem(
        t("messages.updateSuccess", {
          count:
            data.resumo?.totalAlunosInadimplentes ??
            0,
        })
      );

      await carregarResumo();
    } catch (e: any) {
      setErro(e?.message || t("errors.updateStatus"));
    } finally {
      setLoadingAtualizacao(false);
    }
  }

  return (
    <div className="phanyx-financeiro-page max-w-7xl space-y-6 p-6 text-slate-900 dark:text-slate-100">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              💰 {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={gerarMensalidades}
              disabled={loadingMensalidades}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loadingMensalidades
                ? t("actions.generatingMonthlyFees")
                : t("actions.generateMonthlyFees")}
            </button>

            <button
              onClick={atualizarStatusFinanceiro}
              disabled={loadingAtualizacao}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loadingAtualizacao
                ? t("actions.updating")
                : t("actions.updateDelinquency")}
            </button>
          </div>
        </div>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: t("summary.received"),
            value: formatarMoeda(
              resumo.totalPago || 0,
              locale
            ),
          },
          {
            label: t("summary.totalPosted"),
            value: formatarMoeda(
              resumo.totalLancado || 0,
              locale
            ),
          },
          {
            label: t("summary.entries"),
            value: String(
              resumo.quantidadeLancamentos
            ),
          },
          {
            label: t("summary.pending"),
            value: formatarMoeda(
              resumo.totalPendente || 0,
              locale
            ),
          },
          {
            label: t("summary.overdue"),
            value: formatarMoeda(
              resumo.totalAtrasado || 0,
              locale
            ),
            danger: true,
          },
          {
            label: t(
              "summary.delinquentStudents"
            ),
            value: String(
              resumo.alunosInadimplentes
            ),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p
              className={[
                "mt-3 text-3xl font-bold",
                item.danger
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-slate-100",
              ].join(" ")}
            >
              {loadingResumo ? "..." : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("executive.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("executive.description")}
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("executive.generalStatus")}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {loadingResumo
                ? t("executive.loading")
                : resumo.totalAtrasado > 0
                ? t("executive.overdueAttention")
                : t("executive.noRelevantOverdue")}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("executive.collection")}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {loadingResumo
                ? t("executive.loading")
                : t("executive.collectionValue", {
                    count:
                      resumo.alunosInadimplentes,
                  })}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("executive.volume")}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {loadingResumo
                ? t("executive.loading")
                : t("executive.volumeValue", {
                    amount: formatarMoeda(
                      resumo.totalLancado || 0,
                      locale
                    ),
                  })}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("executive.received")}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {loadingResumo
                ? t("executive.loading")
                : t("executive.receivedValue", {
                    amount: formatarMoeda(
                      resumo.totalPago || 0,
                      locale
                    ),
                  })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 xl:col-span-2">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("sections.operationsTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("sections.operationsDescription")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <button
              data-tour="financeiro-recebimentos"
              onClick={() =>
                router.push(
                  "/admin/financeiro/recebimentos"
                )
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-slate-900"
            >
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                💵 {t("cards.receiptsTitle")}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t("cards.receiptsDescription")}
              </p>
            </button>

            <button
              data-tour="financeiro-caixa"
              onClick={() =>
                router.push(
                  "/admin/financeiro/caixa"
                )
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-slate-900"
            >
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                🏦 {t("cards.cashTitle")}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t("cards.cashDescription")}
              </p>
            </button>

            <button
              onClick={() =>
                router.push(
                  "/admin/financeiro/taxas"
                )
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-slate-900"
            >
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                🧾 {t("cards.feesTitle")}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t("cards.feesDescription")}
              </p>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("sections.automaticTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("sections.automaticDescription")}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={gerarMensalidades}
              disabled={loadingMensalidades}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left transition hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900/70 dark:bg-blue-950/40 dark:hover:bg-blue-950/70"
            >
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {t("automatic.generateTitle")}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("automatic.generateDescription")}
              </div>
            </button>

            <button
              onClick={atualizarStatusFinanceiro}
              disabled={loadingAtualizacao}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/70 dark:bg-red-950/40 dark:hover:bg-red-950/70"
            >
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {t("automatic.updateTitle")}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("automatic.updateDescription")}
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("sections.controlTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("sections.controlDescription")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <button
            data-tour="financeiro-inadimplentes"
            onClick={() =>
              router.push(
                "/admin/financeiro/inadimplentes"
              )
            }
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-slate-900"
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              🚨 {t("cards.delinquentTitle")}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("cards.delinquentDescription")}
            </p>
          </button>

          <button
            onClick={() =>
              router.push(
                "/admin/financeiro/historico"
              )
            }
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-slate-900"
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              📝 {t("cards.historyTitle")}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("cards.historyDescription")}
            </p>
          </button>

          <button
            onClick={() =>
              router.push(
                "/admin/financeiro/configuracoes"
              )
            }
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-slate-900"
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              ⚙️ {t("cards.settingsTitle")}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("cards.settingsDescription")}
            </p>
          </button>

          <button
            data-tour="financeiro-fechamento"
            onClick={() =>
              router.push(
                "/admin/financeiro/fechamento-geral"
              )
            }
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-slate-900"
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              📦 {t("cards.closingTitle")}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("cards.closingDescription")}
            </p>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("sections.reportsTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("sections.reportsDescription")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button
            data-tour="financeiro-relatorios"
            onClick={() =>
              router.push(
                "/admin/financeiro/relatorios"
              )
            }
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-slate-900"
          >
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              📊 {t("cards.reportsTitle")}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("cards.reportsDescription")}
            </p>
          </button>
        </div>
      </div>

      <FinanceiroTour
        aberto={tourAberto}
        onClose={fecharTourFinanceiro}
      />
    </div>
  );
}