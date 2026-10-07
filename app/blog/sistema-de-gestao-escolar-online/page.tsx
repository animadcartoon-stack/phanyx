import type { Metadata } from "next";
import OnlineSchoolManagementArticle from "@/components/marketing/OnlineSchoolManagementArticle";
import {
  onlineSchoolArticleAlternates,
  onlineSchoolArticleCopy,
  onlineSchoolArticleImage,
  onlineSchoolArticlePath,
} from "@/lib/online-school-management-article";

const locale = "pt-BR";
const copy = onlineSchoolArticleCopy[locale];
const path = onlineSchoolArticlePath(locale);

export const metadata: Metadata = {
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
    locale: "pt_BR",
    url: path,
    images: [onlineSchoolArticleImage],
  },
};

export default function SistemaOnlinePage() {
  return <OnlineSchoolManagementArticle locale={locale} />;
}
