import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getUserFromToken(); // ✅ CORRIGIDO

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { plano } = body;

  if (!plano) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  await prisma.instituicao.update({
    where: { id: user.instituicaoId },
    data: { plano },
  });

  return NextResponse.json({ success: true });
}