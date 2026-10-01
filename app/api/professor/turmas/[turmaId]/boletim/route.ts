import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { obterParesTurmaDisciplinaProfessor } from "@/lib/professor-escopo-academico";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ turmaId: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "NAO_AUTORIZADO" },
        { status: 401 }
      );
    }

    if (user.role !== "PROFESSOR") {
      return NextResponse.json(
        { error: "SEM_PERMISSAO" },
        { status: 403 }
      );
    }

    const { turmaId: turmaIdParam } = await params;
    const turmaId = Number(turmaIdParam);

    if (
      !Number.isInteger(turmaId) ||
      turmaId <= 0
    ) {
      return NextResponse.json(
        { error: "turmaId inválido" },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const disciplinaIdParam =
      url.searchParams.get("disciplinaId");
    const disciplinaId =
      Number(disciplinaIdParam);

    if (
      !disciplinaIdParam ||
      !Number.isInteger(disciplinaId) ||
      disciplinaId <= 0
    ) {
      return NextResponse.json(
        { error: "disciplinaId inválido" },
        { status: 400 }
      );
    }

    const professor =
      await prisma.professor.findFirst({
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

    const paresPermitidos =
      await obterParesTurmaDisciplinaProfessor({
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
      });

    const parPermitido =
      paresPermitidos.some(
        (par) =>
          par.turmaId === turmaId &&
          par.disciplinaId === disciplinaId
      );

    if (!parPermitido) {
      return NextResponse.json(
        {
          error:
            "Turma ou disciplina não encontrada ou sem permissão",
        },
        { status: 404 }
      );
    }

    const turma =
      await prisma.turma.findFirst({
        where: {
          id: turmaId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
          nome: true,
        },
      });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    const vinculoDisciplina =
      await prisma.turmaDisciplina.findFirst({
        where: {
          turmaId,
          disciplinaId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          disciplina: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    if (!vinculoDisciplina?.disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada na turma" },
        { status: 404 }
      );
    }

    const itensMatricula =
      await prisma.itemMatricula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          turmaId,
          disciplinaId,

          status: {
            in: ["A_CURSAR", "EM_CURSO"] as any,
          },

          matricula: {
            status: {
              not: "CANCELADA",
            },
            excluidaEm: null,
          },
        },

        include: {
          matricula: {
            include: {
              aluno: {
                include: {
                  user: true,
                },
              },
            },
          },
        },

        orderBy: {
          id: "desc",
        },
      });

    const alunosDaTurma =
      itensMatricula
        .map(
          (item) =>
            item.matricula?.aluno
        )
        .filter(Boolean);

    const alunosUnicos =
      Array.from(
        new Map(
          alunosDaTurma.map(
            (aluno: any) => [
              aluno.id,
              aluno,
            ]
          )
        ).values()
      ) as any[];

    const alunoIds =
      alunosUnicos.map(
        (aluno) => aluno.id
      );

    const tentativas =
      alunoIds.length > 0
        ? await prisma.tentativaProva.findMany({
            where: {
              instituicaoId:
                user.instituicaoId,

              alunoId: {
                in: alunoIds,
              },

              prova: {
                turmaId,
                disciplinaId,
                instituicaoId:
                  user.instituicaoId,
              },

              finalizada: true,
            },

            include: {
              prova: true,
            },

            orderBy: {
              finishedAt: "desc",
            },
          })
        : [];

    const provas =
      await prisma.prova.findMany({
        where: {
          turmaId,
          disciplinaId,
          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          titulo: true,
        },
      });

    const boletim =
      alunosUnicos.map(
        (aluno: any) => {
          const tentativasDoAluno =
            tentativas.filter(
              (tentativa) =>
                tentativa.alunoId ===
                aluno.id
            );

          const melhorTentativa =
            tentativasDoAluno.length > 0
              ? tentativasDoAluno.reduce(
                  (melhor, atual) => {
                    const notaMelhor =
                      melhor.notaFinal ??
                      -1;

                    const notaAtual =
                      atual.notaFinal ??
                      -1;

                    return notaAtual >
                      notaMelhor
                      ? atual
                      : melhor;
                  }
                )
              : null;

          const nota =
            melhorTentativa?.notaFinal ??
            null;

          return {
            alunoId: aluno.id,

            nome:
              aluno.user?.nome ||
              aluno.nome ||
              "Aluno",

            email:
              aluno.user?.email ||
              "",

            nota,

            status:
              nota == null
                ? "SEM PROVA"
                : nota >= 7
                  ? "APROVADO"
                  : "REPROVADO",
          };
        }
      );

    const notasValidas =
      boletim
        .map(
          (item) => item.nota
        )
        .filter(
          (nota): nota is number =>
            typeof nota === "number"
        );

    const mediaTurma =
      notasValidas.length > 0
        ? Number(
            (
              notasValidas.reduce(
                (acc, nota) =>
                  acc + nota,
                0
              ) /
              notasValidas.length
            ).toFixed(2)
          )
        : 0;

    const melhorNota =
      notasValidas.length > 0
        ? Math.max(
            ...notasValidas
          )
        : 0;

    const piorNota =
      notasValidas.length > 0
        ? Math.min(
            ...notasValidas
          )
        : 0;

    return NextResponse.json({
      turma: {
        id: turma.id,
        nome: turma.nome,
      },

      disciplina: {
        id:
          vinculoDisciplina
            .disciplina.id,

        nome:
          vinculoDisciplina
            .disciplina.nome,
      },

      provas,

      resumo: {
        totalAlunos:
          boletim.length,

        mediaTurma,
        melhorNota,
        piorNota,
      },

      boletim,
    });
  } catch (e: any) {
    console.error(
      "ERRO BOLETIM TURMA:",
      e
    );

    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao carregar boletim da turma",
      },
      { status: 500 }
    );
  }
}