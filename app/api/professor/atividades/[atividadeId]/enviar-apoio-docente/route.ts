import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(
  _req: Request,
  { params }: { params: { atividadeId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "PROFESSOR" && user.role !== "professor") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const atividadeId = Number(params.atividadeId);

    if (!Number.isFinite(atividadeId) || atividadeId <= 0) {
      return NextResponse.json(
        { error: "Atividade inválida" },
        { status: 400 }
      );
    }

    const atividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
        instituicaoId: user.instituicaoId,
        turma: {
          OR: [
            { professorId: professor.id },
            {
              disciplinas: {
                some: {
                  professorId: professor.id,
                },
              },
            },
          ],
        },
      },
      select: {
        id: true,
        status: true,
        professorResponsavelId: true,
      },
    });

    if (!atividade) {
      return NextResponse.json(
        { error: "Atividade não encontrada para este professor" },
        { status: 404 }
      );
    }

    if (atividade.status !== "RASCUNHO") {
      return NextResponse.json(
        {
          error:
            "Apenas atividades em rascunho podem ser enviadas para apoio docente.",
        },
        { status: 400 }
      );
    }

    const atualizada = await prisma.atividade.update({
      where: {
        id: atividade.id,
      },
      data: {
        status: "AGUARDANDO_PUBLICACAO",
        professorResponsavelId:
          atividade.professorResponsavelId || professor.id,
        criadoPorId: user.id,
        enviadoParaApoioDocenteEm: new Date(),
      },
      select: {
        id: true,
        titulo: true,
        status: true,
        enviadoParaApoioDocenteEm: true,
        professorResponsavelId: true,
      },
    });

    return NextResponse.json({
      ok: true,
      atividade: atualizada,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao enviar para apoio docente" },
      { status: 500 }
    );
  }
}