import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const disciplinaId = Number(ctx.params.id);

    if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
      return NextResponse.json(
        { error: "Disciplina inválida" },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: auth.userId,
        instituicaoId: auth.instituicaoId,
      },
      include: {
        itensMatricula: {
          where: {
            disciplinaId,
          },
          select: {
            id: true,
            status: true,
            disciplinaId: true,
          },
        },
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const itemMatricula = aluno.itensMatricula?.[0];

    if (!itemMatricula) {
      return NextResponse.json(
        { error: "Disciplina não vinculada ao aluno" },
        { status: 403 }
      );
    }

    const disciplina = await prisma.disciplina.findFirst({
      where: {
        id: disciplinaId,
        instituicaoId: auth.instituicaoId,
      },
      include: {
        aulas: {
          orderBy: [
            { ordem: "asc" },
            { id: "asc" },
          ],
          select: {
            id: true,
            titulo: true,
            descricao: true,
            duracaoMin: true,
            ordem: true,
            videoUrl: true,
            arquivoUrl: true,
            materialUrl: true,
            conteudo: true,
            tipo: true,
          },
        },
      },
    });

    if (!disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }

    const progresso = await prisma.progressoAula.findMany({
      where: {
        alunoId: aluno.id,
        instituicaoId: auth.instituicaoId,
        aula: {
          disciplinaId,
        },
      },
      select: {
        id: true,
        aulaId: true,
        concluida: true,
        tempoAssistidoSegundos: true,
        concluidaEm: true,
      },
    });

    return NextResponse.json({
      id: disciplina.id,
      nome: disciplina.nome,
      descricao: disciplina.descricao,
      aulas: disciplina.aulas,
      progresso,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar disciplina do aluno" },
      { status: 401 }
    );
  }
}