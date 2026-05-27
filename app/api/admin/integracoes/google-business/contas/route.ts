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
        googleBusinessAccessToken: true,
      },
    });

    if (!instituicao?.googleBusinessAccessToken) {
      return NextResponse.json(
        { error: "Google Business não conectado" },
        { status: 400 }
      );
    }

    const resposta = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${instituicao.googleBusinessAccessToken}`,
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