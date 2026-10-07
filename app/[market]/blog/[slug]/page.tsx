import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DigitalSchoolManagementArticle from "@/components/marketing/DigitalSchoolManagementArticle";
import ImageToolsBlogArticle from "@/components/marketing/ImageToolsBlogArticle";
import OnlineSchoolManagementArticle from "@/components/marketing/OnlineSchoolManagementArticle";
import OpenCoursesArticle from "@/components/marketing/OpenCoursesArticle";
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
  imageToolsArticleAlternates,
  imageToolsArticleCopy,
  imageToolsArticleImages,
  imageToolsArticlePath,
  imageToolsArticleSlugs,
  type ImageToolsArticleKind,
} from "@/lib/image-tools-blog";
import {
  onlineSchoolArticleAlternates,
  onlineSchoolArticleCopy,
  onlineSchoolArticleImage,
  onlineSchoolArticlePath,
  onlineSchoolArticleSlugs,
} from "@/lib/online-school-management-article";
import {
  openCoursesArticleAlternates,
  openCoursesArticleCopy,
  openCoursesArticleImages,
  openCoursesArticlePath,
  openCoursesArticleSlugs,
} from "@/lib/open-courses-article";
import {
  schoolGuideAlternates,
  schoolGuideCopy,
  schoolGuidePath,
  schoolGuideSlugs,
} from "@/lib/school-guide";

type BlogLocale = Exclude<LocalePhanyx, "pt-BR">;
const locales: BlogLocale[] = ["pt-PT", "en-US", "es-ES", "fr-FR"];
const imageKinds: ImageToolsArticleKind[] = [
  "background-removers",
  "image-editor",
];

type Params = {
  params: Promise<{ market: string; slug: string }>;
};

function schoolGuideLocale(market: string, slug: string): BlogLocale | null {
  return (
    locales.find(
      (locale) => locale === market && schoolGuideSlugs[locale] === slug,
    ) ?? null
  );
}

function onlineArticleLocale(market: string, slug: string): BlogLocale | null {
  return (
    locales.find(
      (locale) =>
        locale === market && onlineSchoolArticleSlugs[locale] === slug,
    ) ?? null
  );
}

function digitalArticleLocale(market: string, slug: string): BlogLocale | null {
  return (
    locales.find(
      (locale) =>
        locale === market && digitalSchoolArticleSlugs[locale] === slug,
    ) ?? null
  );
}

function openCoursesLocale(market: string, slug: string): BlogLocale | null {
  return (
    locales.find(
      (locale) =>
        locale === market && openCoursesArticleSlugs[locale] === slug,
    ) ?? null
  );
}

function imageToolsArticleMatch(
  market: string,
  slug: string,
): { locale: BlogLocale; kind: ImageToolsArticleKind } | null {
  for (const locale of locales) {
    if (locale !== market) continue;

    for (const kind of imageKinds) {
      if (imageToolsArticleSlugs[kind][locale] === slug) {
        return { locale, kind };
      }
    }
  }

  return null;
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
    ...locales.map((market) => ({
      market,
      slug: openCoursesArticleSlugs[market],
    })),
    ...imageKinds.flatMap((kind) =>
      locales.map((market) => ({
        market,
        slug: imageToolsArticleSlugs[kind][market],
      })),
    ),
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

  const openLocale = openCoursesLocale(market, slug);
  if (openLocale) {
    const copy = openCoursesArticleCopy[openLocale];
    const path = openCoursesArticlePath(openLocale);
    const image = openCoursesArticleImages[openLocale];

    return {
      title: { absolute: copy.title },
      description: copy.description,
      alternates: {
        canonical: path,
        ...openCoursesArticleAlternates(),
      },
      openGraph: {
        title: copy.title,
        description: copy.description,
        type: "article",
        locale: openLocale.replace("-", "_"),
        url: path,
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        title: copy.title,
        description: copy.description,
        images: [image],
      },
    };
  }

  const imageMatch = imageToolsArticleMatch(market, slug);
  if (imageMatch) {
    const { locale, kind } = imageMatch;
    const copy = imageToolsArticleCopy[kind][locale];
    const path = imageToolsArticlePath(kind, locale);
    const image = imageToolsArticleImages[kind][locale];

    return {
      title: { absolute: copy.title },
      description: copy.description,
      keywords: [...copy.keywords],
      alternates: {
        canonical: path,
        ...imageToolsArticleAlternates(kind),
      },
      openGraph: {
        title: copy.title,
        description: copy.description,
        type: "article",
        locale: locale.replace("-", "_"),
        url: path,
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        title: copy.title,
        description: copy.description,
        images: [image],
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

  const openLocale = openCoursesLocale(market, slug);
  if (openLocale) {
    return <OpenCoursesArticle locale={openLocale} />;
  }

  const imageMatch = imageToolsArticleMatch(market, slug);
  if (imageMatch) {
    return (
      <ImageToolsBlogArticle
        locale={imageMatch.locale}
        kind={imageMatch.kind}
      />
    );
  }

  notFound();
}
