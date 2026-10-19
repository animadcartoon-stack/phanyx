"use client";
import { useEffect, useState } from "react";
import { VARIANTES_FONTES_CERTIFICADO, ESCRITAS_FONTES_CERTIFICADO } from "@/lib/certificados/fontesCertificado";

type StatusFonte = "carregando" | "pronto" | "erro";
type Entrada = { link: HTMLLinkElement; pronta: Promise<void>; erro: boolean; usos: number };
const caches = new WeakMap<Document, Map<string, Entrada>>();
const LIMITE = 48;

function entradaFonte(nome: string, repetir: boolean) {
  let cache = caches.get(document);
  if (!cache) { cache = new Map();caches.set(document, cache); }
  let entrada = cache.get(nome);
  if (entrada?.erro && repetir && !entrada.usos) { entrada.link.remove();cache.delete(nome);entrada = undefined; }
  if (!entrada) {
    const link = document.createElement("link");link.rel = "stylesheet";link.dataset.amostrasFontes = nome;
    link.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(nome).replace(/%20/g, "+") + ":" + VARIANTES_FONTES_CERTIFICADO[nome] + "&display=swap";
    const nova = { link, erro: false, usos: 0 } as Entrada;
    nova.pronta = new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => terminar(false), 15000);
      function terminar(ok: boolean) { window.clearTimeout(timeout);link.onload = null;link.onerror = null;nova.erro = !ok;ok ? resolve() : reject(new Error("font-stylesheet")); }
      link.onload = () => terminar(true);link.onerror = () => terminar(false);
    });
    entrada = nova;cache.set(nome, entrada);document.head.appendChild(link);
  }
  cache.delete(nome);cache.set(nome, entrada);entrada.usos++;
  for (const [chave, antiga] of cache) { if (cache.size <= LIMITE) break;if (!antiga.usos) { antiga.link.remove();cache.delete(chave); } }
  return entrada;
}

export default function useAmostrasFontes(fontes: readonly string[], texto: string, tentativa: number) {
  const chave = fontes.filter(nome => VARIANTES_FONTES_CERTIFICADO[nome]).sort().join("|");
  const [estado, setEstado] = useState<{ chave: string; fontes: Record<string, StatusFonte> }>({ chave: "", fontes: {} });
  useEffect(() => {
    let cancelado = false;
    const entradas: Entrada[] = [];
    setEstado({ chave, fontes: {} });
    if (!chave) return;
    for (const nome of chave.split("|")) {
      const entrada = entradaFonte(nome, tentativa > 0);entradas.push(entrada);
      void entrada.pronta.then(async () => {
        if (cancelado) return;
        const escrita = ESCRITAS_FONTES_CERTIFICADO[nome];
        const amostra = escrita === "greek" ? "Ελληνική γραφή" : escrita === "arabic" ? "الخط العربي" : texto || "Abc";
        if (document.fonts.check(`28px "${nome}"`, amostra)) return;
        const faces = await document.fonts.load(`28px "${nome}"`, amostra);
        if (!faces.length) throw new Error("font-face");
      }).then(() => {
        if (!cancelado) setEstado(atual => ({ chave, fontes: { ...(atual.chave === chave ? atual.fontes : {}), [nome]: "pronto" } }));
      }, () => {
        if (!cancelado) setEstado(atual => ({ chave, fontes: { ...(atual.chave === chave ? atual.fontes : {}), [nome]: "erro" } }));
      });
    }
    return () => { cancelado = true;for (const entrada of entradas) entrada.usos--; };
  }, [chave, texto, tentativa]);
  return (nome: string): StatusFonte => !VARIANTES_FONTES_CERTIFICADO[nome] ? "pronto" : estado.chave === chave ? estado.fontes[nome] || "carregando" : "carregando";
}
