import Image from "next/image";
import Link from "next/link";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { LocalePhanyx } from "@/i18n/config";
import { backgroundRemoverPath } from "@/lib/background-remover-i18n";
import { marketingPath } from "@/lib/public-marketing";
import {
  imageToolsArticleCopy,
  imageToolsArticleImages,
  imageToolsArticleLocales,
  imageToolsArticlePath,
  type ImageToolsArticleKind,
} from "@/lib/image-tools-blog";

const footerCopy: Record<
  LocalePhanyx,
  { explore: string; tool: string; home: string; plans: string; rights: string }
> = {
  "pt-BR": {
    explore: "Explore",
    tool: "Removedor de fundo",
    home: "PHANYX",
    plans: "Planos",
    rights: "Todos os direitos reservados.",
  },
  "pt-PT": {
    explore: "Explorar",
    tool: "Removedor de fundo",
    home: "PHANYX",
    plans: "Planos",
    rights: "Todos os direitos reservados.",
  },
  "en-US": {
    explore: "Explore",
    tool: "Background remover",
    home: "PHANYX",
    plans: "Plans",
    rights: "All rights reserved.",
  },
  "es-ES": {
    explore: "Explorar",
    tool: "Eliminar fondo",
    home: "PHANYX",
    plans: "Planes",
    rights: "Todos los derechos reservados.",
  },
  "fr-FR": {
    explore: "Explorer",
    tool: "Supprimer l’arrière-plan",
    home: "PHANYX",
    plans: "Offres",
    rights: "Tous droits réservés.",
  },
};

