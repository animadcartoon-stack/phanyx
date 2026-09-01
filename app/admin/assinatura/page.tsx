"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type InstituicaoResumo = {
  id: number;
  nome: string;
  plano: string | null;
  statusAssinatura: string | null;
  isentaPagamento: boolean;
};

type AssinaturaPhanyx = {
  id: number;
  plano: string;
  status: string;
  testeGratisInicioEm: string;
  testeGratisFimEm: string;
  primeiraCobrancaEm: string | null;
  proximaCobrancaEm: string | null;
  asaasBillingType: string | null;
  asaasCycle: string | null;
  valorBase: number;
  valorPorAluno: number;
  valorPorPoloExtra: number;
  valorMensalAtual: number;
  alunosAtivosReferencia: number;
  polosReferencia: number;
  canceladaEm: string | null;
  motivoCancelamento: string | null;
  asaasSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
};

function classeStatus(status?: string | null) {
  const valor = String(status || "").toUpperCase();

  if (valor === "TESTE_GRATIS") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  }

  if (valor === "ATIVA") {
    return "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-200";
  }

  if (valor === "EM_ATRASO") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200";
  }

  if (valor === "CANCELADA") {
    return "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200";
  }

  return "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
}

export default function AdminAssinaturaPage() {
  const locale = useLocale();
  const t = useTranslations("AdminSubscription");

  const [instituicao, setInstituicao] = useState<InstituicaoResumo | null>(
    null
  );
  const [assinatura, setAssinatura] = useState<AssinaturaPhanyx | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  function formatarData(data?: string | null) {
    if (!data) return "-";

    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) return "-";

    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(valor);
  }

  function formatarValor(valor: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  }

  function rotuloCobranca(tipo?: string | null) {
    const valor = String(tipo || "").toUpperCase();

    if (valor === "CREDIT_CARD") return t("billingTypes.creditCard");
    if (valor === "BOLETO") return t("billingTypes.boleto");
    if (valor === "PIX") return t("billingTypes.pix");

    return tipo || "-";
  }

  function rotuloStatus(status?: string | null) {
    const valor = String(status || "").toUpperCase();

    if (valor === "TESTE_GRATIS") return t("statuses.freeTrial");
    if (valor === "ATIVA") return t("statuses.active");
    if (valor === "EM_ATRASO") return t("statuses.overdue");
    if (valor === "CANCELADA") return t("statuses.cancelled");

    return status ? status.replaceAll("_", " ") : "-";
  }

  function rotuloPlano(plano?: string | null) {
    const valor = String(plano || "").toUpperCase();

    if (valor === "ESSENCIAL") return t("plans.essential");
    if (valor === "PROFISSIONAL") return t("plans.professional");
    if (valor === "ENTERPRISE") return t("plans.enterprise");

    return plano || "-";
  }

  async function lerRespostaJson(res: Response, erroPadrao: string) {
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const texto = await res.text();
      console.error("Non-JSON subscription API response:", texto);
      throw new Error(erroPadrao);
    }

    return res.json();
  }

  async function carregarAssinatura() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/assinatura-phanyx", {
        cache: "no-store",
      });

      const json = await lerRespostaJson(res, t("errors.invalidResponse"));

      if (!res.ok) {
        console.error("Subscription API error:", json?.error);
        throw new Error(t("errors.load"));
      }

      setInstituicao(json.instituicao || null);
      setAssinatura(json.assinatura || null);
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : t("errors.load"));
    } finally {
      setLoading(false);
    }
  }

  async function confirmarCancelamento() {
    try {
      setCancelando(true);
      setErro("");
      setSucesso("");

      const res = await fetch("/api/admin/assinatura-phanyx/cancelar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          motivo,
        }),
      });

      const json = await lerRespostaJson(res, t("errors.invalidResponse"));

      if (!res.ok) {
        console.error("Subscription cancellation API error:", json?.error);
        throw new Error(t("errors.cancel"));
      }

      setSucesso(t("success.cancelled"));
      setModalAberto(false);
      setMotivo("");

      await carregarAssinatura();
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : t("errors.cancel"));
    } finally {
      setCancelando(false);
    }
  }

  useEffect(() => {
    carregarAssinatura();
    // The subscription is loaded once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const podeCancelar =
    assinatura &&
    assinatura.status !== "CANCELADA" &&
    Boolean(assinatura.asaasSubscriptionId) &&
    !instituicao?.isentaPagamento;

  const statusAtual = assinatura?.status || instituicao?.statusAssinatura;
  const planoAtual = assinatura?.plano || instituicao?.plano;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            {t("hero.eyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-black">{t("hero.title")}</h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300">
            {t("hero.description")}
          </p>
        </div>

        {erro ? (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-500/40 bg-red-50 p-4 text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {erro}
          </div>
        ) : null}

        {sucesso ? (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            {sucesso}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {t("feedback.loading")}
          </div>
        ) : !instituicao ? (
          <div className="rounded-3xl border border-red-500/40 bg-red-50 p-8 text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {t("feedback.institutionUnavailable")}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {t("institution.label")}
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {instituicao.nome}
                  </h2>

                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {t("institution.currentPlan")}{" "}
                    <strong className="text-slate-950 dark:text-white">
                      {rotuloPlano(planoAtual)}
                    </strong>
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${classeStatus(
                    statusAtual
                  )}`}
                >
                  {rotuloStatus(statusAtual)}
                </span>
              </div>

              {instituicao.isentaPagamento ? (
                <div className="mt-6 rounded-2xl border border-blue-500/40 bg-blue-50 p-4 text-sm font-medium leading-6 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                  {t("institution.exemptNotice")}
                </div>
              ) : !assinatura ? (
                <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  {t("institution.notFound")}
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                        {t("details.trialStart")}
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {formatarData(assinatura.testeGratisInicioEm)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                        {t("details.trialEnd")}
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {formatarData(assinatura.testeGratisFimEm)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                        {t("details.firstCharge")}
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {formatarData(assinatura.primeiraCobrancaEm)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                        {t("details.billingMethod")}
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {rotuloCobranca(assinatura.asaasBillingType)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-blue-500/40 bg-blue-50 p-5 text-sm font-medium leading-7 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                    <p className="font-black text-blue-950 dark:text-white">
                      {t("cancellation.howTitle")}
                    </p>

                    <p className="mt-2">{t("cancellation.howDescription")}</p>
                  </div>

                  {assinatura.status === "CANCELADA" ? (
                    <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-50 p-5 text-sm font-medium leading-7 text-red-800 dark:bg-red-950/40 dark:text-red-200">
                      <p className="font-black">
                        {t("cancellation.cancelledTitle")}
                      </p>
                      <p className="mt-2">
                        {t("cancellation.cancelledAt", {
                          date: formatarData(assinatura.canceladaEm),
                        })}
                      </p>
                      {assinatura.motivoCancelamento ? (
                        <p className="mt-2">
                          {t("cancellation.reason", {
                            reason: assinatura.motivoCancelamento,
                          })}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {podeCancelar ? (
                    <button
                      type="button"
                      onClick={() => setModalAberto(true)}
                      className="mt-6 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-900"
                    >
                      {t("cancellation.openButton")}
                    </button>
                  ) : null}
                </>
              )}
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
                  {t("values.title")}
                </p>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">
                      {t("values.currentMonthly")}
                    </span>
                    <strong>
                      {formatarValor(assinatura?.valorMensalAtual || 0)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">
                      {t("values.perStudent")}
                    </span>
                    <strong>
                      {formatarValor(assinatura?.valorPorAluno || 0)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-700 dark:text-slate-300">
                      {t("values.extraCampus")}
                    </span>
                    <strong>
                      {formatarValor(assinatura?.valorPorPoloExtra || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
                  {t("usage.title")}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {t("usage.activeStudents")}
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {assinatura?.alunosAtivosReferencia || 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {t("usage.campuses")}
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {assinatura?.polosReferencia || 0}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {modalAberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancelando) {
              setModalAberto(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-subscription-title"
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <p className="text-sm font-black uppercase tracking-[0.2em] text-red-700 dark:text-red-300">
              {t("cancellation.modal.eyebrow")}
            </p>

            <h2
              id="cancel-subscription-title"
              className="mt-2 text-2xl font-black text-slate-950 dark:text-white"
            >
              {t("cancellation.modal.title")}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {t("cancellation.modal.description")}
            </p>

            <label
              htmlFor="subscription-cancellation-reason"
              className="mt-5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t("cancellation.modal.reasonLabel")}
            </label>

            <textarea
              id="subscription-cancellation-reason"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t("cancellation.modal.reasonPlaceholder")}
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
            />

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                disabled={cancelando}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("cancellation.modal.backButton")}
              </button>

              <button
                type="button"
                onClick={confirmarCancelamento}
                disabled={cancelando}
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-900"
              >
                {cancelando
                  ? t("cancellation.modal.cancelling")
                  : t("cancellation.modal.confirmButton")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}