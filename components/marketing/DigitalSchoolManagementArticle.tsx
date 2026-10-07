import Image from "next/image";
import Link from "next/link";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { LocalePhanyx } from "@/i18n/config";
import { marketingCopy, marketingPath } from "@/lib/public-marketing";
import {
  digitalSchoolArticleCopy,
  digitalSchoolArticleImages,
  digitalSchoolArticleLocales,
  digitalSchoolArticlePath,
} from "@/lib/digital-school-management-article";
import { onlineSchoolArticlePath } from "@/lib/online-school-management-article";
import { schoolGuidePath } from "@/lib/school-guide";

export default function DigitalSchoolManagementArticle({
  locale,
}: {
  locale: LocalePhanyx;
}) {
  const copy = digitalSchoolArticleCopy[locale];
  const path = digitalSchoolArticlePath(locale);
  const pageUrl = `https://phanyx.com.br${path}`;
  const image = digitalSchoolArticleImages[locale];

  const languagePaths = Object.fromEntries(
    digitalSchoolArticleLocales.map((item) => [
      item,
      digitalSchoolArticlePath(item),
    ]),
  ) as Partial<Record<LocalePhanyx, string>>;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: copy.heading,
        description: copy.description,
        image: `https://phanyx.com.br${image}`,
        mainEntityOfPage: pageUrl,
        publisher: {
          "@type": "Organization",
          name: "PHANYX",
          url: "https://phanyx.com.br",
        },
        inLanguage: locale,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "PHANYX",
            item: `https://phanyx.com.br${marketingPath(locale, "home")}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item:
              locale === "pt-BR"
                ? "https://phanyx.com.br/blog"
                : `https://phanyx.com.br/${locale}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: copy.heading,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: copy.faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      <LocalizedHeader
        locale={locale}
        section="school"
        languagePaths={languagePaths}
      />

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <article className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            {copy.kicker}
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            {copy.heading}
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-700">{copy.intro}</p>

          <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Image
              src={image}
              alt={copy.imageAlt}
              width={1600}
              height={1067}
              sizes="(max-width: 896px) 100vw, 896px"
              className="h-auto w-full object-cover"
              priority
            />
            <figcaption className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {copy.imageCaption}
            </figcaption>
          </figure>

          <nav
            aria-label={copy.contents}
            className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6"
          >
            <h2 className="text-lg font-semibold">{copy.contents}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-blue-700">
              <li><a href="#what" className="underline">{copy.contentsLinks.what}</a></li>
              <li><a href="#signs" className="underline">{copy.contentsLinks.signs}</a></li>
              <li><a href="#steps" className="underline">{copy.contentsLinks.steps}</a></li>
              <li><a href="#technology" className="underline">{copy.contentsLinks.technology}</a></li>
            </ul>
          </nav>

          <section id="what" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.whatHeading}</h2>
            {copy.whatParagraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 leading-7 text-slate-700">
                {paragraph}
              </p>
            ))}
          </section>

          <section id="signs" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.signsHeading}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {copy.signs.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-700">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="steps" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.stepsHeading}</h2>
            <p className="mt-4 leading-7 text-slate-700">{copy.stepsIntro}</p>
            <ol className="mt-8 space-y-5">
              {copy.steps.map((item, index) => (
                <li key={item.title} className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-xl font-semibold">
                    <span className="mr-2 text-blue-700">{index + 1}.</span>
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-700">{item.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="technology" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.technologyHeading}</h2>
            {copy.technologyParagraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 leading-7 text-slate-700">
                {paragraph}
              </p>
            ))}

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold">{copy.calloutTitle}</h3>
              <p className="mt-3 leading-7 text-slate-700">{copy.calloutText}</p>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-bold">{copy.phanyxHeading}</h2>
            <p className="mt-4 leading-7 text-slate-700">{copy.phanyxText}</p>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href={marketingPath(locale, "school")}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500"
              >
                {copy.schoolButton}
              </Link>

              <Link
                href={onlineSchoolArticlePath(locale)}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50"
              >
                {copy.onlineButton}
              </Link>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-bold">{copy.faqHeading}</h2>
            <div className="mt-7 space-y-6">
              {copy.faqs.map((item) => (
                <div key={item.question}>
                  <h3 className="text-xl font-semibold">{item.question}</h3>
                  <p className="mt-3 leading-7 text-slate-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <nav
            aria-label={copy.relatedHeading}
            className="mt-14 border-t border-slate-200 pt-8"
          >
            <h2 className="text-xl font-bold">{copy.relatedHeading}</h2>
            <ul className="mt-4 space-y-3 text-blue-700">
              <li>
                <Link className="underline" href={onlineSchoolArticlePath(locale)}>
                  {copy.relatedOnline}
                </Link>
              </li>
              <li>
                <Link className="underline" href={schoolGuidePath(locale)}>
                  {copy.relatedGuide}
                </Link>
              </li>
              <li>
                <Link className="underline" href={marketingPath(locale, "enrollment")}>
                  {copy.relatedEnrollment}
                </Link>
              </li>
            </ul>
          </nav>

          <nav
            aria-label={copy.languagesLabel}
            className="mt-10 border-t border-slate-200 pt-8"
          >
            <h2 className="text-xl font-bold">{copy.languagesLabel}</h2>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-blue-700">
              {digitalSchoolArticleLocales
                .filter((item) => item !== locale)
                .map((item) => (
                  <li key={item}>
                    <Link
                      href={digitalSchoolArticlePath(item)}
                      hrefLang={item}
                      className="underline"
                    >
                      {marketingCopy[item].name}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </article>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.4fr_1fr] md:px-10 lg:px-12">
          <div>
            <Link
              href={marketingPath(locale, "home")}
              className="inline-flex items-center gap-3 text-white"
            >
              <span className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/15 bg-white">
                <Image
                  src="/icon.png"
                  alt="PHANYX"
                  fill
                  sizes="40px"
                  className="object-contain p-1.5"
                />
              </span>
              <span className="font-bold tracking-[0.16em]">PHANYX</span>
            </Link>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              {copy.footerTagline}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              {copy.footerExplore}
            </h2>
            <nav className="mt-4 flex flex-col gap-3 text-sm">
              <Link href={marketingPath(locale, "school")} className="hover:text-white">
                {copy.footerSchool}
              </Link>
              <Link href={marketingPath(locale, "academic")} className="hover:text-white">
                {copy.footerAcademic}
              </Link>
              <Link href={marketingPath(locale, "plans")} className="hover:text-white">
                {copy.footerPlans}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl border-t border-white/10 px-6 py-5 text-xs text-slate-500 md:px-10 lg:px-12">
          © 2026 PHANYX. {copy.footerRights}
        </div>
      </footer>
    </div>
  );
}
