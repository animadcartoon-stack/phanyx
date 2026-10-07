import type { Metadata } from "next";
import OpenCoursesArticle from "@/components/marketing/OpenCoursesArticle";
import {
  openCoursesArticleAlternates,
  openCoursesArticleCopy,
  openCoursesArticleImages,
  openCoursesArticlePath,
} from "@/lib/open-courses-article";

const locale = "pt-BR";
const copy = openCoursesArticleCopy[locale];
const path = openCoursesArticlePath(locale);

export const metadata: Metadata = {
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
    locale: "pt_BR",
    url: path,
    images: [openCoursesArticleImages[locale]],
  },
  twitter: {
    card: "summary_large_image",
    title: copy.title,
    description: copy.description,
    images: [openCoursesArticleImages[locale]],
  },
};

export default function PlataformaEadCursosLivresPage() {
  return <OpenCoursesArticle locale={locale} />;
}
