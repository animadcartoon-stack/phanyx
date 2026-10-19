"use client";

import { useEffect, useState } from "react";
import { VARIANTES_FONTES_CERTIFICADO } from "@/lib/certificados/fontesCertificado";

type StatusFonte = "carregando" | "pronto" | "erro";

export default function useAmostrasFontes(fontes: readonly string[], texto: string, tentativa: number) {
  const chave = fontes.filter(nome => VARIANTES_FONTES_CERTIFICADO[nome]).sort().join("|");
  const [estado, setEstado] = useState<{ chave: string; fontes: Record<string, StatusFonte> }>({ chave: "", fontes: {} });
  useEffect(() => {
    setEstado({ chave, fontes: {} });
    if (!chave) return;
    let cancelado = false;
    let link: HTMLLinkElement | undefined;
    let limite: number | undefined;
    const nomes = chave.split("|");
    const atualizar = (fontes: Record<string, StatusFonte>) => { if (!cancelado) setEstado({ chave, fontes }); };
    const temporizador = window.setTimeout(() => {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.dataset.amostrasFontes = "true";
      link.href = "https://fonts.googleapis.com/css2?" + nomes.map(nome => "family=" + encodeURIComponent(nome).replace(/%20/g, "+") + ":" + VARIANTES_FONTES_CERTIFICADO[nome]).join("&") + "&display=swap";
      link.onerror = () => atualizar(Object.fromEntries(nomes.map(nome => [nome, "erro"])));
      link.onload = async () => {
        if (cancelado) return;
        const estados = await Promise.all(nomes.map(async nome => {
          try {
            const faces = await document.fonts.load(`28px "${nome}"`, texto || "Abc Ελληνική الخط");
            return [nome, faces.length ? "pronto" : "erro"] as const;
          } catch { return [nome, "erro"] as const; }
        }));
        atualizar(Object.fromEntries(estados));
        window.clearTimeout(limite);
      };
      document.head.appendChild(link);
      limite = window.setTimeout(() => atualizar(Object.fromEntries(nomes.map(nome => [nome, "erro"]))), 15000);
    }, 120);
    return () => { cancelado = true; window.clearTimeout(temporizador); window.clearTimeout(limite); if (link) { link.onload = null; link.onerror = null; link.remove(); } };
  }, [chave, texto, tentativa]);
  return (nome: string): StatusFonte => !VARIANTES_FONTES_CERTIFICADO[nome] ? "pronto" : estado.chave === chave ? estado.fontes[nome] || "carregando" : "carregando";
}
