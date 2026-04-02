import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const codigo = String(searchParams.get("codigo") || "").trim();

    if (!codigo) {
      return NextResponse.json(
        { error: "Código de validação não informado." },
        { status: 400 }
      );
    }

    const documento = await prisma.documentoGerado.findFirst({
      where: {
        codigoValidacao: codigo,
      },
      include: {
        aluno: true,
        instituicao: true,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: documento.id,
      titulo: documento.titulo,
      tipo: documento.tipo,
      criadoEm: documento.criadoEm,
      codigoValidacao: documento.codigoValidacao,
      aluno: documento.aluno
        ? {
            nome: documento.aluno.nome,
            matricula: documento.aluno.matricula,
            cpf: documento.aluno.cpf,
          }
        : null,
      instituicao: documento.instituicao
        ? {
            nome: documento.instituicao.nome,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Erro ao validar documento:", error);
    return NextResponse.json(
      { error: "Erro ao validar documento." },
      { status: 500 }
    );
  }
}