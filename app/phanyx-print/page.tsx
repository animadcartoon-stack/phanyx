import type { Metadata } from "next";
import PhanyxPrintPage from "@/components/marketing/PhanyxPrintPage";
import {
  phanyxPrintAlternates,
  phanyxPrintCopy,
  phanyxPrintPath,
} from "@/lib/phanyx-print-i18n";

const copy = phanyxPrintCopy["pt-BR"];

export const metadata: Metadata = {
  title: { absolute: copy.seoTitle },
  description: copy.seoDescription,
  keywords: [...copy.keywords],
  alternates: phanyxPrintAlternates(),
  openGraph: {
    title: copy.seoTitle,
    description: copy.seoDescription,
    locale: "pt_BR",
    url: phanyxPrintPath("pt-BR"),
    images: ["/images/phanyx-print-icon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: copy.seoTitle,
    description: copy.seoDescription,
    images: ["/images/phanyx-print-icon.png"],
  },
};

export default function PhanyxPrintBrazilPage() {
  return <PhanyxPrintPage locale="pt-BR" />;
}
