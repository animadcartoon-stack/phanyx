import Link from "next/link";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { ForeignLocale } from "@/lib/localized-plans";
import { marketingCopy, marketingPath } from "@/lib/public-marketing";
import { searchIntentCopy, type SearchIntent } from "@/lib/search-intents";

export default function SearchIntentPage({ locale, section }: { locale: ForeignLocale; section: SearchIntent }) {
  const copy = searchIntentCopy[locale][section];
  const marketing = marketingCopy[locale];
  const related = (["school", "lms", "success"] as const).filter((item) => item !== section);

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      <LocalizedHeader locale={locale} section={section} />
      <main>
        <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">PHANYX · {marketing.navAcademic}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{copy.heading}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">{copy.intro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={marketingPath(locale, "plans")} className="rounded-xl bg-blue-600 px-6 py-3 font-bold !text-white hover:bg-blue-500">{marketing.navPlans}</Link>
              <Link href={marketingPath(locale, "academic")} className="rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">{marketing.navAcademic}</Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold">{copy.benefitsHeading}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">{copy.benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-bold text-blue-900">{benefit.title}</h3>
              <p className="mt-3 leading-7 text-slate-700">{benefit.detail}</p>
            </article>
          ))}</div>
        </section>
        <section className="bg-slate-50"><div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold">{copy.workflowHeading}</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">{copy.workflow.map((step, index) => (
            <li key={step} className="rounded-2xl border border-slate-200 bg-white p-6 leading-7"><span className="mb-4 block text-2xl font-bold text-blue-700">{index + 1}</span>{step}</li>
          ))}</ol>
        </div></section>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold">{copy.question}</h2><p className="mt-4 max-w-3xl leading-8 text-slate-700">{copy.answer}</p>
          <div className="mt-10 rounded-2xl bg-blue-950 p-8 text-white">
            <h2 className="text-2xl font-bold">{copy.nextStep}</h2>
            <div className="mt-6 flex flex-wrap gap-3"><Link href={marketingPath(locale, "plans")} className="rounded-xl bg-blue-600 px-5 py-3 font-bold !text-white">{marketing.navPlans}</Link><a href={`https://wa.me/5548988101240?text=${encodeURIComponent(`PHANYX ${copy.heading} (${locale})`)}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white">{marketing.contact}</a></div>
          </div>
          <nav aria-label={marketing.navAcademic} className="mt-12 grid gap-4 md:grid-cols-3">
            {["academic", ...related].map((item) => <Link key={item} href={marketingPath(locale, item as "academic" | SearchIntent)} className="rounded-xl border border-slate-200 p-5 font-semibold text-blue-800 hover:bg-blue-50">{item === "academic" ? marketing.navAcademic : searchIntentCopy[locale][item as SearchIntent].heading} →</Link>)}
          </nav>
        </section>
      </main>
    </div>
  );
}
