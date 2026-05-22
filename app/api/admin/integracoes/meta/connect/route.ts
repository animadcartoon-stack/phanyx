import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  const user = await getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const appId = process.env.META_APP_ID;
  const redirectUri =
    process.env.META_REDIRECT_URI ||
    "https://phanyx.com.br/api/admin/integracoes/meta/callback";

  if (!appId) {
    return NextResponse.json(
      { error: "META_APP_ID não configurado" },
      { status: 500 }
    );
  }

  const scopes = [
    "instagram_business_basic",
    "instagram_manage_comments",
    "instagram_business_manage_messages",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_metadata",
    "business_management",
  ].join(",");

  const url = new URL("https://www.facebook.com/v20.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", String(user.instituicaoId));

  return NextResponse.redirect(url.toString());
}