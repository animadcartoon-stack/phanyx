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

    const turmas = await prisma.turma.findMany({
      where: {
        instituicaoId: user.instituicaoId,
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
      include: {
        disciplinas: {
          where: {
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
          include: {
            disciplina: {
              include: {
                curso: true,
              },
            },
          },
        },
        itensMatricula: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(
      turmas.flatMap((t) =>
        t.disciplinas.map((item) => ({
          id: t.id,
          turmaDisciplinaId: item.id,
          nome: t.nome,
          semestre: t.semestre,
          periodoLetivo: t.periodoLetivo,
          statusTurma: t.statusTurma,
          alunos: t.itensMatricula.length,

          curso: item.disciplina?.curso ?? null,

          disciplinaId: item.disciplinaId,
          disciplina: item.disciplina,

          statusDisciplina: item.status,
          dataInicio: item.dataInicio,
          dataFim: item.dataFim,
        }))
      )
    );
  } catch (e: any) {
    console.error("ERRO API PROFESSOR TURMAS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar turmas" },
      { status: 500 }
    );
  }
}