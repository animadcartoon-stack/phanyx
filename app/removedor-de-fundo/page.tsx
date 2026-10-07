import type { Metadata } from "next";
import BackgroundRemoverPage from "@/components/marketing/BackgroundRemoverPage";
import {
  backgroundRemoverAlternates,
  backgroundRemoverPageCopy,
  backgroundRemoverPath,
} from "@/lib/background-remover-i18n";

const copy = backgroundRemoverPageCopy["pt-BR"];

export const metadata: Metadata = {
  title: { absolute: copy.seoTitle },
  description: copy.seoDescription,
  keywords: [...copy.keywords],
  alternates: backgroundRemoverAlternates(),
  openGraph: {
    title: copy.seoTitle,
    description: copy.seoDescription,
    locale: "pt_BR",
    url: backgroundRemoverPath("pt-BR"),
  },
};

export default function RemovedorDeFundoPage() {
  return <BackgroundRemoverPage locale="pt-BR" />;
}
