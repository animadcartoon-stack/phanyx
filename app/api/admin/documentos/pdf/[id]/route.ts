import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LayoutProfissional =
  | "PHANYX_MODERNO"
  | "PHANYX_ACADEMICO"
  | "PHANYX_CLASSICO"
  | "PERSONALIZADO_CLASSICO"
  | "PERSONALIZADO_MODERNO"
  | "PERSONALIZADO_MARCA";

function normalizarTexto(valor: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function gerarQrCodeImagem(pdfDoc: PDFDocument, texto: string) {
  const dataUrl = await QRCode.toDataURL(texto, {
    margin: 1,
    width: 220,
  });

  const base64 = dataUrl.split(",")[1];
  const bytes = Buffer.from(base64, "base64");
  return pdfDoc.embedPng(bytes);
}

function normalizarLayoutProfissional(estilo?: string): LayoutProfissional {
  switch (estilo) {
    case "PHANYX_MODERNO":
    case "PHANYX_ACADEMICO":
    case "PHANYX_CLASSICO":
    case "PERSONALIZADO_CLASSICO":
    case "PERSONALIZADO_MODERNO":
    case "PERSONALIZADO_MARCA":
      return estilo;

    case "INSTITUCIONAL":
      return "PHANYX_MODERNO";
    case "CLASSICO":
      return "PHANYX_CLASSICO";
    case "MINIMALISTA":
      return "PHANYX_ACADEMICO";

    case "SEM_COR":
      return "PERSONALIZADO_CLASSICO";
    case "COLORIDO":
      return "PERSONALIZADO_MODERNO";
    case "MARCA_DAGUA":
      return "PERSONALIZADO_MARCA";

    default:
      return "PHANYX_MODERNO";
  }
}

function quebrarTextoEmLinhas(
  texto: string,
  maxWidth: number,
  font: any,
  fontSize: number
) {
  const paragrafos = String(texto || "").split("\n");
  const linhas: string[] = [];

  for (const paragrafo of paragrafos) {
    if (!paragrafo.trim()) {
      linhas.push("");
      continue;
    }

    const palavras = paragrafo.split(" ");
    let linhaAtual = "";

    for (const palavra of palavras) {
      const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
      const largura = font.widthOfTextAtSize(tentativa, fontSize);

      if (largura <= maxWidth) {
        linhaAtual = tentativa;
      } else {
        if (linhaAtual) linhas.push(linhaAtual);
        linhaAtual = palavra;
      }
    }

    if (linhaAtual) linhas.push(linhaAtual);
  }

  return linhas;
}

function extrairValorMonetarioDoConteudo(texto: string) {
  const conteudo = String(texto || "");

  const match =
    conteudo.match(/VALOR:\s*R\$\s*([\d\.,]+)/i) ||
    conteudo.match(/R\$\s*([\d\.,]+)/i);

  if (!match?.[1]) return 0;

  const normalizado = match[1]
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function gerarCodigoValidacao(docId: number, criadoEm?: Date | string | null) {
  const dataBase = criadoEm ? new Date(criadoEm) : new Date();
  const yyyy = dataBase.getFullYear();
  const mm = String(dataBase.getMonth() + 1).padStart(2, "0");
  const dd = String(dataBase.getDate()).padStart(2, "0");
  const hh = String(dataBase.getHours()).padStart(2, "0");
  const mi = String(dataBase.getMinutes()).padStart(2, "0");

  return `PHANYX-${yyyy}${mm}${dd}-${docId}-${hh}${mi}`;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID do documento inválido" },
        { status: 400 }
      );
    }

    const doc = await prisma.documentoGerado.findUnique({
      where: { id },
      include: {
        aluno: true,
        instituicao: {
          include: {
            configuracaoInstituicao: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    const config = doc.instituicao?.configuracaoInstituicao;

    const logo = config?.logoUrl || "";
    const papelTimbrado = config?.papelTimbradoUrl || "";
    const usarPapelTimbrado = Boolean(config?.usarPapelTimbrado);

    const layoutSelecionado = normalizarLayoutProfissional(
      config?.estiloPapelTimbrado || config?.estiloDocumento
    );

    const nomeInstituicao =
      config?.nomeFantasia || doc.instituicao?.nome || "PHANYX";
    const cnpj = config?.cnpj || "-";
    const telefone = config?.telefone || "-";
    const email = config?.email || "-";
    const cidade = config?.cidade || "";
    const estado = config?.estado || "";

    const estiloRaw = config?.estiloDocumento || "";
    const estiloNormalizado = normalizarTexto(estiloRaw);

    let estiloDocumentoLegado = "minimalista";

    if (estiloNormalizado.includes("classico")) {
      estiloDocumentoLegado = "classico";
    } else if (estiloNormalizado.includes("institucional")) {
      estiloDocumentoLegado = "institucional";
    } else if (estiloNormalizado.includes("minimalista")) {
      estiloDocumentoLegado = "minimalista";
    }

    const dataFormatada = doc.criadoEm
      ? new Date(doc.criadoEm).toLocaleDateString("pt-BR")
      : "-";

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const serif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

// 🔐 Código de validação
const codigoValidacao =
  doc.codigoValidacao || gerarCodigoValidacao(doc.id, doc.criadoEm);

// salva se ainda não existir
if (!doc.codigoValidacao) {
  await prisma.documentoGerado.update({
    where: { id: doc.id },
    data: { codigoValidacao },
  });
}

// 🔗 Link público
const urlBase = new URL(req.url);
const linkValidacao = `${urlBase.protocol}//${urlBase.host}/validar-documento?codigo=${encodeURIComponent(
  codigoValidacao
)}`;


// 📱 QR Code
const qrImage = await gerarQrCodeImagem(pdfDoc, linkValidacao);
    const usarFonteTexto =
      layoutSelecionado === "PHANYX_ACADEMICO" ||
      layoutSelecionado === "PHANYX_CLASSICO" ||
      estiloDocumentoLegado === "classico"
        ? serif
        : font;

    const fontTitulo =
      layoutSelecionado === "PHANYX_ACADEMICO" ||
      layoutSelecionado === "PHANYX_CLASSICO" ||
      estiloDocumentoLegado === "classico"
        ? serifBold
        : bold;

    const pageWidth = 595;
    const pageHeight = 842;
    const margemX = 44;
    const larguraTexto = pageWidth - margemX * 2;

    async function carregarImagem(urlImagem: string) {
      if (!urlImagem) return null;

      try {
        const url = new URL(req.url);
        const origem = `${url.protocol}//${url.host}`;
        const imgUrl = urlImagem.startsWith("http")
          ? urlImagem
          : `${origem}${urlImagem}`;

        const response = await fetch(imgUrl);
        if (!response.ok) return null;

        const bytes = await response.arrayBuffer();

        try {
          return await pdfDoc.embedPng(bytes);
        } catch {
          try {
            return await pdfDoc.embedJpg(bytes);
          } catch {
            return null;
          }
        }
      } catch {
        return null;
      }
    }

    const imagemPapelTimbrado =
      usarPapelTimbrado && papelTimbrado
        ? await carregarImagem(papelTimbrado)
        : null;

    const imagemLogo = await carregarImagem(logo);



    function desenharTextoRodapeInstitucional(pagina: any, yBase: number) {
      const linha1 = `${nomeInstituicao} • CNPJ: ${cnpj}`;
      const linha2 = `${telefone} • ${email}`;
      const linha3 = `${cidade}${cidade && estado ? " - " : ""}${estado}`;

      pagina.drawText(linha1, {
        x: margemX,
        y: yBase,
        size: 8,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      pagina.drawText(linha2, {
        x: margemX,
        y: yBase - 10,
        size: 8,
        font,
        color: rgb(0.45, 0.45, 0.45),
      });

      if (cidade || estado) {
        pagina.drawText(linha3, {
          x: margemX,
          y: yBase - 20,
          size: 8,
          font,
          color: rgb(0.45, 0.45, 0.45),
        });
      }
    }

    function desenharModeloPhanyxModerno(pagina: any) {
  // Faixa superior principal
  pagina.drawRectangle({
    x: 0,
    y: pageHeight - 82,
    width: pageWidth,
    height: 82,
    color: rgb(0.07, 0.2, 0.4),
  });

  // Barra lateral discreta
  pagina.drawRectangle({
    x: 0,
    y: 0,
    width: 26,
    height: pageHeight,
    color: rgb(0.05, 0.12, 0.24),
  });

  // Faixas inferiores elegantes
  pagina.drawRectangle({
    x: pageWidth - 230,
    y: 0,
    width: 230,
    height: 16,
    color: rgb(0.07, 0.2, 0.4),
  });

  pagina.drawRectangle({
    x: pageWidth - 165,
    y: 0,
    width: 120,
    height: 8,
    color: rgb(0.18, 0.43, 0.72),
  });

  // Linha separadora abaixo do cabeçalho
  pagina.drawLine({
    start: { x: margemX, y: pageHeight - 98 },
    end: { x: pageWidth - margemX, y: pageHeight - 98 },
    thickness: 0.8,
    color: rgb(0.84, 0.84, 0.86),
  });

  // Rodapé institucional discreto
  pagina.drawText(`${cnpj} • ${telefone} • ${email}`, {
    x: margemX,
    y: 24,
    size: 8,
    font,
    color: rgb(0.42, 0.42, 0.44),
  });
}

    function desenharModeloPhanyxAcademico(pagina: any) {
      if (imagemLogo) {
        pagina.drawImage(imagemLogo, {
          x: pageWidth / 2 - 110,
          y: pageHeight / 2 - 110,
          width: 220,
          height: 220,
          opacity: 0.05,
        });
      }

      pagina.drawRectangle({
        x: margemX,
        y: pageHeight - 26,
        width: larguraTexto,
        height: 1,
        color: rgb(0.74, 0.74, 0.78),
      });

      pagina.drawRectangle({
        x: margemX,
        y: 62,
        width: larguraTexto,
        height: 1,
        color: rgb(0.74, 0.74, 0.78),
      });

      desenharTextoRodapeInstitucional(pagina, 26);
    }

    function desenharModeloPhanyxClassico(pagina: any) {
      pagina.drawRectangle({
        x: 0,
        y: pageHeight - 16,
        width: pageWidth,
        height: 16,
        color: rgb(0.1, 0.1, 0.11),
      });

      pagina.drawRectangle({
        x: pageWidth - 110,
        y: pageHeight - 16,
        width: 110,
        height: 16,
        color: rgb(0.08, 0.58, 0.82),
      });

      pagina.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: 46,
        color: rgb(0.1, 0.1, 0.11),
      });

      pagina.drawLine({
        start: { x: margemX, y: 54 },
        end: { x: pageWidth - margemX, y: 54 },
        thickness: 0.8,
        color: rgb(0.82, 0.82, 0.85),
      });

      pagina.drawText(`${telefone} • ${email}`, {
        x: margemX,
        y: 18,
        size: 8,
        font,
        color: rgb(1, 1, 1),
      });

      if (cidade || estado) {
        pagina.drawText(
          `${cidade}${cidade && estado ? " - " : ""}${estado}`,
          {
            x: pageWidth - 160,
            y: 18,
            size: 8,
            font,
            color: rgb(1, 1, 1),
          }
        );
      }
    }

    function desenharModeloPersonalizado(pagina: any) {
      if (!usarPapelTimbrado || !imagemPapelTimbrado) return;

      if (layoutSelecionado === "PERSONALIZADO_MODERNO") {
        pagina.drawRectangle({
          x: 0,
          y: 0,
          width: 22,
          height: pageHeight,
          color: rgb(0.12, 0.23, 0.45),
          opacity: 0.92,
        });

        pagina.drawRectangle({
          x: 0,
          y: pageHeight - 18,
          width: pageWidth,
          height: 18,
          color: rgb(0.12, 0.23, 0.45),
          opacity: 0.92,
        });

        pagina.drawImage(imagemPapelTimbrado, {
          x: 28,
          y: 84,
          width: pageWidth - 56,
          height: pageHeight - 150,
        });

        pagina.drawLine({
          start: { x: margemX, y: 56 },
          end: { x: pageWidth - margemX, y: 56 },
          thickness: 0.8,
          color: rgb(0.82, 0.82, 0.82),
        });

        pagina.drawText(
          `${nomeInstituicao} • CNPJ: ${cnpj} • ${telefone} • ${email}`,
          {
            x: margemX,
            y: 38,
            size: 8,
            font,
            color: rgb(0.35, 0.35, 0.35),
          }
        );

        return;
      }

      if (layoutSelecionado === "PERSONALIZADO_MARCA") {
        pagina.drawImage(imagemPapelTimbrado, {
          x: pageWidth / 2 - 170,
          y: pageHeight / 2 - 170,
          width: 340,
          height: 340,
          opacity: 0.11,
        });

        pagina.drawLine({
          start: { x: margemX, y: 60 },
          end: { x: pageWidth - margemX, y: 60 },
          thickness: 0.8,
          color: rgb(0.82, 0.82, 0.82),
        });

        pagina.drawText(
          `${nomeInstituicao} • ${cidade}${cidade && estado ? " - " : ""}${estado} • ${email}`,
          {
            x: margemX,
            y: 42,
            size: 8,
            font,
            color: rgb(0.38, 0.38, 0.38),
          }
        );

        return;
      }

      pagina.drawRectangle({
        x: 0,
        y: pageHeight - 16,
        width: pageWidth,
        height: 16,
        color: rgb(0.72, 0.72, 0.72),
        opacity: 0.75,
      });

      pagina.drawImage(imagemPapelTimbrado, {
        x: 36,
        y: 110,
        width: pageWidth - 72,
        height: pageHeight - 210,
      });

      pagina.drawLine({
        start: { x: margemX, y: 60 },
        end: { x: pageWidth - margemX, y: 60 },
        thickness: 0.8,
        color: rgb(0.82, 0.82, 0.82),
      });

      pagina.drawText(
        `${nomeInstituicao} • CNPJ: ${cnpj} • ${telefone} • ${email}`,
        {
          x: margemX,
          y: 42,
          size: 8,
          font,
          color: rgb(0.38, 0.38, 0.38),
        }
      );
    }

    function desenharPapelTimbrado(pagina: any) {
      if (layoutSelecionado === "PHANYX_MODERNO") {
        desenharModeloPhanyxModerno(pagina);
        return;
      }

      if (layoutSelecionado === "PHANYX_ACADEMICO") {
        desenharModeloPhanyxAcademico(pagina);
        return;
      }

      if (layoutSelecionado === "PHANYX_CLASSICO") {
        desenharModeloPhanyxClassico(pagina);
        return;
      }

      desenharModeloPersonalizado(pagina);
    }

    async function tentarDesenharLogo(
      pagina: any,
      x: number,
      yLogo: number,
      width: number,
      height: number
    ) {
      if (!imagemLogo) return;

      try {
        pagina.drawImage(imagemLogo, {
          x,
          y: yLogo,
          width,
          height,
        });
      } catch {
        // ignora
      }
    }

    async function desenharCabecalho(pagina: any) {
            if (layoutSelecionado === "PHANYX_MODERNO") {
        await tentarDesenharLogo(pagina, margemX, pageHeight - 64, 36, 36);

        pagina.drawText(nomeInstituicao, {
          x: margemX + 48,
          y: pageHeight - 48,
          size: 16,
          font: bold,
          color: rgb(1, 1, 1),
        });

        pagina.drawText("Documento institucional", {
          x: margemX + 48,
          y: pageHeight - 64,
          size: 9,
          font,
          color: rgb(0.88, 0.92, 0.98),
        });

        pagina.drawText(doc.titulo, {
          x: margemX,
          y: pageHeight - 132,
          size: 21,
          font: bold,
          color: rgb(0.08, 0.12, 0.2),
        });

        pagina.drawLine({
          start: { x: margemX, y: pageHeight - 144 },
          end: { x: pageWidth - margemX, y: pageHeight - 144 },
          thickness: 0.8,
          color: rgb(0.85, 0.85, 0.87),
        });

        return;
      }

      if (layoutSelecionado === "PHANYX_ACADEMICO") {
        await tentarDesenharLogo(
          pagina,
          pageWidth / 2 - 24,
          pageHeight - 96,
          48,
          48
        );

        const larguraInst = fontTitulo.widthOfTextAtSize(nomeInstituicao, 15);
        pagina.drawText(nomeInstituicao, {
          x: (pageWidth - larguraInst) / 2,
          y: pageHeight - 116,
          size: 15,
          font: fontTitulo,
          color: rgb(0.16, 0.16, 0.2),
        });

        const larguraTitulo = fontTitulo.widthOfTextAtSize(doc.titulo, 18);
        pagina.drawText(doc.titulo, {
          x: (pageWidth - larguraTitulo) / 2,
          y: pageHeight - 150,
          size: 18,
          font: fontTitulo,
          color: rgb(0.16, 0.16, 0.2),
        });

        pagina.drawLine({
          start: { x: margemX, y: pageHeight - 164 },
          end: { x: pageWidth - margemX, y: pageHeight - 164 },
          thickness: 0.8,
          color: rgb(0.84, 0.84, 0.86),
        });
        return;
      }

      if (layoutSelecionado === "PHANYX_CLASSICO") {
        await tentarDesenharLogo(pagina, margemX, pageHeight - 112, 50, 50);

        pagina.drawText(nomeInstituicao, {
          x: margemX + 62,
          y: pageHeight - 84,
          size: 16,
          font: fontTitulo,
          color: rgb(0.12, 0.12, 0.14),
        });

        pagina.drawText(doc.titulo, {
          x: margemX,
          y: pageHeight - 150,
          size: 20,
          font: fontTitulo,
          color: rgb(0.12, 0.12, 0.14),
        });

        pagina.drawText(`CNPJ: ${cnpj}`, {
          x: pageWidth - 150,
          y: pageHeight - 84,
          size: 9,
          font,
          color: rgb(0.38, 0.38, 0.4),
        });

        pagina.drawLine({
          start: { x: margemX, y: pageHeight - 162 },
          end: { x: pageWidth - margemX, y: pageHeight - 162 },
          thickness: 0.9,
          color: rgb(0.8, 0.82, 0.85),
        });
        return;
      }

      if (layoutSelecionado === "PERSONALIZADO_CLASSICO") {
        await tentarDesenharLogo(pagina, margemX, pageHeight - 92, 38, 38);

        pagina.drawText(doc.titulo, {
          x: margemX + 52,
          y: pageHeight - 82,
          size: 16,
          font: bold,
          color: rgb(0.1, 0.1, 0.1),
        });

        pagina.drawText(nomeInstituicao, {
          x: margemX + 52,
          y: pageHeight - 100,
          size: 10,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });

        pagina.drawText(`CNPJ: ${cnpj}`, {
          x: margemX + 52,
          y: pageHeight - 114,
          size: 8,
          font,
          color: rgb(0.65, 0.65, 0.65),
        });

        pagina.drawLine({
          start: { x: margemX, y: pageHeight - 130 },
          end: { x: pageWidth - margemX, y: pageHeight - 130 },
          thickness: 0.6,
          color: rgb(0.85, 0.85, 0.85),
        });
        return;
      }

      if (layoutSelecionado === "PERSONALIZADO_MODERNO") {
        await tentarDesenharLogo(pagina, margemX, pageHeight - 92, 40, 40);

        pagina.drawText(doc.titulo, {
          x: margemX + 55,
          y: pageHeight - 82,
          size: 18,
          font: bold,
          color: rgb(0.08, 0.12, 0.2),
        });

        pagina.drawText(nomeInstituicao, {
          x: margemX + 55,
          y: pageHeight - 102,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.34),
        });

        pagina.drawLine({
          start: { x: margemX, y: pageHeight - 132 },
          end: { x: pageWidth - margemX, y: pageHeight - 132 },
          thickness: 0.8,
          color: rgb(0.82, 0.82, 0.84),
        });
        return;
      }

      if (layoutSelecionado === "PERSONALIZADO_MARCA") {
        await tentarDesenharLogo(
          pagina,
          pageWidth / 2 - 22,
          pageHeight - 96,
          44,
          44
        );

        const larguraTitulo = bold.widthOfTextAtSize(doc.titulo, 17);
        pagina.drawText(doc.titulo, {
          x: (pageWidth - larguraTitulo) / 2,
          y: pageHeight - 142,
          size: 17,
          font: bold,
          color: rgb(0.16, 0.16, 0.18),
        });

        const larguraInst = font.widthOfTextAtSize(nomeInstituicao, 11);
        pagina.drawText(nomeInstituicao, {
          x: (pageWidth - larguraInst) / 2,
          y: pageHeight - 160,
          size: 11,
          font,
          color: rgb(0.38, 0.38, 0.4),
        });
        return;
      }

      if (estiloDocumentoLegado === "institucional") {
        pagina.drawRectangle({
          x: margemX,
          y: pageHeight - 55,
          width: larguraTexto,
          height: 10,
          color: rgb(0.06, 0.1, 0.2),
        });

        await tentarDesenharLogo(pagina, margemX, pageHeight - 120, 60, 60);

        pagina.drawText(doc.titulo, {
          x: margemX + 75,
          y: pageHeight - 85,
          size: 18,
          font: bold,
          color: rgb(0.06, 0.1, 0.2),
        });

        pagina.drawText(nomeInstituicao, {
          x: margemX + 75,
          y: pageHeight - 105,
          size: 11,
          font,
          color: rgb(0, 0, 0),
        });

        pagina.drawText(`CNPJ: ${cnpj}`, {
          x: margemX + 75,
          y: pageHeight - 120,
          size: 10,
          font,
          color: rgb(0.25, 0.25, 0.25),
        });

        pagina.drawLine({
          start: { x: margemX, y: pageHeight - 145 },
          end: { x: pageWidth - margemX, y: pageHeight - 145 },
          thickness: 1,
          color: rgb(0.85, 0.85, 0.85),
        });
        return;
      }

      if (estiloDocumentoLegado === "classico") {
        await tentarDesenharLogo(
          pagina,
          pageWidth / 2 - 25,
          pageHeight - 95,
          50,
          50
        );

        const larguraTitulo = serifBold.widthOfTextAtSize(doc.titulo, 18);

        pagina.drawText(doc.titulo, {
          x: (pageWidth - larguraTitulo) / 2,
          y: pageHeight - 130,
          size: 18,
          font: serifBold,
          color: rgb(0, 0, 0),
        });

        const larguraInst = serif.widthOfTextAtSize(nomeInstituicao, 12);

        pagina.drawText(nomeInstituicao, {
          x: (pageWidth - larguraInst) / 2,
          y: pageHeight - 150,
          size: 12,
          font: serif,
        });

        pagina.drawText(`CNPJ: ${cnpj}`, {
          x: (pageWidth - 200) / 2,
          y: pageHeight - 165,
          size: 10,
          font: serif,
        });

        pagina.drawLine({
          start: { x: margemX, y: pageHeight - 180 },
          end: { x: pageWidth - margemX, y: pageHeight - 180 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        return;
      }

      await tentarDesenharLogo(pagina, margemX, pageHeight - 92, 38, 38);

      pagina.drawText(doc.titulo, {
        x: margemX + 52,
        y: pageHeight - 82,
        size: 16,
        font: bold,
        color: rgb(0.1, 0.1, 0.1),
      });

      pagina.drawText(nomeInstituicao, {
        x: margemX + 52,
        y: pageHeight - 100,
        size: 10,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      pagina.drawText(`CNPJ: ${cnpj}`, {
        x: margemX + 52,
        y: pageHeight - 114,
        size: 8,
        font,
        color: rgb(0.65, 0.65, 0.65),
      });

      pagina.drawLine({
        start: { x: margemX, y: pageHeight - 130 },
        end: { x: pageWidth - margemX, y: pageHeight - 130 },
        thickness: 0.6,
        color: rgb(0.85, 0.85, 0.85),
      });
    }

    function desenharRodape(
      pagina: any,
      numeroPagina: number,
      totalPaginas: number
    ) {
      pagina.drawLine({
        start: { x: margemX, y: 48 },
        end: { x: pageWidth - margemX, y: 48 },
        thickness: 0.6,
        color: rgb(0.85, 0.85, 0.85),
      });

      const rodapeTexto = "Documento gerado automaticamente pelo sistema PHANYX";
      const larguraRodape = font.widthOfTextAtSize(rodapeTexto, 8);

      pagina.drawText(rodapeTexto, {
        x: (pageWidth - larguraRodape) / 2,
        y: 34,
        size: 8,
        font,
        color: rgb(0.45, 0.45, 0.45),
      });

      pagina.drawText(`Página ${numeroPagina} de ${totalPaginas}`, {
        x: pageWidth - 110,
        y: 20,
        size: 8,
        font,
        color: rgb(0.45, 0.45, 0.45),
      });
    }

    function novaPaginaComLayout() {
      const pagina = pdfDoc.addPage([pageWidth, pageHeight]);
      desenharPapelTimbrado(pagina);
      return pagina;
    }

    function obterYInicial() {
      if (layoutSelecionado === "PHANYX_MODERNO") return pageHeight - 172;
      if (layoutSelecionado === "PHANYX_ACADEMICO") return pageHeight - 194;
      if (layoutSelecionado === "PHANYX_CLASSICO") return pageHeight - 190;
      if (layoutSelecionado === "PERSONALIZADO_MODERNO") return pageHeight - 170;
      if (layoutSelecionado === "PERSONALIZADO_MARCA") return pageHeight - 186;
      if (layoutSelecionado === "PERSONALIZADO_CLASSICO") return pageHeight - 175;

      return estiloDocumentoLegado === "classico"
        ? pageHeight - 215
        : estiloDocumentoLegado === "institucional"
        ? pageHeight - 185
        : pageHeight - 175;
    }

    let page = novaPaginaComLayout();
    let y = pageHeight - 50;

    await desenharCabecalho(page);
    y = obterYInicial();

    page.drawText(`Aluno: ${doc.aluno?.nome || "-"}`, {
      x: margemX,
      y,
      size: 11,
      font: usarFonteTexto,
      color: rgb(0, 0, 0),
    });
    y -= 16;

    page.drawText(`Matrícula: ${doc.aluno?.matricula || "-"}`, {
      x: margemX,
      y,
      size: 11,
      font: usarFonteTexto,
      color: rgb(0, 0, 0),
    });
    y -= 16;

    page.drawText(`CPF: ${doc.aluno?.cpf || "-"}`, {
      x: margemX,
      y,
      size: 11,
      font: usarFonteTexto,
      color: rgb(0, 0, 0),
    });
    y -= 16;

    page.drawText(`Data: ${dataFormatada}`, {
      x: margemX,
      y,
      size: 11,
      font: usarFonteTexto,
      color: rgb(0, 0, 0),
    });

        y -= 34;

    const valorDoc = extrairValorMonetarioDoConteudo(doc.conteudo || "");

    const textoValor = `R$ ${valorDoc.toFixed(2)}`;
    const larguraValor = bold.widthOfTextAtSize(textoValor, 26);

    // 💰 BLOCO PREMIUM DE VALOR
    page.drawRectangle({
      x: margemX,
      y: y - 80,
      width: larguraTexto,
      height: 80,
      color: rgb(0.94, 0.96, 0.99),
      borderWidth: 1,
      borderColor: rgb(0.8, 0.85, 0.9),
    });

    page.drawText("VALOR RECEBIDO", {
      x: margemX + 12,
      y: y - 25,
      size: 10,
      font: bold,
      color: rgb(0.3, 0.4, 0.6),
    });

    page.drawText(textoValor, {
      x: margemX + (larguraTexto - larguraValor) / 2,
      y: y - 55,
      size: 26,
      font: bold,
      color: rgb(0.05, 0.15, 0.3),
    });

    y -= 100;

    // 👤 BLOCO DO ALUNO
    page.drawRectangle({
      x: margemX,
      y: y - 90,
      width: larguraTexto,
      height: 90,
      color: rgb(0.98, 0.98, 0.98),
      borderWidth: 1,
      borderColor: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("DADOS DO ALUNO", {
      x: margemX + 10,
      y: y - 15,
      size: 10,
      font: bold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Nome: ${doc.aluno?.nome || "-"}`, {
      x: margemX + 10,
      y: y - 30,
      size: 10,
      font: usarFonteTexto,
      color: rgb(0, 0, 0),
    });

    page.drawText(`CPF: ${doc.aluno?.cpf || "-"}`, {
      x: margemX + 10,
      y: y - 45,
      size: 10,
      font: usarFonteTexto,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Matrícula: ${doc.aluno?.matricula || "-"}`, {
      x: margemX + 10,
      y: y - 60,
      size: 10,
      font: usarFonteTexto,
      color: rgb(0, 0, 0),
    });

    y -= 110;

    // ✅ STATUS
    page.drawRectangle({
      x: margemX,
      y: y - 20,
      width: 120,
      height: 18,
      color: rgb(0.85, 0.95, 0.88),
    });

    page.drawText("✔ PAGO", {
      x: margemX + 8,
      y: y - 15,
      size: 10,
      font: bold,
      color: rgb(0.1, 0.5, 0.2),
    });

    y -= 35;

    const linhas = quebrarTextoEmLinhas(
      doc.conteudo || "",
      larguraTexto,
      usarFonteTexto,
      12
    );

    for (const linha of linhas) {
      if (y < 110) {
        page = novaPaginaComLayout();
        await desenharCabecalho(page);
        y = obterYInicial();
      }

      page.drawText(linha || " ", {
        x: margemX,
        y,
        size: 12,
        font: usarFonteTexto,
        color: rgb(0, 0, 0),
      });

      y -= 18;
    }

    // ✍️ ASSINATURA
    page.drawLine({
      start: { x: margemX, y: y - 40 },
      end: { x: margemX + 200, y: y - 40 },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText("Responsável financeiro", {
      x: margemX,
      y: y - 55,
      size: 9,
      font: usarFonteTexto,
      color: rgb(0.4, 0.4, 0.4),
    });
        

    y -= 95;

    page.drawRectangle({
      x: margemX,
      y: y - 86,
      width: larguraTexto,
      height: 86,
      color: rgb(0.97, 0.98, 0.99),
      borderWidth: 1,
      borderColor: rgb(0.82, 0.86, 0.9),
    });

    page.drawText("VALIDAÇÃO DO DOCUMENTO", {
      x: margemX + 10,
      y: y - 16,
      size: 10,
      font: bold,
      color: rgb(0.18, 0.28, 0.45),
    });

    page.drawText(`Código: ${codigoValidacao}`, {
      x: margemX + 10,
      y: y - 32,
      size: 9,
      font: bold,
      color: rgb(0.08, 0.12, 0.2),
    });

    page.drawText(
      `Emitido em: ${
        doc.criadoEm
          ? new Date(doc.criadoEm).toLocaleString("pt-BR")
          : new Date().toLocaleString("pt-BR")
      }`,
      {
        x: margemX + 10,
        y: y - 46,
        size: 8,
        font: usarFonteTexto,
        color: rgb(0.3, 0.3, 0.35),
      }
    );

    page.drawText("Leia o QR Code ou use o link de conferência.", {
      x: margemX + 10,
      y: y - 60,
      size: 8,
      font: usarFonteTexto,
      color: rgb(0.42, 0.42, 0.46),
    });

    const linhasLink = quebrarTextoEmLinhas(
      linkValidacao,
      larguraTexto - 110,
      usarFonteTexto,
      7
    );

    let yLink = y - 74;
    for (const linha of linhasLink.slice(0, 2)) {
      page.drawText(linha, {
        x: margemX + 10,
        y: yLink,
        size: 7,
        font: usarFonteTexto,
        color: rgb(0.28, 0.28, 0.34),
      });
      yLink -= 9;
    }

   

    page.drawImage(qrImage, {
      x: margemX + larguraTexto - 76,
      y: y - 76,
      width: 64,
      height: 64,
    });

    
await prisma.documentoGerado.update({
  where: { id: doc.id },
  data: { codigoValidacao },
});
    const dataHoraEmissao = doc.criadoEm
      ? new Date(doc.criadoEm).toLocaleString("pt-BR")
      : new Date().toLocaleString("pt-BR");

    
    
    y -= 95;

    // 🔐 BLOCO DE VALIDAÇÃO
    page.drawRectangle({
      x: margemX,
      y: y - 70,
      width: larguraTexto,
      height: 70,
      color: rgb(0.97, 0.98, 0.99),
      borderWidth: 1,
      borderColor: rgb(0.82, 0.86, 0.9),
    });

    page.drawText("VALIDAÇÃO DO DOCUMENTO", {
      x: margemX + 10,
      y: y - 15,
      size: 10,
      font: bold,
      color: rgb(0.18, 0.28, 0.45),
    });

    page.drawText(`Código: ${codigoValidacao}`, {
      x: margemX + 10,
      y: y - 32,
      size: 9,
      font: bold,
      color: rgb(0.08, 0.12, 0.2),
    });

    page.drawText(`Emitido em: ${dataHoraEmissao}`, {
      x: margemX + 10,
      y: y - 46,
      size: 9,
      font: usarFonteTexto,
      color: rgb(0.28, 0.28, 0.32),
    });

    page.drawText("Conferência interna pelo sistema PHANYX.", {
      x: margemX + 10,
      y: y - 60,
      size: 8,
      font: usarFonteTexto,
      color: rgb(0.42, 0.42, 0.46),
    });

    y -= 90;

    page.drawText(`Consulta: ${linkValidacao}`, {
      x: margemX,
      y: y,
      size: 8,
      font: usarFonteTexto,
      color: rgb(0.32, 0.32, 0.38),
    });

const pdfBytes = await pdfDoc.save();

return new Response(Buffer.from(pdfBytes), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=documento.pdf",
  },
});
  } catch (error: any) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}