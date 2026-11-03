"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { descontoPontualidadeEmReais, faixasDescontoPontualidade, lerDescontoPontualidade, type DescontoPontualidade } from "@/lib/financeiro/desconto-pontualidade";

export function ResumoDescontoPontualidade({ mensalidade, bolsa = 0 }: { mensalidade: number; bolsa?: number }) {
  const t = useTranslations("AdminFinanceSettings.pontualidade");
  const locale = useLocale();
  const [regra, setRegra] = useState<DescontoPontualidade | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/matriculas/pontualidade", { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const dados = await res.json();
        setRegra(lerDescontoPontualidade(dados.descontoPontualidade));
      }).catch(() => {});
    return () => controller.abort();
  }, []);
  const faixas = faixasDescontoPontualidade(regra);
  const base = Math.round(mensalidade * (1 - bolsa / 100) * 100) / 100;
  const moeda = (valor: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(valor);
  const percentual = (valor: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(valor);
  const antecipado = faixas.antecipado ? descontoPontualidadeEmReais(base, faixas.antecipado.percentual) : 0;
  const vencimento = faixas.vencimento ? descontoPontualidadeEmReais(base, faixas.vencimento.percentual) : 0;
  if (!antecipado && !vencimento) return null;
  return (
    <div className="mt-2 space-y-1 rounded-lg border border-emerald-400/50 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
      {faixas.antecipado && antecipado > 0 && (
        <p>{t("summaryEarly", { valor: moeda(base - antecipado), percentual: percentual(faixas.antecipado.percentual), dias: faixas.antecipado.diasAntecedencia })}</p>
      )}
      {faixas.vencimento && vencimento > 0 && (
        <p>{t("summaryDue", { valor: moeda(base - vencimento), percentual: percentual(faixas.vencimento.percentual) })}</p>
      )}
      {antecipado > 0 && vencimento > 0 && <p>{t("notCumulative")}</p>}
    </div>
  );
}
