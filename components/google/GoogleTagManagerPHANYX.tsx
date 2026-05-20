"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function GoogleTagManagerPHANYX() {
  const [containerId, setContainerId] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/public/google-tag-manager", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (res.ok && data?.containerId && data?.ativo) {
          setContainerId(data.containerId);
        }
      } catch {
        // não bloqueia o site
      }
    }

    carregar();
  }, []);

  if (!containerId) return null;

  return (
    <>
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
          })(window,document,'script','dataLayer','${containerId}');
        `}
      </Script>
    </>
  );
}