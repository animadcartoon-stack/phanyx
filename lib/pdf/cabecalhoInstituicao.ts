import { PDFDocument, PDFPage, PDFFont, rgb } from "pdf-lib";

type DadosCabecalhoInstituicao = {
  nomeInstituicao: string;
  tituloRelatorio: string;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  estado?: string | null;
  logoUrl?: string | null;
};

async function carregarImagemPdf(pdfDoc: PDFDocument, url?: string | null) {
  if (!url) return null;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.warn("Não foi possível carregar a imagem institucional:", res.status);
      return null;
    }

    const bytes = await res.arrayBuffer();

    try {
      return await pdfDoc.embedPng(bytes);
    } catch {
      try {
        return await pdfDoc.embedJpg(bytes);
      } catch {
        console.warn("Imagem institucional não é PNG/JPG compatível com pdf-lib.");
        return null;
      }
    }
  } catch (error) {
    console.error("Erro ao buscar imagem institucional:", error);
    return null;
  }
}

export async function desenharCabecalhoInstituicao({
  pdfDoc,
  pagina,
  fonteNormal,
  fonteBold,
  margem,
  y,
  dados,
}: {
  pdfDoc: PDFDocument;
  pagina: PDFPage;
  fonteNormal: PDFFont;
  fonteBold: PDFFont;
  margem: number;
  y: number;
  dados: DadosCabecalhoInstituicao;
}) {
  let xTexto = margem;

  const logoImage = await carregarImagemPdf(pdfDoc, dados.logoUrl);

  if (logoImage) {
    const larguraLogo = 48;
    const escala = larguraLogo / logoImage.width;
    const alturaLogo = logoImage.height * escala;

    pagina.drawImage(logoImage, {
      x: margem,
      y: y - alturaLogo + 4,
      width: larguraLogo,
      height: alturaLogo,
    });

    xTexto = margem + 62;
  }

  pagina.drawText(dados.nomeInstituicao || "Instituição", {
    x: xTexto,
    y,
    size: 16,
    font: fonteBold,
    color: rgb(0.02, 0.06, 0.15),
  });

  pagina.drawText(dados.tituloRelatorio, {
    x: xTexto,
    y: y - 20,
    size: 14,
    font: fonteBold,
    color: rgb(0.02, 0.06, 0.15),
  });

  const linhaContato = [
    dados.cnpj ? `CNPJ: ${dados.cnpj}` : "",
    dados.telefone || "",
    dados.email || "",
    [dados.cidade, dados.estado].filter(Boolean).join(" - "),
  ]
    .filter(Boolean)
    .join(" • ");

  if (linhaContato) {
    pagina.drawText(linhaContato, {
      x: xTexto,
      y: y - 40,
      size: 8,
      font: fonteNormal,
      color: rgb(0.08, 0.12, 0.2),
    });
  }

  return y - 72;
}