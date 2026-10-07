import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PhanyxResourceArticle from "@/components/marketing/PhanyxResourceArticle";
import { localeEhSuportado, type LocalePhanyx } from "@/i18n/config";
import {
  getPhanyxResourceBySlug,
  phanyxResourceKeys,
  phanyxResourceLanguagePaths,
  phanyxResourcePages,
  phanyxResourcePath,
  phanyxResourceSection,
} from "@/lib/phanyx-resource-pages";

const siteUrl = "https://www.phanyx.com.br";

type PageProps = { params: { market: string; slug: string; resource: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  const locales: LocalePhanyx[] = ["pt-PT", "en-US", "es-ES", "fr-FR"];
  return locales.flatMap((market) =>
    phanyxResourceKeys.map((key) => ({
      market,
      slug: phanyxResourceSection[market],
      resource: phanyxResourcePages[market][key].slug,
    })),
  );
}

function resolve(params: PageProps["params"]) {
  if (!localeEhSuportado(params.market) || params.market === "pt-BR") return null;
  const locale = params.market as LocalePhanyx;
  if (params.slug !== phanyxResourceSection[locale]) return null;
  const article = getPhanyxResourceBySlug(locale, params.resource);
  return article ? { locale, article } : null;
}

export function generateMetadata({ params }: PageProps): Metadata {
  const found = resolve(params);
  if (!found) return {};
  const { locale, article } = found;
  const canonical = `${siteUrl}${phanyxResourcePath(locale, article.key)}`;
  const languages = Object.fromEntries(
    Object.entries(phanyxResourceLanguagePaths(article.key)).map(([language, path]) => [language, `${siteUrl}${path}`]),
  );
  return {
    title: `${article.title} | PHANYX`,
    description: article.description,
    alternates: { canonical, languages: { ...languages, "x-default": `${siteUrl}${phanyxResourcePath("pt-BR", article.key)}` } },
    openGraph: {
      type: "article",
      locale: locale.replace("-", "_"),
      url: canonical,
      title: article.title,
      description: article.description,
      images: [{ url: article.image, width: 1536, height: 1024, alt: article.imageAlt }],
    },
  };
}

export default function ResourcePage({ params }: PageProps) {
  const found = resolve(params);
  if (!found) notFound();
  const { locale, article } = found;
  const url = `${siteUrl}${phanyxResourcePath(locale, article.key)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: `${siteUrl}${article.image}`,
    mainEntityOfPage: url,
    inLanguage: locale,
    publisher: { "@type": "Organization", name: "PHANYX", url: siteUrl },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PhanyxResourceArticle locale={locale} article={article} />
    </>
  );
}
