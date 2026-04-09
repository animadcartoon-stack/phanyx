import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";

export async function GET(
  req: NextRequest,
  ctx: { params: { entregaId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const entregaId = Number(ctx.params.entregaId);

    if (!Number.isFinite(entregaId) || entregaId <= 0) {
      return NextResponse.json(
        { error: "Entrega inválida" },
        { status: 400 }
      );
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: auth.userId,
        instituicaoId: auth.instituicaoId,
      },
      select: {
        id: true,
        instituicaoId: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const entrega = await prisma.entregaAtividade.findFirst({
  where: {
    id: entregaId,
    instituicaoId: auth.instituicaoId,
  },
  include: {
    aluno: {
      select: {
        id: true,
        nome: true,
        matricula: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    },
    atividade: {
      select: {
        id: true,
        titulo: true,
        notaMaxima: true,
        turmaId: true,
        turma: {
          select: {
            id: true,
            nome: true,
            professorId: true,
          },
        },
      },
    },
  },
});

    if (!entrega) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      );
    }

    if (!entrega.atividade || !entrega.atividade.turma) {
      return NextResponse.json(
        { error: "Atividade da entrega não encontrada" },
        { status: 404 }
      );
    }

    if (entrega.atividade.turma.professorId !== professor.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar esta entrega" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: entrega.id,
      texto: entrega.texto,
      link: entrega.link,
      arquivoUrl: entrega.arquivoUrl,
      nota: entrega.nota,
      feedback: entrega.feedback,
      entregueEm: entrega.entregueEm,
      corrigidaEm: entrega.corrigidaEm,
      aluno: entrega.aluno
        ? {
            id: entrega.aluno.id,
            nome: entrega.aluno.nome,
            matricula: entrega.aluno.matricula,
            email: entrega.aluno.email,
          }
        : null,
      atividade: entrega.atividade
        ? {
            id: entrega.atividade.id,
            titulo: entrega.atividade.titulo,
            notaMaxima: entrega.atividade.notaMaxima,
            turmaId: entrega.atividade.turmaId,
            turma: entrega.atividade.turma
              ? {
                  id: entrega.atividade.turma.id,
                  nome: entrega.atividade.turma.nome,
                }
              : null,
          }
        : null,
    });
  } catch (e: any) {
    console.error("ERRO AO BUSCAR ENTREGA DO PROFESSOR:", e);

    return NextResponse.json(
      { error: e.message || "Erro ao buscar entrega" },
      { status: 401 }
    );
  }
}