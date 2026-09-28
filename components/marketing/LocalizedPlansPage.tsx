"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import { localizedPlans, type ForeignLocale } from "@/lib/localized-plans";
import { defaultMarketCountry, marketCountries, marketPricing, type MarketCountry } from "@/lib/market-pricing";
import { marketingCopy, marketingPath } from "@/lib/public-marketing";

const planCodes = ["ESSENCIAL", "PROFISSIONAL", "ENTERPRISE"];
const labels = {
  "en-US": { country: "Institution country", perStudent: "per active student", includedOne: "1 active unit included", includedThree: "up to 3 active units included", byContract: "units defined by contract", extra: "Each additional active unit", monthly: "per month", note: "Prices follow the selected country, independently of page language. The international trial and billing are arranged by proposal; automatic checkout currently charges in BRL." },
  "pt-PT": { country: "País da instituição", perStudent: "por estudante ativo", includedOne: "1 unidade ativa incluída", includedThree: "até 3 unidades ativas incluídas", byContract: "unidades por contrato", extra: "Cada unidade ativa adicional", monthly: "por mês", note: "Os preços seguem o país escolhido, independentemente do idioma. O teste e a faturação internacional são definidos por proposta; a adesão automática atual cobra em reais." },
  "es-ES": { country: "País de la institución", perStudent: "por estudiante activo", includedOne: "1 unidad activa incluida", includedThree: "hasta 3 unidades activas incluidas", byContract: "unidades según contrato", extra: "Cada unidad activa adicional", monthly: "al mes", note: "Los precios corresponden al país elegido, independientemente del idioma. La prueba y la facturación internacional se acuerdan por propuesta; el pago automático actual cobra en reales." },
  "fr-FR": { country: "Pays de l'établissement", perStudent: "par étudiant actif", includedOne: "1 unité active incluse", includedThree: "jusqu'à 3 unités actives incluses", byContract: "unités selon le contrat", extra: "Chaque unité active supplémentaire", monthly: "par mois", note: "Les tarifs correspondent au pays choisi, indépendamment de la langue. L'essai et la facturation internationale font l'objet d'une proposition ; le paiement automatique actuel est en réals." },
} as const;