export default function ImageToolsBlogArticle({
  locale,
  kind,
}: {
  locale: LocalePhanyx;
  kind: ImageToolsArticleKind;
}) {
  const copy = imageToolsArticleCopy[kind][locale];
  const image = imageToolsArticleImages[kind][locale];
  const path = imageToolsArticlePath(kind, locale);
  const pageUrl = `https://phanyx.com.br${path}`;
  const toolPath = backgroundRemoverPath(locale);
  const otherKind: ImageToolsArticleKind =
    kind === "background-removers" ? "image-editor" : "background-removers";

  const languagePaths = Object.fromEntries(
    imageToolsArticleLocales.map((item) => [
      item,
      imageToolsArticlePath(kind, item),
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
        datePublished: "2026-10-06",
        dateModified: "2026-10-06",
        author: {
          "@type": "Organization",
          name: "PHANYX",
          url: "https://phanyx.com.br",
        },
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
            item:
              locale === "pt-BR"
                ? "https://phanyx.com.br"
                : `https://phanyx.com.br/${locale}`,
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

  const footer = footerCopy[locale];

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      <LocalizedHeader
        locale={locale}
        section="academic"
        languagePaths={languagePaths}
      />

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
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
              height={900}
              sizes="(max-width: 896px) 100vw, 896px"
              className="h-auto w-full object-cover"
              priority
            />
            <figcaption className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {copy.imageCaption}
            </figcaption>
          </figure>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={toolPath}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold !text-white hover:bg-blue-500"
            >
              {copy.ctaButton}
            </Link>
            <Link
              href={imageToolsArticlePath(otherKind, locale)}
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50"
            >
              {copy.kind === "background-removers"
                ? copy.editorLink
                : copy.rankingLink}
            </Link>
          </div>

          {copy.kind === "background-removers" ? (
            <>
              <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <p className="font-semibold text-blue-950">{copy.updated}</p>
                <p className="mt-3 leading-7 text-blue-900">{copy.disclosure}</p>
              </div>

              <section className="mt-14">
                <h2 className="text-3xl font-bold">{copy.criteriaHeading}</h2>
                <p className="mt-4 leading-7 text-slate-700">
                  {copy.criteriaText}
                </p>
              </section>

              <section className="mt-14">
                <h2 className="text-3xl font-bold">{copy.toolsHeading}</h2>
                <p className="mt-4 leading-7 text-slate-700">
                  {copy.toolsIntro}
                </p>

                <div className="mt-8 space-y-7">
                  {copy.tools.map((tool, index) => (
                    <article
                      key={tool.name}
                      className="rounded-2xl border border-slate-200 p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-blue-700">
                            {index + 1}
                          </p>
                          <h3 className="mt-1 text-2xl font-bold">{tool.name}</h3>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
                          {tool.bestFor}
                        </span>
                      </div>

                      <p className="mt-4 leading-7 text-slate-700">
                        {tool.summary}
                      </p>

                      <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-900">
                        {tool.free}
                      </p>

                      <ul className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        {tool.strengths.map((strength) => (
                          <li key={strength}>✓ {strength}</li>
                        ))}
                      </ul>

                      {tool.caution ? (
                        <p className="mt-4 text-sm leading-6 text-amber-800">
                          {tool.caution}
                        </p>
                      ) : null}

                      <a
                        href={tool.official}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-5 inline-flex text-sm font-semibold text-blue-700 underline"
                      >
                        {locale === "en-US"
                          ? "Official site"
                          : locale === "es-ES"
                            ? "Sitio oficial"
                            : locale === "fr-FR"
                              ? "Site officiel"
                              : "Site oficial"}
                      </a>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-3xl font-bold">{copy.verdictHeading}</h2>
                <p className="mt-4 leading-7 text-slate-700">
                  {copy.verdictText}
                </p>
              </section>

              <section className="mt-14 rounded-3xl bg-slate-950 p-8 text-white">
                <h2 className="text-3xl font-bold">{copy.phanyxHeading}</h2>
                <p className="mt-4 leading-7 text-slate-200">{copy.phanyxText}</p>
                <Link
                  href={toolPath}
                  className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold !text-white hover:bg-blue-500"
                >
                  {copy.ctaButton}
                </Link>
              </section>
            </>
          ) : (
            <>
              <section className="mt-14">
                <h2 className="text-3xl font-bold">{copy.whatHeading}</h2>
                {copy.whatParagraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-4 leading-7 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </section>

              <section className="mt-14">
                <h2 className="text-3xl font-bold">{copy.photoshopHeading}</h2>
                {copy.photoshopParagraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-4 leading-7 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </section>

              <section className="mt-14">
                <h2 className="text-3xl font-bold">{copy.freeHeading}</h2>
                <p className="mt-4 leading-7 text-slate-700">{copy.freeIntro}</p>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {copy.freeFeatures.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-slate-200 p-6"
                    >
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="mt-3 leading-7 text-slate-700">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-14 rounded-2xl border border-violet-200 bg-violet-50 p-6">
                <h2 className="text-2xl font-bold text-violet-950">
                  {copy.aiHeading}
                </h2>
                <p className="mt-4 leading-7 text-violet-900">{copy.aiText}</p>
              </section>

              <section className="mt-14">
                <h2 className="text-3xl font-bold">{copy.usesHeading}</h2>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {copy.uses.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                    >
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="mt-3 leading-7 text-slate-700">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-3xl font-bold">{copy.workflowHeading}</h2>
                <ol className="mt-8 space-y-4">
                  {copy.workflow.map((item) => (
                    <li
                      key={item.title}
                      className="rounded-2xl border border-slate-200 p-6"
                    >
                      <h3 className="text-xl font-semibold text-blue-800">
                        {item.title}
                      </h3>
                      <p className="mt-2 leading-7 text-slate-700">
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-14 rounded-3xl bg-slate-950 p-8 text-white">
                <h2 className="text-3xl font-bold">{copy.ctaHeading}</h2>
                <p className="mt-4 leading-7 text-slate-200">{copy.ctaText}</p>
                <Link
                  href={toolPath}
                  className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold !text-white hover:bg-blue-500"
                >
                  {copy.ctaButton}
                </Link>
              </section>
            </>
          )}

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
                <Link className="underline" href={toolPath}>
                  {copy.kind === "background-removers"
                    ? copy.phanyxHeading
                    : copy.ctaHeading}
                </Link>
              </li>
              <li>
                <Link
                  className="underline"
                  href={imageToolsArticlePath(otherKind, locale)}
                >
                  {copy.kind === "background-removers"
                    ? copy.editorLink
                    : copy.rankingLink}
                </Link>
              </li>
            </ul>
          </nav>

          <nav
            aria-label={copy.languagesLabel}
            className="mt-10 border-t border-slate-200 pt-8"
          >
            <h2 className="text-xl font-bold">{copy.languagesLabel}</h2>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {imageToolsArticleLocales.map((item) => (
                <Link
                  key={item}
                  href={imageToolsArticlePath(kind, item)}
                  hrefLang={item}
                  className="text-sm font-semibold text-blue-700 underline"
                >
                  {item}
                </Link>
              ))}
            </div>
          </nav>
        </article>
      </main>

      <footer className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 md:grid-cols-2">
          <div>
            <p className="font-bold tracking-[0.18em]">PHANYX</p>
            <p className="mt-3 text-sm text-slate-400">
              {kind === "background-removers"
                ? copy.description
                : copy.description}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              {footer.explore}
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
              <Link href={toolPath}>{footer.tool}</Link>
              <Link href={locale === "pt-BR" ? "/" : `/${locale}`}>
                {footer.home}
              </Link>
              <Link href={marketingPath(locale, "plans")}>{footer.plans}</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl border-t border-white/10 px-6 py-5 text-xs text-slate-500">
          © 2026 PHANYX. {footer.rights}
        </div>
      </footer>
    </div>
  );
}
