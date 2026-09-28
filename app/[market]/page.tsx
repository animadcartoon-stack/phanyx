import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalizedMarketingPage from "@/components/marketing/LocalizedMarketingPage";
import { localeEhSuportado, type LocalePhanyx } from "@/i18n/config";
import { marketingAlternates, marketingCopy, marketingPath } from "@/lib/public-marketing";

export const dynamicParams = false;
export function generateStaticParams() { return ["pt-PT", "en-US", "es-ES", "fr-FR"].map((market) => ({ market })); }

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const { market } = await params;
  if (!localeEhSuportado(market) || market === "pt-BR") return {};
  const copy = marketingCopy[market];
  return {
    title: { absolute: copy.homeTitle }, description: copy.homeDescription,
    alternates: { ...marketingAlternates("home"), canonical: marketingPath(market, "home") },
    openGraph: { title: copy.homeTitle, description: copy.homeDescription, locale: market.replace("-", "_"), url: marketingPath(market, "home") },
  };
}

export default async function MarketHomePage({ params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  if (!localeEhSuportado(market) || market === "pt-BR") notFound();
  return <LocalizedMarketingPage locale={market as LocalePhanyx} section="home" />;
}
