import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

type DadosCertificado = {
  nomeAluno: string;
  nomeCurso: string;
  nomeInstituicao: string;
  dataConclusao: Date | string;
  codigoValidacao: string;
  cidade?: string | null;
  coordenadorNome?: string | null;
};

function formatarDataBR(data: Date | string) {
  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString("pt-BR");
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3001";
}

export async function gerarCertificadoPdf(
  templateBytes: Uint8Array,
  dados: DadosCertificado
) {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  page.drawText("CERTIFICADO", {
    x: width / 2 - 110,
    y: height - 110,
    size: 28,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.35),
  });

  const texto1 = "Certificamos que";
  const texto2 = dados.nomeAluno;
  const texto3 =
    `concluiu com aproveitamento o curso ${dados.nomeCurso}, ` +
    `oferecido por ${dados.nomeInstituicao}.`;

  page.drawText(texto1, {
    x: 90,
    y: height - 190,
    size: 18,
    font,
    color: rgb(0.15, 0.15, 0.15),
  });

  page.drawText(texto2, {
    x: 90,
    y: height - 230,
    size: 24,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.05),
  });

  page.drawText(texto3, {
    x: 90,
    y: height - 280,
    size: 16,
    font,
    color: rgb(0.15, 0.15, 0.15),
    maxWidth: width - 180,
    lineHeight: 22,
  });

  const cidade = dados.cidade?.trim() || "São José";
  const dataFormatada = formatarDataBR(dados.dataConclusao);

  page.drawText(`${cidade}, ${dataFormatada}`, {
    x: 90,
    y: 150,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(`Código de validação: ${dados.codigoValidacao}`, {
    x: 90,
    y: 90,
    size: 10,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });

  const urlValidacao = `${getBaseUrl()}/validar-certificado?codigo=${encodeURIComponent(
    dados.codigoValidacao
  )}`;

  const qrDataUrl = await QRCode.toDataURL(urlValidacao, {
    margin: 1,
    width: 140,
  });

  const qrImageBytes = Uint8Array.from(Buffer.from(qrDataUrl.split(",")[1], "base64"));
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  page.drawImage(qrImage, {
    x: width - 150,
    y: 60,
    width: 80,
    height: 80,
  });

  if (dados.coordenadorNome) {
    page.drawLine({
      start: { x: width - 260, y: 120 },
      end: { x: width - 80, y: 120 },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(dados.coordenadorNome, {
      x: width - 230,
      y: 100,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText("Coordenação", {
      x: width - 185,
      y: 84,
      size: 11,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  }

  return await pdfDoc.save();
}