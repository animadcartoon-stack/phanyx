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
    const page = pdfDoc.addPage([842, 595]); // A4 horizontal

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

    function drawText(
      value: string,
      x: number,
      y: number,
      size = 8,
      bold = false
    ) {
      page.drawText(value, {
        x,
        y,
        size,
        font: bold ? fontBold : font,
        color: rgb(0, 0, 0),
      });
    }

    function line(x1: number, y1: number, x2: number, y2: number) {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
    }

    function rect(x: number, y: number, w: number, h: number) {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderWidth: 0.8,
        borderColor: rgb(0, 0, 0),
      });
    }

    function desenharVia(origemY: number) {

    const x = 25;
    const yTop = origemY;
    const tableW = width - 90;
    const assinaturaW = 55;

    rect(x, 75, tableW, 470);
    rect(x + tableW + 5, 75, assinaturaW, 470);

    drawText(empresa.toUpperCase(), x + 8, yTop, 9, true);
    drawText(`CNPJ: ${cnpj}`, x + 8, yTop - 16, 8);
    drawText("Folha Mensal", x + tableW - 95, yTop, 8, true);
    drawText(competencia, x + tableW - 95, yTop - 16, 8);

    line(x, yTop - 28, x + tableW, yTop - 28);

    drawText("Código", x + 8, yTop - 43, 7, true);
    drawText("Nome do Funcionário", x + 70, yTop - 43, 7, true);
    drawText("CBO", x + 520, yTop - 43, 7, true);
    drawText("Depto", x + 610, yTop - 43, 7, true);

    drawText(texto(holerite.funcionario.codigoFuncionario || holerite.funcionario.id), x + 8, yTop - 56, 8);
    drawText(holerite.funcionario.nome.toUpperCase(), x + 70, yTop - 56, 8, true);
    drawText(texto(holerite.funcionario.cargo || ""), x + 70, yTop - 70, 8);
    drawText(texto(holerite.funcionario.departamento?.nome || ""), x + 610, yTop - 56, 8);

    drawText("Admissão:", x + 610, yTop - 70, 7, true);
    drawText(
      holerite.funcionario.dataAdmissao
        ? new Date(holerite.funcionario.dataAdmissao).toLocaleDateString("pt-BR")
        : "",
      x + 675,
      yTop - 70,
      8
    );

    line(x, yTop - 84, x + tableW, yTop - 84);

    const yTabela = yTop - 100;
    const headerH = 18;
    const rowH = 16;

    line(x, yTabela + headerH, x + tableW, yTabela + headerH);
    line(x, yTabela, x + tableW, yTabela);

    line(x + 50, yTabela + headerH, x + 50, 170);
    line(x + 410, yTabela + headerH, x + 410, 170);
    line(x + 530, yTabela + headerH, x + 530, 170);
    line(x + 655, yTabela + headerH, x + 655, 170);

    drawText("Código", x + 8, yTabela + 5, 7, true);
    drawText("Descrição", x + 170, yTabela + 5, 7, true);
    drawText("Referência", x + 440, yTabela + 5, 7, true);
    drawText("Vencimentos", x + 565, yTabela + 5, 7, true);
    drawText("Descontos", x + 690, yTabela + 5, 7, true);

    let y = yTabela - 15;

    holerite.eventos.forEach((evento) => {
      drawText(texto(evento.codigo), x + 8, y, 8);
      drawText(texto(evento.descricao).toUpperCase(), x + 60, y, 8);
      drawText(texto(evento.referencia), x + 430, y, 8);

      if (evento.tipo === "VENCIMENTO") {
        drawText(moeda(evento.valor), x + 565, y, 8);
      } else {
        drawText(moeda(evento.valor), x + 690, y, 8);
      }

      y -= rowH;
    });

    line(x, 170, x + tableW, 170);

    drawText("Total de Vencimentos", x + 540, 150, 6, true);
    drawText("Total de Descontos", x + 665, 150, 6, true);

    drawText(moeda(holerite.totalVencimentos), x + 565, 132, 9);
    drawText(moeda(holerite.totalDescontos), x + 690, 132, 9);

    line(x + 530, 120, x + tableW, 120);

    drawText("Valor Líquido", x + 540, 102, 7, true);
    drawText(moeda(holerite.valorLiquido), x + 690, 102, 11, true);

    line(x, 95, x + tableW, 95);

    drawText("Salário Base", x + 30, 80, 6, true);
    drawText(moeda(holerite.salarioBase), x + 30, 66, 8);

    drawText("Base INSS", x + 170, 80, 6, true);
    drawText(moeda(holerite.baseInss || holerite.salarioBase), x + 170, 66, 8);

    drawText("Base FGTS", x + 310, 80, 6, true);
    drawText(moeda(holerite.baseFgts || holerite.salarioBase), x + 310, 66, 8);

    drawText("FGTS do Mês", x + 450, 80, 6, true);
    drawText(moeda(holerite.fgtsMes || 0), x + 450, 66, 8);

    drawText("Base IRRF", x + 590, 80, 6, true);
    drawText(moeda(holerite.baseIrrf || holerite.salarioBase), x + 590, 66, 8);

    drawText("Faixa IRRF", x + 710, 80, 6, true);
    drawText("0,00", x + 710, 66, 8);

    drawText("Declaro ter recebido a importância líquida discriminada neste recibo.", x + tableW + 18, 250, 6);
    line(x + tableW + 17, 150, x + tableW + assinaturaW - 5, 150);
    drawText("Assinatura do Funcionário", x + tableW + 14, 140, 5);
    line(x + tableW + 17, 105, x + tableW + assinaturaW - 5, 105);
    drawText("Data", x + tableW + 28, 95, 5);
    desenharVia(height - 30);
    
    }

    desenharVia(height - 30);
    desenharVia(260);

    const bytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="holerite-${holerite.funcionario.nome}-${competencia}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar PDF do holerite." },
      { status: 500 }
    );
  }
}