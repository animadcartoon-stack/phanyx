import { abrirBrowserPuppeteer } from "@/lib/certificados/puppeteer-browser";
import { criarTokenRenderCracha } from "@/lib/crachas/cracha-render-token";

type GerarCrachaVisualPdfParams = {
  crachaEmitidoId: number;
  origin: string;
  larguraMm: number;
  alturaMm: number;
  possuiVerso: boolean;
};

function numeroPositivo(valor: unknown, padrao: number) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero <= 0) {
    return padrao;
  }

  return numero;
}

async function esperarFontesImagensEConteudo(page: any) {
  await page.evaluate(async () => {
    // @ts-ignore
    if (document.fonts?.ready) {
      // @ts-ignore
      await document.fonts.ready;
    }

    await Promise.all(
      Array.from(document.images).map((imagem: any) => {
        if (imagem.complete) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          imagem.onload = () => resolve();
          imagem.onerror = () => resolve();
        });
      })
    );

    const inicio = Date.now();

    while (Date.now() - inicio < 10000) {
      const pronto =
        document.documentElement.dataset.crachaRenderPronto === "true";

      if (pronto) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });
}

export async function gerarCrachaVisualPdf({
  crachaEmitidoId,
  origin,
  larguraMm,
  alturaMm,
  possuiVerso,
}: GerarCrachaVisualPdfParams) {
  const larguraFinalMm = numeroPositivo(larguraMm, 54);
  const alturaFinalMm = numeroPositivo(alturaMm, 86);

  const token = criarTokenRenderCracha(crachaEmitidoId);

const url = new URL(`/crachas/render/${crachaEmitidoId}`, origin);
url.searchParams.set("t", token);

  const browser = await abrirBrowserPuppeteer();

  try {
    const page = await browser.newPage();

    const larguraViewport =
      larguraFinalMm > alturaFinalMm ? 760 : 480;

    const alturaViewport =
      larguraFinalMm > alturaFinalMm ? 480 : 760;

    await page.setViewport({
      width: larguraViewport,
      height: alturaViewport,
      deviceScaleFactor: 2,
    });

    await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await esperarFontesImagensEConteudo(page);

    const erroRender = await page.evaluate(() => {
      return (
        document.documentElement.dataset.crachaRenderErro ||
        ""
      );
    });

    if (erroRender) {
      throw new Error(erroRender);
    }

    const paginasEncontradas = await page.evaluate(() => {
      return document.querySelectorAll("[data-cracha-pagina]").length;
    });

    if (paginasEncontradas === 0) {
      throw new Error(
        "A página de renderização não produziu nenhuma face do crachá."
      );
    }

    const totalPaginasEsperado = possuiVerso ? 2 : 1;

    const pdf = await page.pdf({
      printBackground: true,
      width: `${larguraFinalMm}mm`,
      height: `${alturaFinalMm}mm`,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      preferCSSPageSize: true,
      pageRanges:
        totalPaginasEsperado === 2 ? "1-2" : "1",
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => null);
  }
}