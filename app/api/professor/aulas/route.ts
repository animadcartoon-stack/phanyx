import { NextResponse } from "next/server";
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

    const aulas = await prisma.aula.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        disciplina: {
          instituicaoId: user.instituicaoId,
          OR: [
            { professorId: professor.id },
            {
              professoresHabilitados: {
                some: {
                  professorId: professor.id,
                },
              },
            },
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        duracaoMin: true,
        videoUrl: true,
        createdAt: true,
        disciplina: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      aulas,
    });
  } catch (e: any) {
    console.error("ERRO AO LISTAR AULAS DO PROFESSOR:", e);

    return NextResponse.json(
      { error: e?.message || "Erro ao listar aulas" },
      { status: 500 }
    );
  }
}