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
      select: {
        id: true,
        ativo: true,
        statusAluno: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }
    if (
      !aluno.ativo ||
      [
        "TRANCADO",
        "TRANSFERIDO",
        "DESLIGADO",
        "FORMADO",
        "CANCELADO",
        "SUSPENSO",
      ].includes(
        String(
          aluno.statusAluno || ""
        ).toUpperCase()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seu status acad\u00eamico n\u00e3o permite acessar novas provas.",
        },
        {
          status: 403,
        }
      );
    }

    const disciplinaId =
      Number(params.disciplinaId);

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

          status: {
            in: [
              "A_CURSAR",
              "EM_CURSO",
            ] as any,
          },

          matricula: {
            alunoId:
              aluno.id,

            instituicaoId:
              user.instituicaoId,

            status: {
              notIn: [
                "CANCELADA",
                "TRANCADA",
                "CONCLUIDA",
                "SUSPENSA",
              ] as any,
            },

            excluidaEm:
              null,
          },
        },

        select: {
          id: true,
          turmaId: true,
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

    const agora = new Date();

    const prova =
      await prisma.prova.findFirst({
        where: {
          instituicaoId:
            user.instituicaoId,

          turmaId:
            vinculoOperacional.turmaId,

          disciplinaId,

          ativa:
            true,

          status:
            "PUBLICADA" as any,

          publicadaAt: {
            not:
              null,
          },

          AND: [
            {
              OR: [
                {
                  disponivelEm:
                    null,
                },
                {
                  disponivelEm: {
                    lte:
                      agora,
                  },
                },
              ],
            },
            {
              OR: [
                {
                  expiraEm:
                    null,
                },
                {
                  expiraEm: {
                    gte:
                      agora,
                  },
                },
              ],
            },
            {
              OR: [
                {
                  tipoPublico:
                    "TURMA",
                },
                {
                  tipoPublico:
                    "ALUNOS_SELECIONADOS",

                  alunosLiberados: {
                    some: {
                      alunoId:
                        aluno.id,

                      instituicaoId:
                        user.instituicaoId,
                    },
                  },
                },
              ],
            },
          ],
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