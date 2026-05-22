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
        paginas: [],
      });
    }

    const res = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?access_token=${instituicao.metaAccessToken}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Erro Meta pages:", data);
      return NextResponse.json(
        { conectado: true, paginas: [], erro: data },
        { status: 400 }
      );
    }

    return NextResponse.json({
      conectado: true,
      paginas: data.data || [],
    });
  } catch (error) {
    console.error("Erro listar páginas Meta:", error);

    return NextResponse.json(
      { error: "Erro ao listar páginas Meta" },
      { status: 500 }
    );
  }
}