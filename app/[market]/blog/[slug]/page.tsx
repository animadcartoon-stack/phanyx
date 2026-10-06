import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DigitalSchoolManagementArticle from "@/components/marketing/DigitalSchoolManagementArticle";
import OnlineSchoolManagementArticle from "@/components/marketing/OnlineSchoolManagementArticle";
import SchoolGuidePage from "@/components/marketing/SchoolGuidePage";
import type { LocalePhanyx } from "@/i18n/config";
import {
  digitalSchoolArticleAlternates,
  digitalSchoolArticleCopy,
  digitalSchoolArticleImages,
  digitalSchoolArticlePath,
  digitalSchoolArticleSlugs,
} from "@/lib/digital-school-management-article";
import {
  onlineSchoolArticleAlternates,
  onlineSchoolArticleCopy,
  onlineSchoolArticleImage,
  onlineSchoolArticlePath,
  onlineSchoolArticleSlugs,
} from "@/lib/online-school-management-article";
import {
  schoolGuideAlternates,
  schoolGuideCopy,
  schoolGuidePath,
  schoolGuideSlugs,
} from "@/lib/school-guide";

type BlogLocale = Exclude<LocalePhanyx, "pt-BR">;
const locales: BlogLocale[] = ["pt-PT", "en-US", "es-ES", "fr-FR"];

type Params = {
  params: Promise<{ market: string; slug: string }>;
};

function schoolGuideLocale(market: string, slug: string): BlogLocale | null {
  return locales.find(
    (locale) => locale === market && schoolGuideSlugs[locale] === slug,
  ) ?? null;
}

function onlineArticleLocale(market: string, slug: string): BlogLocale | null {
  return locales.find(
    (locale) =>
      locale === market && onlineSchoolArticleSlugs[locale] === slug,
  ) ?? null;
}

function digitalArticleLocale(market: string, slug: string): BlogLocale | null {
  return locales.find(
    (locale) =>
      locale === market && digitalSchoolArticleSlugs[locale] === slug,
  ) ?? null;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...locales.map((market) => ({
      market,
      slug: schoolGuideSlugs[market],
    })),
    ...locales.map((market) => ({
      market,
      slug: onlineSchoolArticleSlugs[market],
    })),
    ...locales.map((market) => ({
      market,
      slug: digitalSchoolArticleSlugs[market],
    })),
  ];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { market, slug } = await params;

  const guideLocale = schoolGuideLocale(market, slug);
  if (guideLocale) {
    const copy = schoolGuideCopy[guideLocale];
    const path = schoolGuidePath(guideLocale);

    return {
      title: { absolute: copy.title },
      description: copy.description,
      alternates: {
        canonical: path,
        ...schoolGuideAlternates(),
      },
      openGraph: {
        title: copy.title,
        description: copy.description,
        type: "article",
        locale: guideLocale.replace("-", "_"),
        url: path,
        images: ["/images/guia-sistema-gestao-escolar-sala.webp"],
      },
    };
  }

  const onlineLocale = onlineArticleLocale(market, slug);
  if (onlineLocale) {
    const copy = onlineSchoolArticleCopy[onlineLocale];
    const path = onlineSchoolArticlePath(onlineLocale);

    return {
      title: { absolute: copy.title },
      description: copy.description,
      alternates: {
        canonical: path,
        ...onlineSchoolArticleAlternates(),
      },
      openGraph: {
        title: copy.title,
        description: copy.description,
        type: "article",
        locale: onlineLocale.replace("-", "_"),
        url: path,
        images: [onlineSchoolArticleImage],
      },
    };
  }

  const digitalLocale = digitalArticleLocale(market, slug);
  if (digitalLocale) {
    const copy = digitalSchoolArticleCopy[digitalLocale];
    const path = digitalSchoolArticlePath(digitalLocale);

    return {
      title: { absolute: copy.title },
      description: copy.description,
      alternates: {
        canonical: path,
        ...digitalSchoolArticleAlternates(),
      },
      openGraph: {
        title: copy.title,
        description: copy.description,
        type: "article",
        locale: digitalLocale.replace("-", "_"),
        url: path,
        images: [digitalSchoolArticleImages[digitalLocale]],
      },
    };
  }

  return {};
}

export default async function Page({ params }: Params) {
  const { market, slug } = await params;

  const guideLocale = schoolGuideLocale(market, slug);
  if (guideLocale) {
    return <SchoolGuidePage locale={guideLocale} />;
  }

  const onlineLocale = onlineArticleLocale(market, slug);
  if (onlineLocale) {
    return <OnlineSchoolManagementArticle locale={onlineLocale} />;
  }

  const digitalLocale = digitalArticleLocale(market, slug);
  if (digitalLocale) {
    return <DigitalSchoolManagementArticle locale={digitalLocale} />;
  }

  notFound();
}
