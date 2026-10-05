import type { Metadata } from "next";
import EnrollmentPage from "@/components/marketing/EnrollmentPage";
import { enrollmentCopy } from "@/lib/enrollment-marketing";
import { marketingAlternates, marketingPath } from "@/lib/public-marketing";

const copy = enrollmentCopy["pt-BR"];
export const metadata: Metadata = {
  title: { absolute: copy.title },
  description: copy.description,
  alternates: { ...marketingAlternates("enrollment"), canonical: marketingPath("pt-BR", "enrollment") },
  openGraph: { title: copy.title, description: copy.description, locale: "pt_BR", url: marketingPath("pt-BR", "enrollment") },
};

export default function EnrollmentBrazilPage() {
  return <EnrollmentPage locale="pt-BR" />;
}
