import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { abrirBrowserPuppeteer } from "@/lib/certificados/puppeteer-browser";

export const runtime = "nodejs";

const LARGURA_CERTIFICADO = 1123;
const ALTURA_CERTIFICADO = 794;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function gerarPreviewPdfComoImagem(pdfUrl: string) {
  let browser: any = null;

  try {
    browser = await abrirBrowserPuppeteer();

    const page = await browser.newPage();

    await page.setViewport({
      width: LARGURA_CERTIFICADO,
      height: ALTURA_CERTIFICADO,
      deviceScaleFactor: 2,
    });

    const pdfSemToolbar = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;

    await page.setContent(
      `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                width: ${LARGURA_CERTIFICADO}px;
                height: ${ALTURA_CERTIFICADO}px;
                overflow: hidden;
                background: white;
              }

              iframe {
                width: ${LARGURA_CERTIFICADO}px;
                height: ${ALTURA_CERTIFICADO}px;
                border: 0;
                margin: 0;
                padding: 0;
                display: block;
                background: white;
              }
            </style>
          </head>

          <body>
            <iframe src="${escaparHtml(pdfSemToolbar)}"></iframe>
          </body>
        </html>
      `,
      {
        waitUntil: "networkidle0",
        timeout: 30000,
      }
    );

    await esperar(3000);

    const imagem = await page.screenshot({
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: LARGURA_CERTIFICADO,
        height: ALTURA_CERTIFICADO,
      },
      omitBackground: false,
    });

    return Buffer.from(imagem);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Instituição do usuário não encontrada." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    const tipoArquivo = String(file.type || "").toLowerCase();
    const nomeArquivo = String(file.name || "");

    if (
      tipoArquivo !== "application/pdf" &&
      !nomeArquivo.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Envie um arquivo PDF." },
        { status: 400 }
      );
    }

    const nomeSeguro = nomeArquivo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.\-]/g, "_");

    const agora = Date.now();

    const caminhoArquivo = `certificados/modelos/instituicao-${user.instituicaoId}-${agora}-${nomeSeguro}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blob = await put(caminhoArquivo, buffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });

    const previewBuffer = await gerarPreviewPdfComoImagem(blob.url);

    const caminhoPreview = `certificados/modelos/previews/instituicao-${user.instituicaoId}-${agora}-${nomeSeguro.replace(
      /\.pdf$/i,
      ""
    )}.png`;

    const previewBlob = await put(caminhoPreview, previewBuffer, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
    });

    await prisma.instituicao.update({
      where: { id: user.instituicaoId },
      data: {
        certificadoTemplateUrl: blob.url,
        certificadoPreviewUrl: previewBlob.url,
      },
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
      previewUrl: previewBlob.url,
      certificadoPreviewUrl: previewBlob.url,
    });
  } catch (error: any) {
    console.error("ERRO UPLOAD MODELO CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao fazer upload do modelo.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}