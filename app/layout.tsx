import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import GoogleAnalyticsPHANYX from "@/components/google/GoogleAnalyticsPHANYX";
import GoogleTagManagerInstituicao from "@/components/google/GoogleTagManagerInstituicao";
import GoogleAdsPHANYX from "@/components/google/GoogleAdsPHANYX";
import PWARegister from "@/components/pwa/PWARegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://phanyx.com.br"),

  title: {
    default: "PHANYX | Sistema de Gestão Escolar Completo",
    template: "%s | PHANYX",
  },

  description:
    "Sistema de gestão escolar completo para escolas, faculdades e EAD. Controle acadêmico, financeiro, alunos, professores, provas e certificados em uma única plataforma.",

  keywords: [
    "sistema de gestão escolar",
    "software educacional",
    "plataforma EAD",
    "gestão acadêmica",
    "sistema para escolas",
    "sistema acadêmico",
    "controle escolar",
  ],

  authors: [{ name: "PHANYX" }],

  icons: {
  icon: "/icon.png",
  apple: "/apple-touch-icon.png",
},

manifest: "/manifest.json",

appleWebApp: {
  capable: true,
  statusBarStyle: "default",
  title: "PHANYX",
},

themeColor: "#0f172a",

  openGraph: {
    title: "PHANYX | Sistema de Gestão Escolar",
    description:
      "Plataforma completa para gestão escolar, acadêmica e EAD.",
    url: "https://phanyx.com.br",
    siteName: "PHANYX",
    locale: "pt_BR",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins&family=Montserrat&family=Roboto&family=Open+Sans&family=Lato&family=Playfair+Display&family=Merriweather&family=Libre+Baskerville&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&family=Alex+Brush&family=Sacramento&family=Indie+Flower&family=Caveat&display=swap" rel="stylesheet" />
    <meta name="google-site-verification" content="NwoAwG25GlnNtcQGaQ2PAIe0EXXGQl6VrogGfBj563A" />
    <meta name="application-name" content="PHANYX" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="PHANYX" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#0f172a" />
  </head>
      <body
  suppressHydrationWarning
  className={`${inter.variable} antialiased bg-gray-100`}
>
  
<PWARegister />
  <AuthProvider>
  <GoogleAnalyticsPHANYX />
  <GoogleTagManagerInstituicao />
  <GoogleAdsPHANYX />
  {children}
</AuthProvider>

</body>
    </html>
  );
}