import type { Metadata, Viewport } from "next";

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

  return {
    title: "RH Ponto",

    description:
      "Aplicativo de registro de ponto e recursos de RH.",

    manifest: `/rh-app/${slug}/manifest.webmanifest`,

    icons: {
      icon: "/app-rh-icon-192.png",
      apple: "/app-rh-icon-192.png",
    },

    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "RH Ponto",
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