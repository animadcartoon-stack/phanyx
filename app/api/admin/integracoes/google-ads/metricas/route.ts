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

    if (!instituicao?.googleAdsRefreshToken) {
      return NextResponse.json({
        conectado: false,
      });
    }

    return NextResponse.json({
      conectado: true,
      mensagem: "Integração Google Ads autenticada com sucesso",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro Google Ads",
        detalhe: String(error),
      },
      { status: 500 }
    );
  }
}