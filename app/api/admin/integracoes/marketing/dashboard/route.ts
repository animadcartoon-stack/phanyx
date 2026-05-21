import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
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

    const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

    if (!propertyId || !clientEmail || !privateKey) {
  return NextResponse.json({
    visitantes: 0,
    conversoes: 0,
    googleBusiness: 0,
    reputacao: null,
    debug: {
      temPropertyId: Boolean(propertyId),
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
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "conversions" },
      ],
    });

    const visitantes =
      Number(response.rows?.[0]?.metricValues?.[0]?.value || 0);

    const conversoes =
      Number(response.rows?.[0]?.metricValues?.[1]?.value || 0);

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