import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
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
        novosUsuarios: 0,
        sessoes: 0,
        visualizacoes: 0,
        tempoMedioSessao: 0,
        conversoes: 0,
        googleBusiness: 0,
        reputacao: null,
        debug: { temPropertyId: false },
      });
    }

    let visitantes = 0;
    let novosUsuarios = 0;
    let sessoes = 0;
    let visualizacoes = 0;
    let tempoMedioSessao = 0;
    let conversoes = 0;

    let googleBusiness = 0;
    let reputacao = null;
    let cliquesBusca = 0;
    let impressoesBusca = 0;

    const metrics = [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "conversions" },
    ];

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

      const searchConsole = google.searchconsole({
  version: "v1",
  auth: oauth2Client,
});

const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

if (siteUrl) {
  try {
    const hoje = new Date();
    const inicio = new Date();

    inicio.setDate(hoje.getDate() - 30);

    const inicioStr = inicio.toISOString().split("T")[0];
    const hojeStr = hoje.toISOString().split("T")[0];

    const busca = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: inicioStr,
        endDate: hojeStr,
      },
    });

    cliquesBusca = busca.data.rows?.[0]?.clicks || 0;
    impressoesBusca = busca.data.rows?.[0]?.impressions || 0;
  } catch (err) {
    console.error("Erro Search Console:", err);
  }
}

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
            metrics,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      const valores = data?.rows?.[0]?.metricValues || [];

visitantes = Number(valores?.[0]?.value || 0);
novosUsuarios = Number(valores?.[1]?.value || 0);
sessoes = Number(valores?.[2]?.value || 0);
visualizacoes = Number(valores?.[3]?.value || 0);
tempoMedioSessao = Number(valores?.[4]?.value || 0);
conversoes = Number(valores?.[5]?.value || 0);

    } else {
      const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      );

      if (!clientEmail || !privateKey) {
        return NextResponse.json({
          visitantes: 0,
          novosUsuarios: 0,
          sessoes: 0,
          visualizacoes: 0,
          tempoMedioSessao: 0,
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
        metrics,
      });

      const valores = response.rows?.[0]?.metricValues || [];

      visitantes = Number(valores?.[0]?.value || 0);
      novosUsuarios = Number(valores?.[1]?.value || 0);
      sessoes = Number(valores?.[2]?.value || 0);
      visualizacoes = Number(valores?.[3]?.value || 0);
      tempoMedioSessao = Number(valores?.[4]?.value || 0);
      conversoes = Number(valores?.[5]?.value || 0);
    }

    return NextResponse.json({
  visitantes,
  novosUsuarios,
  sessoes,
  visualizacoes,
  tempoMedioSessao,
  conversoes,
  googleBusiness,
  reputacao,
  cliquesBusca,
  impressoesBusca,
});

  } catch (error) {
    console.error("Erro dashboard marketing:", error);

    return NextResponse.json(
      {
        visitantes: 0,
        novosUsuarios: 0,
        sessoes: 0,
        visualizacoes: 0,
        tempoMedioSessao: 0,
        conversoes: 0,
        googleBusiness: 0,
        reputacao: null,
        erro: String(error),
      },
      { status: 500 }
    );
  }
}