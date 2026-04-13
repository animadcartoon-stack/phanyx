import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const certificadoTemplateUrl = String(
      body?.certificadoTemplateUrl || ""
    ).trim();

    const certificadoCoordenadorNome = String(
      body?.certificadoCoordenadorNome || ""
    ).trim();

    const certificadoCidade = String(
      body?.certificadoCidade || ""
    ).trim();

    await prisma.instituicao.update({
      where: { id: user.instituicaoId },
      data: {
        certificadoTemplateUrl: certificadoTemplateUrl || null,
        certificadoCoordenadorNome: certificadoCoordenadorNome || null,
        certificadoCidade: certificadoCidade || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRO CONFIG CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao salvar configuração do certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}