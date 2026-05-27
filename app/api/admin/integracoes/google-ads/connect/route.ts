import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Google OAuth não configurado" },
        { status: 500 }
      );
    }

    const scope = [
      "https://www.googleapis.com/auth/adwords",
    ].join(" ");

    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope,
        state: String(user.instituicaoId),
      }).toString();

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Erro Google Ads connect:", error);

    return NextResponse.json(
      { error: "Erro ao iniciar conexão Google Ads" },
      { status: 500 }
    );
  }
}