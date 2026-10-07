import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { LocalePhanyx } from "@/i18n/config";
import { marketingCopy, marketingPath } from "@/lib/public-marketing";
import {
  openCoursesArticleCopy,
  openCoursesArticleImages,
  openCoursesArticleLocales,
  openCoursesArticlePath,
} from "@/lib/open-courses-article";

function IntlFooter({ locale }: { locale: LocalePhanyx }) {
  const copy = openCoursesArticleCopy[locale];
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.4fr_1fr] md:px-10 lg:px-12">
        <div>
          <Link href={marketingPath(locale, "home")} className="inline-flex items-center gap-3 text-white">
            <span className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/15 bg-white">
              <Image src="/icon.png" alt="PHANYX" fill sizes="40px" className="object-contain p-1.5" />
            </span>
            <span className="font-bold tracking-[0.16em]">PHANYX</span>
          </Link>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">{copy.footerTagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{copy.footerExplore}</h2>
          <nav className="mt-4 flex flex-col gap-3 text-sm">
            <Link href={marketingPath(locale, "lms")} className="hover:text-white">{copy.footerPlatform}</Link>
            <Link href={marketingPath(locale, "plans")} className="hover:text-white">{copy.footerPlans}</Link>
            <Link href={locale === "pt-BR" ? "/blog" : `/${locale}/blog`} className="hover:text-white">{copy.footerBlog}</Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-white/10 px-6 py-5 text-xs text-slate-500 md:px-10 lg:px-12">
        © 2026 PHANYX. {copy.footerRights}
      </div>
    </footer>
  );
}

export default function OpenCoursesArticle({ locale }: { locale: LocalePhanyx }) {
  const copy = openCoursesArticleCopy[locale];
  const path = openCoursesArticlePath(locale);
  const image = openCoursesArticleImages[locale];
  const pageUrl = `https://phanyx.com.br${path}`;
  const languagePaths = Object.fromEntries(
    openCoursesArticleLocales.map((item) => [item, openCoursesArticlePath(item)]),
  ) as Partial<Record<LocalePhanyx, string>>;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
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
            item: locale === "pt-BR" ? "https://phanyx.com.br/blog" : `https://phanyx.com.br/${locale}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: copy.heading,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      {locale === "pt-BR" ? (
        <Header />
      ) : (
        <LocalizedHeader locale={locale} section="lms" languagePaths={languagePaths} />
      )}

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <article className="mx-auto max-w-6xl px-6 py-14 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">{copy.kicker}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{copy.heading}</h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-700">{copy.intro}</p>

          <figure className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
            <Image
              src={image}
              alt={copy.imageAlt}
              width={2172}
              height={724}
              priority
              className="h-auto w-full"
              sizes="(max-width: 1280px) 94vw, 1152px"
            />
            <figcaption className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {copy.imageCaption}
            </figcaption>
          </figure>

          <div className="mx-auto max-w-4xl">
            <section className="mt-12">
              <h2 className="text-3xl font-bold">{copy.whatHeading}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">{copy.whatText}</p>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold">{copy.featuresHeading}</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {copy.features.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 leading-7 text-slate-700">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold">{copy.integratedHeading}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">{copy.integratedText}</p>
            </section>

            <section className="mt-12 rounded-2xl bg-slate-950 p-7 text-white md:p-9">
              <h2 className="text-3xl font-bold">{copy.phanyxHeading}</h2>
              <p className="mt-4 leading-7 text-slate-200">{copy.phanyxText}</p>
              <Link
                href={marketingPath(locale, "lms")}
                className="mt-7 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500"
              >
                {copy.cta}
              </Link>
            </section>

            <nav aria-label={copy.languagesLabel} className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="text-xl font-bold">{copy.languagesLabel}</h2>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-blue-700">
                {openCoursesArticleLocales
                  .filter((item) => item !== locale)
                  .map((item) => (
                    <li key={item}>
                      <Link href={openCoursesArticlePath(item)} hrefLang={item} className="underline">
                        {marketingCopy[item].name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        </article>
      </main>

      {locale === "pt-BR" ? <Footer /> : <IntlFooter locale={locale} />}
    </div>
  );
}
