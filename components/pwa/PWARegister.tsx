"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("PHANYX PWA registrado:", registration.scope);
      } catch (error) {
        console.error("Erro ao registrar PWA:", error);
      }
    });
  }, []);

  return null;
}