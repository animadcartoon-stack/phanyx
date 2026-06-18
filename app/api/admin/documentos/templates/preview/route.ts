import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { renderizarHtmlTipTapNoPdf } from "@/lib/pdf/renderizarHtmlTipTap";

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
    numeroMatricula: "2026-0001",
    nomeTitularContrato: "Aluno Exemplo",
    cpfTitularContrato: "000.000.000-00",
    emailTitularContrato: "titular@exemplo.com",
    telefoneTitularContrato: "(00) 00000-0000",
    parentescoTitularContrato: "Aluno maior de idade",
    tipoTitularContrato: "Próprio aluno",
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

    if (body?.tipo === "HISTORICO") {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const baseUrl = new URL(req.url).origin;
    const logo = await carregarImagemPdf(pdfDoc, config?.logoUrl, baseUrl);

    let page = pdfDoc.addPage([595.28, 841.89]);

    const preto = rgb(0, 0, 0);
    const cinza = rgb(0.35, 0.35, 0.35);
    const cinzaClaro = rgb(0.92, 0.92, 0.92);

    function drawBox(x: number, y: number, w: number, h: number) {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: preto,
        borderWidth: 0.8,
      });
    }

    function drawText(
      texto: string,
      x: number,
      y: number,
      size = 8,
      bold = false,
      color = preto
    ) {
      page.drawText(String(texto || "-"), {
        x,
        y,
        size,
        font: bold ? fontBold : font,
        color,
      });
    }

    function novaPaginaHistorico() {
      page = pdfDoc.addPage([595.28, 841.89]);
      drawBox(35, 35, 525, 770);
      return 760;
    }

    drawBox(35, 35, 525, 770);

    // Cabeçalho
    drawBox(45, 675, 505, 120);
    drawBox(55, 685, 100, 100);

    if (logo) {
      page.drawImage(logo, {
        x: 65,
        y: 695,
        width: 80,
        height: 80,
      });
    } else {
      drawText("Logo da", 83, 735, 10);
      drawText("Instituição", 75, 718, 10);
    }

    drawText(config?.nomeFantasia || "Instituição Exemplo", 175, 765, 8);
    drawText(`CNPJ: ${config?.cnpj || "00.000.000/0001-00"}`, 175, 750, 8);
    drawText(
      `${config?.endereco || "Endereço institucional"}${config?.numero ? ` - ${config.numero}` : ""}`,
      175,
      735,
      8
    );
    drawText(`Telefone: ${config?.telefone || "(00) 00000-0000"}`, 175, 720, 8);
    drawText(`E-mail: ${config?.email || "contato@instituicao.com"}`, 175, 705, 8);

    // Título
    drawText("HISTÓRICO ACADÊMICO — BACHAREL LIVRE EM TEOLOGIA", 85, 640, 13, true);

    // Dados do aluno
    drawBox(45, 460, 505, 145);

    page.drawRectangle({
      x: 45,
      y: 585,
      width: 505,
      height: 20,
      color: cinzaClaro,
      borderColor: preto,
      borderWidth: 0.8,
    });

    drawText("DADOS DO ALUNO", 250, 591, 9, true);

    drawText("Aluno(a): Aluno Exemplo", 55, 565, 8);
    drawText("CPF: 000.000.000-00", 55, 550, 8);
    drawText("RG: -", 55, 535, 8);
    drawText("Órgão expedidor: -", 55, 520, 8);
    drawText("Nascimento: -", 55, 505, 8);
    drawText("Sexo: -", 55, 490, 8);
    drawText("Naturalidade: -", 55, 475, 8);

    drawText("Nacionalidade: Brasileira", 280, 565, 8);
    drawText("Matrícula: 2026-0001", 280, 550, 8);
    drawText("Situação acadêmica: ATIVO", 280, 535, 8);

    // Tabela
    drawText("COMPONENTES CURRICULARES", 190, 420, 11, true);

    const tabelaX = 45;
    let yTabela = 390;

    const colunas = [
      { titulo: "DISCIPLINA", x: tabelaX, w: 260 },
      { titulo: "C.H.", x: tabelaX + 260, w: 55 },
      { titulo: "NOTA", x: tabelaX + 315, w: 60 },
      { titulo: "FREQ.", x: tabelaX + 375, w: 60 },
      { titulo: "SITUAÇÃO", x: tabelaX + 435, w: 70 },
    ];

    page.drawRectangle({
      x: tabelaX,
      y: yTabela,
      width: 505,
      height: 22,
      color: cinzaClaro,
      borderColor: preto,
      borderWidth: 0.8,
    });

    for (const col of colunas) {
      drawBox(col.x, yTabela, col.w, 22);
      drawText(col.titulo, col.x + 5, yTabela + 8, 8, true);
    }

    yTabela -= 22;

    const disciplinas = [
      ["ANTIGO TESTAMENTO A", "96h", "-", "-", "A cursar"],
      ["NOVO TESTAMENTO A", "96h", "-", "-", "A cursar"],
      ["TEOLOGIA BÍBLICA", "64h", "-", "-", "A cursar"],
      ["ANTROPOLOGIA E MISSÕES TRANSCULTURAIS", "64h", "-", "-", "A cursar"],
      ["HERMENÊUTICA BÍBLICA", "64h", "-", "-", "A cursar"],
    ];

    for (const item of disciplinas) {
      if (yTabela < 135) {
        yTabela = novaPaginaHistorico();
      }

      for (const col of colunas) {
        drawBox(col.x, yTabela, col.w, 20);
      }

      drawText(item[0].slice(0, 45), tabelaX + 5, yTabela + 7, 7.5);
      drawText(item[1], tabelaX + 270, yTabela + 7, 7.5);
      drawText(item[2], tabelaX + 327, yTabela + 7, 7.5);
      drawText(item[3], tabelaX + 387, yTabela + 7, 7.5);
      drawText(item[4], tabelaX + 442, yTabela + 7, 7.2);

      yTabela -= 20;
    }

    // Observações
    yTabela -= 30;
    drawText("OBSERVAÇÕES:", 45, yTabela, 8.5, true);
    drawText("Histórico acadêmico emitido eletronicamente pelo PHANYX.", 45, yTabela - 15, 7);
    drawText(
      "As disciplinas ainda não concluídas permanecem indicadas como “A cursar”.",
      45,
      yTabela - 28,
      7
    );

    // Assinatura
    drawText(config?.responsavelNome || "Responsável legal", 230, 120, 8.5, true);
    page.drawLine({
      start: { x: 185, y: 135 },
      end: { x: 410, y: 135 },
      thickness: 0.8,
      color: preto,
    });
    drawText(config?.responsavelCargo || "Diretor", 260, 108, 7.5);
    drawText(config?.nomeFantasia || "Instituição", 270, 96, 7.5);

    // Rodapé
    drawText(
      `${config?.nomeFantasia || "PHANYX"} - CNPJ ${config?.cnpj || "-"}`,
      45,
      65,
      7,
      false,
      cinza
    );

    drawText("Código de validação: PHANYX-EXEMPLO-0001", 45, 52, 7, true, cinza);
    drawText("Valide em: https://www.phanyx.com.br/validar-documento", 45, 40, 7, false, cinza);

    const bytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=previa-historico.pdf",
      },
    });
  }

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

  await renderizarHtmlTipTapNoPdf({
  html: conteudoHtml,
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
      "Content-Disposition": "inline; filename=previa-template.pdf",
    },
  });
}