"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: any[];
  }
}

export default function GoogleTagManagerInstituicao() {
  useEffect(() => {
    async function carregarGTM() {
      try {
        const res = await fetch("/api/admin/integracoes/google-tag-manager", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data?.ativo || !data?.containerId) return;

        if (document.getElementById("google-tag-manager-phanyx-script")) {
          return;
        }

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          "gtm.start": new Date().getTime(),
          event: "gtm.js",
        });

        const script = document.createElement("script");
        script.id = "google-tag-manager-phanyx-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${data.containerId}`;

        document.head.appendChild(script);
      } catch {
        // Não quebra o PHANYX se o GTM falhar.
      }
    }

    carregarGTM();
  }, []);

  return null;
}