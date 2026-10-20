"use client";
import { useEffect, useState } from "react";
import { VARIANTES_FONTES_CERTIFICADO, ESCRITAS_FONTES_CERTIFICADO } from "@/lib/certificados/fontesCertificado";

type StatusFonte = "carregando" | "pronto" | "erro";
type Entrada = { link: HTMLLinkElement; pronta: Promise<void>; erro: boolean; usos: number; amostras: Map<string, Promise<void>> };
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
    const nova = { link, erro: false, usos: 0, amostras: new Map<string, Promise<void>>() } as Entrada;
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

function textoDaAmostra(nome: string, texto: string) {
  const escrita = ESCRITAS_FONTES_CERTIFICADO[nome];
  return escrita === "greek" ? "Ελληνική γραφή" : escrita === "arabic" ? "الخط العربي" : texto || "Abc";
}

function carregarAmostra(entrada: Entrada, nome: string, amostra: string) {
  let pronta = entrada.amostras.get(amostra);
  if (!pronta) {
    pronta = entrada.pronta.then(async () => {
      if (!entrada.usos) throw new Error("font-sample-inactive");
      if (document.fonts.check(`28px "${nome}"`, amostra)) return;
      const faces = await document.fonts.load(`28px "${nome}"`, amostra);
      if (!faces.length) throw new Error("font-face");
    }).catch(erro => { if (entrada.amostras.get(amostra) === pronta) entrada.amostras.delete(amostra);throw erro; });
    entrada.amostras.set(amostra, pronta);
    // As familias continuam limitadas a 48; cada uma guarda no maximo 8 amostras.
    while (entrada.amostras.size > 8) entrada.amostras.delete(entrada.amostras.keys().next().value!);
  }
  return pronta;
}

type Resultado = { entrada: Entrada; amostra: string; status: StatusFonte };

export default function useAmostrasFontes(fontes: readonly string[], texto: string, tentativa: number) {
  const chave = fontes.filter(nome => VARIANTES_FONTES_CERTIFICADO[nome]).sort().join("|");
  const [estado, setEstado] = useState<Record<string, Resultado>>({});
  useEffect(() => {
    let cancelado = false;
    const entradas: Entrada[] = [];
    if (!chave) return;
    for (const nome of chave.split("|")) {
      const entrada = entradaFonte(nome, tentativa > 0);entradas.push(entrada);
      const amostra = textoDaAmostra(nome, texto);
      function publicar(status: StatusFonte) {
        if (cancelado) return;
        setEstado(atual => {
          const anterior = atual[nome];
          if (anterior?.entrada === entrada && anterior.amostra === amostra && anterior.status === status) return atual;
          return { ...atual, [nome]: { entrada, amostra, status } };
        });
      }
      void carregarAmostra(entrada, nome, amostra).then(() => publicar("pronto"), () => publicar("erro"));
    }
    return () => { cancelado = true;for (const entrada of entradas) entrada.usos--; };
  }, [chave, texto, tentativa]);
  return (nome: string): StatusFonte => {
    if (!VARIANTES_FONTES_CERTIFICADO[nome]) return "pronto";
    const anterior = estado[nome];
    return anterior && typeof document !== "undefined" && anterior.entrada === caches.get(document)?.get(nome) && anterior.amostra === textoDaAmostra(nome, texto)
      ? anterior.status : "carregando";
  };
}
