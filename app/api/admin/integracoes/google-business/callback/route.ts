import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json({ error: "Callback inválido" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
      "https://phanyx.com.br/api/admin/integracoes/google-business/callback";

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Google Business OAuth não configurado" },
        { status: 500 }
      );
    }

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        { error: "Google não retornou refresh_token. Conecte novamente." },
        { status: 400 }
      );
    }

    await prisma.instituicao.update({
      where: { id: Number(state) },
      data: {
        googleBusinessAtivo: true,
        googleBusinessRefreshToken: tokens.refresh_token,
      },
    });

    return NextResponse.redirect(
      "https://phanyx.com.br/admin/integracoes/marketing?google_business=callback_ok"
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro callback Google Business", detalhe: String(error) },
      { status: 500 }
    );
  }
}