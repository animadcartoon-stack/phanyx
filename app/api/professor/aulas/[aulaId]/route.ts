import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ aulaId: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const { aulaId: aulaIdParam } = await params;
    const aulaId = Number(aulaIdParam);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "Aula inválida" }, { status: 400 });
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

    const aula = await prisma.aula.findFirst({
      where: {
        id: aulaId,
        instituicaoId: user.instituicaoId,
        turma: {
          professorId: professor.id,
          instituicaoId: user.instituicaoId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!aula) {
      return NextResponse.json(
        { error: "Aula não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    await prisma.aula.delete({
      where: {
        id: aula.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Aula excluída com sucesso.",
    });
  } catch (e: any) {
    console.error("ERRO AO EXCLUIR AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao excluir aula" },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ aulaId: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const { aulaId: aulaIdParam } = await params;
    const aulaId = Number(aulaIdParam);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "Aula inválida" }, { status: 400 });
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

    const aula = await prisma.aula.findFirst({
      where: {
        id: aulaId,
        instituicaoId: user.instituicaoId,
        turma: {
          professorId: professor.id,
          instituicaoId: user.instituicaoId,
        },
      },
    });

    if (!aula) {
      return NextResponse.json(
        { error: "Aula não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const updated = await prisma.aula.update({
      where: { id: aulaId },
      data: {
        titulo: body.titulo ?? aula.titulo,
        descricao: body.descricao ?? aula.descricao,
        duracaoMin: body.duracaoMin ?? aula.duracaoMin,
        videoUrl: body.videoUrl ?? aula.videoUrl,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("ERRO AO EDITAR AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao editar aula" },
      { status: 500 }
    );
  }
}