import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminOperations");
  const title = t("validationsTitle");
  return { title: { absolute: title.includes("PHANYX") ? title : title + " | PHANYX" } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
