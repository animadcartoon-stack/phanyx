import Image from "next/image";
import Link from "next/link";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { LocalePhanyx } from "@/i18n/config";
import { marketingCopy, marketingPath } from "@/lib/public-marketing";
import { schoolGuideCopy, schoolGuideLocales, schoolGuidePath } from "@/lib/school-guide";

type GuideLocale = Exclude<LocalePhanyx, "pt-BR">;

export default function SchoolGuidePage({ locale }: { locale: GuideLocale }) {
  const copy = schoolGuideCopy[locale];

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      <LocalizedHeader locale={locale} section="school" />
      <main>
        <article className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">{copy.kicker}</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">{copy.heading}</h1>
          <p className="mt-6 text-lg leading-8 text-slate-700">{copy.intro}</p>

          <figure className="mt-10 overflow-hidden rounded-2xl border border-slate-200">
            <Image
              src="/images/guia-sistema-gestao-escolar-sala.webp"
              alt={copy.imageAlt}
              width={1672}
              height={941}
              sizes="(max-width: 896px) 100vw, 896px"
              className="h-auto w-full"
              priority
            />
          </figure>

          <nav aria-label={copy.contents} className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold">{copy.contents}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-blue-700">
              <li><a href="#criteria" className="underline">{copy.criteriaLink}</a></li>
              <li><a href="#demo" className="underline">{copy.demoLink}</a></li>
              <li><a href="#phanyx" className="underline">{copy.phanyxLink}</a></li>
            </ul>
          </nav>

          <section id="criteria" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.criteriaTitle}</h2>
            <p className="mt-4 leading-7 text-slate-700">{copy.criteriaIntro}</p>
            <ol className="mt-8 space-y-5">
              {copy.criteria.map((item, index) => (
                <li key={item.title} className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-xl font-semibold"><span className="mr-2 text-blue-700">{index + 1}.</span>{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-700">{item.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="demo" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.demoTitle}</h2>
            {copy.demoParagraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-7 text-slate-700">{paragraph}</p>)}
          </section>

          <section id="phanyx" className="mt-14 scroll-mt-24 rounded-2xl bg-slate-950 p-7 text-white md:p-9">
            <h2 className="text-3xl font-bold">{copy.phanyxTitle}</h2>
            <p className="mt-4 leading-7 text-slate-200">{copy.phanyxText}</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href={marketingPath(locale, "school")} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500">{copy.schoolButton}</Link>
              <Link href={marketingPath(locale, "plans")} className="rounded-xl border border-white/30 px-5 py-3 font-semibold text-white hover:bg-white/10">{copy.plansButton}</Link>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-bold">{copy.faqTitle}</h2>
            {copy.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="mt-7 text-xl font-semibold">{faq.question}</h3>
                <p className="mt-3 leading-7 text-slate-700">{faq.answer}</p>
              </div>
            ))}
          </section>

          <nav aria-label={copy.languagesLabel} className="mt-14 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold">{copy.languagesLabel}</h2>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-blue-700">
              {schoolGuideLocales.filter((item) => item !== locale).map((item) => (
                <li key={item}><Link href={schoolGuidePath(item)} hrefLang={item} className="underline">{marketingCopy[item].name}</Link></li>
              ))}
            </ul>
          </nav>
        </article>
      </main>
    </div>
  );
}
