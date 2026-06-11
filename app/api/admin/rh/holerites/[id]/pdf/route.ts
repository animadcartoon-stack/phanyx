import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function moeda(valor: any) {
  const n = Number(valor || 0);
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function texto(v: any) {
  return v ? String(v) : "";
}

function dataBR(v: any) {
  if (!v) return "";
  return new Date(v).toLocaleDateString("pt-BR");
}

function limparArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .toLowerCase();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = Number(params.id);

    const holerite = await prisma.holeriteRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        funcionario: {
          include: {
            departamento: true,
          },
        },
        instituicao: {
          include: {
            configuracaoInstituicao: true,
          },
        },
        eventos: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!holerite) {
      return NextResponse.json(
        { error: "Holerite não encontrado." },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 em pé

    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    const { width, height } = page.getSize();

    const cfg = holerite.instituicao.configuracaoInstituicao;

    const empresa =
      cfg?.razaoSocial ||
      cfg?.nomeFantasia ||
      holerite.instituicao.nome ||
      "Instituição";

    const cnpj = cfg?.cnpj || "";
    const competencia = `${String(holerite.competenciaMes).padStart(
      2,
      "0"
    )}/${holerite.competenciaAno}`;

    const competenciaExtenso = new Date(
      Number(holerite.competenciaAno),
      Number(holerite.competenciaMes) - 1,
      1
    ).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    function drawText(
      value: string,
      x: number,
      y: number,
      size = 7,
      bold = false,
      maxWidth?: number
    ) {
      let final = String(value || "").replace(/[^\x20-\x7EÀ-ÿ]/g, "");

      if (maxWidth) {
        while (
          final.length > 0 &&
          (bold ? fontBold : font).widthOfTextAtSize(final, size) > maxWidth
        ) {
          final = final.slice(0, -1);
        }
      }

      page.drawText(final, {
        x,
        y,
        size,
        font: bold ? fontBold : font,
        color: rgb(0, 0, 0),
      });
    }

    function drawRight(
      value: string,
      rightX: number,
      y: number,
      size = 7,
      bold = false
    ) {
      const f = bold ? fontBold : font;
      const w = f.widthOfTextAtSize(String(value || ""), size);
      drawText(value, rightX - w, y, size, bold);
    }

    function line(x1: number, y1: number, x2: number, y2: number, t = 0.65) {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: t,
        color: rgb(0, 0, 0),
      });
    }

    function rect(x: number, y: number, w: number, h: number, t = 0.65) {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderWidth: t,
        borderColor: rgb(0, 0, 0),
      });
    }

    function desenharVia(topY: number, bottomY: number) {
  const x = 10;
  const gap = 5;
  const assinaturaW = 48;
  const mainW = width - x * 2 - gap - assinaturaW;
  const h = topY - bottomY;
  const sx = x + mainW + gap;

  const headerBottomY = topY - 48;
  const dadosBottomY = topY - 82;
  const tabelaHeaderY = dadosBottomY - 14;
  const basesTopY = bottomY + 28;
  const totaisTopY = bottomY + 86;
  const tabelaBottomY = totaisTopY;

  rect(x, bottomY, mainW, h);
  rect(sx, bottomY, assinaturaW, h);

  drawText(empresa.toUpperCase(), x + 6, topY - 13, 7, true, 310);
  drawText(`CNPJ: ${cnpj}`, x + 6, topY - 27, 7);
  drawText("CC:", x + 265, topY - 27, 7);
  drawText(empresa.toUpperCase(), x + 290, topY - 27, 7, false, 140);

  drawText("Folha Mensal", x + mainW - 78, topY - 13, 7, true);
  drawText(competenciaExtenso, x + mainW - 78, topY - 27, 7, false, 74);
  drawText(texto(holerite.funcionario.tipoContrato || "Mensalista"), x + 318, topY - 40, 7);

  line(x, headerBottomY, x + mainW, headerBottomY);

  drawText("Código", x + 18, topY - 59, 4.8, true);
  drawText("Nome do Funcionário", x + 58, topY - 59, 4.8, true);
  drawText("CBO", x + 375, topY - 59, 4.8, true);
  drawText("Departamento", x + 445, topY - 59, 4.8, true);
  drawText("Filial", x + mainW - 30, topY - 59, 4.8, true);

  drawText(texto(holerite.funcionario.codigoFuncionario || holerite.funcionario.id), x + 18, topY - 70, 7);
  drawText(holerite.funcionario.nome.toUpperCase(), x + 58, topY - 70, 7, true, 260);
  drawText(texto(holerite.funcionario.departamento?.nome || holerite.funcionario.setor || ""), x + 445, topY - 70, 7, false, 58);
  drawText("1", x + mainW - 25, topY - 70, 7);

  drawText(texto(holerite.funcionario.cargo || ""), x + 58, topY - 81, 7, true, 220);
  drawText("Admissão:", x + 375, topY - 81, 6, true);
  drawText(dataBR(holerite.funcionario.dataAdmissao), x + 430, topY - 81, 7);

  line(x, dadosBottomY, x + mainW, dadosBottomY);

  const colCodigo = x + 38;
  const colDesc = x + 285;
  const colRef = x + 375;
  const colVenc = x + 465;

  line(x, tabelaHeaderY, x + mainW, tabelaHeaderY);
  line(colCodigo, dadosBottomY, colCodigo, tabelaBottomY);
  line(colDesc, dadosBottomY, colDesc, basesTopY);
  line(colRef, dadosBottomY, colRef, basesTopY);
  line(colVenc, dadosBottomY, colVenc, basesTopY);

  drawText("Código", x + 3, dadosBottomY - 10, 6, true);
  drawText("Descrição", x + 150, dadosBottomY - 10, 6, true);
  drawText("Referência", colDesc + 20, dadosBottomY - 10, 6, true);
  drawText("Vencimentos", colRef + 22, dadosBottomY - 10, 6, true);
  drawText("Descontos", colVenc + 24, dadosBottomY - 10, 6, true);

  let y = tabelaHeaderY - 12;
  const rowH = 12;
  const maxEventos = Math.floor((tabelaHeaderY - tabelaBottomY - 8) / rowH);

  holerite.eventos.slice(0, maxEventos).forEach((evento) => {
    drawText(texto(evento.codigo), x + 4, y, 7, false, 30);
    drawText(texto(evento.descricao).toUpperCase(), colCodigo + 6, y, 7, false, 235);
    drawRight(texto(evento.referencia), colRef - 5, y, 7);

    if (evento.tipo === "VENCIMENTO") {
      drawRight(moeda(evento.valor), colVenc - 8, y, 7);
    } else {
      drawRight(moeda(evento.valor), x + mainW - 5, y, 7);
    }

    y -= rowH;
  });

  line(x, tabelaBottomY, x + mainW, tabelaBottomY);

  drawText("Total de Vencimentos", colRef + 5, totaisTopY - 12, 5, true);
  drawText("Total de Descontos", colVenc + 5, totaisTopY - 12, 5, true);
  drawRight(moeda(holerite.totalVencimentos), colVenc - 8, totaisTopY - 28, 8);
  drawRight(moeda(holerite.totalDescontos), x + mainW - 5, totaisTopY - 28, 8);

  line(colRef, totaisTopY - 39, x + mainW, totaisTopY - 39);

  drawText("Valor Líquido", colRef + 5, totaisTopY - 54, 6, true);
  drawText("=>", colRef + 78, totaisTopY - 56, 11, true);
  drawRight(moeda(holerite.valorLiquido), x + mainW - 5, totaisTopY - 56, 9, true);

  line(x, basesTopY, x + mainW, basesTopY);

  const baseCols = [
    { label: "Salário Base", value: moeda(holerite.salarioBase), px: x + 22 },
    { label: "Sal. Contr. INSS", value: moeda(holerite.baseInss || holerite.salarioBase), px: x + 112 },
    { label: "Base Cálc. FGTS", value: moeda(holerite.baseFgts || holerite.salarioBase), px: x + 208 },
    { label: "F.G.T.S do Mês", value: moeda(holerite.fgtsMes || 0), px: x + 312 },
    { label: "Base Cálc. IRRF", value: moeda(holerite.baseIrrf || holerite.salarioBase), px: x + 408 },
    { label: "Faixa IRRF", value: "0,00", px: x + 500 },
  ];

  baseCols.forEach((c) => {
    drawText(c.label, c.px, bottomY + 18, 4.8, true);
    drawText(c.value, c.px, bottomY + 6, 7);
  });

  page.drawText("Declaro ter recebido a importância líquida discriminada neste recibo.", {
  x: sx + 13,
  y: bottomY + 82,
  size: 4.3,
  font,
  color: rgb(0, 0, 0),
  rotate: degrees(90),
});

line(sx + 30, bottomY + 158, sx + 30, bottomY + 248, 0.9);

page.drawText("Assinatura do Funcionário", {
  x: sx + 38,
  y: bottomY + 162,
  size: 4.4,
  font,
  color: rgb(0, 0, 0),
  rotate: degrees(90),
});

page.drawText("____/____/_______", {
  x: sx + 20,
  y: bottomY + 32,
  size: 5.2,
  font: fontBold,
  color: rgb(0, 0, 0),
  rotate: degrees(90),
});

page.drawText("Data", {
  x: sx + 38,
  y: bottomY + 36,
  size: 4.4,
  font,
  color: rgb(0, 0, 0),
  rotate: degrees(90),
});
}

    desenharVia(height - 12, 455);
    desenharVia(405, 25);

    const bytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${limparArquivo(
          `holerite-${holerite.funcionario.nome}-${competencia}.pdf`
        )}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar PDF do holerite." },
      { status: 500 }
    );
  }
}