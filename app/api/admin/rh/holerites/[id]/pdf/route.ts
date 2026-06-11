import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
    const page = pdfDoc.addPage([842, 595]);

    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    const { width } = page.getSize();

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
      const x = 22;
      const gap = 7;
      const assinaturaW = 125;
      const mainW = width - x * 2 - gap - assinaturaW;
      const h = topY - bottomY;

      const headerY = topY - 16;
      const dadosTopY = topY - 54;
      const tabelaTopY = topY - 92;
      const tabelaBottomY = bottomY + 74;
      const totaisTopY = tabelaBottomY;
      const basesTopY = bottomY + 40;

      rect(x, bottomY, mainW, h);
      rect(x + mainW + gap, bottomY, assinaturaW, h);

      drawText(empresa.toUpperCase(), x + 8, topY - 12, 8, true, mainW - 185);
      drawText(`CNPJ: ${cnpj}  CC:`, x + 8, topY - 25, 7);
      drawText("Folha Mensal", x + mainW - 112, topY - 12, 7, true);
      drawText(competenciaExtenso, x + mainW - 112, topY - 25, 7, false, 105);

      line(x, headerY - 18, x + mainW, headerY - 18);

      drawText("Código", x + 8, dadosTopY, 6, true);
      drawText("Nome do Funcionário", x + 72, dadosTopY, 6, true);
      drawText("CBO", x + 430, dadosTopY, 6, true);
      drawText("Departamento", x + 500, dadosTopY, 6, true);
      drawText("Filial", x + mainW - 45, dadosTopY, 6, true);

      drawText(
        texto(holerite.funcionario.codigoFuncionario || holerite.funcionario.id),
        x + 8,
        dadosTopY - 13,
        7,
        false,
        55
      );

      drawText(
        holerite.funcionario.nome.toUpperCase(),
        x + 72,
        dadosTopY - 13,
        7,
        true,
        340
      );

      drawText("", x + 430, dadosTopY - 13, 7);
      drawText(
        texto(holerite.funcionario.departamento?.nome || holerite.funcionario.setor || ""),
        x + 500,
        dadosTopY - 13,
        7,
        false,
        85
      );
      drawText("1", x + mainW - 35, dadosTopY - 13, 7);

      drawText(
        texto(holerite.funcionario.tipoContrato || "Mensalista"),
        x + 72,
        dadosTopY - 27,
        7,
        false,
        115
      );
      drawText(
        texto(holerite.funcionario.cargo || ""),
        x + 210,
        dadosTopY - 27,
        7,
        true,
        240
      );
      drawText("Admissão:", x + 500, dadosTopY - 27, 6, true);
      drawText(dataBR(holerite.funcionario.dataAdmissao), x + 558, dadosTopY - 27, 7);

      line(x, tabelaTopY + 14, x + mainW, tabelaTopY + 14);

      const colCodigo = x + 52;
      const colDesc = x + 405;
      const colRef = x + 505;
      const colVenc = x + 590;

      line(colCodigo, tabelaTopY + 14, colCodigo, tabelaBottomY);
      line(colDesc, tabelaTopY + 14, colDesc, tabelaBottomY);
      line(colRef, tabelaTopY + 14, colRef, tabelaBottomY);
      line(colVenc, tabelaTopY + 14, colVenc, tabelaBottomY);

      drawText("Código", x + 8, tabelaTopY + 3, 6, true);
      drawText("Descrição", x + 150, tabelaTopY + 3, 6, true);
      drawText("Referência", colDesc + 15, tabelaTopY + 3, 6, true);
      drawText("Vencimentos", colRef + 25, tabelaTopY + 3, 6, true);
      drawText("Descontos", colVenc + 38, tabelaTopY + 3, 6, true);

      line(x, tabelaTopY, x + mainW, tabelaTopY);
      line(x, tabelaBottomY, x + mainW, tabelaBottomY);

      let y = tabelaTopY - 13;
      const rowH = 13;
      const maxEventos = Math.floor((tabelaTopY - tabelaBottomY - 8) / rowH);

      holerite.eventos.slice(0, maxEventos).forEach((evento) => {
        drawText(texto(evento.codigo), x + 8, y, 7, false, 38);
        drawText(texto(evento.descricao).toUpperCase(), colCodigo + 8, y, 7, false, 335);
        drawText(texto(evento.referencia), colDesc + 12, y, 7, false, 85);

        if (evento.tipo === "VENCIMENTO") {
          drawRight(moeda(evento.valor), colVenc - 12, y, 7);
        } else {
          drawRight(moeda(evento.valor), x + mainW - 10, y, 7);
        }

        y -= rowH;
      });

      if (holerite.eventos.length > maxEventos) {
        drawText(
          `+ ${holerite.eventos.length - maxEventos} evento(s) não exibido(s)`,
          colCodigo + 8,
          tabelaBottomY + 8,
          6,
          true
        );
      }

      drawText("Total de Vencimentos", colRef + 6, totaisTopY - 14, 6, true);
      drawText("Total de Descontos", colVenc + 6, totaisTopY - 14, 6, true);
      drawRight(moeda(holerite.totalVencimentos), colVenc - 12, totaisTopY - 29, 8);
      drawRight(moeda(holerite.totalDescontos), x + mainW - 10, totaisTopY - 29, 8);

      line(colRef, totaisTopY - 38, x + mainW, totaisTopY - 38);

      drawText("Valor Líquido", colRef + 6, totaisTopY - 55, 7, true);
      drawRight(moeda(holerite.valorLiquido), x + mainW - 10, totaisTopY - 57, 10, true);

      line(x, basesTopY, x + mainW, basesTopY);

      const baseCols = [
        { label: "Sal. Contr. INSS", value: moeda(holerite.salarioBase), px: x + 8 },
        { label: "Salário Base", value: moeda(holerite.salarioBase), px: x + 118 },
        { label: "Base Cálc. FGTS", value: moeda(holerite.baseFgts || holerite.salarioBase), px: x + 228 },
        { label: "F.G.T.S do Mês", value: moeda(holerite.fgtsMes || 0), px: x + 348 },
        { label: "Base Cálc. IRRF", value: moeda(holerite.baseIrrf || holerite.salarioBase), px: x + 468 },
        { label: "Faixa IRRF", value: "0,00", px: x + 588 },
      ];

      baseCols.forEach((c) => {
        drawText(c.label, c.px, bottomY + 24, 5.5, true);
        drawText(c.value, c.px, bottomY + 10, 7);
      });

      const sx = x + mainW + gap;
      const sw = assinaturaW;

      drawText(
        "Declaro ter recebido a importância líquida",
        sx + 8,
        topY - 72,
        5.4,
        false,
        sw - 16
      );
      drawText(
        "discriminada neste recibo.",
        sx + 8,
        topY - 84,
        5.4,
        false,
        sw - 16
      );

      line(sx + 14, bottomY + 92, sx + sw - 14, bottomY + 92);
      drawText("Assinatura do Funcionário", sx + 18, bottomY + 80, 5.4);

      drawText("____/____/_______", sx + 24, bottomY + 45, 6);
      drawText("Data", sx + 53, bottomY + 32, 5.4);
    }

    desenharVia(570, 310);
    desenharVia(285, 25);

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