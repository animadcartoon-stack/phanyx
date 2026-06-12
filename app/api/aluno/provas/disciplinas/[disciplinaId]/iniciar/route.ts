import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { disciplinaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role || "").toUpperCase() !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const disciplinaId = Number(params.disciplinaId);

    if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
      return NextResponse.json(
        { error: "Disciplina inválida" },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const itemMatricula = await prisma.itemMatricula.findFirst({
  where: {
    instituicaoId: user.instituicaoId,
    disciplinaId,
    status: {
      in: ["A_CURSAR", "EM_CURSO"] as any,
    },
    matricula: {
      alunoId: aluno.id,
      instituicaoId: user.instituicaoId,
    },
  },
  select: {
    turmaId: true,
    disciplinaId: true,
  },
});

    if (!itemMatricula) {
      return NextResponse.json(
        { error: "Aluno não matriculado nesta disciplina" },
        { status: 403 }
      );
    }

    const agora = new Date();

    const prova = await prisma.prova.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        turmaId: itemMatricula.turmaId,
        ativa: true,
        status: "PUBLICADA" as any,
        turma: {
          disciplinas: {
            some: {
              disciplinaId,
            },
          },
        },
        OR: [
          {
            disponivelEm: null,
          },
          {
            disponivelEm: {
              lte: agora,
            },
          },
        ],
        AND: [
          {
            OR: [
              {
                expiraEm: null,
              },
              {
                expiraEm: {
                  gte: agora,
                },
              },
            ],
          },
          {
            OR: [
              {
                tipoPublico: "TURMA",
              },
              {
                tipoPublico: "ALUNOS_SELECIONADOS",
                alunosLiberados: {
                  some: {
                    alunoId: aluno.id,
                    instituicaoId: user.instituicaoId,
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        questoes: {
          orderBy: {
            ordem: "asc",
          },
          include: {
            alternativas: {
              orderBy: {
                ordem: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!prova) {
      return NextResponse.json(
        { error: "Prova ainda não disponível" },
        { status: 404 }
      );
    }

    if (prova.exigirAulasConcluidas) {
      const aulas = await prisma.aula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          turmaId: itemMatricula.turmaId,
          disciplinaId,
          publicada: true,
        },
        select: {
          id: true,
        },
      });

      const aulaIds = aulas.map((aula) => aula.id);

      if (aulaIds.length > 0) {
        const concluidas = await prisma.progressoAula.count({
          where: {
            instituicaoId: user.instituicaoId,
            alunoId: aluno.id,
            aulaId: {
              in: aulaIds,
            },
            concluida: true,
          },
        });

        if (concluidas < aulaIds.length) {
          return NextResponse.json(
            {
              error:
                "Conclua as aulas obrigatórias antes de iniciar esta prova.",
            },
            { status: 403 }
          );
        }
      }
    }

    const tentativaExistente = await prisma.tentativaProva.findFirst({
      where: {
        alunoId: aluno.id,
        provaId: prova.id,
        instituicaoId: user.instituicaoId,
        status: "EM_ANDAMENTO" as any,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (tentativaExistente) {
      return NextResponse.json({
        tentativaId: tentativaExistente.id,
        prova,
      });
    }

    const quantidadeTentativas = await prisma.tentativaProva.count({
      where: {
        alunoId: aluno.id,
        provaId: prova.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (quantidadeTentativas >= Number(prova.tentativasMax || 1)) {
      return NextResponse.json(
        { error: "Limite de tentativas atingido para esta prova." },
        { status: 403 }
      );
    }

    const tentativa = await prisma.tentativaProva.create({
      data: {
        alunoId: aluno.id,
        provaId: prova.id,
        instituicaoId: user.instituicaoId,
        tentativaNumero: quantidadeTentativas + 1,
        expiraEm: prova.tempoMin
          ? new Date(Date.now() + Number(prova.tempoMin) * 60 * 1000)
          : null,
      },
    });

    return NextResponse.json({
      tentativaId: tentativa.id,
      prova,
    });
  } catch (e: any) {
    console.error("ERRO INICIAR PROVA ALUNO:", e);

    return NextResponse.json(
      { error: e?.message || "Erro ao iniciar prova" },
      { status: 500 }
    );
  }
}