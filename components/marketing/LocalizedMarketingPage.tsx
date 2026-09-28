import Link from "next/link";
import type { LocalePhanyx } from "@/i18n/config";
import {
  marketingCopy,
  marketingLocales,
  marketingPath,
  type MarketingSection,
} from "@/lib/public-marketing";

export default function LocalizedMarketingPage({ locale, section }: { locale: LocalePhanyx; section: MarketingSection }) {
  const copy = marketingCopy[locale];
  const whatsapp = `https://wa.me/5548988101240?text=${encodeURIComponent(`${copy.contact} — PHANYX (${locale})`)}`;

  return (
    <div lang={locale} className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href={marketingPath(locale, "home")} className="text-xl font-black tracking-widest text-blue-700">PHANYX</Link>
          <nav aria-label="Navigation" className="flex flex-wrap items-center gap-5 text-sm font-semibold">
            <Link href={marketingPath(locale, "academic")} className="hover:text-blue-700">{copy.navAcademic}</Link>
            <Link href={marketingPath(locale, "plans")} className="hover:text-blue-700">{copy.navPlans}</Link>
            <Link href={`/login?lang=${locale}`} className="hover:text-blue-700">{copy.login}</Link>
          </nav>
          <nav aria-label="Languages" className="flex flex-wrap gap-2 text-xs">
            {marketingLocales.map((item) => (
              <Link key={item} href={marketingPath(item, section)} hrefLang={item} lang={item}
                aria-label={marketingCopy[item].name}
                aria-current={item === locale ? "page" : undefined}
                className={`rounded-lg border px-2 py-1 ${item === locale ? "border-blue-600 bg-blue-50 font-bold text-blue-800" : "border-slate-200 hover:border-blue-500"}`}>
                {item}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white">
          <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">PHANYX</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              {section === "plans" ? copy.plansTitle.replace(" | PHANYX", "") : copy.headline}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-blue-100">{section === "plans" ? copy.plansDescription : copy.intro}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={marketingPath(locale, section === "plans" ? "academic" : "plans")}
                className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-500">
                {section === "plans" ? copy.navAcademic : copy.navPlans}
              </Link>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">{copy.contact}</a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-black md:text-4xl">{copy.featuresTitle}</h2>
          <p className="mt-3 max-w-3xl text-slate-600">{copy.featuresDescription}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {copy.features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <h2 className="text-3xl font-black md:text-4xl">{copy.tiersTitle}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {copy.tiers.map((tier) => (
                <article key={tier.name} className="flex flex-col rounded-2xl border border-slate-200 p-7 shadow-sm">
                  <h3 className="text-2xl font-black">{tier.name}</h3>
                  <p className="mt-3 font-bold text-blue-700">{tier.brazilPrice}</p>
                  <p className="mt-3 flex-1 leading-7 text-slate-600">{tier.description}</p>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                    className="mt-7 rounded-xl bg-blue-600 px-5 py-3 text-center font-bold text-white hover:bg-blue-700">{copy.askProposal}</a>
                </article>
              ))}
            </div>
            <p className="mt-7 max-w-4xl text-sm leading-6 text-slate-600">{copy.pricingNote}</p>
          </div>
        </section>
      </main>
      <footer className="bg-slate-950 px-6 py-10 text-center text-sm text-slate-300">© PHANYX</footer>
    </div>
  );
}
