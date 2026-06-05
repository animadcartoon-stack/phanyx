import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function substituirExemplos(texto: string) {
  const valores: Record<string, string> = {
    nomeInstituicao: "IBE - Instituto Batista de Educação",
    cnpjInstituicao: "04.407.694/0001-37",
    blocoInstituicao:
      "IBE - Instituto Batista de Educação\nCNPJ: 04.407.694/0001-37\nRua Caetano Jose Ferreira, 398 - São José\nTelefone: (48) 98810-1240\nE-mail: atendimento@institutobatista.com",
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
    dataAtual: new Date().toLocaleDateString("pt-BR"),
    cidadeAssinatura: "Florianópolis",
    responsavelLegal: "Roberto Ramos da Silva",
    blocoAssinaturaDiretor: "Roberto Ramos da Silva\nDiretor\nIBE",
    disciplinas:
      "- Antigo Testamento A | 96h | A cursar\n- Novo Testamento A | 96h | A cursar\n- Teologia Bíblica | 64h | A cursar",
    disciplinasPorSemestre:
      "1º Semestre\n- Antigo Testamento A | 96h | A cursar\n- Novo Testamento A | 96h | A cursar\n- Teologia Bíblica | 64h | A cursar",
    codigoValidacao: "PHANYX-EXEMPLO-0001",
    urlValidacao: "https://www.phanyx.com.br/validar-documento",
  };

  let final = texto;

  for (const [chave, valor] of Object.entries(valores)) {
    final = final.replaceAll(`{{${chave}}}`, valor);
  }

  final = final.replaceAll(/{{[^}]+}}/g, "-");

  return final;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const conteudo = substituirExemplos(String(body?.conteudo || ""));

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;

  function novaPagina() {
    page = pdfDoc.addPage([595.28, 841.89]);
    y = 800;
  }

  function drawLine(texto: string, bold = false) {
    if (y < 55) novaPagina();

    page.drawText(texto.slice(0, 105), {
      x: 45,
      y,
      size: bold ? 10 : 8,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });

    y -= bold ? 18 : 13;
  }

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
