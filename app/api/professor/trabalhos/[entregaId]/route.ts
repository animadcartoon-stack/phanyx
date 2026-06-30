import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { entregaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const entregaId = Number(params.entregaId);

    if (!Number.isFinite(entregaId) || entregaId <= 0) {
      return NextResponse.json({ error: "Entrega inválida" }, { status: 400 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
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
        instituicaoId: user.instituicaoId,
        atividade: {
          turma: {
            OR: [
              { professorId: professor.id },
              {
                disciplinas: {
                  some: { professorId: professor.id },
                },
              },
            ],
          },
        },
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            matricula: true,
          },
        },
        historicos: {
          orderBy: {
            versao: "desc",
          },
        },
        atividade: {
          include: {
            turma: {
              select: {
                id: true,
                nome: true,
                semestre: true,
                periodoLetivo: true,
                curso: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!entrega) {
      return NextResponse.json(
        { error: "Entrega não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const trabalho = {
      entregaId: entrega.id,
      atividadeId: entrega.atividadeId,
      titulo: entrega.atividade?.titulo || "Atividade não informada",
      descricao: entrega.atividade?.descricao || "",
      notaMaxima: entrega.atividade?.notaMaxima || 10,
      prazo: entrega.atividade?.prazo || null,
      statusAtividade: entrega.atividade?.status || "",
      alunoId: entrega.alunoId,
      aluno: entrega.aluno?.nome || "Aluno não informado",
      matricula: entrega.aluno?.matricula || "",
      turmaId: entrega.atividade?.turmaId,
      turma: entrega.atividade?.turma?.nome || "Turma não informada",
      curso: entrega.atividade?.turma?.curso?.nome || "",
      semestre:
        entrega.atividade?.turma?.semestre || "Semestre não informado",
      periodoLetivo:
        entrega.atividade?.turma?.periodoLetivo || "Período não informado",
      texto: entrega.texto,
      link: entrega.link,
      arquivoUrl: entrega.arquivoUrl,
      nota: entrega.nota,
      feedback: entrega.feedback,
      entregueEm: entrega.entregueEm,
      corrigidaEm: entrega.corrigidaEm,
      historicos: entrega.historicos || [],
      status:
        entrega.corrigidaEm || entrega.nota !== null ? "Avaliado" : "Enviado",
    };

    return NextResponse.json({ ok: true, trabalho });
  } catch (e: any) {
    console.error("ERRO AO BUSCAR TRABALHO:", e);

    return NextResponse.json(
      { error: e?.message || "Erro ao buscar trabalho" },
      { status: 500 }
    );
  }
}