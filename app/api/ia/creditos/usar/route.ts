import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const creditos = await prisma.creditoIA.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!creditos || creditos.saldo <= 0) {
      return NextResponse.json(
        {
          error: "SEM_CREDITOS",
          mensagem: "Você não possui créditos IA.",
        },
        { status: 400 }
      );
    }

    const atualizado = await prisma.creditoIA.update({
      where: {
        userId: user.id,
      },
      data: {
        saldo: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      saldo: atualizado.saldo,
    });
  } catch (error) {
    console.error("Erro ao consumir crédito:", error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}