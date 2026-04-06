import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function podeVerTurmas(role?: string) {
  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "COORDENADOR" ||
    role === "SECRETARIA"
  );
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!podeVerTurmas(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const turmas = await prisma.turma.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        disciplina: {
          select: {
            id: true,
            nome: true,
            codigo: true,
            cursoId: true,
          },
        },
        professor: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        _count: {
          select: {
            aulas: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const resultado = turmas.map((turma) => ({
      id: turma.id,
      nome: turma.nome,
      codigo: turma.codigo,
      semestre: turma.semestre,
      periodoLetivo: turma.periodoLetivo,
      ativa: turma.ativa,

      cursoId: turma.disciplina?.cursoId ?? null,

      disciplina: turma.disciplina
        ? {
            id: turma.disciplina.id,
            nome: turma.disciplina.nome,
            codigo: turma.disciplina.codigo,
            cursoId: turma.disciplina.cursoId,
          }
        : null,

      professor: turma.professor
        ? {
            id: turma.professor.id,
            nome:
              turma.professor.user?.nome ??
              turma.professor.nome ??
              "Professor sem nome",
          }
        : null,

      _count: {
        aulas: turma._count?.aulas ?? 0,
      },
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar turmas do admin:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar turmas" },
      { status: 500 }
    );
  }
}