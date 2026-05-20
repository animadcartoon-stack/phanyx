import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import GoogleAnalyticsPHANYX from "@/components/google/GoogleAnalyticsPHANYX";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Script from "next/script";

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
  },

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

 const cookieStore = await cookies();
const token = cookieStore.get("token")?.value;

let googleTagManagerId: string | null = null;

if (token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      instituicaoId: number;
    };

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: decoded.instituicaoId },
      select: {
        googleTagManagerId: true,
        googleTagManagerAtivo: true,
      },
    });

    if (instituicao?.googleTagManagerAtivo && instituicao.googleTagManagerId) {
      googleTagManagerId = instituicao.googleTagManagerId;
    }
  } catch {
    googleTagManagerId = null;
  }
}

console.log("TOKEN GTM:", token);
console.log("GTM ID ENCONTRADO:", googleTagManagerId);

  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins&family=Montserrat&family=Roboto&family=Open+Sans&family=Lato&family=Playfair+Display&family=Merriweather&family=Libre+Baskerville&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&family=Alex+Brush&family=Sacramento&family=Indie+Flower&family=Caveat&display=swap" rel="stylesheet" />
    <meta name="google-site-verification" content="NwoAwG25GlnNtcQGaQ2PAIe0EXXGQl6VrogGfBj563A" />
  
  </head>
      <body
  suppressHydrationWarning
  className={`${inter.variable} antialiased bg-gray-100`}
>
  <AuthProvider>
  <GoogleAnalyticsPHANYX />

  {googleTagManagerId && (
    <Script id="google-tag-manager-phanyx" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){
          w[l]=w[l]||[];
          w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),
              dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;
          j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
          f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${googleTagManagerId}');
      `}
    </Script>
  )}

  {children}
</AuthProvider>
</body>
    </html>
  );
}