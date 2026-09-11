import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  { params }: { params: { disciplinaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ALUNO" && user.role !== "aluno")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const disciplinaId = Number(params.disciplinaId);

    if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
      return NextResponse.json(
        { error: "Disciplina inválida" },
        { status: 400 }
      );
    }

    const vinculoOperacional =
      await prisma.itemMatricula.findFirst({
        where: {
          instituicaoId:
            user.instituicaoId,

          disciplinaId,

          matricula: {
            alunoId:
              aluno.id,

            instituicaoId:
              user.instituicaoId,

            status: {
              not:
                "CANCELADA",
            },

            excluidaEm:
              null,
          },
        },

        select: {
          id: true,
        },
      });

    if (!vinculoOperacional) {
      return NextResponse.json(
        {
          error:
            "Acesso acad?mico indispon?vel para esta matr?cula.",
        },
        {
          status: 403,
        }
      );
    }

    const prova = await prisma.prova.findFirst({
  where: {
    instituicaoId: user.instituicaoId,
    ativa: true,
    turma: {
  disciplinas: {
    some: {
      disciplinaId: disciplinaId,
    },
  },
},
  },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        titulo: true,
        notaMaxima: true,
        tempoMin: true,
        status: true,
        ativa: true,
      },
    });

    if (!prova) {
      return NextResponse.json(null);
    }

    return NextResponse.json(prova);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao buscar prova" },
      { status: 500 }
    );
  }
}