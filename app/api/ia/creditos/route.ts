import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    let creditos = await prisma.creditoIA.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!creditos) {
      creditos = await prisma.creditoIA.create({
        data: {
          userId: user.id,
          saldo: 0,
        },
      });
    }

    return NextResponse.json({
      saldo: creditos.saldo,
    });
  } catch (error) {
    console.error("Erro ao buscar créditos IA:", error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}