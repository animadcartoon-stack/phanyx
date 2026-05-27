import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json(
        { error: "Callback inválido do Google Ads" },
        { status: 400 }
      );
    }

    const instituicaoId = Number(state);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Google OAuth não configurado" },
        { status: 500 }
      );
    }

    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          error:
            "Google não retornou refresh_token. Tente desconectar e conectar novamente.",
        },
        { status: 400 }
      );
    }

    await prisma.instituicao.update({
      where: { id: instituicaoId },
      data: {
        googleAdsAtivo: true,
        googleAdsRefreshToken: tokens.refresh_token,
      } as any,
    });

    return NextResponse.redirect(
      "https://phanyx.com.br/admin/integracoes/marketing?google_ads=callback_ok"
    );
  } catch (error) {
    console.error("Erro callback Google Ads:", error);

    return NextResponse.json(
      {
        error: "Erro ao conectar Google Ads",
        detalhe: String(error),
      },
      { status: 500 }
    );
  }
}