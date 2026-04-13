import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codigo = String(searchParams.get("codigo") || "").trim();

    if (!codigo) {
      return NextResponse.json(
        { error: "Código do certificado não informado." },
        { status: 400 }
      );
    }

    const certificado = await prisma.certificado.findUnique({
      where: { codigo },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
          },
        },
        disciplina: {
          select: {
            id: true,
            nome: true,
          },
        },
        instituicao: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!certificado) {
      return NextResponse.json(
        { valido: false, error: "Certificado não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valido: true,
      certificado: {
        id: certificado.id,
        codigo: certificado.codigo,
        emitidoEm: certificado.emitidoEm,
        aluno: certificado.aluno,
        disciplina: certificado.disciplina,
        instituicao: certificado.instituicao,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao validar certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}