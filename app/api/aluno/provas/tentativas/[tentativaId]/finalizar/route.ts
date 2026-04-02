import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarProvas } from "@/lib/permissoesPlano";

export async function POST(
  _req: Request,
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
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
    select: {
      id: true,
    },
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
    include: {
      prova: {
        include: {
          questoes: {
            orderBy: { id: "asc" },
            include: {
              alternativas: {
                orderBy: { id: "asc" },
              },
            },
          },
        },
      },
      respostas: true,
    },
  });

  if (!tentativa) {
    return NextResponse.json(
      { error: "Tentativa não encontrada" },
      { status: 404 }
    );
  }

  if (tentativa.finalizada) {
    return NextResponse.json(
      { error: "Tentativa já finalizada" },
      { status: 400 }
    );
  }

  let notaCalculada = 0;

  for (const q of tentativa.prova.questoes) {
    if (q.tipo !== "multipla_escolha") continue;

    const correta = q.alternativas.find((a) => a.correta);
    if (!correta) continue;

    const respostaAluno = tentativa.respostas.find(
      (r) => r.questaoId === q.id
    );

    if (!respostaAluno?.alternativaId) continue;

    if (respostaAluno.alternativaId === correta.id) {
      notaCalculada += q.valor ?? 1;
    }
  }

  const notaMax = tentativa.prova.notaMaxima || 10;
  const notaFinal = Math.max(
    0,
    Math.min(notaMax, Number(notaCalculada.toFixed(2)))
  );

  const updated = await prisma.tentativaProva.update({
    where: { id: tentativa.id },
    data: {
      notaFinal,
      finalizada: true,
      status: "FINALIZADA",
      finishedAt: new Date(),
    },
    select: {
      id: true,
      notaFinal: true,
      finalizada: true,
    },
  });

  return NextResponse.json(updated);
}