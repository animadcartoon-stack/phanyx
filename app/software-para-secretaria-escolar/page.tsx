import type { Metadata } from "next";
import RegistrarPage from "@/components/marketing/RegistrarPage";
import { registrarCopy } from "@/lib/registrar-marketing";
import { marketingAlternates, marketingPath } from "@/lib/public-marketing";

const copy = registrarCopy["pt-BR"];
export const metadata: Metadata = {
  title: { absolute: copy.title }, description: copy.description,
  alternates: { ...marketingAlternates("registrar"), canonical: marketingPath("pt-BR", "registrar") },
  openGraph: { title: copy.title, description: copy.description, locale: "pt_BR", url: marketingPath("pt-BR", "registrar") },
};

export default function RegistrarBrazilPage() { return <RegistrarPage locale="pt-BR" />; }
