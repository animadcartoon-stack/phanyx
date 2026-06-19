import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

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

    const ferias = await prisma.feriasRH.findFirst({
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
      },
    });

    if (!ferias) {
      return NextResponse.json(
        { error: "Férias não encontrada." },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    const cfg = ferias.instituicao.configuracaoInstituicao;

    const empresa =
      cfg?.razaoSocial ||
      cfg?.nomeFantasia ||
      ferias.instituicao.nome ||
      "Instituição";

    const cnpj = cfg?.cnpj || "";

    function drawText(
      value: string,
      x: number,
      y: number,
      size = 10,
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

    function line(x1: number, y1: number, x2: number, y2: number, t = 0.7) {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: t,
        color: rgb(0, 0, 0),
      });
    }

    function rect(x: number, y: number, w: number, h: number, t = 0.7) {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderWidth: t,
        borderColor: rgb(0, 0, 0),
      });
    }

    rect(40, 70, 515, 700);

    drawText(empresa.toUpperCase(), 60, 735, 11, true, 430);
    drawText(`CNPJ: ${cnpj}`, 60, 718, 9);

    line(40, 700, 555, 700);

    drawText("AVISO DE FÉRIAS", 210, 665, 15, true);

    drawText("Funcionário:", 65, 620, 10, true);
    drawText(ferias.funcionario.nome.toUpperCase(), 170, 620, 10, false, 330);

    drawText("Cargo:", 65, 595, 10, true);
    drawText(texto(ferias.funcionario.cargo || ""), 170, 595, 10, false, 330);

    drawText("Departamento:", 65, 570, 10, true);
    drawText(
      texto(ferias.funcionario.departamento?.nome || ferias.funcionario.setor || ""),
      170,
      570,
      10,
      false,
      330
    );

    drawText("Data de admissão:", 65, 545, 10, true);
    drawText(dataBR(ferias.funcionario.dataAdmissao), 210, 545, 10);

    line(65, 520, 530, 520);

    drawText("Comunicamos que suas férias foram programadas conforme abaixo:", 65, 485, 10);

    drawText("Período aquisitivo:", 65, 450, 10, true);
    drawText(
      `${dataBR(ferias.periodoAquisitivoInicio)} até ${dataBR(
        ferias.periodoAquisitivoFim
      )}`,
      240,
      450,
      10
    );

    drawText("Período de gozo:", 65, 425, 10, true);
    drawText(
      `${dataBR(ferias.dataInicio)} até ${dataBR(ferias.dataFim)}`,
      240,
      425,
      10
    );

    drawText("Quantidade de dias:", 65, 400, 10, true);
    drawText(`${ferias.dias} dias`, 240, 400, 10);

    drawText("Retorno ao trabalho:", 65, 375, 10, true);
    drawText(dataBR(ferias.dataRetorno), 240, 375, 10);

    drawText("Abono pecuniário:", 65, 350, 10, true);
    drawText(ferias.abonoPecuniario ? "Sim" : "Não", 240, 350, 10);

    drawText("Data de pagamento:", 65, 325, 10, true);
    drawText(dataBR(ferias.dataPagamento), 240, 325, 10);

    drawText(
      "Declaro estar ciente da programação das férias acima descritas.",
      65,
      270,
      10
    );

    drawText("Local e data: _________________________________", 65, 225, 10);

    line(75, 155, 255, 155);
    drawText("Assinatura da Empresa", 100, 140, 9);

    line(330, 155, 510, 155);
    drawText("Assinatura do Funcionário", 350, 140, 9);

    const bytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${limparArquivo(
          `aviso-ferias-${ferias.funcionario.nome}.pdf`
        )}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar aviso de férias." },
      { status: 500 }
    );
  }
}