import { NextResponse } from "next/server";
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
        metaAccessToken: true,
      },
    });

    if (!instituicao?.metaAccessToken) {
      return NextResponse.json({
        conectado: false,
      });
    }

    const pagesRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?access_token=${instituicao.metaAccessToken}`
    );

    const pagesData = await pagesRes.json();

    const pagina = pagesData?.data?.[0];

    if (!pagina) {
      return NextResponse.json({
        conectado: true,
        instagram: null,
      });
    }

    const instaRes = await fetch(
      `https://graph.facebook.com/v20.0/${pagina.id}?fields=instagram_business_account&access_token=${instituicao.metaAccessToken}`
    );

    const instaData = await instaRes.json();

    return NextResponse.json({
      conectado: true,
      pagina: pagina.name,
      instagram: instaData,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro Instagram Meta" },
      { status: 500 }
    );
  }
}