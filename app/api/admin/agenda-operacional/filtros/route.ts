import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const instituicaoId = user.instituicaoId;

    const [
      cursos,
      turmas,
      professores,
      funcionarios,
      departamentos,
      disciplinas,
      polos,
    ] = await Promise.all([
      prisma.curso.findMany({
        where: { instituicaoId },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),

      prisma.turma.findMany({
        where: { instituicaoId },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),

      prisma.professor.findMany({
        where: { instituicaoId },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),

      prisma.funcionario.findMany({
        where: {
          instituicaoId,
          arquivado: false,
        },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),

      prisma.departamento.findMany({
        where: { instituicaoId },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),

      prisma.disciplina.findMany({
        where: { instituicaoId },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),

      prisma.polo.findMany({
        where: { instituicaoId },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),
    ]);

    return NextResponse.json({
      cursos,
      turmas,
      professores,
      funcionarios,
      departamentos,
      disciplinas,
      polos,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message ?? "Erro ao carregar filtros.",
      },
      { status: 500 }
    );
  }
}