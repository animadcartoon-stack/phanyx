import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("RhAppEntry");
  return {
  title: "PHANYX RH",

  description:
    t("metadataDescription"),

  manifest: "/manifest-rh.json",

  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PHANYX RH",
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

export default function RhAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
