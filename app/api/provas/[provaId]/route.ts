import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(_req: Request, { params }: { params: { provaId: string } }) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const provaId = Number(params.provaId);
  if (!Number.isFinite(provaId) || provaId <= 0) {
    return NextResponse.json({ error: "provaId inválido" }, { status: 400 });
  }

  const prova = await prisma.prova.findFirst({
    where: { id: provaId, disciplina: { instituicaoId: user.instituicaoId } },
    select: {
      id: true,
      titulo: true,
      notaMaxima: true,
      ativa: true,
      questoes: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          enunciado: true,
          tipo: true,
          valor: true,
          alternativas: { orderBy: { id: "asc" }, select: { id: true, texto: true } },
        },
      },
    },
  });

  if (!prova) return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
  return NextResponse.json(prova);
}