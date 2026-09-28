import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalizedMarketingPage from "@/components/marketing/LocalizedMarketingPage";
import { localeEhSuportado, type LocalePhanyx } from "@/i18n/config";
import { marketingAlternates, marketingCopy, marketingLocales, marketingPath, marketingSection } from "@/lib/public-marketing";

export const dynamicParams = false;
export function generateStaticParams() {
  return marketingLocales.filter((market) => market !== "pt-BR").flatMap((market) =>
    (["academic", "plans"] as const).map((section) => ({ market, section: marketingPath(market, section).split("/").at(-1)! })));
}

export async function generateMetadata({ params }: { params: Promise<{ market: string; section: string }> }): Promise<Metadata> {
  const { market, section: slug } = await params;
  if (!localeEhSuportado(market) || market === "pt-BR") return {};
  const section = marketingSection(market, slug);
  if (!section || section === "home") return {};
  const copy = marketingCopy[market];
  const title = section === "plans" ? copy.plansTitle : copy.seoTitle;
  const description = section === "plans" ? copy.plansDescription : copy.seoDescription;
  return {
    title: { absolute: title }, description,
    alternates: { ...marketingAlternates(section), canonical: marketingPath(market, section) },
    openGraph: { title, description, locale: market.replace("-", "_"), url: marketingPath(market, section) },
  };
}

export default async function MarketSectionPage({ params }: { params: Promise<{ market: string; section: string }> }) {
  const { market, section: slug } = await params;
  if (!localeEhSuportado(market) || market === "pt-BR") notFound();
  const section = marketingSection(market, slug);
  if (!section || section === "home") notFound();
  return <LocalizedMarketingPage locale={market as LocalePhanyx} section={section} />;
}
