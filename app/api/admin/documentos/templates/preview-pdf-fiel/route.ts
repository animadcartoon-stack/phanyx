import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function substituirExemplos(texto: string, config: any) {
  const valores: Record<string, string> = {
    nomeInstituicao: config?.nomeFantasia || "Instituição Exemplo",
    cnpjInstituicao: config?.cnpj || "00.000.000/0001-00",
    dataAtual: new Date().toLocaleDateString("pt-BR"),
    cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "Cidade",
  };

  let final = texto;

  for (const [chave, valor] of Object.entries(valores)) {
    final = final.replaceAll(`{{${chave}}}`, valor);
  }

  return final.replaceAll(/{{[^}]+}}/g, "-");
}

export async function POST(req: NextRequest) {
  let browser: any = null;

  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: { instituicaoId: user.instituicaoId },
    });

    const conteudoHtml = substituirExemplos(
      String(body?.conteudo || ""),
      config
    );

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 18mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: white;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
    }

    .conteudo {
      width: 100%;
    }

    .conteudo p {
      margin-top: 0;
    }

    .conteudo img {
      max-width: 100%;
    }
  </style>
</head>
<body>
  <main class="conteudo">
    ${conteudoHtml}
  </main>
</body>
</html>`;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "18mm",
        right: "18mm",
        bottom: "18mm",
        left: "18mm",
      },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=previa-fiel.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => null);
    }

    console.error("Erro ao gerar PDF fiel:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao gerar PDF fiel" },
      { status: 500 }
    );
  }
}