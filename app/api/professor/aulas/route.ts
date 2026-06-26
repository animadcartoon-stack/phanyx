import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const hoje = inicioDoDia(new Date());

    const substituicoesAtivas = await prisma.substituicaoDocente.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        professorSubstitutoId: professor.id,
        status: {
          notIn: ["CANCELADA", "ENCERRADA", "SUSPENSA"],
        },
        dataInicio: {
          lte: hoje,
        },
        OR: [
          {
            dataFim: null,
          },
          {
            dataFim: {
              gte: hoje,
            },
          },
        ],
      },
      select: {
        id: true,
        professorTitularId: true,
        turmaId: true,
        disciplinaId: true,
        dataInicio: true,
        dataFim: true,
        professorTitular: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    const filtrosSubstituicao = substituicoesAtivas.map((sub) => ({
      turmaId: sub.turmaId,
      disciplinaId: sub.disciplinaId,
    }));

    const aulas = await prisma.aula.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        OR: [
          {
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
          ...filtrosSubstituicao,
        ],
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
        turmaId: true,
        disciplinaId: true,
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
        disciplina: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    const aulasComContexto = aulas.map((aula) => {
      const substituicao = substituicoesAtivas.find(
        (sub) =>
          sub.turmaId === aula.turmaId &&
          sub.disciplinaId === aula.disciplinaId
      );

      return {
        ...aula,
        substituicaoAtiva: substituicao
          ? {
              id: substituicao.id,
              professorTitular: substituicao.professorTitular,
              dataInicio: substituicao.dataInicio,
              dataFim: substituicao.dataFim,
            }
          : null,
      };
    });

    return NextResponse.json({
      ok: true,
      professor,
      substituicoesAtivas,
      aulas: aulasComContexto,
    });
  } catch (e: any) {
    console.error("ERRO AO LISTAR AULAS DO PROFESSOR:", e);

    return NextResponse.json(
      { error: e?.message || "Erro ao listar aulas" },
      { status: 500 }
    );
  }
}