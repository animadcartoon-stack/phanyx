import type { Metadata } from "next";
import DigitalSchoolManagementArticle from "@/components/marketing/DigitalSchoolManagementArticle";
import {
  digitalSchoolArticleAlternates,
  digitalSchoolArticleCopy,
  digitalSchoolArticleImages,
  digitalSchoolArticlePath,
} from "@/lib/digital-school-management-article";

const locale = "pt-BR";
const copy = digitalSchoolArticleCopy[locale];
const path = digitalSchoolArticlePath(locale);

export const metadata: Metadata = {
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
    locale: "pt_BR",
    url: path,
    images: [digitalSchoolArticleImages[locale]],
  },
};

export default function GestaoEscolarDigitalPage() {
  return <DigitalSchoolManagementArticle locale={locale} />;
}
