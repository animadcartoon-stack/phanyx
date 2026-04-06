import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: Request, { params }: { params: { tentativaId: string } }) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tentativaId = Number(params.tentativaId);
  if (!Number.isFinite(tentativaId) || tentativaId <= 0) {
    return NextResponse.json({ error: "tentativaId inválido" }, { status: 400 });
  }

  const body = await req.json();
  const questaoId = Number(body.questaoId);
  const alternativaId = body.alternativaId != null ? Number(body.alternativaId) : null;
  const respostaTexto = body.respostaTexto != null ? String(body.respostaTexto) : null;

  if (!Number.isFinite(questaoId) || questaoId <= 0) {
    return NextResponse.json({ error: "questaoId inválido" }, { status: 400 });
  }

  // garante que a tentativa pertence ao aluno da sessão (multi-tenant)
  const aluno = await prisma.aluno.findFirst({
    where: { userId: user.id, instituicaoId: user.instituicaoId },
    select: { id: true },
  });
  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const tentativa = await prisma.tentativaProva.findFirst({
    where: { id: tentativaId, alunoId: aluno.id, prova: { disciplina: { instituicaoId: user.instituicaoId } } },
    select: { id: true, finalizada: true },
  });
  if (!tentativa) return NextResponse.json({ error: "Tentativa não encontrada" }, { status: 404 });
  if (tentativa.finalizada) return NextResponse.json({ error: "Tentativa já finalizada" }, { status: 400 });

  // upsert 1 resposta por questão
  const resposta = await prisma.respostaProva.upsert({
    where: { tentativaId_questaoId: { tentativaId, questaoId } },
    update: { alternativaId, respostaTexto },
    create: { tentativaId, questaoId, alternativaId, respostaTexto },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, respostaId: resposta.id });
}