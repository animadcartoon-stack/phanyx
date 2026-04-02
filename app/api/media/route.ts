import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(request: Request) {
  const user = getUserFromToken();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get("alunoId");
  const disciplinaId = searchParams.get("disciplinaId");

  if (!alunoId || !disciplinaId) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios" },
      { status: 400 }
    );
  }

  const notas = await prisma.nota.findMany({
    where: {
      alunoId: Number(alunoId),
      disciplinaId: Number(disciplinaId),
    },
  });

  if (notas.length === 0) {
    return NextResponse.json({ media: 0 });
  }

  const soma = notas.reduce((acc, n) => acc + n.valor, 0);
  const media = soma / notas.length;

  return NextResponse.json({ media });
}