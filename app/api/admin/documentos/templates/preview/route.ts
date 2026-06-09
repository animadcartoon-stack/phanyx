import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

async function carregarImagemPdf(pdfDoc: PDFDocument, url?: string | null, baseUrl?: string) {
  try {
    if (!url) return null;

    const finalUrl = url.startsWith("http")
      ? url
      : `${baseUrl}${url}`;

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

function substituirExemplos(texto: string, config: any) {
  const valores: Record<string, string> = {
    nomeInstituicao: config?.nomeFantasia || "Instituição Exemplo",
    cnpjInstituicao: config?.cnpj || "00.000.000/0001-00",
    telefoneInstituicao: config?.telefone || "(00) 00000-0000",
    emailInstituicao: config?.email || "contato@instituicao.com",
    cidadeInstituicao: config?.cidade || "Cidade",
    blocoInstituicao:
      `${config?.nomeFantasia || "Instituição Exemplo"}\n` +
      `CNPJ: ${config?.cnpj || "00.000.000/0001-00"}\n` +
      `${config?.endereco || "Endereço institucional"}${config?.numero ? `, ${config.numero}` : ""}\n` +
      `Telefone: ${config?.telefone || "(00) 00000-0000"}\n` +
      `E-mail: ${config?.email || "contato@instituicao.com"}`,

    nomeAluno: "Aluno Exemplo",
    cpfAluno: "000.000.000-00",
    matriculaAluno: "2026-0001",
    curso: "Bacharel Livre em Teologia",
    statusAluno: "ATIVO",
    statusMatricula: "ATIVA",
    dataMatricula: "03/06/2026",
    dataConclusao: "-",
    semestreAtual: "1º semestre",
    cargaHorariaCurso: "3.200h",
    percentualConclusao: "25%",
    valorContrato: "R$ 0,00",
    referenciaFinanceira: "Pagamento institucional",
    dataAtual: new Date().toLocaleDateString("pt-BR"),
    cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "Cidade",
    responsavelLegal: config?.responsavelNome || "Responsável legal",
    blocoAssinaturaDiretor:
      `${config?.responsavelNome || "Responsável legal"}\n` +
      `${config?.responsavelCargo || "Diretor"}\n` +
      `${config?.nomeFantasia || "Instituição"}`,

    disciplinas:
      "- Antigo Testamento A | 96h | A cursar\n" +
      "- Novo Testamento A | 96h | A cursar\n" +
      "- Teologia Bíblica | 64h | A cursar",

    codigoValidacao: "PHANYX-EXEMPLO-0001",
    urlValidacao: "https://www.phanyx.com.br/validar-documento",
  };

  let final = texto;

  for (const [chave, valor] of Object.entries(valores)) {
    final = final.replaceAll(`{{${chave}}}`, valor);
  }

  return final.replaceAll(/{{[^}]+}}/g, "-");
}

function htmlParaTextoPreview(html: string) {
  return String(html || "")
    .replace(/\r\n/g, "\n")
    .replace(/<p[^>]*>\s*<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/h1>/gi, "\n\n")
    .replace(/<\/h2>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n+$/g, "");
}

export async function POST(req: NextRequest) {
  const user = await getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const config = await prisma.configuracaoInstituicao.findUnique({
    where: { instituicaoId: user.instituicaoId },
  });

  const baseUrl = new URL(req.url).origin;

  const conteudoHtml = substituirExemplos(String(body?.conteudo || ""), config);
  const conteudo = htmlParaTextoPreview(conteudoHtml);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logo = await carregarImagemPdf(pdfDoc, config?.logoUrl, baseUrl);
  const papel = await carregarImagemPdf(pdfDoc, config?.papelTimbradoUrl, baseUrl);

  let page = pdfDoc.addPage([595.28, 841.89]);
  let y = 700;

  function aplicarLayoutPagina() {
    const largura = page.getWidth();
    const altura = page.getHeight();

    if (config?.usarPapelTimbrado && config?.estiloPapelTimbrado === "PAPEL_PROPRIO" && papel) {
      page.drawImage(papel, {
        x: 0,
        y: 0,
        width: largura,
        height: altura,
      });
      y = 720;
      return;
    }

    if (config?.usarPapelTimbrado && config?.estiloPapelTimbrado === "PHANYX_CLASSICO") {
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

      page.drawText("Prévia de documento", {
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

  function drawLine(texto: string, bold = false) {
    if (y < 60) novaPagina();

    page.drawText(texto.slice(0, 105), {
      x: 55,
      y,
      size: bold ? 11 : 9,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });

    y -= bold ? 22 : 16;
  }

  aplicarLayoutPagina();

  for (const linha of conteudo.split("\n")) {
    const limpa = linha.trim();

    if (!limpa) {
      y -= 8;
      continue;
    }

    const ehTitulo = limpa.startsWith("[") && limpa.endsWith("]");
    drawLine(limpa, ehTitulo);
  }

  const bytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=previa-template.pdf",
    },
  });
}