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

  if (dados.logoUrl) {
    try {
      const resLogo = await fetch(dados.logoUrl);

      if (resLogo.ok) {
        const logoBytes = await resLogo.arrayBuffer();
        
        let logoImage;

try {
  logoImage = await pdfDoc.embedPng(logoBytes);
} catch {
  try {
    logoImage = await pdfDoc.embedJpg(logoBytes);
  } catch {
    logoImage = null;
  }
}

if (!logoImage) {
  console.warn("Logo institucional não pôde ser incorporada ao PDF.");
  return y - 72;
}

        pagina.drawImage(logoImage, {
  x: margem,
  y: y - 42,
  width: 44,
  height: 44,
});

xTexto = margem + 56;
      }
    } catch (error) {
      console.error("Erro ao carregar logo institucional no PDF:", error);
    }
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