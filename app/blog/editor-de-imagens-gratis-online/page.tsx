import type { Metadata } from "next";
import ImageToolsBlogArticle from "@/components/marketing/ImageToolsBlogArticle";
import {
  imageToolsArticleAlternates,
  imageToolsArticleCopy,
  imageToolsArticleImages,
  imageToolsArticlePath,
} from "@/lib/image-tools-blog";

const kind = "image-editor" as const;
const locale = "pt-BR" as const;
const copy = imageToolsArticleCopy[kind][locale];

export const metadata: Metadata = {
  title: { absolute: copy.title },
  description: copy.description,
  keywords: [...copy.keywords],
  alternates: {
    canonical: imageToolsArticlePath(kind, locale),
    ...imageToolsArticleAlternates(kind),
  },
  openGraph: {
    title: copy.title,
    description: copy.description,
    type: "article",
    locale: "pt_BR",
    url: imageToolsArticlePath(kind, locale),
    images: [imageToolsArticleImages[kind][locale]],
  },
  twitter: {
    card: "summary_large_image",
    title: copy.title,
    description: copy.description,
    images: [imageToolsArticleImages[kind][locale]],
  },
};

export default function Page() {
  return <ImageToolsBlogArticle locale={locale} kind={kind} />;
}
