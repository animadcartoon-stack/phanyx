import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { abrirBrowserPuppeteer } from "@/lib/certificados/puppeteer-browser";
import { criarTokenRenderCertificado } from "@/lib/certificados/certificado-render-token";

type GerarPdfVisualParams = {
  certificadoId: number;
  origin: string;
};

const LARGURA_PADRAO = 1123;
const ALTURA_PADRAO = 794;

function ehPdf(url?: string | null) {
  if (!url) return false;

  const limpa = url.split("?")[0].split("#")[0].toLowerCase();

  return limpa.endsWith(".pdf") || limpa.includes(".pdf");
}

async function baixarArquivoComoBuffer(url: string) {
  const resposta = await fetch(url, {
    cache: "no-store",
  });

  if (!resposta.ok) {
    throw new Error(`Não foi possível baixar o modelo PDF: ${resposta.status}`);
  }

  const arrayBuffer = await resposta.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

async function esperarFontesEImagens(page: any) {
  await page.evaluate(async () => {
    // @ts-ignore
    if (document.fonts?.ready) {
      // @ts-ignore
      await document.fonts.ready;
    }

    await Promise.all(
      Array.from(document.images).map((img: any) => {
        if (img.complete) return Promise.resolve();

        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  });
}

async function gerarOverlayPngTransparente({
  certificadoId,
  origin,
  largura,
  altura,
}: {
  certificadoId: number;
  origin: string;
  largura: number;
  altura: number;
}) {
  const token = criarTokenRenderCertificado(certificadoId);

  const url = new URL(`/certificados/render/${certificadoId}`, origin);
  url.searchParams.set("t", token);
  url.searchParams.set("overlay", "1");

  const browser = await abrirBrowserPuppeteer();

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: largura,
      height: altura,
      deviceScaleFactor: 2,
    });

    await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await esperarFontesEImagens(page);

    const imagem = await page.screenshot({
      type: "png",
      omitBackground: true,
      clip: {
        x: 0,
        y: 0,
        width: largura,
        height: altura,
      },
    });

    return Buffer.from(imagem);
  } finally {
    await browser.close().catch(() => null);
  }
}

async function gerarPdfVisualDireto({
  certificadoId,
  origin,
  largura,
  altura,
}: {
  certificadoId: number;
  origin: string;
  largura: number;
  altura: number;
}) {
  const token = criarTokenRenderCertificado(certificadoId);

  const url = new URL(`/certificados/render/${certificadoId}`, origin);
  url.searchParams.set("t", token);

  const browser = await abrirBrowserPuppeteer();

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: largura,
      height: altura,
      deviceScaleFactor: 1,
    });

    await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await esperarFontesEImagens(page);

    const pdf = await page.pdf({
      printBackground: true,
      width: `${largura}px`,
      height: `${altura}px`,
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

async function gerarPdfComFundoPdfOriginal({
  certificadoId,
  origin,
  templateUrl,
  largura,
  altura,
}: {
  certificadoId: number;
  origin: string;
  templateUrl: string;
  largura: number;
  altura: number;
}) {
  const [modeloBuffer, overlayPng] = await Promise.all([
    baixarArquivoComoBuffer(templateUrl),
    gerarOverlayPngTransparente({
      certificadoId,
      origin,
      largura,
      altura,
    }),
  ]);

  const modeloDoc = await PDFDocument.load(modeloBuffer);
  const saidaDoc = await PDFDocument.create();

  const [paginaModelo] = await saidaDoc.copyPages(modeloDoc, [0]);
  saidaDoc.addPage(paginaModelo);

  const pagina = saidaDoc.getPages()[0];
  const tamanhoPagina = pagina.getSize();

  const imagemOverlay = await saidaDoc.embedPng(overlayPng);

  pagina.drawImage(imagemOverlay, {
    x: 0,
    y: 0,
    width: tamanhoPagina.width,
    height: tamanhoPagina.height,
  });

  const pdfFinal = await saidaDoc.save();

  return Buffer.from(pdfFinal);
}

export async function gerarCertificadoVisualPdf({
  certificadoId,
  origin,
}: GerarPdfVisualParams) {
  const certificado = await prisma.certificado.findUnique({
    where: {
      id: certificadoId,
    },
    include: {
      instituicao: {
        select: {
          certificadoTemplateUrl: true,
          certificadoPreviewUrl: true,
        },
      },
    },
  });

  if (!certificado) {
    throw new Error("Certificado não encontrado.");
  }

  const templateUrl = certificado.instituicao?.certificadoTemplateUrl || null;

  const largura = LARGURA_PADRAO;
  const altura = ALTURA_PADRAO;

  if (ehPdf(templateUrl)) {
    return gerarPdfComFundoPdfOriginal({
      certificadoId,
      origin,
      templateUrl: templateUrl!,
      largura,
      altura,
    });
  }

  return gerarPdfVisualDireto({
    certificadoId,
    origin,
    largura,
    altura,
  });
}