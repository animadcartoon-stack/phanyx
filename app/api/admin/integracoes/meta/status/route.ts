import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        metaConectado: true,
        metaAccessToken: true,
      },
    });

    const conectado = !!instituicao?.metaAccessToken;

    return NextResponse.json({
      conectado,
      instagram: conectado,
      facebook: conectado,
      whatsapp: conectado,
    });
  } catch (error) {
    console.error("Erro status Meta:", error);

    return NextResponse.json(
      {
        conectado: false,
        instagram: false,
        facebook: false,
        whatsapp: false,
      },
      { status: 500 }
    );
  }
}