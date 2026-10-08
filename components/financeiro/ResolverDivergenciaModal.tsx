"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Conferencia = {
  cobranca: {
    id: number; referenciaInterna: string; statusBancario: string; statusOperacional: string;
    versao: string; aluno: { id: number; nome: string }; conta: { nome: string; moeda: string };
    parcelaOriginalId: number;
  };
  parcela: { id: number; descricao: string | null; vencimento: string | null; versao: string };
  analise: {
    valorCobrado: number; valorCompensado: number | null; valorFinal: number;
    totalPagoAnterior: number; saldoAtual: number; saldoAposBaixa: number;
    parcial: boolean; bloqueios: string[]; podeResolver: boolean;
  };
  motivosDetectados: string[];
  parcelas: Array<{ id: number; descricao: string | null; vencimento: string | null; matricula: string | null; saldoAtual: number }>;
};

type Props = { cobrancaId: number; onFechar: () => void; onResolvida: () => void | Promise<void> };
const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950";

export default function ResolverDivergenciaModal({ cobrancaId, onFechar, onResolvida }: Props) {
  const t = useTranslations("AdminFinanceiroDivergencias");
  const locale = useLocale();
  const tituloId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const salvandoRef = useRef(false);
  const [dados, setDados] = useState<Conferencia | null>(null);
  const [parcelaId, setParcelaId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [confirmarParcial, setConfirmarParcial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    const elemento = dialog.current;
    elemento?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { elemento?.close(); document.body.style.overflow = overflow; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setConfirmarParcial(false);
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (parcelaId) params.set("lancamentoFinanceiroId", String(parcelaId));
        if (busca.trim()) params.set("busca", busca.trim());
        const resposta = await fetch(`/api/admin/financeiro/cobrancas/${cobrancaId}/resolver-divergencia?${params}`, { credentials: "include", cache: "no-store", signal: controller.signal });
        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado.codigo || "ERRO_CONFERENCIA");
        if (!controller.signal.aborted) setDados(resultado);
      } catch (error) {
        if (!controller.signal.aborted) {
          const codigo = error instanceof Error ? error.message : "ERRO_CONFERENCIA";
          setErro(t.has(`errors.${codigo}`) ? t(`errors.${codigo}`) : t("errors.ERRO_CONFERENCIA"));
        }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, busca ? 350 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [cobrancaId, parcelaId, busca, revisao, t]);

  function moeda(valor: number | null) {
    if (valor === null) return "—";
    return new Intl.NumberFormat(locale, { style: "currency", currency: dados?.cobranca.conta.moeda || "BRL" }).format(valor);
  }

  function motivo(codigo: string) {
    return t.has(`reasons.${codigo}`) ? t(`reasons.${codigo}`) : t("reasonUnknown");
  }

  async function resolver(event: React.FormEvent) {
    event.preventDefault();
    if (!dados || loading || salvandoRef.current) return;
    salvandoRef.current = true;
    setSalvando(true);
    setErro("");
    try {
      const resposta = await fetch(`/api/admin/financeiro/cobrancas/${cobrancaId}/resolver-divergencia`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lancamentoFinanceiroId: dados.parcela.id, justificativa: justificativa.trim(),
          confirmarPagamentoParcial: confirmarParcial, versaoCobranca: dados.cobranca.versao,
          versaoLancamento: dados.parcela.versao,
        }),
      });
      const resultado = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        const codigo = resultado.codigo || "ERRO_CONFERENCIA";
        setErro(t.has(`errors.${codigo}`) ? t(`errors.${codigo}`) : motivo(codigo));
        if (resposta.status === 409) setRevisao((atual) => atual + 1);
        return;
      }
      await onResolvida();
    } catch { setErro(t("errors.ERRO_CONFERENCIA")); }
    finally { salvandoRef.current = false; setSalvando(false); }
  }

  const podeResolver = dados?.cobranca.statusOperacional === "DIVERGENCIA"
    && dados.analise.podeResolver && justificativa.trim().length >= 10
    && (!dados.analise.parcial || confirmarParcial) && !loading && !salvando;

  return (
    <dialog ref={dialog} aria-labelledby={tituloId} onCancel={(event) => {
      event.preventDefault();
      if (!salvandoRef.current) onFechar();
    }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <form onSubmit={resolver} className="space-y-5 p-5 sm:p-6" aria-busy={loading || salvando}>
        <div className="flex items-start justify-between gap-4">
          <div><h2 id={tituloId} className="text-xl font-bold">{t("title")}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("intro")}</p></div>
          <button type="button" onClick={onFechar} disabled={salvando} aria-label={t("close")} className="rounded-lg border border-slate-300 px-3 py-1 dark:border-slate-700">×</button>
        </div>
        {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}
        {loading && <p role="status" className="py-6 text-center text-sm">{t("loading")}</p>}
        {!loading && !dados && <button type="button" onClick={() => { setErro(""); setRevisao((atual) => atual + 1); }} className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-700">{t("refresh")}</button>}
        {dados && <>
          <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
            <p className="font-bold">{dados.cobranca.aluno.nome}</p>
            <p className="mt-1 break-all text-slate-600 dark:text-slate-300">{dados.cobranca.referenciaInterna}</p>
            <p className="mt-1">{dados.cobranca.conta.nome}</p>
          </div>
          {dados.motivosDetectados.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="font-semibold">{t("detected")}</p><ul className="mt-2 list-disc space-y-1 pl-5">{dados.motivosDetectados.map((item) => <li key={item}>{motivo(item)}</li>)}</ul>
          </div>}
          <div className="grid gap-3 sm:grid-cols-3">{[
            [t("charged"), moeda(dados.analise.valorCobrado)], [t("received"), moeda(dados.analise.valorCompensado)],
            [t("balance"), moeda(dados.analise.saldoAtual)], [t("total"), moeda(dados.analise.valorFinal)],
            [t("previouslyPaid"), moeda(dados.analise.totalPagoAnterior)], [t("remaining"), moeda(dados.analise.saldoAposBaixa)],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><p className="text-xs text-slate-600 dark:text-slate-300">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}</div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("identityNotice")}</p>
          <label className="block space-y-2 text-sm font-semibold"><span>{t("search")}</span><input type="search" value={busca} disabled={salvando} onChange={(event) => { setErro(""); setBusca(event.target.value); }} className={campo} placeholder={t("searchPlaceholder")} /></label>
          <label className="block space-y-2 text-sm font-semibold"><span>{t("parcel")}</span><select value={parcelaId || dados.parcela.id} disabled={salvando} onChange={(event) => { setErro(""); setParcelaId(Number(event.target.value)); }} className={campo}>
            {!dados.parcelas.some((item) => item.id === dados.parcela.id) && <option value={dados.parcela.id}>{t("parcelNumber", { id: dados.parcela.id })} — {dados.parcela.descricao || t("monthlyFee")}</option>}
            {dados.parcelas.map((item) => <option key={item.id} value={item.id}>{t("parcelNumber", { id: item.id })} — {item.descricao || t("monthlyFee")} — {item.vencimento ? new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(new Date(item.vencimento)) : "—"} — {moeda(item.saldoAtual)}</option>)}
          </select></label>
          {dados.parcela.id !== dados.cobranca.parcelaOriginalId && <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{t("linkChange", { from: dados.cobranca.parcelaOriginalId, to: dados.parcela.id })}</p>}
          {dados.analise.bloqueios.length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><p className="font-semibold">{t("blocked")}</p><ul className="mt-2 list-disc space-y-1 pl-5">{dados.analise.bloqueios.map((item) => <li key={item}>{motivo(item)}</li>)}</ul></div>}
          {dados.analise.parcial && dados.analise.podeResolver && <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><input type="checkbox" checked={confirmarParcial} disabled={salvando} onChange={(event) => setConfirmarParcial(event.target.checked)} className="mt-1" /><span>{t("partialConfirmation", { amount: moeda(dados.analise.valorCompensado), balance: moeda(dados.analise.saldoAposBaixa) })}</span></label>}
          <label className="block space-y-2 text-sm font-semibold"><span>{t("justification")}</span><textarea required minLength={10} maxLength={2000} rows={3} value={justificativa} disabled={salvando} onChange={(event) => setJustificativa(event.target.value)} className={campo} placeholder={t("justificationPlaceholder")} /></label>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("notice")}</p>
        </>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="button" onClick={onFechar} disabled={salvando} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">{t("cancel")}</button>
          <button type="submit" disabled={!podeResolver} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{salvando ? t("saving") : t("resolve")}</button>
        </div>
      </form>
    </dialog>
  );
}
