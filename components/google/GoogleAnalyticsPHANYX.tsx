"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function GoogleAnalyticsPHANYX() {
  const [measurementId, setMeasurementId] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/public/google-analytics", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (res.ok && data?.googleAnalyticsId && data?.googleAnalyticsAtivo) {
          setMeasurementId(data.googleAnalyticsId);
        }
      } catch {
        // não bloqueia o site
      }
    }

    carregar();
  }, []);

  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />

      <Script id="google-analytics-phanyx" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}