import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";

export async function GET(
  req: NextRequest,
  ctx: { params: { provaId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const provaId = Number(ctx.params.provaId);

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    const tentativas: any[] = await prisma.tentativaProva.findMany({
      where: {
        provaId,
        finalizada: true,
      },
      include: {
        aluno: true,
      },
      orderBy: {
        startedAt: "desc",
      } as any,
    });

    // Regra inicial:
    // se um aluno tiver mais de uma tentativa finalizada,
    // usamos a mais recente.
    const tentativasPorAluno = new Map<number, any>();

    for (const tentativa of tentativas) {
      if (!tentativasPorAluno.has(tentativa.alunoId)) {
        tentativasPorAluno.set(tentativa.alunoId, tentativa);
      }
    }

    const tentativasUnicas = Array.from(tentativasPorAluno.values());

    const alunos = tentativasUnicas.map((tentativa) => ({
      tentativaId: tentativa.id,
      alunoId: tentativa.alunoId,
      alunoNome:
        tentativa.aluno?.nome ||
        tentativa.aluno?.user?.nome ||
        `Aluno ${tentativa.alunoId}`,
      nota: tentativa.notaFinal ?? 0,
      finalizada: tentativa.finalizada,
      startedAt: tentativa.startedAt,
      finishedAt: tentativa.finishedAt,
      status: tentativa.finalizada ? "FINALIZADA" : "EM_ANDAMENTO",
    }));

    const totalAlunos = alunos.length;

    const somaNotas = alunos.reduce(
      (acc, item) => acc + Number(item.nota || 0),
      0
    );

    const mediaTurma =
      totalAlunos > 0 ? Number((somaNotas / totalAlunos).toFixed(2)) : 0;

    return NextResponse.json({
      prova: {
        id: prova.id,
        titulo: prova.titulo,
        notaMaxima: prova.notaMaxima,
        status: prova.status,
      },
      totalAlunos,
      mediaTurma,
      alunos,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar boletim da prova" },
      { status: 401 }
    );
  }
}