import type { Page } from "puppeteer-core";

const seletorFontes = ".phanyx-conteudo [style*='font-family' i]";
const familiasGenericas = [
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
  "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "math", "emoji", "fangsong",
];

export async function fontesSubstituidasNaPrevia(page: Page): Promise<string[]> {
  // Colhe uma amostra de cada família explícita, sem incluir o texto no diagnóstico.
  const amostras = await page.evaluate((seletor, genericas) => {
    const fontes = new Map<string, { indice: number; familia: string }>();
    const elementos = document.querySelectorAll<HTMLElement>(seletor);
    for (const [indice, elemento] of Array.from(elementos).entries()) {
      if (fontes.size === 12) break;
      if (!elemento.style.fontFamily || !elemento.getClientRects().length) continue;
      const temTexto = Array.from(elemento.childNodes).some(
        no => no.nodeType === Node.TEXT_NODE && no.textContent?.trim()
      );
      if (!temTexto) continue;
      const familia = getComputedStyle(elemento).fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
      const chave = familia.toLowerCase();
      if (!familia || familia.length > 80 || genericas.includes(chave) || fontes.has(chave)) continue;
      fontes.set(chave, { indice, familia });
    }
    return [...fontes.values()];
  }, seletorFontes, familiasGenericas);
  if (!amostras.length) return [];

  const sessao = await page.createCDPSession();
  try {
    await sessao.send("DOM.enable");
    await sessao.send("CSS.enable");
    const { root } = await sessao.send("DOM.getDocument");
    const { nodeIds } = await sessao.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: seletorFontes });
    const substituidas = await Promise.all(amostras.map(async ({ indice, familia }) => {
      const nodeId = nodeIds[indice];
      if (!nodeId) return null;
      const { fonts } = await sessao.send("CSS.getPlatformFontsForNode", { nodeId });
      const usadas = fonts.filter(fonte => fonte.glyphCount > 0);
      const chave = familia.toLowerCase();
      return usadas.length && !usadas.some(fonte => fonte.familyName.toLowerCase() === chave)
        ? familia
        : null;
    }));
    return substituidas.filter((familia): familia is string => familia !== null);
  } finally {
    await sessao.detach().catch(() => {});
  }
}
