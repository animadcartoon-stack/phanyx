import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: {
    slug: string;
  };
}): Promise<Metadata> {
  const slug = encodeURIComponent(
    String(params.slug || "")
  );

  const t = await getTranslations("RhAppAccess");

  return {
    title: t("productName"),

    description: t("metadataDescription"),

    manifest: `/rh-app/${slug}/manifest.webmanifest`,

    icons: {
      icon: "/app-rh-icon-192.png",
      apple: "/app-rh-icon-192.png",
    },

    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("productName"),
    },

    robots: {
      index: false,
      follow: false,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f172a",
};

export default function RhInstituicaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}