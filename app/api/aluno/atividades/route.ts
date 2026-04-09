import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";

export async function GET(_req: NextRequest) {
  try {
    const auth = getAuth(_req);
    assertAluno(auth);

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: auth.userId,
        instituicaoId: auth.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const matriculas = await prisma.matricula.findMany({
      where: {
        alunoId: aluno.id,
        instituicaoId: auth.instituicaoId,
      },
      select: {
        itens: {
          select: {
            turmaId: true,
          },
        },
      },
    });

    const turmaIds = matriculas.flatMap((m) => m.itens.map((i) => i.turmaId));

    const atividades = await prisma.atividade.findMany({
      where: {
        instituicaoId: auth.instituicaoId,
        turmaId: { in: turmaIds },
      },
      include: {
        turma: {
          include: {
            disciplina: true,
          },
        },
        entregas: {
          where: {
            alunoId: aluno.id,
          },
          select: {
            id: true,
            texto: true,
            link: true,
            arquivoUrl: true,
            entregueEm: true,
            nota: true,
            feedback: true,
            corrigidaEm: true,
          },
          orderBy: {
            entregueEm: "desc",
          },
        },
      },
      orderBy: {
        prazo: "asc",
      },
    });

    const items = atividades.map((atividade) => {
      const entrega = atividade.entregas[0] || null;

      return {
        id: atividade.id,
        titulo: atividade.titulo,
        descricao: atividade.descricao,
        prazo: atividade.prazo,
        status: atividade.status,
        notaMaxima: atividade.notaMaxima,
        turmaNome: atividade.turma?.nome || null,
        disciplinaNome: atividade.turma?.disciplina?.nome || null,
        entrega,
      };
    });

    return NextResponse.json({
      ok: true,
      total: items.length,
      items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar atividades do aluno" },
      { status: 401 }
    );
  }
}