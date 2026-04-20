import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curso de Teologia EAD | Bacharel Livre em Teologia",
  description:
    "Curso de teologia EAD com formação completa, flexível e reconhecida. Matrículas abertas para 2026. Estude no seu ritmo.",
  keywords: [
    "curso de teologia EAD",
    "bacharel livre em teologia",
    "faculdade teológica online",
    "curso bíblico online",
    "teologia EAD Brasil"
  ],
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}