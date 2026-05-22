import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const creditos = await prisma.creditoIA.upsert({
      where: { userId: user.id },
      update: { saldo: { increment: 15 } },
      create: { userId: user.id, saldo: 15 },
    });

    return NextResponse.json({ saldo: creditos.saldo });
  } catch (error) {
    console.error("Erro no teste de créditos IA:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}