export default function LocalizedPlansPage({ locale }: { locale: ForeignLocale }) {
  const t = localizedPlans[locale];
  const marketing = marketingCopy[locale];
  const words = labels[locale];
  const [country, setCountry] = useState<MarketCountry>(defaultMarketCountry[locale]);
  const prices = marketPricing[country];
  const [students, setStudents] = useState(250);
  const [units, setUnits] = useState(1);
  const format = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: prices.currency }).format(value);
  const extraUnits = (index: number) => index === 0 ? Math.max(0, units - 1) : index === 1 ? Math.max(0, units - 3) : 0;
  const total = (index: number) => prices.base[index] + Math.max(0, students) * prices.student[index] + (index < 2 ? extraUnits(index) * prices.extraUnit[index] : 0);
  const whatsapp = (name: string) => `https://wa.me/5548988101240?text=${encodeURIComponent(`${t.proposal}: PHANYX ${name} (${locale}, ${prices.currency})`)}`;
  const period = (index: number) => `/${locale === "en-US" ? "month" : locale === "fr-FR" ? "mois" : locale === "es-ES" ? "mes" : "mês"} + ${format(prices.student[index])} ${words.perStudent} + ${index === 0 ? words.includedOne : index === 1 ? words.includedThree : words.byContract}`;
  const unitDetails = (index: number) => index === 2 ? t.enterpriseUnits : `${words.extra}: ${format(prices.extraUnit[index])} ${words.monthly}.`;

  useEffect(() => {
    const stored = window.localStorage.getItem("PHANYX_MARKET_COUNTRY");
    if (marketCountries.includes(stored as MarketCountry)) {
      setCountry(stored as MarketCountry);
      return;
    }
    fetch("/api/public/market-country")
      .then((response) => response.ok ? response.json() : null)
      .then((data: { country?: string } | null) => {
        if (marketCountries.includes(data?.country as MarketCountry)) setCountry(data?.country as MarketCountry);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const target = document.getElementById("calculadora-planos");
      if (target) window.scrollTo({ top: target.offsetTop + 800, behavior: "smooth" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      <LocalizedHeader locale={locale} section="plans" />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_32%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12 lg:py-24">
            <div className="mx-auto max-w-5xl text-center">
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">{t.badge}</p>
              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl xl:text-6xl">{t.headline}<span className="block bg-gradient-to-r from-blue-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">{t.accent}</span></h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">{t.intro}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a href="#planos" className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold !text-white hover:bg-blue-500">{t.start}</a>
                <a href={whatsapp("PHANYX")} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15">{t.specialist}</a>
              </div>
              <div className="mt-12 grid gap-4 text-left sm:grid-cols-2 xl:grid-cols-4">
                {t.indicators.map((item) => <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-5"><h2 className="font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-blue-100">{item.description}</p></div>)}
              </div>
              <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm text-blue-100">{t.trust.map((item) => <span key={item} className="rounded-full border border-white/10 px-4 py-2">{item}</span>)}</div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold tracking-[0.2em] text-blue-700">{t.why}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{t.whyTitle}</h2><p className="mt-4 text-lg text-slate-600">{t.whyDescription}</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{t.indicators.map((item, i) => <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><p className="text-3xl font-bold text-blue-700">{["3", "3 in 1", "QR", "SaaS"][i]}</p><h3 className="mt-3 font-bold">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.description}</p></article>)}</div>
        </div></section>

        <section id="calculadora-planos" className="bg-slate-50"><div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-bold md:text-4xl">{t.simulatorTitle}</h2><p className="mt-4 text-slate-600">{t.simulatorDescription}</p></div>
          <div className="mx-auto mt-10 max-w-5xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <label className="mb-5 block max-w-sm text-sm font-bold">{words.country}
              <select value={country} onChange={(event) => { const chosen = event.target.value as MarketCountry; setCountry(chosen); window.localStorage.setItem("PHANYX_MARKET_COUNTRY", chosen); }} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                {marketCountries.map((code) => <option key={code} value={code}>{new Intl.DisplayNames([locale], { type: "region" }).of(code)} ({marketPricing[code].currency})</option>)}
              </select>
            </label>
            <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold">{t.students}<input type="number" min="1" value={students} onChange={(event) => setStudents(Math.max(1, Number(event.target.value) || 1))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label><label className="text-sm font-bold">{t.unitsLabel}<input type="number" min="1" value={units} onChange={(event) => setUnits(Math.max(1, Number(event.target.value) || 1))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label></div>
            <p className="mt-3 text-sm text-slate-500">{t.unitHint}</p>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">{t.plans.map((plan, index) => <div key={plan.subtitle} className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><h3 className="font-bold text-blue-950">{marketing.tiers[index].name}</h3><p className="mt-2 text-sm text-blue-800">{format(prices.base[index])} + ({students} × {format(prices.student[index])}){index < 2 && extraUnits(index) > 0 ? ` + ${extraUnits(index)} × ${format(prices.extraUnit[index])}` : ""}</p><p className="mt-3 text-3xl font-black text-blue-950">{format(total(index))}{index === 2 && "+"}</p><p className="mt-1 text-xs text-slate-600">{t.total}</p><p className="mt-2 text-xs text-slate-600">{index === 2 ? t.enterpriseUnits : t.included}</p></div>)}</div>
            <p className="mt-6 text-sm text-slate-600">{words.note}</p>
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center"><h3 className="text-lg font-bold text-blue-950">{t.finalTitle}</h3><p className="mt-2 text-sm text-blue-800">{t.finalDescription}</p><div className="mt-5 flex flex-wrap justify-center gap-3"><a href={whatsapp("trial")} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold !text-white">{t.freeTrial}</a><a href={whatsapp("proposal")} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-bold text-blue-700">{t.proposal}</a></div></div>
          </div>
          <div id="planos" className="mt-12 grid scroll-mt-24 gap-8 xl:grid-cols-3">{t.plans.map((plan, index) => {
            const featured = index === 1;
            return <article key={plan.subtitle} className={`relative rounded-[28px] border p-8 shadow-sm ${featured ? "border-blue-600 bg-slate-950 text-white shadow-2xl ring-1 ring-blue-500/30" : "border-slate-200 bg-white text-slate-900"}`}>
              {index > 0 && <span className={`absolute -top-3 left-6 rounded-full px-4 py-1 text-xs font-bold tracking-widest !text-white ${featured ? "bg-blue-600" : "bg-slate-900"}`}>{featured ? t.recommended : t.advanced}</span>}
              <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${featured ? "text-blue-200" : "text-blue-700"}`}>{marketing.tiers[index].name}</p><h3 className="mt-3 min-h-20 text-2xl font-bold">{plan.subtitle}</h3>
              <div className="mt-6"><span className="text-4xl font-extrabold">{format(prices.base[index])}</span><p className={`mt-2 text-sm ${featured ? "text-slate-300" : "text-slate-500"}`}>{period(index)}</p><p className={`mt-3 text-xs leading-5 ${featured ? "text-blue-100" : "text-blue-700"}`}>{unitDetails(index)}</p><p className={`mt-4 min-h-28 text-sm leading-7 ${featured ? "text-slate-200" : "text-slate-600"}`}>{plan.description}</p></div>
              <div className="mt-8 space-y-3"><a href={whatsapp(planCodes[index])} target="_blank" rel="noopener noreferrer" className={`block rounded-2xl px-5 py-4 text-center text-sm font-black !text-white ${featured ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-900 hover:bg-slate-800"}`}>{t.start}</a><a href={whatsapp(planCodes[index])} target="_blank" rel="noopener noreferrer" className={`block rounded-2xl border px-5 py-4 text-center text-sm font-bold ${featured ? "border-white/20 bg-white/10 text-white" : "border-slate-300 text-slate-800"}`}>{index === 2 ? t.proposal : t.specialist}</a></div>
              <p className={`mt-3 text-xs ${featured ? "text-slate-300" : "text-slate-500"}`}>{t.trialNote}</p>
              <div className={`mt-8 border-t pt-8 ${featured ? "border-white/10" : "border-slate-200"}`}><h4 className="text-xs font-bold uppercase tracking-widest">{t.includes}:</h4><ul className="mt-4 space-y-3">{plan.features.map((feature) => <li key={feature} className={`flex gap-3 text-sm ${featured ? "text-slate-200" : "text-slate-600"}`}><span>✓</span><span>{feature}</span></li>)}</ul></div>
              <div className={`mt-8 rounded-2xl p-4 ${featured ? "bg-white/10" : "bg-slate-50"}`}><p className="text-xs font-bold uppercase tracking-widest">{t.idealLabel}</p><p className="mt-2 text-sm">{plan.ideal}</p></div>
            </article>;
          })}</div>
        </div></section>

        <section className="border-y border-blue-100 bg-blue-50/60"><div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12"><h2 className="text-3xl font-bold md:text-4xl">{marketing.featuresTitle}</h2><p className="mt-3 text-slate-600">{marketing.featuresDescription}</p><div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{marketing.features.map((feature) => <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-xl font-bold">{feature.title}</h3><p className="mt-2 leading-7 text-slate-600">{feature.description}</p></article>)}</div><p className="mt-7 text-sm text-slate-600">{t.featureAvailability}</p></div></section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">{t.compareLabel}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{t.compareTitle}</h2><p className="mt-4 text-lg text-slate-600">{t.compareDescription}</p><div className="mt-10 overflow-x-auto rounded-[28px] border border-slate-200 shadow-sm"><table className="min-w-full bg-white"><thead className="bg-slate-950 text-white"><tr><th className="px-6 py-4 text-left">{marketing.featuresTitle}</th>{marketing.tiers.map((tier) => <th key={tier.name} className="px-6 py-4 text-left">{tier.name}</th>)}</tr></thead><tbody>{t.comparison.map((item, index) => <tr key={item.label} className={index % 2 ? "bg-slate-50" : "bg-white"}><th scope="row" className="px-6 py-4 text-left text-sm font-medium">{item.label}</th>{item.values.map((value, i) => <td key={i} className="px-6 py-4 text-sm text-slate-600">{value}</td>)}</tr>)}</tbody></table></div></section>

        <section className="bg-slate-950"><div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12"><div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white md:p-10"><h2 className="text-3xl font-bold">{t.finalTitle}</h2><p className="mt-4 text-blue-100">{t.finalDescription}</p><div className="mt-7 flex flex-wrap gap-3"><Link href={marketingPath(locale, "academic")} className="rounded-xl border border-white/20 px-5 py-3 font-bold text-white">{marketing.navAcademic}</Link><a href={whatsapp("PHANYX")} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-blue-600 px-5 py-3 font-bold !text-white">{t.proposal}</a></div></div></div></section>
      </main>
    </div>
  );
}
