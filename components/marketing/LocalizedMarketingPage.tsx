import Image from "next/image";
import Link from "next/link";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { ForeignLocale } from "@/lib/localized-plans";
import { localizedHome } from "@/lib/localized-home";
import { marketingCopy, marketingPath, type MarketingSection } from "@/lib/public-marketing";
import { searchIntentCopy } from "@/lib/search-intents";

export default function LocalizedMarketingPage({ locale, section }: { locale: ForeignLocale; section: Extract<MarketingSection, "home" | "academic"> }) {
  const t = localizedHome[locale];
  const copy = marketingCopy[locale];
  const plans = marketingPath(locale, "plans");
  const whatsapp = `https://wa.me/5548988101240?text=${encodeURIComponent(`${copy.contact} — PHANYX (${locale})`)}`;

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      <LocalizedHeader locale={locale} section={section} />
      <main>
        <section className="relative overflow-hidden border-b border-slate-800 bg-[#06133a] text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#081a52] to-[#142863]" />
          <div className="absolute right-[-6%] top-0 hidden h-full w-[42%] lg:block">
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(28% 0%, 100% 0%, 100% 100%, 4% 100%)" }}>
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#06133a] via-[#06133a]/40 to-transparent" />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020817]/65 via-transparent to-transparent" />
              <Image src="/images/formax-hero.jpg" alt="PHANYX academic platform" fill priority className="scale-[1.04] object-cover object-[68%_center]" />
            </div>
          </div>
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
                <p className="mb-3 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200">{t.kicker}</p>
                <h1 className="mt-4 text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-4xl xl:text-[3.1rem]">
                  <span className="block text-white">{section === "academic" ? copy.headline : t.lead}</span>
                  <span className="mt-2 block bg-gradient-to-r from-blue-300 via-blue-200 to-blue-400 bg-clip-text text-transparent">{t.accent}</span>
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">{section === "academic" ? copy.intro : t.intro}</p>
                <p className="mt-6 text-slate-300">{t.theologyLead} <a href="/ibe/matricula" className="text-blue-400 underline">{t.theologyLink}</a> {t.theologyEnd}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href={plans} className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold !text-white shadow-lg hover:bg-blue-500">{copy.navPlans}</Link>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-semibold text-white hover:bg-white/15">{copy.contact}</a>
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-3 sm:inline-flex">
                  <div className="flex flex-wrap gap-2">{t.portals.map((portal, index) => <Link key={portal} href={`/login?portal=${["aluno", "professor", "admin"][index]}&lang=${locale}`} className="rounded-xl border border-blue-200/40 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">{["👨‍🎓", "👨‍🏫", "🛡️"][index]} {portal}</Link>)}</div>
                </div>
                <div className="mt-5 flex gap-4 text-sm"><a href="/blog" className="font-semibold text-blue-300 underline-offset-4 hover:underline">Blog</a><a href="/blog/sistema-gestao-escolar" className="font-semibold text-blue-300 underline-offset-4 hover:underline">{t.blog}</a></div>
                <div className="mt-6 hidden gap-4 xl:grid xl:grid-cols-3">{t.trust.map((item) => <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-xl font-bold text-white">{item.title}</p><p className="mt-2 text-sm text-slate-200">{item.description}</p></div>)}</div>
              </div>
              <div className="relative mt-2 lg:hidden"><div className="relative h-[260px] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl sm:h-[300px]"><div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020817]/70 via-transparent to-transparent" /><Image src="/images/formax-hero.jpg" alt="PHANYX academic platform" fill priority className="object-cover object-[78%_center]" /><p className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white backdrop-blur">{t.intro}</p></div></div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <h2 className="text-3xl font-bold md:text-4xl">{copy.featuresTitle}</h2><p className="mt-3 text-slate-600">{copy.featuresDescription}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{copy.features.map((feature) => <article key={feature.title} className="rounded-2xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p></article>)}</div>
          <Link href={plans} className="mt-7 inline-flex font-bold text-blue-700 hover:underline">{copy.navPlans} →</Link>
        </div></section>

        <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:px-12">
          <h2 className="text-2xl font-bold">{copy.navAcademic}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">{(["school", "lms", "success"] as const).map((intent) => (
            <Link key={intent} href={marketingPath(locale, intent)} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-400 hover:bg-blue-50">
              <h3 className="font-bold text-blue-900">{searchIntentCopy[locale][intent].heading}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{searchIntentCopy[locale][intent].description}</p>
            </Link>
          ))}</div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">{t.modulesKicker}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{t.modulesTitle}</h2><p className="mt-4 text-lg text-slate-600">{t.modulesDescription}</p></div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{t.modules.map((module) => <article key={module.title} className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm"><div className="text-3xl">{module.emoji}</div><h3 className="mt-4 text-xl font-bold">{module.title}</h3><p className="mt-3 text-slate-600">{module.description}</p></article>)}</div>
        </section>

        <section className="bg-slate-50"><div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:px-10 lg:grid-cols-2 lg:items-center lg:px-12"><div><p className="text-sm font-semibold tracking-[0.2em] text-blue-700">{t.differenceKicker}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{t.differenceTitle}</h2><p className="mt-4 text-lg text-slate-600">{t.differenceDescription}</p></div><div className="grid gap-4">{t.differences.map((item) => <p key={item} className="rounded-2xl border border-gray-200 bg-white p-5 font-medium text-gray-800 shadow-sm">✓ {item}</p>)}</div></div></section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12"><div className="rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 text-white md:p-12"><p className="text-sm font-semibold tracking-[0.2em] text-blue-200">{t.securityKicker}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{t.securityTitle}</h2><p className="mt-4 max-w-3xl text-blue-100">{t.securityDescription}</p><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{t.security.map((item) => <article key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-5"><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-sm text-blue-100">{item.description}</p></article>)}</div></div></section>

        <section className="bg-slate-50"><div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12"><p className="text-sm font-semibold tracking-[0.2em] text-blue-700">{t.ecosystemKicker}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{t.ecosystemTitle}</h2><p className="mt-4 text-lg text-slate-600">{t.ecosystemDescription}</p><div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{t.modules.map((module) => <article key={module.title} className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm"><h3 className="text-xl font-bold">{module.title}</h3><p className="mt-3 text-slate-600">{module.description}</p></article>)}</div></div></section>

        <section className="mx-auto max-w-5xl px-6 py-20 md:px-10 lg:px-12"><div className="text-center"><p className="text-sm font-semibold tracking-[0.2em] text-blue-700">{t.faqsKicker}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{t.faqsTitle}</h2></div><div className="mt-12 space-y-4">{t.faqs.map((faq) => <article key={faq.question} className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-bold">{faq.question}</h3><p className="mt-3 text-slate-600">{faq.answer}</p></article>)}</div></section>

        <section className="bg-slate-950"><div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12"><div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white md:p-10"><p className="text-sm font-semibold tracking-[0.2em] text-blue-200">{t.ctaKicker}</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">{t.ctaTitle}</h2><p className="mt-4 max-w-3xl text-blue-100">{t.ctaDescription}</p><div className="mt-7 flex flex-wrap gap-3"><Link href={plans} className="rounded-xl bg-blue-600 px-6 py-3 font-bold !text-white">{copy.navPlans}</Link><a href={whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white">{copy.contact}</a></div></div></div></section>
      </main>
    </div>
  );
}
