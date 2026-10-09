import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 },
      );
    }

    const instituicaoId = Number(user.instituicaoId);

    if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 },
      );
    }

    const [
      alunos,
      professores,
      cursos,
      disciplinas,
      certificados,
    ] = await prisma.$transaction([
      prisma.aluno.count({
        where: { instituicaoId },
      }),
      prisma.professor.count({
        where: { instituicaoId },
      }),
      prisma.curso.count({
        where: { instituicaoId },
      }),
      prisma.disciplina.count({
        where: { instituicaoId },
      }),
      prisma.certificado.count({
        where: { instituicaoId },
      }),
    ]);

    return NextResponse.json(
      {
        alunos,
        professores,
        cursos,
        disciplinas,
        certificados,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Erro ao carregar resumo do dashboard:", error);

    return NextResponse.json(
      { error: "Erro ao carregar resumo do dashboard." },
      { status: 500 },
    );
  }
}
