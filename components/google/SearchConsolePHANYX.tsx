"use client";

import { useEffect } from "react";

function extrairContent(meta: string) {
  const match = meta.match(/content=["']([^"']+)["']/i);
  return match?.[1] || meta.trim();
}

export default function SearchConsolePHANYX() {
  useEffect(() => {
    async function carregarSearchConsole() {
      try {
        const res = await fetch("/api/admin/integracoes/search-console", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data?.ativo || !data?.meta) return;

        const content = extrairContent(data.meta);

        if (!content) return;

        const jaExiste = document.querySelector(
          'meta[name="google-site-verification"][data-phanyx-search-console="true"]'
        );

        if (jaExiste) return;

        const meta = document.createElement("meta");
        meta.name = "google-site-verification";
        meta.content = content;
        meta.setAttribute("data-phanyx-search-console", "true");

        document.head.appendChild(meta);
      } catch {
        // Não quebra o PHANYX se falhar.
      }
    }

    carregarSearchConsole();
  }, []);

  return null;
}