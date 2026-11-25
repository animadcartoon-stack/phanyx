import type { Metadata } from "next";
import PaginaInstitucionalPhanyx from "@/components/marketing/PaginaInstitucionalPhanyx";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Canal do PHANYX para informações sobre privacidade e dados pessoais.",
  robots: { index: false, follow: true },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <PaginaInstitucionalPhanyx
      titulo="Política de Privacidade"
      orientacao="Escreva ao suporte para solicitar a política aplicável ou tirar dúvidas sobre privacidade e dados pessoais."
      canal="suporte"
    />
  );
}
