import Image from "next/image";
import Link from "next/link";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { ForeignLocale } from "@/lib/localized-plans";
import { localizedHome } from "@/lib/localized-home";
import { marketingCopy, marketingPath } from "@/lib/public-marketing";
import { searchIntentCopy, type SearchIntent } from "@/lib/search-intents";

export default function SearchIntentPage({ locale, section }: { locale: ForeignLocale; section: SearchIntent }) {
  const copy = searchIntentCopy[locale][section];
  const marketing = marketingCopy[locale];
  const home = localizedHome[locale];
  const related = (["school", "lms", "success"] as const).filter((item) => item !== section);

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      <LocalizedHeader locale={locale} section={section} />
      <main>
        <section className="relative overflow-hidden border-b border-slate-800 bg-[#06133a] text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#081a52] to-[#142863]" />
          <div className="absolute right-0 top-0 hidden h-full w-[48%] pointer-events-none lg:block">
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(18% 0%, 100% 0%, 100% 100%, 2% 100%)" }}>
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#06133a] via-[#06133a]/40 to-transparent" />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020817]/65 via-transparent to-transparent" />
              <Image src="/images/formax-hero.jpg" alt="PHANYX academic platform" fill priority className="scale-[1.04] object-cover object-[60%_center]" />
            </div>
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-5 pb-10 pt-6 md:px-10 md:pb-14 md:pt-10 lg:px-12 lg:pb-16 lg:pt-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="max-w-2xl">
                <p className="mb-3 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200">{home.kicker}</p>
                <h1 className="mt-4 text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl xl:text-[3.1rem]">{copy.heading}</h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">{copy.intro}</p>
                <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 md:text-base">{home.intro}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href={marketingPath(locale, "plans")} className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold !text-white shadow-lg hover:bg-blue-500">{marketing.navPlans}</Link>
                  <a href={`https://wa.me/5548988101240?text=${encodeURIComponent(`PHANYX ${copy.heading} (${locale})`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-semibold text-white hover:bg-white/15">{marketing.contact}</a>
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-3 sm:inline-flex">
                  <div className="flex flex-wrap gap-2">{home.portals.map((portal, index) => <Link key={portal} href={`/login?portal=${["aluno", "professor", "admin"][index]}&lang=${locale}`} className="rounded-xl border border-blue-200/40 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">{["👨‍🎓", "👨‍🏫", "🛡️"][index]} {portal}</Link>)}</div>
                </div>
              </div>
              <div className="relative mt-2 lg:hidden"><div className="relative h-[260px] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl sm:h-[300px]"><div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020817]/70 via-transparent to-transparent" /><Image src="/images/formax-hero.jpg" alt="PHANYX academic platform" fill priority className="object-cover object-[78%_center]" /><p className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white backdrop-blur">{home.intro}</p></div></div>
            </div>
          </div>
        </section>
        <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <h2 className="text-3xl font-bold md:text-4xl">{marketing.featuresTitle}</h2>
          <p className="mt-3 text-slate-600">{marketing.featuresDescription}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{marketing.features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}</div>
          <Link href={marketingPath(locale, "academic")} className="mt-7 inline-flex font-bold text-blue-700 hover:underline">{marketing.navAcademic} →</Link>
        </div></section>
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <h2 className="text-3xl font-bold md:text-4xl">{copy.benefitsHeading}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">{copy.benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-blue-900">{benefit.title}</h3>
              <p className="mt-3 leading-7 text-slate-700">{benefit.detail}</p>
            </article>
          ))}</div>
        </section>
        <section className="bg-slate-50"><div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <h2 className="text-3xl font-bold md:text-4xl">{copy.workflowHeading}</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">{copy.workflow.map((step, index) => (
            <li key={step} className="rounded-2xl border border-slate-200 bg-white p-6 leading-7 shadow-sm"><span className="mb-4 block text-2xl font-bold text-blue-700">{index + 1}</span>{step}</li>
          ))}</ol>
        </div></section>
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">{home.modulesKicker}</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">{home.modulesTitle}</h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">{home.modulesDescription}</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{home.modules.map((module) => (
            <article key={module.title} className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">{module.emoji}</div>
              <h3 className="mt-4 text-xl font-bold">{module.title}</h3>
              <p className="mt-3 text-slate-600">{module.description}</p>
            </article>
          ))}</div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <h2 className="text-2xl font-bold">{copy.question}</h2><p className="mt-4 max-w-3xl leading-8 text-slate-700">{copy.answer}</p>
        </section>
        <section className="bg-slate-950"><div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white md:p-10">
            <p className="text-sm font-semibold tracking-[0.2em] text-blue-200">{home.ctaKicker}</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">{copy.nextStep}</h2>
            <p className="mt-4 max-w-3xl text-blue-100">{home.ctaDescription}</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href={marketingPath(locale, "plans")} className="rounded-xl bg-blue-600 px-6 py-3 font-bold !text-white">{marketing.navPlans}</Link><a href={`https://wa.me/5548988101240?text=${encodeURIComponent(`PHANYX ${copy.heading} (${locale})`)}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white">{marketing.contact}</a></div>
          </div>
          <nav aria-label={marketing.navAcademic} className="mt-10 grid gap-4 md:grid-cols-3">
            {["academic", ...related].map((item) => <Link key={item} href={marketingPath(locale, item as "academic" | SearchIntent)} className="rounded-xl border border-white/15 bg-white/5 p-5 font-semibold text-blue-100 hover:bg-white/10">{item === "academic" ? marketing.navAcademic : searchIntentCopy[locale][item as SearchIntent].heading} →</Link>)}
          </nav>
        </div></section>
      </main>
    </div>
  );
}
