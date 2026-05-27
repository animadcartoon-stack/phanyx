import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        googleAdsRefreshToken: true,
        googleAdsAtivo: true,
      },
    });

    return NextResponse.json({
      conectado: !!instituicao?.googleAdsRefreshToken,
      ativo: instituicao?.googleAdsAtivo || false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao consultar Google Ads",
        detalhe: String(error),
      },
      { status: 500 }
    );
  }
}