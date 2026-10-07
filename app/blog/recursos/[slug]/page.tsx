import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PhanyxResourceArticle from "@/components/marketing/PhanyxResourceArticle";
import {
  getPhanyxResourceBySlug,
  phanyxResourceKeys,
  phanyxResourceLanguagePaths,
  phanyxResourcePages,
  phanyxResourcePath,
} from "@/lib/phanyx-resource-pages";

const siteUrl = "https://www.phanyx.com.br";

type PageProps = { params: { slug: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return phanyxResourceKeys.map((key) => ({ slug: phanyxResourcePages["pt-BR"][key].slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const article = getPhanyxResourceBySlug("pt-BR", params.slug);
  if (!article) return {};
  const canonical = `${siteUrl}${phanyxResourcePath("pt-BR", article.key)}`;
  const languages = Object.fromEntries(
    Object.entries(phanyxResourceLanguagePaths(article.key)).map(([locale, path]) => [locale, `${siteUrl}${path}`]),
  );
  return {
    title: `${article.title} | PHANYX`,
    description: article.description,
    alternates: { canonical, languages: { ...languages, "x-default": `${siteUrl}${phanyxResourcePath("pt-BR", article.key)}` } },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      url: canonical,
      title: article.title,
      description: article.description,
      images: [{ url: article.image, width: 1536, height: 1024, alt: article.imageAlt }],
    },
  };
}

export default function ResourcePage({ params }: PageProps) {
  const article = getPhanyxResourceBySlug("pt-BR", params.slug);
  if (!article) notFound();
  const url = `${siteUrl}${phanyxResourcePath("pt-BR", article.key)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: `${siteUrl}${article.image}`,
    mainEntityOfPage: url,
    inLanguage: "pt-BR",
    publisher: { "@type": "Organization", name: "PHANYX", url: siteUrl },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PhanyxResourceArticle locale="pt-BR" article={article} />
    </>
  );
}
