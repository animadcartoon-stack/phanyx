import type { Metadata } from "next";
import PaginaInstitucionalPhanyx from "@/components/marketing/PaginaInstitucionalPhanyx";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Canal do PHANYX para informações sobre termos de uso e contratação.",
  robots: { index: false, follow: true },
};

export default function TermosDeUsoPage() {
  return (
    <PaginaInstitucionalPhanyx
      titulo="Termos de Uso"
      orientacao="Escreva ao comercial para solicitar os termos aplicáveis ou tirar dúvidas sobre o uso e a contratação da plataforma."
      canal="comercial"
    />
  );
}
