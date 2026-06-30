import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";

export async function GET(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    if (!Number.isFinite(atividadeId) || atividadeId <= 0) {
      return NextResponse.json(
        { error: "Atividade inválida" },
        { status: 400 }
      );
    }

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

    const turmaIds = matriculas.flatMap((m) =>
      m.itens.map((i) => i.turmaId)
    );

    const atividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
        instituicaoId: auth.instituicaoId,
        turmaId: {
          in: turmaIds,
        },
        status: "PUBLICADA",
      },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
        disciplina: {
          select: {
            id: true,
            nome: true,
          },
        },
        anexos: {
          orderBy: {
            createdAt: "asc",
          },
        },
        entregas: {
          where: {
            alunoId: aluno.id,
          },
          orderBy: {
            entregueEm: "desc",
          },
          take: 1,
        },
      },
    });

    if (!atividade) {
      return NextResponse.json(
        { error: "Atividade não encontrada ou indisponível" },
        { status: 404 }
      );
    }

    return NextResponse.json(atividade);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar atividade" },
      { status: 401 }
    );
  }
}