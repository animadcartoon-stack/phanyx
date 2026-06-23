import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

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

function substituirExemplos(texto: string, config: any) {
  const valores: Record<string, string> = {
    nomeInstituicao: config?.nomeFantasia || "Instituição Exemplo",
    cnpjInstituicao: config?.cnpj || "00.000.000/0001-00",
    enderecoInstituicao: config?.endereco || "Endereço institucional",
    telefoneInstituicao: config?.telefone || "(00) 00000-0000",
    emailInstituicao: config?.email || "contato@instituicao.com",
    cidadeInstituicao: config?.cidade || "Cidade",
    estadoInstituicao: config?.estado || "UF",
    cepInstituicao: config?.cep || "00000-000",

    blocoInstituicao:
      `${config?.nomeFantasia || "Instituição Exemplo"}<br>` +
      `CNPJ: ${config?.cnpj || "00.000.000/0001-00"}<br>` +
      `${config?.endereco || "Endereço institucional"}${config?.numero ? `, ${config.numero}` : ""}<br>` +
      `Telefone: ${config?.telefone || "(00) 00000-0000"}<br>` +
      `E-mail: ${config?.email || "contato@instituicao.com"}`,

    nomeAluno: "Aluno Exemplo",
    cpfAluno: "000.000.000-00",
    rgAluno: "00.000.000-0",
    matriculaAluno: "2026-0001",
    numeroMatricula: "2026-0001",
    statusAluno: "ATIVO",
    statusMatricula: "ATIVA",
    dataMatricula: "03/06/2026",
    dataConclusao: "-",
    semestreAtual: "1º semestre",
    cargaHorariaCurso: "3.200h",
    percentualConclusao: "25%",
    curso: "Bacharel Livre em Teologia",

    nomeTitularContrato: "Aluno Exemplo",
    cpfTitularContrato: "000.000.000-00",
    emailTitularContrato: "titular@exemplo.com",
    telefoneTitularContrato: "(00) 00000-0000",
    parentescoTitularContrato: "Aluno maior de idade",
    tipoTitularContrato: "Próprio aluno",

    valorContrato: "R$ 0,00",
    referenciaFinanceira: "Pagamento institucional",

    dataAtual: new Date().toLocaleDateString("pt-BR"),
    cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "Cidade",
    responsavelLegal: config?.responsavelNome || "Responsável legal",

    assinaturaDiretor: "",
    blocoAssinaturaDiretor:
      `${config?.responsavelNome || "Responsável legal"}<br>` +
      `${config?.responsavelCargo || "Diretor"}<br>` +
      `${config?.nomeFantasia || "Instituição"}`,

    disciplinas:
      "- Antigo Testamento A | 96h | A cursar<br>" +
      "- Novo Testamento A | 96h | A cursar<br>" +
      "- Teologia Bíblica | 64h | A cursar",

    codigoValidacao: "PHANYX-EXEMPLO-0001",
    urlValidacao: "https://www.phanyx.com.br/validar-documento",

    // RH - aliases para preview
    nomeFuncionario: "Funcionário Exemplo",
    funcionarioNome: "Funcionário Exemplo",
    cpfFuncionario: "000.000.000-00",
    funcionarioCpf: "000.000.000-00",
    rgFuncionario: "00.000.000-0",
    funcionarioRg: "00.000.000-0",
    pisPasepFuncionario: "000.00000.00-0",
    codigoFuncionario: "0001",
    cargoFuncionario: "Auxiliar Administrativo",
    funcionarioCargo: "Auxiliar Administrativo",
    departamentoFuncionario: "Departamento Exemplo",
    funcionarioDepartamento: "Departamento Exemplo",
    salarioBaseFuncionario: "R$ 0,00",
    funcionarioSalario: "R$ 0,00",
    tipoContratoFuncionario: "CLT",
    cargaHorariaMensalFuncionario: "220h",
    dataAdmissaoFuncionario: "01/01/2026",
    funcionarioDataAdmissao: "01/01/2026",
    dataDesligamentoFuncionario: "-",
    funcionarioDataDesligamento: "-",

    motivoDemissao: "Motivo exemplo",
    tipoRescisao: "Sem justa causa",
    dataDemissao: "-",
    saldoSalario: "R$ 0,00",
    feriasVencidas: "R$ 0,00",
    feriasProporcionais: "R$ 0,00",
    decimoTerceiroProporcional: "R$ 0,00",
    avisoPrevio: "R$ 0,00",
    valorRescisao: "R$ 0,00",
    valorLiquidoRescisao: "R$ 0,00",
  };

  let final = texto || "";

  for (const [chave, valor] of Object.entries(valores)) {
    final = final.replaceAll(`{{${chave}}}`, valor || "");
  }

  return final.replaceAll(/{{[^}]+}}/g, "-");
}

