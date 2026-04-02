import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ turmaId: string }> }
) {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    if (user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "SEM_PERMISSAO" }, { status: 403 });
    }

    const { turmaId: turmaIdParam } = await params;
    const turmaId = Number(turmaIdParam);

    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      return NextResponse.json({ error: "turmaId inválido" }, { status: 400 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
      },
      include: {
        disciplina: true,
        matriculas: {
          include: {
            aluno: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const alunoIds = turma.matriculas.map((m) => m.alunoId);

    const tentativas = await prisma.tentativaProva.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        alunoId: { in: alunoIds },
        prova: {
          turmaId: turma.id,
          instituicaoId: user.instituicaoId,
        },
        finalizada: true,
      },
      include: {
        prova: true,
      },
      orderBy: {
        finishedAt: "desc",
      },
    });

    const provas = await prisma.prova.findMany({
      where: {
        turmaId: turma.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        titulo: true,
      },
    });

    const boletim = turma.matriculas.map((mat) => {
      const aluno = mat.aluno;

      const tentativasDoAluno = tentativas.filter((t) => t.alunoId === aluno.id);

      const melhorTentativa =
        tentativasDoAluno.length > 0
          ? tentativasDoAluno.reduce((melhor, atual) => {
              const notaMelhor = melhor.notaFinal ?? -1;
              const notaAtual = atual.notaFinal ?? -1;
              return notaAtual > notaMelhor ? atual : melhor;
            })
          : null;

      const nota = melhorTentativa?.notaFinal ?? null;

      return {
        alunoId: aluno.id,
        nome: aluno.user?.nome || aluno.nome || "Aluno",
        email: aluno.user?.email || "",
        nota,
        status:
          nota == null
            ? "SEM PROVA"
            : nota >= 7
            ? "APROVADO"
            : "REPROVADO",
      };
    });

    const notasValidas = boletim
      .map((b) => b.nota)
      .filter((n): n is number => typeof n === "number");

    const mediaTurma =
      notasValidas.length > 0
        ? Number(
            (
              notasValidas.reduce((acc, n) => acc + n, 0) /
              notasValidas.length
            ).toFixed(2)
          )
        : 0;

    const melhorNota = notasValidas.length > 0 ? Math.max(...notasValidas) : 0;
    const piorNota = notasValidas.length > 0 ? Math.min(...notasValidas) : 0;

    return NextResponse.json({
      turma: {
        id: turma.id,
        nome: turma.nome,
      },
      disciplina: {
        id: turma.disciplinaId,
        nome: turma.disciplina?.nome ?? "Disciplina",
      },
      provas,
      resumo: {
        totalAlunos: boletim.length,
        mediaTurma,
        melhorNota,
        piorNota,
      },
      boletim,
    });
  } catch (e: any) {
    console.error("ERRO BOLETIM TURMA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar boletim da turma" },
      { status: 500 }
    );
  }
}