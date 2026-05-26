import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
    }

    const atividades = await prisma.atividade.findMany({
      where: {
        instituicaoId: user.instituicaoId,
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
      orderBy: { createdAt: "desc" },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
            semestre: true,
            periodoLetivo: true,
            curso: { select: { nome: true } },
          },
        },
        entregas: {
          orderBy: { entregueEm: "desc" },
          include: {
            aluno: {
              select: {
                id: true,
                nome: true,
                matricula: true,
              },
            },
          },
        },
      },
    });

    const trabalhos = atividades.flatMap((atividade) =>
      atividade.entregas.map((entrega) => ({
        entregaId: entrega.id,
        atividadeId: atividade.id,
        titulo: atividade.titulo,
        notaMaxima: atividade.notaMaxima,
        statusAtividade: atividade.status,
        prazo: atividade.prazo,
        alunoId: entrega.alunoId,
        aluno: entrega.aluno?.nome || "Aluno não informado",
        matricula: entrega.aluno?.matricula || "",
        turmaId: atividade.turmaId,
        turma: atividade.turma?.nome || "Turma não informada",
        curso: atividade.turma?.curso?.nome || "",
        semestre: atividade.turma?.semestre || "Semestre não informado",
        periodoLetivo: atividade.turma?.periodoLetivo || "Período não informado",
        texto: entrega.texto,
        link: entrega.link,
        arquivoUrl: entrega.arquivoUrl,
        nota: entrega.nota,
        feedback: entrega.feedback,
        entregueEm: entrega.entregueEm,
        corrigidaEm: entrega.corrigidaEm,
        status: entrega.corrigidaEm || entrega.nota !== null ? "Avaliado" : "Enviado",
      }))
    );

    return NextResponse.json({ ok: true, trabalhos });
  } catch (e: any) {
    console.error("ERRO AO LISTAR TRABALHOS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar trabalhos" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const body = await req.json();
    const entregaId = Number(body.entregaId);
    const nota = Number(body.nota);
    const feedback = String(body.feedback || "").trim();

    if (!Number.isFinite(entregaId) || entregaId <= 0) {
      return NextResponse.json({ error: "Entrega inválida" }, { status: 400 });
    }

    if (!Number.isFinite(nota) || nota < 0) {
      return NextResponse.json({ error: "Nota inválida" }, { status: 400 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
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
      select: { id: true },
    });

    if (!entrega) {
      return NextResponse.json(
        { error: "Entrega não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const atualizada = await prisma.entregaAtividade.update({
      where: { id: entregaId },
      data: {
        nota,
        feedback,
        corrigidaEm: new Date(),
      },
    });

    return NextResponse.json({ ok: true, entrega: atualizada });
  } catch (e: any) {
    console.error("ERRO AO AVALIAR TRABALHO:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao avaliar trabalho" },
      { status: 500 }
    );
  }
}