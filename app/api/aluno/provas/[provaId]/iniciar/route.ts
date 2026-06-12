import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarProvas } from "@/lib/permissoesPlano";

export async function POST(
  _req: Request,
  { params }: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ALUNO") {
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

    const provaId = Number(params.provaId);

    if (!Number.isFinite(provaId) || provaId <= 0) {
      return NextResponse.json({ error: "Prova inválida" }, { status: 400 });
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
      ["CONCLUIDO", "CANCELADO", "TRANCADO", "DESLIGADO"].includes(
        String(aluno.statusAluno)
      )
    ) {
      return NextResponse.json(
        { error: "Seu status acadêmico não permite iniciar novas provas." },
        { status: 403 }
      );
    }

    const agora = new Date();

    const prova = await prisma.prova.findFirst({
      where: {
        id: provaId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        titulo: true,
        notaMaxima: true,
        turmaId: true,
        status: true,
        ativa: true,
        publicadaAt: true,
        encerradaAt: true,
        disponivelEm: true,
        expiraEm: true,
        tempoMin: true,
        tentativasMax: true,
        exigirAulasConcluidas: true,
        tipoPublico: true,
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
        turma: {
          select: {
            id: true,
            disciplinas: {
              take: 1,
              select: {
                disciplina: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
        alunosLiberados: {
          where: {
            alunoId: aluno.id,
          },
          select: {
            alunoId: true,
          },
        },
      },
    });

    if (!prova) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    if (!prova.ativa || prova.status !== "PUBLICADA" || !prova.publicadaAt) {
      return NextResponse.json(
        { error: "Esta prova ainda não está disponível." },
        { status: 403 }
      );
    }

    if (prova.encerradaAt || prova.status === "ENCERRADA") {
      return NextResponse.json(
        { error: "Esta prova foi encerrada pelo professor." },
        { status: 403 }
      );
    }

    if (prova.disponivelEm && prova.disponivelEm > agora) {
      return NextResponse.json(
        { error: "Esta prova ainda não chegou na data e horário de início." },
        { status: 403 }
      );
    }

    if (prova.expiraEm && prova.expiraEm < agora) {
      return NextResponse.json(
        { error: "O prazo desta prova já terminou." },
        { status: 403 }
      );
    }

    if (!prova.questoes.length) {
      return NextResponse.json(
        { error: "Esta prova ainda não possui questões." },
        { status: 403 }
      );
    }

    if (
      prova.tipoPublico === "ALUNOS_SELECIONADOS" &&
      prova.alunosLiberados.length === 0
    ) {
      return NextResponse.json(
        { error: "Esta prova não foi liberada para você." },
        { status: 403 }
      );
    }

    if (prova.exigirAulasConcluidas) {
      const aulasDaTurma = await prisma.aula.findMany({
        where: {
          turmaId: prova.turmaId,
          instituicaoId: user.instituicaoId,
          publicada: true,
        },
        select: { id: true },
      });

      if (aulasDaTurma.length > 0) {
        const progressos = await prisma.progressoAula.findMany({
          where: {
            alunoId: aluno.id,
            instituicaoId: user.instituicaoId,
            aulaId: {
              in: aulasDaTurma.map((aula) => aula.id),
            },
            concluida: true,
          },
          select: { aulaId: true },
        });

        const concluidas = new Set(progressos.map((p) => p.aulaId));

        const todasConcluidas = aulasDaTurma.every((aula) =>
          concluidas.has(aula.id)
        );

        if (!todasConcluidas) {
          return NextResponse.json(
            {
              error:
                "Você precisa concluir todas as aulas antes de fazer a prova.",
            },
            { status: 403 }
          );
        }
      }
    }

    const tentativasAnteriores = await prisma.tentativaProva.findMany({
      where: {
        alunoId: aluno.id,
        provaId: prova.id,
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        tentativaNumero: "desc",
      },
      select: {
        id: true,
        finalizada: true,
        tentativaNumero: true,
        status: true,
      },
      take: 1,
    });

    const ultimaTentativa = tentativasAnteriores[0] ?? null;

    if (ultimaTentativa && !ultimaTentativa.finalizada) {
      return NextResponse.json({
        tentativa: ultimaTentativa,
        prova: {
          id: prova.id,
          titulo: prova.titulo ?? "Prova",
          notaMaxima: prova.notaMaxima ?? 10,
          disciplinaId:
            prova.turma.disciplinas[0]?.disciplina?.id ?? null,
          turmaId: prova.turmaId,
          disciplinaNome:
            prova.turma.disciplinas[0]?.disciplina?.nome ?? null,
          questoes: prova.questoes,
        },
      });
    }

    const proximaTentativaNumero = ultimaTentativa
      ? ultimaTentativa.tentativaNumero + 1
      : 1;

    if (proximaTentativaNumero > prova.tentativasMax) {
      return NextResponse.json(
        { error: "Você já utilizou todas as tentativas permitidas." },
        { status: 409 }
      );
    }

    const expiraEmTentativa =
      prova.tempoMin && prova.tempoMin > 0
        ? new Date(agora.getTime() + prova.tempoMin * 60 * 1000)
        : null;

    const tentativa = await prisma.tentativaProva.create({
      data: {
        alunoId: aluno.id,
        provaId: prova.id,
        instituicaoId: user.instituicaoId,
        tentativaNumero: proximaTentativaNumero,
        status: "EM_ANDAMENTO" as any,
        expiraEm: expiraEmTentativa,
      },
      select: {
        id: true,
        alunoId: true,
        provaId: true,
        finalizada: true,
        tentativaNumero: true,
        expiraEm: true,
        status: true,
      },
    });

    return NextResponse.json({
      tentativa,
      prova: {
        id: prova.id,
        titulo: prova.titulo ?? "Prova",
        notaMaxima: prova.notaMaxima ?? 10,
        disciplinaId: prova.turma.disciplinas[0]?.disciplina?.id ?? null,
        turmaId: prova.turmaId,
        disciplinaNome: prova.turma.disciplinas[0]?.disciplina?.nome ?? null,
        questoes: prova.questoes,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao iniciar prova" },
      { status: 500 }
    );
  }
}