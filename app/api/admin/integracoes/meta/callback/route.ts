import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const error = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const instituicaoId = Number(url.searchParams.get("state"));

    if (error) {
      return NextResponse.redirect(
        "https://phanyx.com.br/admin/integracoes/marketing?meta=erro"
      );
    }

    if (!code || !instituicaoId) {
      return NextResponse.redirect(
        "https://phanyx.com.br/admin/integracoes/marketing?meta=sem_codigo"
      );
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri =
      process.env.META_REDIRECT_URI ||
      "https://phanyx.com.br/api/admin/integracoes/meta/callback";

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        "https://phanyx.com.br/admin/integracoes/marketing?meta=env_incompleta"
      );
    }

    const tokenUrl = new URL(
      "https://graph.facebook.com/v20.0/oauth/access_token"
    );

    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
  return NextResponse.json({
    etapa: "troca_token",
    tokenResOk: tokenRes.ok,
    tokenData,
    redirectUri,
    appId,
    instituicaoId,
  });
}

    // Salva por enquanto na Instituicao.
    // Se estes campos ainda não existirem no Prisma, o TypeScript vai reclamar.
    await prisma.instituicao.update({
      where: { id: instituicaoId },
      data: {
        metaAccessToken: tokenData.access_token,
        metaConectado: true,
      } as any,
    });

    return NextResponse.redirect(
      "https://phanyx.com.br/admin/integracoes/marketing?meta=callback_ok"
    );
  } catch (error) {
    console.error("Erro callback Meta:", error);

    return NextResponse.json({
  etapa: "catch_callback",
  erro: String(error),
});

  }
}