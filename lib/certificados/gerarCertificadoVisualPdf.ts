import { abrirBrowserPuppeteer } from "@/lib/certificados/puppeteer-browser";
import { criarTokenRenderCertificado } from "@/lib/certificados/certificado-render-token";

type GerarPdfVisualParams = {
  certificadoId: number;
  origin: string;
};

export async function gerarCertificadoVisualPdf({
  certificadoId,
  origin,
}: GerarPdfVisualParams) {
  const token = criarTokenRenderCertificado(certificadoId);

  const url = new URL(`/certificados/render/${certificadoId}`, origin);
  url.searchParams.set("t", token);

  const browser = await abrirBrowserPuppeteer();

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1123,
      height: 794,
      deviceScaleFactor: 1,
    });

    await page.goto(url.toString(), {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    await page.evaluate(async () => {
      // @ts-ignore
      if (document.fonts?.ready) {
        // @ts-ignore
        await document.fonts.ready;
      }
    });

    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );

    const pdf = await page.pdf({
      printBackground: true,
      width: "1123px",
      height: "794px",
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
      pageRanges: "1",
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => null);
  }
}