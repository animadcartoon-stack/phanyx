import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  const user = getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const cursos = await prisma.curso.findMany({
    where: {
      instituicaoId: user.instituicaoId,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return NextResponse.json(cursos);
}