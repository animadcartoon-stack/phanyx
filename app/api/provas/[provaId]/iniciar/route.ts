import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(_req: Request, { params }: { params: { provaId: string } }) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const provaId = Number(params.provaId);
  if (!Number.isFinite(provaId) || provaId <= 0) {
    return NextResponse.json({ error: "provaId inválido" }, { status: 400 });
  }

  const aluno = await prisma.aluno.findFirst({
    where: { userId: user.id, instituicaoId: user.instituicaoId },
    select: { id: true },
  });
  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const prova = await prisma.prova.findFirst({
    where: { id: provaId, disciplina: { instituicaoId: user.instituicaoId }, ativa: true },
    select: { id: true },
  });
  if (!prova) return NextResponse.json({ error: "Prova não encontrada ou inativa" }, { status: 404 });

  // se já tem tentativa em aberto, reaproveita
  const existente = await prisma.tentativaProva.findFirst({
    where: { provaId, alunoId: aluno.id, finalizada: false },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  if (existente) return NextResponse.json({ tentativaId: existente.id });

  const tentativa = await prisma.tentativaProva.create({
    data: { provaId, alunoId: aluno.id, finalizada: false },
    select: { id: true },
  });

  return NextResponse.json({ tentativaId: tentativa.id });
}