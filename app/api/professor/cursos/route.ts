import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role || "").toUpperCase() !== "PROFESSOR") {
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

    const cursos = await prisma.curso.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        ativo: true,
        turmas: {
          some: {
            disciplinas: {
              some: {
                disciplina: {
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
            },
          },
        },
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(cursos);
  } catch (e: any) {
    console.error("ERRO API PROFESSOR CURSOS:", e);

    return NextResponse.json(
      { error: e?.message || "Erro ao carregar cursos do professor" },
      { status: 500 }
    );
  }
}