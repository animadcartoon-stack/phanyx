import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalizedMarketingPage from "@/components/marketing/LocalizedMarketingPage";
import LocalizedPlansPage from "@/components/marketing/LocalizedPlansPage";
import SearchIntentPage from "@/components/marketing/SearchIntentPage";
import EnrollmentPage from "@/components/marketing/EnrollmentPage";
import RegistrarPage from "@/components/marketing/RegistrarPage";
import BackgroundRemoverPage from "@/components/marketing/BackgroundRemoverPage";
import { enrollmentCopy } from "@/lib/enrollment-marketing";
import { registrarCopy } from "@/lib/registrar-marketing";
import { searchIntentCopy } from "@/lib/search-intents";
import type { ForeignLocale } from "@/lib/localized-plans";
import { localeEhSuportado } from "@/i18n/config";
import {
  marketingAlternates,
  marketingCopy,
  marketingLocales,
  marketingPath,
  marketingSection,
} from "@/lib/public-marketing";
import {
  backgroundRemoverAlternates,
  backgroundRemoverLocaleFromSlug,
  backgroundRemoverLocales,
  backgroundRemoverPageCopy,
  backgroundRemoverPath,
  backgroundRemoverSlugs,
} from "@/lib/background-remover-i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...marketingLocales
      .filter((market) => market !== "pt-BR")
      .flatMap((market) =>
        (
          [
            "academic",
            "plans",
            "school",
            "lms",
            "success",
            "enrollment",
            "registrar",
          ] as const
        ).map((section) => ({
          market,
          section: marketingPath(market, section).split("/").at(-1)!,
        }))
      ),
    ...backgroundRemoverLocales
      .filter((market) => market !== "pt-BR")
      .map((market) => ({
        market,
        section: backgroundRemoverSlugs[market],
      })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string; section: string }>;
}): Promise<Metadata> {
  const { market, section: slug } = await params;

  if (!localeEhSuportado(market) || market === "pt-BR") return {};

  const removerLocale = backgroundRemoverLocaleFromSlug(market, slug);

  if (removerLocale) {
    const copy = backgroundRemoverPageCopy[removerLocale];

    return {
      title: { absolute: copy.seoTitle },
      description: copy.seoDescription,
      keywords: [...copy.keywords],
      alternates: {
        ...backgroundRemoverAlternates(),
        canonical: backgroundRemoverPath(removerLocale),
      },
      openGraph: {
        title: copy.seoTitle,
        description: copy.seoDescription,
        locale: removerLocale.replace("-", "_"),
        url: backgroundRemoverPath(removerLocale),
      },
    };
  }

  const section = marketingSection(market, slug);
  if (!section || section === "home") return {};

  const copy = marketingCopy[market];
  const intent =
    section === "school" || section === "lms" || section === "success"
      ? searchIntentCopy[market as ForeignLocale][section]
      : null;

  const title =
    section === "registrar"
      ? registrarCopy[market].title
      : section === "enrollment"
        ? enrollmentCopy[market].title
        : intent?.title ??
          (section === "plans" ? copy.plansTitle : copy.seoTitle);

  const description =
    section === "registrar"
      ? registrarCopy[market].description
      : section === "enrollment"
        ? enrollmentCopy[market].description
        : intent?.description ??
          (section === "plans" ? copy.plansDescription : copy.seoDescription);

  return {
    title: { absolute: title },
    description,
    alternates: {
      ...marketingAlternates(section),
      canonical: marketingPath(market, section),
    },
    openGraph: {
      title,
      description,
      locale: market.replace("-", "_"),
      url: marketingPath(market, section),
    },
  };
}

export default async function MarketSectionPage({
  params,
}: {
  params: Promise<{ market: string; section: string }>;
}) {
  const { market, section: slug } = await params;

  if (!localeEhSuportado(market) || market === "pt-BR") notFound();

  const removerLocale = backgroundRemoverLocaleFromSlug(market, slug);
  if (removerLocale) {
    return <BackgroundRemoverPage locale={removerLocale} />;
  }

  const section = marketingSection(market, slug);
  if (!section || section === "home") notFound();

  if (section === "plans") {
    return <LocalizedPlansPage locale={market as ForeignLocale} />;
  }
  if (section === "enrollment") {
    return <EnrollmentPage locale={market} />;
  }
  if (section === "registrar") {
    return <RegistrarPage locale={market} />;
  }
  if (section === "school" || section === "lms" || section === "success") {
    return (
      <SearchIntentPage
        locale={market as ForeignLocale}
        section={section}
      />
    );
  }

  return (
    <LocalizedMarketingPage
      locale={market as ForeignLocale}
      section="academic"
    />
  );
}
