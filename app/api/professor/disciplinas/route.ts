import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function inicioDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
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

    const hoje = inicioDoDia(new Date());

    const substituicoes = await prisma.substituicaoDocente.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        professorSubstitutoId: professor.id,
        status: {
          notIn: ["CANCELADA", "ENCERRADA", "SUSPENSA"],
        },
        dataInicio: {
          lte: hoje,
        },
        OR: [{ dataFim: null }, { dataFim: { gte: hoje } }],
      },
      select: {
        disciplinaId: true,
      },
    });

    const disciplinasSubstituicaoIds = Array.from(
      new Set(substituicoes.map((s) => s.disciplinaId))
    );

    const disciplinas = await prisma.disciplina.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        OR: [
          {
            professorId: professor.id,
          },
          {
            professoresHabilitados: {
              some: {
                professorId: professor.id,
              },
            },
          },
          {
            id: {
              in: disciplinasSubstituicaoIds,
            },
          },
        ],
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(disciplinas);
  } catch (e: any) {
    console.error("ERRO API PROFESSOR DISCIPLINAS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar disciplinas" },
      { status: 500 }
    );
  }
}