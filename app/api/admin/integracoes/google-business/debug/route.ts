import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  const user = await getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_ANALYTICS_OAUTH_CLIENT_ID,
    process.env.GOOGLE_ANALYTICS_OAUTH_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_ANALYTICS_OAUTH_REFRESH_TOKEN,
  });

  const token = await oauth2Client.getAccessToken();

  const res = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    {
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    }
  );

  const data = await res.json();

  return NextResponse.json(data);
}