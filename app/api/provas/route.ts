import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(req: Request) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const disciplinaId = Number(searchParams.get("disciplinaId"));

  if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
    return NextResponse.json({ error: "disciplinaId inválido" }, { status: 400 });
  }

  // garante multi-tenant
  const disciplina = await prisma.disciplina.findFirst({
    where: { id: disciplinaId, instituicaoId: user.instituicaoId },
    select: { id: true },
  });
  if (!disciplina) return NextResponse.json({ error: "Disciplina não encontrada" }, { status: 404 });

  const provas = await prisma.prova.findMany({
    where: { disciplinaId },
    orderBy: { id: "desc" },
    select: {
      id: true,
      titulo: true,
      notaMaxima: true,
      ativa: true,
      createdAt: true,
      _count: { select: { questoes: true } },
    },
  });

  return NextResponse.json({ provas });
}