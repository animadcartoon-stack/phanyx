"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { VARIANTES_FONTES_CERTIFICADO } from "@/lib/certificados/fontesCertificado";
import { trechosTextoCertificado, type TextoCertificado } from "@/lib/certificados/textoCertificado";

const cacheCampos = new WeakMap<object, string[]>();
export function fontesUsadasCertificado(campos: readonly TextoCertificado[]) {
  const fontes = new Set<string>();
  for (const campo of campos) {
    if (campo.tipo === "FORMA" || campo.tipo === "IMAGEM") continue;
    let lista = cacheCampos.get(campo);
    if (!lista) {
      lista = [campo.fonte || "Arial"];
      const html = campo.textoHtml ?? campo.dadosJson?.textoHtml;
      if (html) for (const trecho of trechosTextoCertificado(html)) if (trecho.estilo.fontFamily) lista.push(trecho.estilo.fontFamily);
      cacheCampos.set(campo, lista);
    }
    for (const familia of lista) for (const nome of familia.split(",")) {
      const limpo = nome.trim().replace(/^['"]|['"]$/g, "");
      if (VARIANTES_FONTES_CERTIFICADO[limpo]) fontes.add(limpo);
    }
  }
  return [...fontes].sort();
}

export function urlFontesCertificado(fontes: readonly string[]) {
  if (!fontes.length) return null;
  return "https://fonts.googleapis.com/css2?" + fontes.map(nome => "family=" + encodeURIComponent(nome).replace(/%20/g, "+") + ":" + VARIANTES_FONTES_CERTIFICADO[nome]).join("&") + "&display=swap";
}

function FontesCertificado({ campos }: { campos: readonly TextoCertificado[] }) {
  const chaveFontes = useMemo(() => fontesUsadasCertificado(campos).join("|"), [campos]);
  const fontes = useMemo(() => chaveFontes ? chaveFontes.split("|") : [], [chaveFontes]);
  const url = urlFontesCertificado(fontes);
  const [carregada, setCarregada] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelado = false;
    // O link esta no HTML inicial: a exportacao tambem aguarda a folha de estilos.
    const link = Array.from(document.querySelectorAll<HTMLLinkElement>('link[data-fontes-certificado-link]')).find(item => item.href === url);
    const finalizar = async () => {
      try { await Promise.all(fontes.map(nome => document.fonts.load(`16px "${nome}"`))); await document.fonts.ready; }
      catch { /* A fonte de reserva continua disponivel em caso de falha de rede. */ }
      if (!cancelado) setCarregada(url);
    };
    if (link?.sheet) void finalizar();
    else { link?.addEventListener("load", finalizar); link?.addEventListener("error", finalizar); }
    return () => { cancelado = true; link?.removeEventListener("load", finalizar); link?.removeEventListener("error", finalizar); };
  }, [url, fontes]);
  return <>
    {url && <link key={url} rel="stylesheet" href={url} data-fontes-certificado-link="true" />}
    <span hidden data-fontes-certificado={url && carregada !== url ? "carregando" : "pronto"} />
  </>;
}

export default memo(FontesCertificado);
