import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function limparCampoCsv(valor: any) {
  const texto = String(valor ?? "")
    .replace(/\r?\n|\r/g, " ")
    .replace(/;/g, ",")
    .trim();

  return `"${texto.replace(/"/g, '""')}"`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ turmaId: string }> }
) {
  try {
    const user = await getUserFromToken();

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
        disciplinas: {
          include: {
            disciplina: true,
          },
        },
        itensMatricula: {
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
        },
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const alunosDaTurma = turma.itensMatricula
      .map((item: any) => item.matricula?.aluno)
      .filter(Boolean);

    const alunosUnicos = Array.from(
      new Map(alunosDaTurma.map((aluno: any) => [aluno.id, aluno])).values()
    ) as any[];

    const alunoIds = alunosUnicos.map((aluno: any) => aluno.id);

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
        prova: {
          select: {
            id: true,
            titulo: true,
            notaMaxima: true,
          },
        },
      },
      orderBy: {
        finishedAt: "desc",
      },
    });

    const disciplinasTexto =
      turma.disciplinas
        ?.map((v: any) => v.disciplina?.nome)
        .filter(Boolean)
        .join(", ") || "Disciplinas não informadas";

    const linhas: string[] = [];

    linhas.push(
      [
        "Turma",
        "Disciplinas",
        "Aluno",
        "E-mail",
        "Nota",
        "Status",
        "Prova",
        "Última tentativa",
      ]
        .map(limparCampoCsv)
        .join(";")
    );

    alunosUnicos.forEach((aluno: any) => {
      const tentativasDoAluno = tentativas.filter(
        (t: any) => t.alunoId === aluno.id
      );

      const melhorTentativa =
        tentativasDoAluno.length > 0
          ? tentativasDoAluno.reduce((melhor: any, atual: any) => {
              const notaMelhor = melhor.notaFinal ?? -1;
              const notaAtual = atual.notaFinal ?? -1;
              return notaAtual > notaMelhor ? atual : melhor;
            })
          : null;

      const nota = melhorTentativa?.notaFinal ?? "";
      const status =
        nota === "" ? "SEM PROVA" : Number(nota) >= 7 ? "APROVADO" : "REPROVADO";

      const nome = aluno.user?.nome || aluno.nome || "Aluno";
      const email = aluno.user?.email || "";
      const provaTitulo = melhorTentativa?.prova?.titulo || "";
      const ultimaTentativa = melhorTentativa?.finishedAt
        ? new Date(melhorTentativa.finishedAt).toLocaleString("pt-BR")
        : "";

      linhas.push(
        [
          turma.nome,
          disciplinasTexto,
          nome,
          email,
          nota,
          status,
          provaTitulo,
          ultimaTentativa,
        ]
          .map(limparCampoCsv)
          .join(";")
      );
    });

    const csv = "\uFEFF" + linhas.join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="boletim-turma-${turmaId}.csv"`,
      },
    });
  } catch (e: any) {
    console.error("ERRO CSV BOLETIM:", e);

    return NextResponse.json(
      { error: e?.message || "Erro ao exportar CSV" },
      { status: 500 }
    );
  }
}