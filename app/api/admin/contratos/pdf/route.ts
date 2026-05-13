import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function normalizarEstilo(estilo?: string) {
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
    case "MINIMALISTA":
      return "PHANYX_ACADEMICO";
    case "CLASSICO":
      return "PHANYX_CLASSICO";

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

async function gerarCodigoValidacaoUnico(
  instituicaoId: number,
  nomeInstituicao: string | undefined
) {
  const siglaInstituicao =
    String(nomeInstituicao || `INST${instituicaoId}`)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .trim()
      .split(/\s+/)
      .map((parte) => parte.slice(0, 1).toUpperCase())
      .join("")
      .slice(0, 6) || `INST${instituicaoId}`;

  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const sufixoSeguro = crypto.randomBytes(4).toString("hex").toUpperCase();
    const codigo = `PHANYX-${siglaInstituicao}-${instituicaoId}-${Date.now()}-${sufixoSeguro}`;

    const existente = await prisma.documentoGerado.findUnique({
      where: { codigoValidacao: codigo },
      select: { id: true },
    });

    if (!existente) {
      return codigo;
    }
  }

  throw new Error("Não foi possível gerar um código de validação único.");
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const matriculaId = Number(searchParams.get("matriculaId"));
    const alunoId = Number(searchParams.get("alunoId"));

    const aluno =
      Number.isFinite(alunoId) && alunoId > 0
        ? await prisma.aluno.findFirst({
            where: {
              id: alunoId,
              instituicaoId: user.instituicaoId,
            },
            select: {
              id: true,
              nome: true,
            },
          })
        : null;

    if (
      (!Number.isFinite(matriculaId) || matriculaId <= 0) &&
      (!Number.isFinite(alunoId) || alunoId <= 0)
    ) {
      return NextResponse.json(
        { error: "Parâmetro inválido (matriculaId ou alunoId)" },
        { status: 400 }
      );
    }

    if (Number.isFinite(alunoId) && alunoId > 0 && !aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const urlBase = new URL(req.url);
    const origem = `${urlBase.protocol}//${urlBase.host}`;

    let url = "";
    if (Number.isFinite(matriculaId) && matriculaId > 0) {
      url = `${origem}/api/admin/contratos/gerar?matriculaId=${matriculaId}`;
    } else {
      url = `${origem}/api/admin/contratos/gerar?alunoId=${alunoId}`;
    }

    const contratoRes = await fetch(url, {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    const data = await contratoRes.json();

    if (!contratoRes.ok) {
      throw new Error(data?.error || "Erro ao buscar dados do contrato");
    }

    const siglaInstituicao = String(
  data?.instituicao?.nomeFantasia ||
    data?.instituicao?.nome ||
    `INST${user.instituicaoId}`
)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^A-Za-z0-9 ]/g, "")
  .trim()
  .split(/\s+/)
  .map((parte) => parte.slice(0, 1).toUpperCase())
  .join("")
  .slice(0, 6) || `INST${user.instituicaoId}`;

const sufixoSeguro = crypto.randomBytes(4).toString("hex").toUpperCase();

const codigoValidacao = await gerarCodigoValidacaoUnico(
  user.instituicaoId,
  data?.instituicao?.nome
);

await prisma.documentoGerado.create({
  data: {
    codigoValidacao,
    titulo: data?.titulo || "Contrato educacional",
    tipo: "CONTRATO",
    status: "GERADO",
    conteudo:
      data?.conteudo ||
      `Contrato gerado automaticamente para o aluno ${
        aluno?.nome || "não identificado"
      }.`,
    alunoId: aluno?.id ?? null,
    matriculaId:
      Number.isFinite(matriculaId) && matriculaId > 0 ? matriculaId : null,
    instituicaoId: user.instituicaoId,
    exigeAssinatura: true,
  },
});

const linkValidacao = `${origem}/validar-documento?codigo=${encodeURIComponent(codigoValidacao)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(linkValidacao);
    const estilo = normalizarEstilo(
      data?.instituicao?.estiloPapelTimbrado ||
        data?.instituicao?.estiloDocumento
    );

    const nomeInstituicao = data?.instituicao?.nomeFantasia || "Instituição";
    const cnpj = data?.instituicao?.cnpj || "-";
    const telefone = data?.instituicao?.telefone || "-";
    const email = data?.instituicao?.email || "-";
    const enderecoCompleto = data?.instituicao?.enderecoCompleto || "";
    const responsavelNome =
      data?.instituicao?.responsavelNome || "Responsável legal";
    const responsavelCargo =
      data?.instituicao?.responsavelCargo || "Representante legal";

    const pdfDoc = await PDFDocument.create();
    let assinaturaDiretorEmbed = null;
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595;
    const pageHeight = 842;
    const margemX = 50;
    const larguraTexto = 495;

    async function carregarImagem(urlImagem: string) {
      if (!urlImagem) return null;

      try {
        const logoResponse = await fetch(
  urlImagem.startsWith("http") ? urlImagem : `${origem}${urlImagem}`
);

        if (!logoResponse.ok) return null;

        const bytes = await logoResponse.arrayBuffer();

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

    const imagemLogo = await carregarImagem(data?.instituicao?.logoUrl || "");

    const assinaturaDiretorUrl =
  data?.instituicao?.certificadoAssinaturaUrl ||
  data?.instituicao?.assinaturaDiretorUrl ||
  "";

    const assinaturaDiretorDinamica = await carregarImagem(assinaturaDiretorUrl);

if (assinaturaDiretorDinamica) {
  assinaturaDiretorEmbed = assinaturaDiretorDinamica;
}

const camposVisuaisContrato = Array.isArray(data?.camposVisuais)
  ? data.camposVisuais
  : Array.isArray(data?.template?.camposVisuais)
  ? data.template.camposVisuais
  : [];

const camposAssinaturaDiretor = camposVisuaisContrato.filter(
  (campo: any) => campo?.tipo === "ASSINATURA_DIRETOR"
);

const temAssinaturaDiretorVisual = camposAssinaturaDiretor.length > 0;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 130;

    async function desenharLogo(
      pagina: any,
      x: number,
      yLogo: number,
      width: number,
      height: number,
      fundoClaro = false
    ) {
      if (!imagemLogo) return;

      if (fundoClaro) {
        pagina.drawRectangle({
          x: x - 6,
          y: yLogo - 6,
          width: width + 12,
          height: height + 12,
          color: rgb(1, 1, 1),
        });
      }

      pagina.drawImage(imagemLogo, {
        x,
        y: yLogo,
        width,
        height,
      });
    }

    async function desenharCabecalho(pagina: any) {
      if (estilo === "PHANYX_MODERNO") {
        pagina.drawRectangle({
          x: 0,
          y: pageHeight - 92,
          width: pageWidth,
          height: 92,
          color: rgb(0.14, 0.25, 0.45),
        });

        pagina.drawRectangle({
          x: 0,
          y: 0,
          width: 22,
          height: pageHeight,
          color: rgb(0.09, 0.16, 0.31),
        });

        await desenharLogo(pagina, 58, pageHeight - 68, 48, 48, true);

        pagina.drawText(nomeInstituicao, {
          x: 118,
          y: pageHeight - 42,
          size: 16,
          font: bold,
          color: rgb(1, 1, 1),
        });

        pagina.drawText("Contrato educacional", {
          x: 118,
          y: pageHeight - 60,
          size: 9,
          font,
          color: rgb(0.9, 0.93, 0.97),
        });

        return;
      }

      if (estilo === "PHANYX_CLASSICO") {
        pagina.drawRectangle({
          x: 0,
          y: pageHeight - 84,
          width: pageWidth,
          height: 84,
          color: rgb(0.08, 0.08, 0.08),
        });

        await desenharLogo(pagina, 58, pageHeight - 62, 42, 42, true);

        pagina.drawText(nomeInstituicao, {
          x: 112,
          y: pageHeight - 38,
          size: 16,
          font: bold,
          color: rgb(1, 1, 1),
        });

        pagina.drawText("Contrato educacional", {
          x: 112,
          y: pageHeight - 56,
          size: 9,
          font,
          color: rgb(0.92, 0.92, 0.92),
        });

        return;
      }

      if (estilo === "PHANYX_ACADEMICO") {
        await desenharLogo(pagina, margemX, pageHeight - 70, 40, 40);

        pagina.drawText(nomeInstituicao, {
          x: 102,
          y: pageHeight - 40,
          size: 16,
          font: bold,
          color: rgb(0.1, 0.1, 0.14),
        });

        pagina.drawText("Contrato educacional", {
          x: 102,
          y: pageHeight - 58,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.45),
        });

        pagina.drawLine({
          start: { x: margemX, y: pageHeight - 88 },
          end: { x: pageWidth - margemX, y: pageHeight - 88 },
          thickness: 1,
          color: rgb(0.75, 0.75, 0.78),
        });

        return;
      }
    }

    function desenharRodapeInstitucional(
      pagina: any,
      numeroPagina: number,
      totalPaginas: number
    ) {
      if (estilo === "PHANYX_MODERNO") {
        pagina.drawRectangle({
          x: 0,
          y: 0,
          width: pageWidth,
          height: 46,
          color: rgb(0.14, 0.25, 0.45),
        });

        pagina.drawText(`${nomeInstituicao} • CNPJ: ${cnpj}`, {
          x: margemX,
          y: 26,
          size: 8,
          font,
          color: rgb(1, 1, 1),
        });

        pagina.drawText(`${telefone} • ${email}`, {
          x: margemX,
          y: 15,
          size: 8,
          font,
          color: rgb(0.93, 0.95, 0.98),
        });

        if (enderecoCompleto) {
          pagina.drawText(enderecoCompleto, {
            x: margemX,
            y: 4,
            size: 8,
            font,
            color: rgb(0.93, 0.95, 0.98),
          });
        }
      } else if (estilo === "PHANYX_CLASSICO") {
        pagina.drawRectangle({
          x: 0,
          y: 0,
          width: pageWidth,
          height: 44,
          color: rgb(0.08, 0.08, 0.08),
        });

        pagina.drawText(`${nomeInstituicao} • CNPJ: ${cnpj}`, {
          x: margemX,
          y: 25,
          size: 8,
          font,
          color: rgb(1, 1, 1),
        });

        pagina.drawText(`${telefone} • ${email}`, {
          x: margemX,
          y: 14,
          size: 8,
          font,
          color: rgb(0.92, 0.92, 0.92),
        });

        if (enderecoCompleto) {
          pagina.drawText(enderecoCompleto, {
            x: margemX,
            y: 3,
            size: 8,
            font,
            color: rgb(0.92, 0.92, 0.92),
          });
        }
      } else {
        pagina.drawLine({
          start: { x: margemX, y: 42 },
          end: { x: pageWidth - margemX, y: 42 },
          thickness: 0.8,
          color: rgb(0.82, 0.84, 0.88),
        });

        pagina.drawText(`${nomeInstituicao} • CNPJ: ${cnpj}`, {
          x: margemX,
          y: 24,
          size: 8,
          font,
          color: rgb(0.45, 0.45, 0.45),
        });

        pagina.drawText(`${telefone} • ${email}`, {
          x: margemX,
          y: 14,
          size: 8,
          font,
          color: rgb(0.45, 0.45, 0.45),
        });

        if (enderecoCompleto) {
          pagina.drawText(enderecoCompleto, {
            x: margemX,
            y: 4,
            size: 8,
            font,
            color: rgb(0.45, 0.45, 0.45),
          });
        }
      }

      pagina.drawText(`Página ${numeroPagina} de ${totalPaginas}`, {
        x: pageWidth - 110,
        y: 24,
        size: 8,
        font,
        color:
          estilo === "PHANYX_MODERNO" || estilo === "PHANYX_CLASSICO"
            ? rgb(1, 1, 1)
            : rgb(0.45, 0.45, 0.45),
      });
    }

    await desenharCabecalho(page);

    y =
      estilo === "PHANYX_MODERNO"
        ? pageHeight - 132
        : estilo === "PHANYX_CLASSICO"
        ? pageHeight - 126
        : pageHeight - 118;

    page.drawText("CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS", {
      x: margemX,
      y,
      size: 15,
      font: bold,
      color:
        estilo === "PHANYX_MODERNO"
          ? rgb(0.12, 0.22, 0.4)
          : rgb(0.08, 0.08, 0.08),
    });

    y -= 34;

    const paragrafos = String(data?.contratoFinal || "").split("\n");

    for (const paragrafo of paragrafos) {
      const linhasQuebradas =
        paragrafo.trim() === ""
          ? [""]
          : quebrarTextoEmLinhas(paragrafo, larguraTexto, font, 11);

      for (const linha of linhasQuebradas) {
        if (y < 150) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          await desenharCabecalho(page);

          y =
            estilo === "PHANYX_MODERNO"
              ? pageHeight - 132
              : estilo === "PHANYX_CLASSICO"
              ? pageHeight - 126
              : pageHeight - 118;
        }

        if (linha.includes("{{assinaturaDiretor}}")) {
  const partes = linha.split("{{assinaturaDiretor}}");
  const textoAntes = partes[0] || "";
  const textoDepois = partes[1] || "";

  const xAssinatura = margemX + font.widthOfTextAtSize(textoAntes, 11);

  if (textoAntes.trim()) {
    page.drawText(textoAntes, {
      x: margemX,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
  }

  if (assinaturaDiretorEmbed) {
    page.drawImage(assinaturaDiretorEmbed, {
      x: xAssinatura,
      y: y - 12,
      width: 125,
      height: 34,
      opacity: 1,
    });
  } else {
    page.drawText("Assinatura do diretor", {
      x: xAssinatura,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
  }

  if (textoDepois.trim()) {
    page.drawText(textoDepois, {
      x: xAssinatura + 130,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
  }
} else {
  page.drawText(linha || " ", {
    x: margemX,
    y,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
}

y -= 19;
      }

      y -= 7;
    }

    y -= 20;

    if (y < 190) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      await desenharCabecalho(page);
      y = pageHeight - 170;
    }

    page.drawText("Assinaturas", {
      x: margemX,
      y,
      size: 12,
      font: bold,
      color: rgb(0.08, 0.08, 0.08),
    });

    y -= 34;
    const linhaY = y;

const assinaturaAlunoBase64 = data?.contrato?.assinatura?.imagem;

if (assinaturaAlunoBase64) {
  try {
    const base64Limpo = String(assinaturaAlunoBase64).includes(",")
      ? String(assinaturaAlunoBase64).split(",")[1]
      : String(assinaturaAlunoBase64);

    const assinaturaBytes = Buffer.from(base64Limpo, "base64");
    const assinaturaImagem = await pdfDoc.embedPng(assinaturaBytes);

    const assinaturaAlunoConfig = {
  x: 65,
  y: linhaY + 1,
  width: 100,
  height: 30,
  opacity: 1,
};

page.drawImage(assinaturaImagem, assinaturaAlunoConfig);
page.drawImage(assinaturaImagem, {
  ...assinaturaAlunoConfig,
  x: assinaturaAlunoConfig.x + 0.4,
});
page.drawImage(assinaturaImagem, {
  ...assinaturaAlunoConfig,
  y: assinaturaAlunoConfig.y + 0.4,
});
  } catch (e) {
    console.error("Erro ao desenhar assinatura do aluno no PDF:", e);
  }
}

const assinaturaSecretariaBase64 =
  data?.contrato?.assinaturaSecretariaImagem;

  const assinaturaSecretariaNome =
  data?.contrato?.assinaturaSecretariaNome || null;

const assinaturaSecretariaEm =
  data?.contrato?.assinaturaSecretariaEm || null;

if (assinaturaSecretariaBase64) {
  try {
    const base64Completo = String(assinaturaSecretariaBase64);
    const base64Limpo = base64Completo.includes(",")
      ? base64Completo.split(",")[1]
      : base64Completo;

    const assinaturaBytes = Buffer.from(base64Limpo, "base64");

    let assinaturaImagem;

    if (base64Completo.includes("image/jpeg") || base64Completo.includes("image/jpg")) {
      assinaturaImagem = await pdfDoc.embedJpg(assinaturaBytes);
    } else {
      assinaturaImagem = await pdfDoc.embedPng(assinaturaBytes);
    }

    const assinaturaSecretariaConfig = {
      x: 424,
      y: linhaY + 1,
      width: 105,
      height: 30,
      opacity: 1,
    };

    page.drawImage(assinaturaImagem, assinaturaSecretariaConfig);
    page.drawImage(assinaturaImagem, {
      ...assinaturaSecretariaConfig,
      x: assinaturaSecretariaConfig.x + 0.4,
    });
    page.drawImage(assinaturaImagem, {
      ...assinaturaSecretariaConfig,
      y: assinaturaSecretariaConfig.y + 0.4,
    });
    page.drawImage(assinaturaImagem, {
      ...assinaturaSecretariaConfig,
      x: assinaturaSecretariaConfig.x - 0.4,
    });
  } catch (e) {
    console.error("Erro ao desenhar assinatura da secretaria:", e);
  }
}

if (!assinaturaSecretariaBase64 && assinaturaSecretariaNome) {
  page.drawText("Assinado digitalmente por:", {
    x: 428,
    y: linhaY + 19,
    size: 7,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText(String(assinaturaSecretariaNome).slice(0, 34), {
    x: 428,
    y: linhaY + 10,
    size: 8,
    font: bold,
    color: rgb(0, 0, 0),
  });

  if (assinaturaSecretariaEm) {
    page.drawText(
      `Em ${new Date(assinaturaSecretariaEm).toLocaleDateString("pt-BR")}`,
      {
        x: 428,
        y: linhaY + 1,
        size: 7,
        font,
        color: rgb(0, 0, 0),
      }
    );
  }
}

    page.drawLine({
      start: { x: 50, y: linhaY },
      end: { x: 190, y: linhaY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: 228, y: linhaY },
      end: { x: 368, y: linhaY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

 if (false && assinaturaDiretorEmbed && !temAssinaturaDiretorVisual) {
  const assinaturaDiretorConfig = {
    x: 248,
    y: linhaY + 1,
    width: 125,
    height: 32,
    opacity: 1,
  };

  page.drawImage(assinaturaDiretorEmbed, assinaturaDiretorConfig);
  page.drawImage(assinaturaDiretorEmbed, { ...assinaturaDiretorConfig, x: assinaturaDiretorConfig.x + 0.5 });
  page.drawImage(assinaturaDiretorEmbed, { ...assinaturaDiretorConfig, y: assinaturaDiretorConfig.y + 0.5 });
  page.drawImage(assinaturaDiretorEmbed, { ...assinaturaDiretorConfig, x: assinaturaDiretorConfig.x - 0.5 });
  page.drawImage(assinaturaDiretorEmbed, { ...assinaturaDiretorConfig, y: assinaturaDiretorConfig.y - 0.5 });
}

    page.drawLine({
      start: { x: 406, y: linhaY },
      end: { x: 545, y: linhaY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    y -= 18;

    page.drawText(data?.aluno?.nome || "Aluno/Titular", {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(responsavelNome, {
      x: 228,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Atendente / Secretaria", {
      x: 406,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 14;

    page.drawText("Titular do contrato", {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawText(`${responsavelCargo} • CNPJ: ${cnpj}`, {
      x: 228,
      y,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawText("Assinatura administrativa", {
      x: 406,
      y,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    y -= 42;

    if (y < 120) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      await desenharCabecalho(page);
      y = pageHeight - 170;
    }

    page.drawText("Testemunhas", {
      x: margemX,
      y,
      size: 12,
      font: bold,
      color: rgb(0.08, 0.08, 0.08),
    });

    y -= 28;

    page.drawLine({
      start: { x: 50, y },
      end: { x: 240, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: 305, y },
      end: { x: 495, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    y -= 15;

    page.drawText("Nome:", {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawText("Nome:", {
      x: 305,
      y,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    y -= 12;

    page.drawText("CPF:", {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawText("CPF:", {
      x: 305,
      y,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

 if (assinaturaDiretorEmbed && camposAssinaturaDiretor.length > 0) {
  const larguraPreview = 276;
  const linhaPreviewY = 326;
  const escalaX = 495 / larguraPreview;
  const escalaY = 1.15;

  for (const campo of camposAssinaturaDiretor) {
    const paginaDestino = pdfDoc.getPage(pdfDoc.getPageCount() - 1);

    const largura = Number(campo.largura || 160) * escalaX;
    const altura = Number(campo.altura || 45) * escalaY;

    const x = margemX + Number(campo.x || 0) * escalaX;
    const yPdf =
      linhaY +
      (linhaPreviewY - Number(campo.y || 0)) * escalaY -
      altura / 2;

    paginaDestino.drawImage(assinaturaDiretorEmbed, {
      x,
      y: yPdf,
      width: largura,
      height: altura,
      opacity: 1,
    });
  }
}

    const totalPaginas = pdfDoc.getPageCount();
const paginaFinal = pdfDoc.getPage(totalPaginas - 1);
const { width } = paginaFinal.getSize();

const qrImageBytes = await fetch(qrCodeDataUrl).then((res) => res.arrayBuffer());
const qrImage = await pdfDoc.embedPng(qrImageBytes);
const qrSize = 80;

const qrX = width - qrSize - 40;
const qrY = 100;

const textoValidacao = "Documento validável digitalmente";
const tamanhoTextoValidacao = 9;
const tamanhoCodigo = 7;

const larguraTextoValidacao =
  helveticaFont.widthOfTextAtSize(textoValidacao, tamanhoTextoValidacao);

const larguraCodigo =
  helveticaFont.widthOfTextAtSize(codigoValidacao, tamanhoCodigo);

const centroQr = qrX + qrSize / 2;

paginaFinal.drawImage(qrImage, {
  x: qrX,
  y: qrY,
  width: qrSize,
  height: qrSize,
});

paginaFinal.drawText(textoValidacao, {
  x: centroQr - larguraTextoValidacao / 2,
  y: qrY - 20,
  size: tamanhoTextoValidacao,
  font: helveticaFont,
});

paginaFinal.drawText(codigoValidacao, {
  x: centroQr - larguraCodigo / 2,
  y: qrY - 35,
  size: tamanhoCodigo,
  font: helveticaFont,
});

for (let i = 0; i < totalPaginas; i++) {
  const pagina = pdfDoc.getPage(i);
  desenharRodapeInstitucional(pagina, i + 1, totalPaginas);
}

               const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="contrato.pdf"',
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF do contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}