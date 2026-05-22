import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const quantidade = Number(body.quantidade || 0);

    if (quantidade <= 0) {
      return NextResponse.json(
        { error: "Quantidade inválida" },
        { status: 400 }
      );
    }

    const creditos = await prisma.creditoIA.upsert({
      where: {
        userId: user.id,
      },
      update: {
        saldo: {
          increment: quantidade,
        },
      },
      create: {
        userId: user.id,
        saldo: quantidade,
      },
    });

    return NextResponse.json({
      saldo: creditos.saldo,
    });
  } catch (error) {
    console.error("Erro ao adicionar créditos:", error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}