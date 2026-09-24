import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminDocumentsTemplates");

  return { title: t("page.title") };
}

export default function DocumentTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
