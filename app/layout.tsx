import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PHANYX) | Sistema Acadêmico Inteligente",
  description: "Sistema Acadêmico Inteligente",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        suppressHydrationWarning
        className={`${inter.variable} antialiased bg-gray-100`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}