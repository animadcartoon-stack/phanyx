import Image from "next/image";
import Link from "next/link";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { LocalePhanyx } from "@/i18n/config";
import {
  marketingCopy,
  marketingPath,
} from "@/lib/public-marketing";
import {
  onlineSchoolArticleCopy,
  onlineSchoolArticleImage,
  onlineSchoolArticleLocales,
  onlineSchoolArticlePath,
} from "@/lib/online-school-management-article";
import { schoolGuidePath } from "@/lib/school-guide";

export default function OnlineSchoolManagementArticle({
  locale,
}: {
  locale: LocalePhanyx;
}) {
  const copy = onlineSchoolArticleCopy[locale];
  const path = onlineSchoolArticlePath(locale);
  const pageUrl = `https://phanyx.com.br${path}`;

  const languagePaths = Object.fromEntries(
    onlineSchoolArticleLocales.map((item) => [
      item,
      onlineSchoolArticlePath(item),
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
        image: `https://phanyx.com.br${onlineSchoolArticleImage}`,
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
              src={onlineSchoolArticleImage}
              alt={copy.imageAlt}
              width={1672}
              height={941}
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
              <li>
                <a href="#how" className="underline">
                  {copy.contentsLinks.how}
                </a>
              </li>
              <li>
                <a href="#comparison" className="underline">
                  {copy.contentsLinks.comparison}
                </a>
              </li>
              <li>
                <a href="#when" className="underline">
                  {copy.contentsLinks.when}
                </a>
              </li>
              <li>
                <a href="#migration" className="underline">
                  {copy.contentsLinks.migration}
                </a>
              </li>
            </ul>
          </nav>

          <section id="how" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.howHeading}</h2>
            {copy.howParagraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 leading-7 text-slate-700"
              >
                {paragraph}
              </p>
            ))}
          </section>

          <section id="comparison" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.comparisonHeading}</h2>
            <p className="mt-4 leading-7 text-slate-700">
              {copy.comparisonIntro}
            </p>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="p-4 font-semibold">
                      {copy.comparisonLabels.criterion}
                    </th>
                    <th className="p-4 font-semibold">
                      {copy.comparisonLabels.online}
                    </th>
                    <th className="p-4 font-semibold">
                      {copy.comparisonLabels.local}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copy.comparison.map((item) => (
                    <tr
                      key={item.criterion}
                      className="border-b border-slate-200 align-top"
                    >
                      <th className="p-4 font-semibold text-slate-900">
                        {item.criterion}
                      </th>
                      <td className="p-4 leading-7 text-slate-700">
                        {item.online}
                      </td>
                      <td className="p-4 leading-7 text-slate-700">
                        {item.local}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="when" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.whenHeading}</h2>

            <p className="mt-4 leading-7 text-slate-700">{copy.whenText}</p>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold">{copy.calloutTitle}</h3>
              <p className="mt-3 leading-7 text-slate-700">
                {copy.calloutText}
              </p>
            </div>
          </section>

          <section id="migration" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-bold">{copy.migrationHeading}</h2>

            <ol className="mt-7 space-y-5">
              {copy.migrationSteps.map((item, index) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-slate-200 p-6"
                >
                  <h3 className="text-xl font-semibold">
                    <span className="mr-2 text-blue-700">{index + 1}.</span>
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-700">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
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
                href={schoolGuidePath(locale)}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50"
              >
                {copy.guideButton}
              </Link>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-bold">{copy.faqHeading}</h2>

            <div className="mt-7 space-y-6">
              {copy.faqs.map((item) => (
                <div key={item.question}>
                  <h3 className="text-xl font-semibold">{item.question}</h3>
                  <p className="mt-3 leading-7 text-slate-700">
                    {item.answer}
                  </p>
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
                <Link className="underline" href={schoolGuidePath(locale)}>
                  {copy.relatedGuide}
                </Link>
              </li>
              <li>
                <Link
                  className="underline"
                  href={marketingPath(locale, "enrollment")}
                >
                  {copy.relatedEnrollment}
                </Link>
              </li>
              <li>
                <Link
                  className="underline"
                  href={marketingPath(locale, "academic")}
                >
                  {copy.relatedAcademic}
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
              {onlineSchoolArticleLocales
                .filter((item) => item !== locale)
                .map((item) => (
                  <li key={item}>
                    <Link
                      href={onlineSchoolArticlePath(item)}
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
              <Link
                href={marketingPath(locale, "school")}
                className="hover:text-white"
              >
                {copy.footerSchool}
              </Link>
              <Link
                href={marketingPath(locale, "academic")}
                className="hover:text-white"
              >
                {copy.footerAcademic}
              </Link>
              <Link
                href={marketingPath(locale, "plans")}
                className="hover:text-white"
              >
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
