import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        googleBusinessRefreshToken: true,
      },
    });

    if (!instituicao?.googleBusinessRefreshToken) {
      return NextResponse.json(
        { error: "Google Business não conectado" },
        { status: 400 }
      );
    }

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: instituicao.googleBusinessRefreshToken,
    });

    const tokenResponse = await oauth2Client.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Não foi possível gerar access token Google Business" },
        { status: 500 }
      );
    }

    const resposta = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const data = await resposta.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao buscar contas Google Business",
        detalhe: String(error),
      },
      { status: 500 }
    );
  }
}