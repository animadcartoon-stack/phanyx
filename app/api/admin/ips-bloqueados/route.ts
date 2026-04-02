import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

// LISTAR
export async function GET() {
  const user = getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const dados = await prisma.bloqueioIP.findMany({
    where: { ativo: true },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(dados);
}

// DESBLOQUEAR
export async function PATCH(req: Request) {
  const user = getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await req.json();

  await prisma.bloqueioIP.update({
    where: { id },
    data: { ativo: false },
  });

  return NextResponse.json({ sucesso: true });
}