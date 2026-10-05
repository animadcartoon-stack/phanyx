import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SchoolGuidePage from "@/components/marketing/SchoolGuidePage";
import type { LocalePhanyx } from "@/i18n/config";
import { schoolGuideAlternates, schoolGuideCopy, schoolGuidePath, schoolGuideSlugs } from "@/lib/school-guide";

type GuideLocale = Exclude<LocalePhanyx, "pt-BR">;
const locales: GuideLocale[] = ["pt-PT", "en-US", "es-ES", "fr-FR"];
type Params = { params: Promise<{ market: string; slug: string }> };

function guideLocale(market: string, slug: string): GuideLocale | null {
  return locales.find((locale) => locale === market && schoolGuideSlugs[locale] === slug) ?? null;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((market) => ({ market, slug: schoolGuideSlugs[market] }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { market, slug } = await params;
  const locale = guideLocale(market, slug);
  if (!locale) return {};
  const copy = schoolGuideCopy[locale];
  const path = schoolGuidePath(locale);
  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: { canonical: path, ...schoolGuideAlternates() },
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: "article",
      locale: locale.replace("-", "_"),
      url: path,
      images: ["/images/guia-sistema-gestao-escolar-sala.webp"],
    },
  };
}

export default async function Page({ params }: Params) {
  const { market, slug } = await params;
  const locale = guideLocale(market, slug);
  if (!locale) notFound();
  return <SchoolGuidePage locale={locale} />;
}
