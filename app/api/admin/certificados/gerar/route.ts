import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { assinaturaPermiteUso } from "@/lib/assinatura-acesso";

function gerarCodigoCertificado(
  instituicaoId: number,
  alunoId: number,
  disciplinaId: number
) {
  const data = new Date();
  const ano = data.getFullYear();
  const sufixo = Date.now().toString(36).toUpperCase();

  return `PHX-${instituicaoId}-${ano}-${alunoId}-${disciplinaId}-${sufixo}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        plano: true,
        statusAssinatura: true,
        isentaPagamento: true,
      },
    });

    const podeGerarCertificado =
      planoTemRecurso(instituicao?.plano, "CERTIFICADOS_AUTOMATICOS") &&
      assinaturaPermiteUso(
        instituicao?.statusAssinatura,
        instituicao?.isentaPagamento
      );

    if (!podeGerarCertificado) {
      return NextResponse.json(
        {
          error:
            "A geração automática de certificados está disponível a partir do Plano Profissional e exige assinatura ativa.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const alunoId = Number(body.alunoId);
    const disciplinaIdRecebido = body.disciplinaId
      ? Number(body.disciplinaId)
      : null;

    if (!Number.isFinite(alunoId) || alunoId <= 0) {
      return NextResponse.json(
        { error: "Aluno inválido." },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        matriculas: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            curso: true,
            itens: {
              orderBy: {
                id: "asc",
              },
              include: {
                disciplina: true,
              },
            },
          },
        },
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    let disciplina =
      disciplinaIdRecebido && Number.isFinite(disciplinaIdRecebido)
        ? await prisma.disciplina.findFirst({
            where: {
              id: disciplinaIdRecebido,
              instituicaoId: user.instituicaoId,
            },
          })
        : null;

    if (!disciplina) {
      disciplina =
        aluno.matriculas
          .flatMap((matricula) => matricula.itens)
          .map((item) => item.disciplina)
          .find(Boolean) || null;
    }

    if (!disciplina) {
      return NextResponse.json(
        {
          error:
            "Este aluno ainda não possui disciplina vinculada à matrícula. Não foi possível gerar certificado.",
        },
        { status: 400 }
      );
    }

    const existente = await prisma.certificado.findUnique({
      where: {
        alunoId_disciplinaId: {
          alunoId: aluno.id,
          disciplinaId: disciplina.id,
        },
      },
    });

    const codigo =
      existente?.codigo ||
      gerarCodigoCertificado(
        user.instituicaoId,
        aluno.id,
        disciplina.id
      );

    const certificado = await prisma.certificado.upsert({
      where: {
        alunoId_disciplinaId: {
          alunoId: aluno.id,
          disciplinaId: disciplina.id,
        },
      },
      update: {
        emitidoEm: new Date(),
      },
      create: {
        alunoId: aluno.id,
        disciplinaId: disciplina.id,
        instituicaoId: user.instituicaoId,
        codigo,
      },
      include: {
        disciplina: true,
      },
    });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText("Certificado de Conclusão", {
      x: 250,
      y: 450,
      size: 26,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Certificamos que ${aluno.nome}`, {
      x: 180,
      y: 360,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`concluiu com aprovação: ${disciplina.nome}`, {
      x: 180,
      y: 320,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Código de validação: ${certificado.codigo}`, {
      x: 180,
      y: 260,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Emitido em: ${new Date(certificado.emitidoEm).toLocaleDateString("pt-BR")}`, {
      x: 180,
      y: 235,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=certificado-${aluno.nome}.pdf`,
      },
    });
  } catch (error: any) {
    console.error("ERRO GERAR CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao gerar certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}