import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarCertificadoPdf } from "@/lib/certificados/gerarCertificado";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certificadoId: string }> }
) {
  try {
    const { certificadoId } = await params;
    const id = Number(certificadoId);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "Certificado inválido." },
        { status: 400 }
      );
    }

    const certificado = await prisma.certificado.findUnique({
      where: { id },
      include: {
        aluno: true,
        disciplina: true,
        instituicao: true,
      },
    });

    if (!certificado) {
      return NextResponse.json(
        { error: "Certificado não encontrado." },
        { status: 404 }
      );
    }

    if (!certificado.instituicao?.certificadoTemplateUrl) {
      return NextResponse.json(
        { error: "A instituição ainda não configurou o modelo de certificado." },
        { status: 400 }
      );
    }

    const templateUrl = certificado.instituicao.certificadoTemplateUrl;

    const templateResponse = await fetch(templateUrl);

    if (!templateResponse.ok) {
      return NextResponse.json(
        { error: "Não foi possível carregar o modelo de certificado." },
        { status: 500 }
      );
    }

    const templateArrayBuffer = await templateResponse.arrayBuffer();

    const pdfBytes = await gerarCertificadoPdf(
  new Uint8Array(templateArrayBuffer),
  {
    nomeAluno: certificado.aluno?.nome || "Aluno",
    nomeCurso: certificado.disciplina?.nome || "Disciplina",
    nomeInstituicao: certificado.instituicao?.nome || "Instituição",
    dataConclusao: certificado.emitidoEm,
    codigoValidacao: certificado.codigo,
    cidade: certificado.instituicao?.certificadoCidade || null,
    coordenadorNome:
      certificado.instituicao?.certificadoCoordenadorNome || null,
  }
);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificado-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("ERRO DOWNLOAD CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao gerar certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}