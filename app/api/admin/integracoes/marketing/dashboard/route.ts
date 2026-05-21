import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { OAuth2Client } from "google-auth-library";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        googleAnalyticsPropertyId: true,
        googleAnalyticsAtivo: true,
      },
    });

    const propertyId =
      instituicao?.googleAnalyticsAtivo
        ? instituicao.googleAnalyticsPropertyId
        : null;

    if (!propertyId) {
      return NextResponse.json({
        visitantes: 0,
        conversoes: 0,
        googleBusiness: 0,
        reputacao: null,
        debug: { temPropertyId: false },
      });
    }

    let visitantes = 0;
    let conversoes = 0;

    const oauthClientId = process.env.GOOGLE_ANALYTICS_OAUTH_CLIENT_ID;
    const oauthClientSecret = process.env.GOOGLE_ANALYTICS_OAUTH_CLIENT_SECRET;
    const oauthRefreshToken = process.env.GOOGLE_ANALYTICS_OAUTH_REFRESH_TOKEN;

    if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
      const oauth2Client = new OAuth2Client(
        oauthClientId,
        oauthClientSecret
      );

      oauth2Client.setCredentials({
        refresh_token: oauthRefreshToken,
      });

      const token = await oauth2Client.getAccessToken();

      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }, { name: "conversions" }],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      visitantes = Number(data?.rows?.[0]?.metricValues?.[0]?.value || 0);
      conversoes = Number(data?.rows?.[0]?.metricValues?.[1]?.value || 0);
    } else {
      const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      );

      if (!clientEmail || !privateKey) {
        return NextResponse.json({
          visitantes: 0,
          conversoes: 0,
          googleBusiness: 0,
          reputacao: null,
          debug: {
            temOAuth: false,
            temClientEmail: Boolean(clientEmail),
            temPrivateKey: Boolean(privateKey),
          },
        });
      }

      const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
      });

      const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [{ name: "activeUsers" }, { name: "conversions" }],
      });

      visitantes = Number(response.rows?.[0]?.metricValues?.[0]?.value || 0);
      conversoes = Number(response.rows?.[0]?.metricValues?.[1]?.value || 0);
    }

    return NextResponse.json({
      visitantes,
      conversoes,
      googleBusiness: 0,
      reputacao: null,
    });
  } catch (error) {
    console.error("Erro dashboard marketing:", error);

    return NextResponse.json(
      {
        visitantes: 0,
        conversoes: 0,
        googleBusiness: 0,
        reputacao: null,
        erro: String(error),
      },
      { status: 500 }
    );
  }
}