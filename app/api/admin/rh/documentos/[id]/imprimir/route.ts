import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { renderizarHtmlTipTapNoPdf } from "@/lib/pdf/renderizarHtmlTipTap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function carregarImagemPdf(
  pdfDoc: PDFDocument,
  url?: string | null,
  baseUrl?: string
) {
  try {
    if (!url) return null;

    const finalUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    const res = await fetch(finalUrl);

    if (!res.ok) return null;

    const bytes = await res.arrayBuffer();

    if (finalUrl.toLowerCase().includes(".png")) {
      return await pdfDoc.embedPng(bytes);
    }

    return await pdfDoc.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);

    if (!id) {
      return NextResponse.json({ error: "Documento inválido" }, { status: 400 });
    }

    const documento = await prisma.documentoRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        funcionario: {
          select: {
            nome: true,
            cpf: true,
          },
        },
        instituicao: {
          include: {
            configuracaoInstituicao: true,
          },
        },
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    const config = documento.instituicao?.configuracaoInstituicao;
    const baseUrl = new URL(req.url).origin;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const logo = await carregarImagemPdf(pdfDoc, config?.logoUrl, baseUrl);
    const papel = await carregarImagemPdf(
      pdfDoc,
      config?.papelTimbradoUrl,
      baseUrl
    );

    let page = pdfDoc.addPage([595.28, 841.89]);
    let y = 700;

    function aplicarLayoutPagina() {
      const largura = page.getWidth();
      const altura = page.getHeight();

      if (
        config?.usarPapelTimbrado &&
        config?.estiloPapelTimbrado === "PAPEL_PROPRIO" &&
        papel
      ) {
        page.drawImage(papel, {
          x: 0,
          y: 0,
          width: largura,
          height: altura,
        });

        y = 720;
        return;
      }

      if (
        config?.usarPapelTimbrado &&
        config?.estiloPapelTimbrado === "PHANYX_CLASSICO"
      ) {
        page.drawRectangle({
          x: 0,
          y: 742,
          width: largura,
          height: 100,
          color: rgb(0.07, 0.07, 0.07),
        });

        if (logo) {
          page.drawImage(logo, {
            x: 55,
            y: 765,
            width: 62,
            height: 62,
          });
        }

        page.drawText(config?.nomeFantasia || "Instituição", {
          x: 130,
          y: 797,
          size: 16,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        page.drawText(documento.titulo || "Documento RH", {
          x: 130,
          y: 775,
          size: 9,
          font,
          color: rgb(1, 1, 1),
        });

        page.drawRectangle({
          x: 0,
          y: 0,
          width: largura,
          height: 28,
          color: rgb(0.07, 0.07, 0.07),
        });

        page.drawText(`${config?.cnpj || ""}  ${config?.telefone || ""}`, {
          x: 45,
          y: 10,
          size: 6,
          font,
          color: rgb(1, 1, 1),
        });

        y = 705;
        return;
      }

      y = 790;
    }

    function novaPagina() {
      page = pdfDoc.addPage([595.28, 841.89]);
      aplicarLayoutPagina();
    }

    aplicarLayoutPagina();

    await renderizarHtmlTipTapNoPdf({
      html: documento.conteudo || "",
      page,
      pdfDoc,
      font,
      bold: fontBold,
      x: 55,
      yInicial: y,
      maxWidth: 485,
      pageWidth: 595.28,
      pageHeight: 841.89,
      criarNovaPagina: async () => {
        novaPagina();
        return page;
      },
    });

    const bytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=documento-rh-${documento.id}.pdf`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar PDF RH." },
      { status: 500 }
    );
  }
}