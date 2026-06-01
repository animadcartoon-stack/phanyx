import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const aluno = await prisma.aluno.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
    include: {
      matriculas: {
        include: {
          itens: true,
        },
      },
    },
  });

  const professor = await prisma.professor.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
  });

  const itensMatricula = await prisma.itemMatricula.findMany({
    where: {
      instituicaoId: user.instituicaoId,
    },
    take: 10,
    include: {
      turma: {
        include: {
          disciplinas: {
            include: {
              professor: true,
              disciplina: {
                include: {
                  professor: true,
                  professoresHabilitados: true,
                },
              },
            },
          },
        },
      },
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
  });

  return NextResponse.json({
    user: {
      id: user.id,
      nome: user.nome,
      role: user.role,
      instituicaoId: user.instituicaoId,
    },
    aluno,
    professor,
    itensMatricula,
  });
}