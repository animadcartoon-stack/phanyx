import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "PHANYX RH",

  description:
    "Aplicativo do PHANYX para registro de ponto e acesso aos recursos de RH.",

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