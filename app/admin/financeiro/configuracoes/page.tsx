"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type ConfigFinanceira = {
  jurosPadrao: number;
  multaPadrao: number;
  descontoPadrao: number;
  diasTolerancia: number;
  bloquearAlunoInadimplente: boolean;
  quantidadeMensalidadesParaBloqueio: number;
  permitirPagamentoParcial: boolean;
};

const initialState: ConfigFinanceira = {
  jurosPadrao: 0,
  multaPadrao: 0,
  descontoPadrao: 0,
  diasTolerancia: 0,
  bloquearAlunoInadimplente: false,
  quantidadeMensalidadesParaBloqueio: 3,
  permitirPagamentoParcial: true,
};

type TipoMensagem = "success" | "error" | "";


type ConfiguracoesTourStep = {
  target: string;
  titulo: string;
  destaque: string;
  descricao: string;
  imagem: string;
};

function ConfiguracoesFinanceirasTour({
  steps,
  onClose,
}: {
  steps: ConfiguracoesTourStep[];
  onClose: () => void;
}) {
  const tUi = useTranslations("AdminFinanceSettings.tour.ui");

  const [stepAtual, setStepAtual] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = steps[stepAtual];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function atualizar() {
      const el = document.querySelector(
        step.target
      ) as HTMLElement | null;

      if (!el) {
        setTargetRect(null);
        return;
      }

      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      timer = setTimeout(() => {
        const rect = el.getBoundingClientRect();

        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 260);
    }

    atualizar();

    window.addEventListener("resize", atualizar);
    window.addEventListener("scroll", atualizar, true);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      window.removeEventListener("resize", atualizar);
      window.removeEventListener("scroll", atualizar, true);
    };
  }, [step.target]);

  if (!targetRect) {
    return null;
  }

  const margem = 16;
  const folga = 10;

  const spotlight = {
    top: Math.max(
      margem,
      targetRect.top - folga
    ),
    left: Math.max(
      margem,
      targetRect.left - folga
    ),
    width:
      targetRect.width +
      folga * 2,
    height:
      targetRect.height +
      folga * 2,
  };

  const larguraBalao = Math.min(
    420,
    window.innerWidth - 32
  );

  const centroAlvo =
    spotlight.left +
    spotlight.width / 2;

  const leftBalao = Math.max(
    margem,
    Math.min(
      centroAlvo -
        larguraBalao / 2,
      window.innerWidth -
        larguraBalao -
        margem
    )
  );

  const alturaEstimadaBalao = 310;
  const espacoAbaixo =
    window.innerHeight -
    (spotlight.top + spotlight.height);

  const balaoAcima =
    espacoAbaixo <
      alturaEstimadaBalao + 30 &&
    spotlight.top >
      alturaEstimadaBalao + 30;

  const topBalao = balaoAcima
    ? spotlight.top - 18
    : Math.min(
        spotlight.top +
          spotlight.height +
          18,
        window.innerHeight - 340
      );

  function anterior() {
    setStepAtual((atual) =>
      Math.max(0, atual - 1)
    );
  }

  function proximo() {
    if (
      stepAtual >=
      steps.length - 1
    ) {
      onClose();
      return;
    }

    setStepAtual(
      (atual) => atual + 1
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        className="absolute rounded-2xl border-2 border-blue-400"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          boxShadow:
            "0 0 0 9999px rgba(15, 23, 42, 0.82)",
        }}
      />

      <div
        className="pointer-events-auto absolute w-[420px] max-w-[calc(100vw-32px)] rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-slate-900 shadow-2xl"
        style={{
          top: topBalao,
          left: leftBalao,
          transform: balaoAcima
            ? "translateY(-100%)"
            : undefined,
        }}
      >
        {balaoAcima ? (
          <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b border-slate-200 bg-white" />
        ) : (
          <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 bg-white" />
        )}

        <div className="flex gap-4">
          <img
            src={step.imagem}
            alt=""
            className="h-24 w-24 shrink-0 object-contain drop-shadow-lg"
          />

          <div className="min-w-0 flex-1">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">
              {steps.length > 0 ? tUi("kicker") : ""}
            </div>

            <h2 className="text-xl font-bold leading-tight">
              {step.titulo}
            </h2>

            <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium leading-snug text-blue-700">
              {step.destaque}
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {step.descricao}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="text-xs text-slate-500">
            {tUi("step", { current: stepAtual + 1, total: steps.length })}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {tUi("close")}
            </button>

            {stepAtual > 0 && (
              <button
                type="button"
                onClick={anterior}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {tUi("previous")}
              </button>
            )}

            <button
              type="button"
              onClick={proximo}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              {stepAtual === steps.length - 1 ? tUi("finish") : tUi("next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracoesFinanceirasPage() {
  const t = useTranslations("AdminFinanceSettings");

  const [tourAberto, setTourAberto] =
    useState(false);

  const tourSteps: ConfiguracoesTourStep[] = [
    {
      target:
        '[data-tour="config-parametros"]',
      titulo: t(
        "tour.parameters.title"
      ),
      destaque: t(
        "tour.parameters.highlight"
      ),
      descricao: t(
        "tour.parameters.description"
      ),
      imagem:
        "/images/configuracao.png",
    },
    {
      target:
        '[data-tour="config-bloqueio"]',
      titulo: t(
        "tour.blocking.title"
      ),
      destaque: t(
        "tour.blocking.highlight"
      ),
      descricao: t(
        "tour.blocking.description"
      ),
      imagem:
        "/images/phanyx-bloqueado.png",
    },
    {
      target:
        '[data-tour="config-regra-bloqueio"]',
      titulo: t(
        "tour.blockRule.title"
      ),
      destaque: t(
        "tour.blockRule.highlight"
      ),
      descricao: t(
        "tour.blockRule.description"
      ),
      imagem:
        "/images/phanyx-bloqueado.png",
    },
    {
      target:
        '[data-tour="config-pagamento-parcial"]',
      titulo: t(
        "tour.partialPayment.title"
      ),
      destaque: t(
        "tour.partialPayment.highlight"
      ),
      descricao: t(
        "tour.partialPayment.description"
      ),
      imagem:
        "/images/formas-de-pagamento.png",
    },
    {
      target:
        '[data-tour="config-salvar"]',
      titulo: t(
        "tour.save.title"
      ),
      destaque: t(
        "tour.save.highlight"
      ),
      descricao: t(
        "tour.save.description"
      ),
      imagem:
        "/images/configuracao.png",
    },
  ];


  const [form, setForm] = useState<ConfigFinanceira>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setLoading(true);
      setMensagem("");
      setTipoMensagem("");

      const res = await fetch("/api/admin/financeiro/configuracoes", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("messages.loadError"));
      }

      setForm({
        jurosPadrao: Number(data.jurosPadrao || 0),
        multaPadrao: Number(data.multaPadrao || 0),
        descontoPadrao: Number(data.descontoPadrao || 0),
        diasTolerancia: Number(data.diasTolerancia || 0),
        bloquearAlunoInadimplente: Boolean(data.bloquearAlunoInadimplente),
        quantidadeMensalidadesParaBloqueio: Number(
          data.quantidadeMensalidadesParaBloqueio || 3
        ),
        permitirPagamentoParcial: Boolean(data.permitirPagamentoParcial),
      });
    } catch (error: any) {
      setMensagem(error.message || t("messages.loadError"));
      setTipoMensagem("error");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setMensagem("");
      setTipoMensagem("");

      const res = await fetch("/api/admin/financeiro/configuracoes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("messages.saveError"));
      }

      setMensagem(t("messages.saveSuccess"));
      setTipoMensagem("success");
    } catch (error: any) {
      setMensagem(error.message || t("messages.saveError"));
      setTipoMensagem("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("loading")}
      </div>
    );
  }

  const inputClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white";

  return (
    <div className="max-w-6xl space-y-6 p-6 text-slate-950 dark:text-slate-100">
      <div className="phanyx-financeiro-config-titulo">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </p>

        <button
          type="button"
          onClick={() =>
            setTourAberto(true)
          }
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span aria-hidden="true">&#10024;</span>
          {t("tour.open")}
        </button>
      </div>

      {mensagem && (
        <div
          className={[
            "rounded-xl border p-4 text-sm shadow-sm",
            tipoMensagem === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
          ].join(" ")}
        >
          {mensagem}
        </div>
      )}

      <form
        onSubmit={salvar}
        className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div
          data-tour="config-parametros"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.defaultInterest")}
            </label>

            <input
              type="number"
              step="0.01"
              value={form.jurosPadrao}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  jurosPadrao: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.defaultPenalty")}
            </label>

            <input
              type="number"
              step="0.01"
              value={form.multaPadrao}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  multaPadrao: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.defaultDiscount")}
            </label>

            <input
              type="number"
              step="0.01"
              value={form.descontoPadrao}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  descontoPadrao: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.graceDays")}
            </label>

            <input
              type="number"
              value={form.diasTolerancia}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  diasTolerancia: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label
            data-tour="config-bloqueio" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            <input
              type="checkbox"
              checked={form.bloquearAlunoInadimplente}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  bloquearAlunoInadimplente: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-blue-600"
            />

            <span className="text-sm">
              {t("fields.blockDelinquentStudent")}
            </span>
          </label>

          <label
            data-tour="config-pagamento-parcial" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            <input
              type="checkbox"
              checked={form.permitirPagamentoParcial}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  permitirPagamentoParcial: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-blue-600"
            />

            <span className="text-sm">
              {t("fields.allowPartialPayment")}
            </span>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div
            data-tour="config-regra-bloqueio">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("fields.blockAfterOverdueInstallments")}
            </label>

            <input
              type="number"
              min={1}
              value={form.quantidadeMensalidadesParaBloqueio}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  quantidadeMensalidadesParaBloqueio: Number(e.target.value),
                }))
              }
              className={inputClassName}
            />

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("fields.blockExample")}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
          <button
            data-tour="config-salvar"
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? t("actions.saving")
              : `💾 ${t("actions.save")}`}
          </button>
        </div>
      </form>

      {tourAberto && (
        <ConfiguracoesFinanceirasTour
          steps={tourSteps}
          onClose={() =>
            setTourAberto(false)
          }
        />
      )}
    </div>
  );
}
