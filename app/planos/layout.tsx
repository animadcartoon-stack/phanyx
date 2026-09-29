import type { Metadata } from "next";
import { marketingAlternates, marketingCopy } from "@/lib/public-marketing";

export const metadata: Metadata = {
  title: { absolute: marketingCopy["pt-BR"].plansTitle },
  description: marketingCopy["pt-BR"].plansDescription,
  alternates: marketingAlternates("plans"),
};

export default function PlanosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
