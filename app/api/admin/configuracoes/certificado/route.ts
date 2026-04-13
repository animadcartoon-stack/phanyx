import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        certificadoTemplateUrl: true,
        certificadoCoordenadorNome: true,
        certificadoCidade: true,
      },
    });

    return NextResponse.json(instituicao);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar configuração", detalhe: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const instituicao = await prisma.instituicao.update({
      where: { id: user.instituicaoId },
      data: {
        certificadoTemplateUrl: body.certificadoTemplateUrl || null,
        certificadoCoordenadorNome:
          body.certificadoCoordenadorNome || null,
        certificadoCidade: body.certificadoCidade || null,
      },
      select: {
        certificadoTemplateUrl: true,
        certificadoCoordenadorNome: true,
        certificadoCidade: true,
      },
    });

    return NextResponse.json(instituicao);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao salvar configuração", detalhe: error.message },
      { status: 500 }
    );
  }
}