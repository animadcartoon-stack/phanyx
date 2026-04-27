import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarProvas } from "@/lib/permissoesPlano";

export async function POST(
  req: Request,
  { params }: { params: { tentativaId: string } }
) {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "ALUNO") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (!podeUsarProvas(user.plano || "ESSENCIAL")) {
    return NextResponse.json(
      { error: "Recurso disponível apenas nos planos Profissional e Enterprise" },
      { status: 403 }
    );
  }

  const aluno = await prisma.aluno.findFirst({
    where: { userId: user.id, instituicaoId: user.instituicaoId },
    select: { id: true },
  });

  if (!aluno) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  const tentativaId = Number(params.tentativaId);
  if (!Number.isFinite(tentativaId) || tentativaId <= 0) {
    return NextResponse.json({ error: "tentativaId inválido" }, { status: 400 });
  }

  const tentativa = await prisma.tentativaProva.findFirst({
    where: {
      id: tentativaId,
      alunoId: aluno.id,
      prova: {
        instituicaoId: user.instituicaoId,
      },
    },
    select: {
      id: true,
      finalizada: true,
    },
  });

  if (!tentativa) {
    return NextResponse.json({ error: "Tentativa não encontrada" }, { status: 404 });
  }

  if (tentativa.finalizada) {
    return NextResponse.json({ error: "Tentativa finalizada" }, { status: 409 });
  }

  const body = await req.json();

  const questaoId = Number(body.questaoId);
  if (!Number.isFinite(questaoId) || questaoId <= 0) {
    return NextResponse.json({ error: "questaoId inválido" }, { status: 400 });
  }

  const alternativaId =
    body.alternativaId != null ? Number(body.alternativaId) : null;

  const respostaTexto =
    body.respostaTexto != null ? String(body.respostaTexto) : null;

  const questao = await prisma.questao.findFirst({
    where: {
      id: questaoId,
      prova: {
        tentativas: {
          some: { id: tentativaId, alunoId: aluno.id },
        },
      },
    },
    select: { id: true },
  });

  if (!questao) {
    return NextResponse.json({ error: "Questão inválida" }, { status: 400 });
  }

  const existente = await prisma.respostaProva.findFirst({
  where: {
    tentativaId,
    questaoId,
    instituicaoId: user.instituicaoId,
  },
  select: { id: true },
});

const saved = existente
  ? await prisma.respostaProva.update({
      where: { id: existente.id },
      data: {
        alternativaId,
        respostaTexto,
      },
    })
  : await prisma.respostaProva.create({
      data: {
        tentativaId,
        questaoId,
        alternativaId,
        respostaTexto,
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
    });

  return NextResponse.json(saved);
}