import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";

type CampoCertificadoPdf = {
  id: number;
  tipo: string;
  x: number;
  y: number;
  largura?: number | null;
  altura?: number | null;
  fonte?: string | null;
  tamanho?: number | null;
  cor?: string | null;
  preenchimentoCor?: string | null;
  contornoCor?: string | null;
  contornoEspessura?: number | null;
  mostrarPreenchimento?: boolean | null;
  mostrarContorno?: boolean | null;
  alinhamento?: string | null;
  negrito?: boolean | null;
  italico?: boolean | null;
  sublinhado?: boolean | null;
  ordem?: number | null;
  lineHeight?: number | null;
  marcador?: string | null;
  imagemUrl?: string | null;
  url?: string | null;
  src?: string | null;
  arquivoUrl?: string | null;
  previewUrl?: string | null;
  opacity?: number | null;
  objectFit?: string | null;
  rotate?: number | null;
  forma?: string | null;
  texto?: string | null;
  textoHtml?: string | null;
  textoModo?: "NORMAL" | "VERTICAL" | "ARCO" | null;
  pontosForma?: Array<{
    id?: string;
    x: number;
    y: number;
    tipo?: string;
  }> | null;
  dadosJson?: any;
};

type DadosCertificado = {
  nomeAluno: string;
  nomeCurso: string;
  nomeInstituicao: string;
  dataConclusao: Date | string;
  codigoValidacao: string;

  numeroMatricula?: string | null;
  cpfAluno?: string | null;
  rgAluno?: string | null;
  cidade?: string | null;
  coordenadorNome?: string | null;
  assinaturaUrl?: string | null;
  logoUrl?: string | null;

  disciplinasConcluidas?: string | null;
  cargaHoraria?: string | null;
  anoConclusao?: string | null;
  aproveitamento?: string | null;
  frequenciaTotal?: string | null;
  modalidade?: string | null;
  turma?: string | null;
  polo?: string | null;
  cnpjInstituicao?: string | null;
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

function corPdf(cor?: string | null, fallback = "#1e3a8a") {
  const valor = String(cor || fallback).trim();

  if (!valor.startsWith("#")) {
    return rgb(0.12, 0.23, 0.54);
  }

  const hex = valor.replace("#", "");

  if (hex.length !== 6) {
    return rgb(0.12, 0.23, 0.54);
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  return rgb(r, g, b);
}

function limparHtml(html?: string | null) {
  if (!html) return "";

  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function normalizarCampo(campo: any): CampoCertificadoPdf {
  const dadosJson =
    campo?.dadosJson && typeof campo.dadosJson === "object"
      ? campo.dadosJson
      : {};

  return {
    ...dadosJson,
    ...campo,
  };
}

function dimensoesEditorPeloPdf(width: number, height: number) {
  if (width >= height) {
    return {
      largura: 1123,
      altura: 794,
    };
  }

  return {
    largura: 794,
    altura: 1123,
  };
}

function caixaPdf(
  campo: CampoCertificadoPdf,
  pageWidth: number,
  pageHeight: number
) {
  const base = dimensoesEditorPeloPdf(pageWidth, pageHeight);

  const larguraCampo =
    Number(campo.largura || 0) ||
    (campo.tipo === "ASSINATURA" ? 260 : campo.tipo === "QR_CODE" ? 120 : 220);

  const alturaCampo =
    Number(campo.altura || 0) ||
    (campo.tipo === "ASSINATURA" ? 90 : campo.tipo === "QR_CODE" ? 120 : 40);

  const x = (Number(campo.x || 0) / base.largura) * pageWidth;
  const largura = (larguraCampo / base.largura) * pageWidth;
  const altura = (alturaCampo / base.altura) * pageHeight;

  const y =
    pageHeight -
    ((Number(campo.y || 0) + alturaCampo) / base.altura) * pageHeight;

  return {
    x,
    y,
    largura,
    altura,
  };
}

function normalizarOpacidade(valor?: number | null) {
  if (valor === null || valor === undefined) return 1;

  const n = Number(valor);

  if (!Number.isFinite(n)) return 1;

  if (n > 1) return Math.max(0, Math.min(1, n / 100));

  return Math.max(0, Math.min(1, n));
}

function escolherFonte(
  campo: CampoCertificadoPdf,
  fontes: {
    normal: PDFFont;
    bold: PDFFont;
    italic: PDFFont;
    boldItalic: PDFFont;
  }
) {
  const nomeFonte = String(campo.fonte || "").toLowerCase();

  const pareceFonteCursiva =
    nomeFonte.includes("dancing") ||
    nomeFonte.includes("script") ||
    nomeFonte.includes("cursive") ||
    nomeFonte.includes("pacifico") ||
    nomeFonte.includes("great vibes");

  if (campo.negrito && (campo.italico || pareceFonteCursiva)) {
    return fontes.boldItalic;
  }

  if (campo.negrito) return fontes.bold;

  if (campo.italico || pareceFonteCursiva) {
    return fontes.italic;
  }

  return fontes.normal;
}

function resolverTextoCampo(campo: CampoCertificadoPdf, dados: DadosCertificado) {
  switch (campo.tipo) {
    case "NOME_ALUNO":
      return dados.nomeAluno;

    case "NUMERO_MATRICULA":
      return dados.numeroMatricula || "";

    case "CPF_ALUNO":
      return dados.cpfAluno || "";

    case "RG_ALUNO":
      return dados.rgAluno || "";

    case "NOME_CURSO":
      return dados.nomeCurso;

    case "DISCIPLINAS_CONCLUIDAS":
      return dados.disciplinasConcluidas || "Disciplina concluída";

    case "CARGA_HORARIA":
      return dados.cargaHoraria || "";

    case "ANO_CONCLUSAO":
      return dados.anoConclusao || String(new Date(dados.dataConclusao).getFullYear());

    case "DATA_CONCLUSAO":
    case "DATA_EMISSAO":
      return formatarDataBR(dados.dataConclusao);

    case "APROVEITAMENTO":
      return dados.aproveitamento || "100%";

    case "FREQUENCIA_TOTAL":
      return dados.frequenciaTotal || "100%";

    case "MODALIDADE":
      return dados.modalidade || "";

    case "TURMA":
      return dados.turma || "";

    case "POLO":
      return dados.polo || "";

    case "NOME_INSTITUICAO":
      return dados.nomeInstituicao;

    case "CNPJ_INSTITUICAO":
      return dados.cnpjInstituicao || "";

    case "CIDADE":
      return dados.cidade || "";

    case "NOME_DIRETOR":
      return dados.coordenadorNome || "";

    case "NUMERO_CERTIFICADO":
    case "CODIGO_VALIDACAO":
      return dados.codigoValidacao;

    case "TEXTO_LIVRE":
      return campo.texto || limparHtml(campo.textoHtml) || "";

    default:
      return campo.texto || campo.tipo;
  }
}

function quebrarLinhaPorLargura(
  texto: string,
  fonte: PDFFont,
  tamanho: number,
  larguraMaxima: number
) {
  const palavras = texto.split(" ").filter(Boolean);

  if (palavras.length === 0) return [""];

  const linhas: string[] = [];
  let linhaAtual = "";

  for (const palavra of palavras) {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    const larguraTentativa = fonte.widthOfTextAtSize(tentativa, tamanho);

    if (larguraTentativa <= larguraMaxima || !linhaAtual) {
      linhaAtual = tentativa;
    } else {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    }
  }

  if (linhaAtual) {
    linhas.push(linhaAtual);
  }

  return linhas;
}

function desenharTexto(
  page: PDFPage,
  campo: CampoCertificadoPdf,
  dados: DadosCertificado,
  fontes: {
    normal: PDFFont;
    bold: PDFFont;
    italic: PDFFont;
    boldItalic: PDFFont;
  }
) {
  const { width, height } = page.getSize();
  const box = caixaPdf(campo, width, height);

  const texto = resolverTextoCampo(campo, dados);

  if (!texto) return;

  const base = dimensoesEditorPeloPdf(width, height);
  let tamanho = Math.max(4, (Number(campo.tamanho || 18) / base.altura) * height);

  const fonte = escolherFonte(campo, fontes);
  const lineHeight = Number(campo.lineHeight || 1.2);

  const tiposUmaLinha = [
  "NOME_ALUNO",
  "NOME_CURSO",
  "ANO_CONCLUSAO",
  "DATA_CONCLUSAO",
  "DATA_EMISSAO",
  "APROVEITAMENTO",
  "FREQUENCIA_TOTAL",
  "CIDADE",
  "NOME_DIRETOR",
  "NUMERO_MATRICULA",
  "CODIGO_VALIDACAO",
  "NUMERO_CERTIFICADO",
];

let linhas =
  campo.textoModo === "VERTICAL"
    ? String(texto).split("")
    : tiposUmaLinha.includes(campo.tipo)
    ? [String(texto).replace(/\s+/g, " ").trim()]
    : String(texto)
        .split("\n")
        .flatMap((linha) =>
          quebrarLinhaPorLargura(
            linha,
            fonte,
            tamanho,
            Math.max(10, box.largura)
          )
        );

  while (
  (
    linhas.length * tamanho * lineHeight > box.altura ||
    tiposUmaLinha.includes(campo.tipo) &&
      fonte.widthOfTextAtSize(linhas[0] || "", tamanho) > box.largura
  ) &&
  tamanho > 4
) {
  tamanho -= 0.5;

  linhas =
    campo.textoModo === "VERTICAL"
      ? String(texto).split("")
      : tiposUmaLinha.includes(campo.tipo)
      ? [String(texto).replace(/\s+/g, " ").trim()]
      : String(texto)
          .split("\n")
          .flatMap((linha) =>
            quebrarLinhaPorLargura(
              linha,
              fonte,
              tamanho,
              Math.max(10, box.largura)
            )
          );
}

  const alturaLinha = tamanho * lineHeight;
  const maxLinhas = Math.max(1, Math.floor(box.altura / alturaLinha));
  const linhasVisiveis = linhas.slice(0, maxLinhas);

  const alturaTotal = linhasVisiveis.length * alturaLinha;

  let yAtual =
    box.y +
    box.altura -
    (box.altura - alturaTotal) / 2 -
    tamanho;

  for (const linha of linhasVisiveis) {
    const larguraTexto = fonte.widthOfTextAtSize(linha, tamanho);

    let xTexto = box.x;

    if (campo.alinhamento === "center") {
      xTexto = box.x + (box.largura - larguraTexto) / 2;
    }

    if (campo.alinhamento === "right") {
      xTexto = box.x + box.largura - larguraTexto;
    }

    page.drawText(linha, {
      x: xTexto,
      y: yAtual,
      size: tamanho,
      font: fonte,
      color: corPdf(campo.cor, "#1e3a8a"),
      opacity: normalizarOpacidade(campo.opacity),
      rotate: degrees(Number(campo.rotate || 0)),
    } as any);

    if (campo.sublinhado) {
      page.drawLine({
        start: { x: xTexto, y: yAtual - 2 },
        end: { x: xTexto + larguraTexto, y: yAtual - 2 },
        thickness: Math.max(0.4, tamanho * 0.04),
        color: corPdf(campo.cor, "#1e3a8a"),
        opacity: normalizarOpacidade(campo.opacity),
      } as any);
    }

    yAtual -= alturaLinha;
  }
}

async function carregarImagem(url?: string | null) {
  if (!url) return null;

  const valor = String(url).trim();

  if (!valor) return null;

  if (valor.startsWith("data:image/")) {
    const [cabecalho, base64] = valor.split(",");
    const mime = cabecalho.includes("png") ? "image/png" : "image/jpeg";

    return {
      bytes: Uint8Array.from(Buffer.from(base64, "base64")),
      mime,
    };
  }

  const resposta = await fetch(valor);

  if (!resposta.ok) return null;

  return {
    bytes: new Uint8Array(await resposta.arrayBuffer()),
    mime: resposta.headers.get("content-type") || "",
  };
}

async function desenharImagem(
  pdfDoc: PDFDocument,
  page: PDFPage,
  campo: CampoCertificadoPdf,
  url: string | null | undefined
) {
  const imagem = await carregarImagem(url);

  if (!imagem) return;

  const { width, height } = page.getSize();
  const box = caixaPdf(campo, width, height);

  const ehPng =
    imagem.mime.includes("png") ||
    String(url || "").toLowerCase().includes(".png");

  const img = ehPng
    ? await pdfDoc.embedPng(imagem.bytes)
    : await pdfDoc.embedJpg(imagem.bytes);

  const proporcaoImagem = img.width / img.height;
  const proporcaoBox = box.largura / box.altura;

  let larguraFinal = box.largura;
  let alturaFinal = box.altura;

  const objectFit = campo.objectFit || "contain";

  if (objectFit !== "cover") {
    if (proporcaoImagem > proporcaoBox) {
      alturaFinal = box.largura / proporcaoImagem;
    } else {
      larguraFinal = box.altura * proporcaoImagem;
    }
  }

  const x = box.x + (box.largura - larguraFinal) / 2;
  const y = box.y + (box.altura - alturaFinal) / 2;

  page.drawImage(img, {
    x,
    y,
    width: larguraFinal,
    height: alturaFinal,
    opacity: normalizarOpacidade(campo.opacity),
    rotate: degrees(Number(campo.rotate || 0)),
  } as any);
}

async function desenharQrCode(
  pdfDoc: PDFDocument,
  page: PDFPage,
  campo: CampoCertificadoPdf,
  dados: DadosCertificado
) {
  const { width, height } = page.getSize();
  const box = caixaPdf(campo, width, height);

  const urlValidacao = `${getBaseUrl()}/validar-certificado?codigo=${encodeURIComponent(
    dados.codigoValidacao
  )}`;

  const qrDataUrl = await QRCode.toDataURL(urlValidacao, {
    margin: 1,
    width: 300,
  });

  const qrBytes = Uint8Array.from(
    Buffer.from(qrDataUrl.split(",")[1], "base64")
  );

  const qrImage = await pdfDoc.embedPng(qrBytes);

  page.drawImage(qrImage, {
    x: box.x,
    y: box.y,
    width: box.largura,
    height: box.altura,
    opacity: normalizarOpacidade(campo.opacity),
  } as any);
}

function pathDaForma(campo: CampoCertificadoPdf) {
  const forma = campo.forma || "";

  if (Array.isArray(campo.pontosForma) && campo.pontosForma.length >= 2) {
    const pontos = campo.pontosForma;

    return pontos
      .map((p, index) => {
        const x = Number(p.x || 0);
        const y = Number(p.y || 0);

        return `${index === 0 ? "M" : "L"} ${x} ${100 - y}`;
      })
      .join(" ")
      .concat(" Z");
  }

  if (forma === "TRIANGULO") {
    return "M 50 100 L 100 0 L 0 0 Z";
  }

  if (forma === "LOSANGO") {
    return "M 50 100 L 100 50 L 50 0 L 0 50 Z";
  }

  if (forma === "SETA") {
    return "M 0 40 L 65 40 L 65 15 L 100 50 L 65 85 L 65 60 L 0 60 Z";
  }

  if (forma === "ESTRELA") {
    return "M 50 100 L 61 62 L 100 62 L 68 40 L 79 0 L 50 25 L 21 0 L 32 40 L 0 62 L 39 62 Z";
  }

  return "";
}

function desenharForma(page: PDFPage, campo: CampoCertificadoPdf) {
  const { width, height } = page.getSize();
  const box = caixaPdf(campo, width, height);

  const forma = campo.forma || "RETANGULO";

  const preenchimentoAtivo = campo.mostrarPreenchimento !== false;
  const contornoAtivo = campo.mostrarContorno !== false;

  const opcoesBase: any = {
    opacity: normalizarOpacidade(campo.opacity),
    rotate: degrees(Number(campo.rotate || 0)),
  };

  if (preenchimentoAtivo) {
    opcoesBase.color = corPdf(campo.preenchimentoCor || campo.cor, "#1d4ed8");
  }

  if (contornoAtivo) {
    opcoesBase.borderColor = corPdf(campo.contornoCor || campo.cor, "#1d4ed8");
    opcoesBase.borderWidth = Number(campo.contornoEspessura || 1);
  }

  if (forma === "LINHA") {
    page.drawLine({
      start: { x: box.x, y: box.y + box.altura / 2 },
      end: { x: box.x + box.largura, y: box.y + box.altura / 2 },
      thickness: Number(campo.contornoEspessura || 2),
      color: corPdf(campo.contornoCor || campo.cor, "#1d4ed8"),
      opacity: normalizarOpacidade(campo.opacity),
    } as any);

    return;
  }

  if (forma === "CIRCULO") {
    page.drawEllipse({
      x: box.x + box.largura / 2,
      y: box.y + box.altura / 2,
      xScale: box.largura / 2,
      yScale: box.altura / 2,
      ...opcoesBase,
    });

    return;
  }

  if (forma === "RETANGULO" || forma === "QUADRADO") {
    page.drawRectangle({
      x: box.x,
      y: box.y,
      width: box.largura,
      height: box.altura,
      ...opcoesBase,
    });

    return;
  }

  const path = pathDaForma(campo);

  if (path) {
    page.drawSvgPath(path, {
      x: box.x,
      y: box.y,
      scale: Math.min(box.largura, box.altura) / 100,
      ...opcoesBase,
    } as any);
  }
}

function urlImagemDoCampo(campo: CampoCertificadoPdf, dados: DadosCertificado) {
  if (campo.tipo === "ASSINATURA") {
    return dados.assinaturaUrl || campo.imagemUrl || campo.url || null;
  }

  if (campo.tipo === "LOGO_INSTITUICAO") {
    return dados.logoUrl || campo.imagemUrl || campo.url || null;
  }

  return (
    campo.imagemUrl ||
    campo.url ||
    campo.src ||
    campo.arquivoUrl ||
    campo.previewUrl ||
    null
  );
}

export async function gerarCertificadoPdf(
  templateBytes: Uint8Array | null,
  dados: DadosCertificado,
  camposRecebidos: any[] = []
) {
  const pdfDoc = templateBytes
    ? await PDFDocument.load(templateBytes)
    : await PDFDocument.create();

  if (!templateBytes) {
    pdfDoc.addPage([842, 595]);
  }

  const page = pdfDoc.getPages()[0];

  const fontes = {
    normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
  };

  const campos = camposRecebidos
    .map(normalizarCampo)
    .filter((campo) => campo && campo.tipo)
    .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));

  for (const campo of campos) {
    if (campo.tipo === "FORMA") {
      desenharForma(page, campo);
      continue;
    }

    if (campo.tipo === "QR_CODE") {
      await desenharQrCode(pdfDoc, page, campo, dados);
      continue;
    }

    if (
  campo.tipo === "IMAGEM" ||
  campo.tipo === "ASSINATURA" ||
  campo.tipo === "LOGO_INSTITUICAO"
) {
  const url = urlImagemDoCampo(campo, dados);

  if (url) {
    await desenharImagem(pdfDoc, page, campo, url);
  }

  continue;
}

desenharTexto(page, campo, dados, fontes);
  }

  return await pdfDoc.save();
}