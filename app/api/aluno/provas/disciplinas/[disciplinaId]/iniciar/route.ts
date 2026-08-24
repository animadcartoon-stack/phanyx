import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { podeUsarProvas } from "@/lib/permissoesPlano";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { disciplinaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (String(user.role || "").toUpperCase() !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!podeUsarProvas(user.plano || "ESSENCIAL")) {
      return NextResponse.json(
        {
          error:
            "Recurso disponível apenas nos planos Profissional e Enterprise",
        },
        { status: 403 }
      );
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
        ativo: true,
      },
      select: {
        id: true,
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
      [
        "TRANCADO",
        "TRANSFERIDO",
        "DESLIGADO",
        "FORMADO",
        "CANCELADO",
        "SUSPENSO",
      ].includes(
        String(aluno.statusAluno || "").toUpperCase()
      )
    ) {
      return NextResponse.json(
        { error: "Seu status acadêmico não permite iniciar novas provas." },
        { status: 403 }
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
      select: {
        id: true,
        titulo: true,
        notaMaxima: true,
        tempoMin: true,
        tentativasMax: true,
        exigirAulasConcluidas: true,
        turmaId: true,
        questoes: {
          orderBy: [{ ordem: "asc" }, { id: "asc" }],
          select: {
            id: true,
            enunciado: true,
            tipo: true,
            valor: true,
            ordem: true,
            alternativas: {
              orderBy: [{ ordem: "asc" }, { id: "asc" }],
              select: {
                id: true,
                texto: true,
                ordem: true,
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

    if (prova.questoes.length === 0) {
      return NextResponse.json(
        { error: "Esta prova ainda não possui questões." },
        { status: 403 }
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

    const provaPublica = {
      id: prova.id,
      titulo: prova.titulo,
      notaMaxima: prova.notaMaxima,
      tempoMin: prova.tempoMin,
      questoes: prova.questoes.map((questao) => ({
        id: questao.id,
        enunciado: questao.enunciado,
        tipo: questao.tipo,
        valor: questao.valor,
        ordem: questao.ordem,
        alternativas:
          String(questao.tipo).toUpperCase() === "MULTIPLA_ESCOLHA"
            ? questao.alternativas.map((alternativa) => ({
                id: alternativa.id,
                texto: alternativa.texto,
                ordem: alternativa.ordem,
              }))
            : [],
      })),
    };

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
      select: {
        id: true,
        expiraEm: true,
      },
    });

    if (tentativaExistente) {
      const tentativaExpirou =
        tentativaExistente.expiraEm !== null &&
        tentativaExistente.expiraEm <= agora;

      if (!tentativaExpirou) {
        return NextResponse.json({
          tentativaId: tentativaExistente.id,
          prova: provaPublica,
        });
      }

      await prisma.tentativaProva.updateMany({
        where: {
          id: tentativaExistente.id,
          alunoId: aluno.id,
          provaId: prova.id,
          instituicaoId: user.instituicaoId,
          status: "EM_ANDAMENTO" as any,
        },
        data: {
          status: "EXPIRADA" as any,
        },
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
        { status: 409 }
      );
    }

    const tentativa = await prisma.tentativaProva.create({
      data: {
        alunoId: aluno.id,
        provaId: prova.id,
        instituicaoId: user.instituicaoId,
        tentativaNumero: quantidadeTentativas + 1,
        status: "EM_ANDAMENTO" as any,
        expiraEm:
          prova.tempoMin && Number(prova.tempoMin) > 0
            ? new Date(agora.getTime() + Number(prova.tempoMin) * 60 * 1000)
            : null,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      tentativaId: tentativa.id,
      prova: provaPublica,
    });
  } catch (error: unknown) {
    console.error("ERRO INICIAR PROVA ALUNO:", error);

    return NextResponse.json(
      { error: "Erro ao iniciar prova" },
      { status: 500 }
    );
  }
}