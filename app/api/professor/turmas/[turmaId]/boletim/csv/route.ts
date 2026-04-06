import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ turmaId: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
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
        disciplina: {
          professorId: professor.id,
          instituicaoId: user.instituicaoId,
        },
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

    const alunoIds = turma.matriculas.map((m: any) => m.alunoId);

    const tentativas = await prisma.tentativaProva.findMany({
      where: {
        alunoId: { in: alunoIds },
        prova: {
          disciplinaId: turma.disciplinaId,
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

    const linhas: string[] = [];
    linhas.push("Aluno,Email,Nota,Status");

    turma.matriculas.forEach((mat: any) => {
      const aluno = mat.aluno;

      const tentativasDoAluno = tentativas.filter(
        (t) => t.alunoId === aluno.id
      );

      const notas = tentativasDoAluno
        .map((t) => Number(t.notaFinal ?? 0))
        .filter((n) => !Number.isNaN(n));

      const nota =
        notas.length > 0
          ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2)
          : "";

      const status =
        nota === ""
          ? "Sem prova"
          : Number(nota) >= 7
          ? "Aprovado"
          : "Reprovado";

      const nome = aluno.user?.nome || aluno.nome || "Aluno";
      const email = aluno.user?.email || "";

      linhas.push(`${nome},${email},${nota},${status}`);
    });

    const csv = linhas.join("\n");

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