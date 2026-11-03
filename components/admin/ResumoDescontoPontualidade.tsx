"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { descontoPontualidadeEmReais, lerDescontoPontualidade, type DescontoPontualidade } from "@/lib/financeiro/desconto-pontualidade";

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
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const base = Math.round(mensalidade * (1 - bolsa / 100) * 100) / 100;
  const desconto = regra ? descontoPontualidadeEmReais(base, regra.percentual) : 0;
  if (!regra || !desconto) return null;
  const valor = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(base - desconto);
  const percentual = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(regra.percentual);

  return (
    <p className="mt-2 rounded-lg border border-emerald-400/50 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
      {regra.diasAntecedencia > 0
        ? t("summaryEarly", { valor, percentual, dias: regra.diasAntecedencia })
        : t("summaryDue", { valor, percentual })}
    </p>
  );
}
