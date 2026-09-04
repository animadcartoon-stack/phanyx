import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import {
  solicitarReanalisePorAlteracaoAcademica,
} from "@/lib/student-success/solicitar-reanalise-por-alteracao-academica";

export async function GET(request: Request) {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const disciplinaId = searchParams.get("disciplinaId");

  const notas = await prisma.nota.findMany({
    where: {
      disciplinaId: disciplinaId ? Number(disciplinaId) : undefined,
      disciplina: {
        instituicaoId: user.instituicaoId,
      },
    },
    include: {
      aluno: true,
      disciplina: true,
    },
  });

  return NextResponse.json(notas);
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "professor") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const nota = await prisma.nota.upsert({
      where: {
        alunoId_disciplinaId: {
          alunoId: body.alunoId,
          disciplinaId: body.disciplinaId,
        },
      },
      update: {
        valor: body.valor,
      },
      create: {
        alunoId: body.alunoId,
        disciplinaId: body.disciplinaId,
        valor: body.valor,
      },
    });

    /*
 * Uma alteração de nota pode modificar:
 * - desempenho;
 * - tendência recente;
 * - classificação de risco.
 *
 * A nota já foi persistida neste ponto.
 * Se o Student Success falhar, não
 * transformamos o lançamento da nota
 * em erro para o professor.
 */
try {
  await solicitarReanalisePorAlteracaoAcademica({
    instituicaoId:
      user.instituicaoId,

    alunoIds: [
      Number(
        body.alunoId
      ),
    ],

    executadoPorId:
      user.id,
  });
}
catch (error) {
  console.error(
    "[STUDENT_SUCCESS_NOTA_REANALISE]",
    error
  );
}

    return NextResponse.json(nota);

  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao lançar nota" },
      { status: 500 }
    );
  }
}