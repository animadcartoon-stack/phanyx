import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { alunoId } = await req.json();

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // 🔥 Buscar modelo salvo
    const config = await prisma.configuracaoCertificado.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    if (!config || !config.modelo) {
      return NextResponse.json({ error: "Modelo não configurado" }, { status: 400 });
    }

    // 🔥 Criar PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 paisagem

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 🔥 Inserir dados (simulação inicial)
    page.drawText(`Nome: ${aluno.nome}`, {
      x: 200,
      y: 350,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Curso: Curso de Teologia`, {
      x: 200,
      y: 300,
      size: 18,
      font,
    });

    page.drawText(`Data: ${new Date().toLocaleDateString()}`, {
      x: 200,
      y: 250,
      size: 16,
      font,
    });

    // 🔥 Gerar PDF
    const pdfBytes = await pdfDoc.save();
const pdfBuffer = Buffer.from(pdfBytes);

// 🔥 Salvar no banco
await prisma.certificado.create({
  data: {
    alunoId: aluno.id,
    instituicaoId: user.instituicaoId,
    modelo: JSON.stringify({ gerado: true }),
    status: "PRONTO",
  },
});

return new NextResponse(Buffer.from(pdfBytes), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=certificado-${aluno.nome}.pdf`,
  },
});

  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar certificado" }, { status: 500 });
  }
}