async function montarDuasViasA4(pdfBytesOriginais: Uint8Array) {
  const finalDoc = await PDFDocument.create();
  const font = await finalDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await finalDoc.embedFont(StandardFonts.HelveticaBold);

  const [paginaOriginal] = await finalDoc.embedPdf(pdfBytesOriginais, [0]);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const metade = pageHeight / 2;

  const page = finalDoc.addPage([pageWidth, pageHeight]);

  const escala = 0.44;
  const larguraVia = pageWidth * escala;
  const alturaVia = pageHeight * escala;
  const x = (pageWidth - larguraVia) / 2;

  const yViaInstituicao = metade + (metade - alturaVia) / 2 - 8;
  const yViaAluno = (metade - alturaVia) / 2 - 8;

  page.drawText("VIA DA INSTITUIÇÃO", {
    x: 40,
    y: pageHeight - 28,
    size: 9,
    font: fontBold,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawPage(paginaOriginal, {
    x,
    y: yViaInstituicao,
    width: larguraVia,
    height: alturaVia,
  });

  page.drawLine({
    start: { x: 30, y: metade },
    end: { x: pageWidth - 30, y: metade },
    thickness: 0.7,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText("CORTE AQUI", {
    x: pageWidth / 2 - 28,
    y: metade + 7,
    size: 7,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  page.drawText("VIA DO ALUNO", {
    x: 40,
    y: metade - 28,
    size: 9,
    font: fontBold,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawPage(paginaOriginal, {
    x,
    y: yViaAluno,
    width: larguraVia,
    height: alturaVia,
  });

  return await finalDoc.save();
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

    const baseUrl = new URL(req.url).origin;
    const conteudoHtml = substituirExemplos(String(body?.conteudo || ""), config);

    if (body?.tipo === "HISTORICO") {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

      drawText("HISTÓRICO ACADÊMICO — BACHAREL LIVRE EM TEOLOGIA", 85, 640, 13, true);

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

      yTabela -= 30;
      drawText("OBSERVAÇÕES:", 45, yTabela, 8.5, true);
      drawText("Histórico acadêmico emitido eletronicamente pelo PHANYX.", 45, yTabela - 15, 7);
      drawText(
        "As disciplinas ainda não concluídas permanecem indicadas como “A cursar”.",
        45,
        yTabela - 28,
        7
      );

      drawText(config?.responsavelNome || "Responsável legal", 230, 120, 8.5, true);
      page.drawLine({
        start: { x: 185, y: 135 },
        end: { x: 410, y: 135 },
        thickness: 0.8,
        color: preto,
      });
      drawText(config?.responsavelCargo || "Diretor", 260, 108, 7.5);
      drawText(config?.nomeFantasia || "Instituição", 270, 96, 7.5);

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
          "Cache-Control": "no-store",
        },
      });
    }

    const formatoImpressao =
      body?.formatoImpressao === "DUAS_VIAS_A4"
        ? "DUAS_VIAS_A4"
        : "A4_INTEIRA";

    const htmlFinal = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4;
      margin: 18mm;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: white;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      line-height: 1.2;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .documento {
      width: 100%;
    }

    .documento p {
      margin-top: 0;
    }

    .documento img {
      max-width: 100%;
    }

    .documento table {
      width: 100%;
      border-collapse: collapse;
    }

    .documento strong,
    .documento b {
      font-weight: 700;
    }

    .documento em,
    .documento i {
      font-style: italic;
    }

    .documento u {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <main class="documento">
    ${conteudoHtml}
  </main>
</body>
</html>
`;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar"
),
      headless: true,
    });

    const pageHtml = await browser.newPage();

    await pageHtml.setContent(htmlFinal, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await pageHtml.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    await browser.close();

    const bytesFinais =
      formatoImpressao === "DUAS_VIAS_A4"
        ? await montarDuasViasA4(pdfBuffer)
        : pdfBuffer;

    return new NextResponse(Buffer.from(bytesFinais), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=previa-template.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => null);
    }

    console.error("Erro ao gerar prévia do template:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao gerar prévia do template." },
      { status: 500 }
    );
  }
}