import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "PROFESSOR") {
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

    const turmasDoProfessor = await prisma.turma.findMany({
  where: {
    professorId: professor.id,
    instituicaoId: user.instituicaoId,
  },
  include: {
    disciplinas: {
      include: {
        disciplina: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
      },
    },
  },
  orderBy: {
    id: "desc",
  },
});

    const mapa = new Map<number, { id: number; nome: string; descricao: string | null }>();

    for (const turma of turmasDoProfessor) {
  for (const item of turma.disciplinas) {
    const disciplina = item.disciplina;
          if (!disciplina) continue;

    if (!mapa.has(disciplina.id)) {
      mapa.set(disciplina.id, {
        id: disciplina.id,
        nome: disciplina.nome,
        descricao: disciplina.descricao ?? null,
      });
    }
  }
}

    const disciplinas = Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );

    return NextResponse.json(disciplinas);
  } catch (e: any) {
    console.error("ERRO API PROFESSOR DISCIPLINAS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar disciplinas" },
      { status: 500 }
    );
  }
}