import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido." },
        { status: 400 }
      );
    }

    const adesao = await prisma.adesaoInstituicao.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        nomeInstituicao: true,
        email: true,
        plano: true,
        asaasId: true,
        instituicaoId: true,
      },
    });

    if (!adesao) {
      return NextResponse.json(
        { error: "Adesão não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, adesao });
  } catch (error) {
    console.error("ERRO STATUS ADESAO:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status da adesão." },
      { status: 500 }
    );
  }
}