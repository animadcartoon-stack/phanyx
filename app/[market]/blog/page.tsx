import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogHubPage from "@/components/marketing/BlogHubPage";
import { localeEhSuportado, type LocalePhanyx } from "@/i18n/config";
import { phanyxBlogMetadata } from "@/lib/phanyx-blog-hub";

type PageProps = { params: { market: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return ["pt-PT", "en-US", "es-ES", "fr-FR"].map((market) => ({ market }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!localeEhSuportado(params.market) || params.market === "pt-BR") return {};
  return phanyxBlogMetadata(params.market as LocalePhanyx);
}

export default function LocalizedBlogPage({ params }: PageProps) {
  if (!localeEhSuportado(params.market) || params.market === "pt-BR") notFound();
  return <BlogHubPage locale={params.market as LocalePhanyx} />;
}
