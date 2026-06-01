import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const notificacoes = await prisma.notificacao.findMany({
    where: {
      usuarioId: user.id,
    },
    orderBy: {
      criadoEm: "desc",
    },
    take: 20,
  });

  const totalNaoLidas = await prisma.notificacao.count({
    where: {
      usuarioId: user.id,
      lida: false,
    },
  });

  return NextResponse.json({
    notificacoes,
    totalNaoLidas,
  });
}