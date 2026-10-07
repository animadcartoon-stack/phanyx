import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { LocalePhanyx } from "@/i18n/config";
import {
  blogHeroImage,
  blogToolLinks,
  editorHeroImage,
  phanyxBlogCopy,
  phanyxBlogLanguagePaths,
  rankingImage,
} from "@/lib/phanyx-blog-hub";
import {
  phanyxResourceKeys,
  phanyxResourcePages,
  phanyxResourcePath,
} from "@/lib/phanyx-resource-pages";

function IntlFooter({ locale }: { locale: LocalePhanyx }) {
  const copy = phanyxBlogCopy[locale];
  const tools = blogToolLinks(locale);
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2">
        <div>
          <p className="font-bold tracking-[0.18em]">PHANYX</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{copy.referenceText}</p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-300">{copy.explore}</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
            <Link href={tools.ranking}>{copy.rankingTitle}</Link>
            <Link href={tools.editorArticle}>{copy.editorTitle}</Link>
            <Link href={tools.plans}>{copy.trialButton}</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t border-white/10 px-6 py-5 text-xs text-slate-500">
        Â© 2026 PHANYX. {copy.rights}
      </div>
    </footer>
  );
}

export default function BlogHubPage({ locale }: { locale: LocalePhanyx }) {
  const copy = phanyxBlogCopy[locale];
  const tools = blogToolLinks(locale);
  const languagePaths = phanyxBlogLanguagePaths();
  const heroSrc = blogHeroImage[locale];
  const heroWidth = 2172;
  const heroHeight = 724;

  return (
    <div lang={locale}>
      {locale === "pt-BR" ? (
        <Header />
      ) : (
        <LocalizedHeader locale={locale} section="academic" languagePaths={languagePaths} />
      )}

      <main className="bg-white text-slate-900">
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-14">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{copy.kicker}</p>
          <h1 className="text-4xl font-bold md:text-5xl">{copy.heading}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{copy.intro}</p>

          <figure className="mx-auto mt-6 w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
            <Image
              src={heroSrc}
              alt={copy.heroAlt}
              width={heroWidth}
              height={heroHeight}
              priority
              className="h-auto w-full"
              sizes="(max-width: 1280px) 94vw, 1152px"
            />
          </figure>
        </section>

        <section className="border-y border-slate-200 bg-slate-50" aria-labelledby="phanyx-recursos">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{copy.platformKicker}</p>
              <h2 id="phanyx-recursos" className="mt-2 text-3xl font-bold md:text-4xl">{copy.platformHeading}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">{copy.platformIntro}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {phanyxResourceKeys.map((key) => {
                const item = phanyxResourcePages[locale][key];
                return (
                  <Link
                    key={key}
                    href={phanyxResourcePath(locale, key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{item.eyebrow}</p>
                    <h3 className="mt-2 text-xl font-bold leading-snug group-hover:text-blue-700">{item.shortTitle}</h3>
                    <p className="mt-2 leading-6 text-slate-600">{item.description}</p>
                    <p className="mt-4 text-sm font-semibold text-blue-600">{copy.readMore}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white" aria-labelledby="ferramentas-gratuitas">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <Image
                src={editorHeroImage[locale]}
                alt={copy.toolsHeading}
                width={1536}
                height={1024}
                className="h-auto w-full rounded-2xl border border-slate-200 shadow-sm"
                sizes="(max-width: 1024px) 100vw, 520px"
              />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{copy.toolsKicker}</p>
                <h2 id="ferramentas-gratuitas" className="mt-2 text-3xl font-bold md:text-4xl">{copy.toolsHeading}</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">{copy.toolsIntro}</p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Image
                  src={rankingImage[locale]}
                  alt={copy.rankingTitle}
                  width={1536}
                  height={1024}
                  className="aspect-[3/2] w-full object-cover"
                  sizes="(max-width: 768px) 100vw, 560px"
                />
                <div className="p-6">
                  <p className="text-sm font-semibold text-blue-600">{copy.rankingEyebrow}</p>
                  <h3 className="mt-2 text-2xl font-bold">{copy.rankingTitle}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{copy.rankingDescription}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={tools.ranking} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{copy.rankingButton}</Link>
                    <Link href={tools.remover} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400">{copy.removerButton}</Link>
                  </div>
                </div>
              </article>

              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Image
                  src={editorHeroImage[locale]}
                  alt={copy.editorTitle}
                  width={1536}
                  height={1024}
                  className="aspect-[3/2] w-full object-cover"
                  sizes="(max-width: 768px) 100vw, 560px"
                />
                <div className="p-6">
                  <p className="text-sm font-semibold text-blue-600">{copy.editorEyebrow}</p>
                  <h3 className="mt-2 text-2xl font-bold">{copy.editorTitle}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{copy.editorDescription}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={tools.editorArticle} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{copy.editorButton}</Link>
                    <Link href={tools.remover} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:border-slate-400">{copy.openEditorButton}</Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50" aria-labelledby="conteudos-gestao">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{copy.managementKicker}</p>
                <h2 id="conteudos-gestao" className="mt-2 text-3xl font-bold md:text-4xl">{copy.managementHeading}</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">{copy.managementIntro}</p>
              </div>
              <Image
                src="/images/blog-hub/phanyx-gestao-integrada-visao-geral.webp"
                alt={copy.managementHeading}
                width={1200}
                height={900}
                className="h-auto w-full rounded-2xl border border-slate-200 shadow-sm"
                sizes="(max-width: 1024px) 100vw, 620px"
              />
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {copy.managementArticles.map((article) => (
                <Link key={article.href} href={article.href} className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm">
                  <h3 className="text-lg font-semibold">{article.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{article.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">{copy.trialKicker}</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">{copy.trialHeading}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">{copy.trialText}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {[copy.adminArea, copy.departments, copy.teacherArea, copy.studentArea].map((label) => (
                  <span key={label} className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm">{label}</span>
                ))}
              </div>
              <Link href={tools.plans} className="mt-7 inline-flex rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600">{copy.trialButton}</Link>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="text-3xl font-bold">{copy.referenceHeading}</h2>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">{copy.referenceText}</p>
          </div>
        </section>
      </main>

      {locale === "pt-BR" ? <Footer /> : <IntlFooter locale={locale} />}
    </div>
  );
}
