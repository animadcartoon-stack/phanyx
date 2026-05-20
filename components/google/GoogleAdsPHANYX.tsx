"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export default function GoogleAdsPHANYX() {
  useEffect(() => {
    async function carregarAds() {
      try {
        const res = await fetch("/api/admin/integracoes/google-ads", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data?.ativo || !data?.adsId) return;

        if (document.getElementById("google-ads-phanyx-script")) return;

        window.dataLayer = window.dataLayer || [];
        window.gtag =
          window.gtag ||
          function gtag() {
            window.dataLayer?.push(arguments as any);
          };

        const script = document.createElement("script");
        script.id = "google-ads-phanyx-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${data.adsId}`;

        document.head.appendChild(script);

        window.gtag("js", new Date());
        window.gtag("config", data.adsId);
      } catch {
        // Não quebra o PHANYX se o Ads falhar.
      }
    }

    carregarAds();
  }, []);

  return null;
}