import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permissão",
        },
        {
          status: 403,
        },
      );
    }

    const instituicaoId =
      Number(user.instituicaoId);

    if (
      !Number.isInteger(
        instituicaoId,
      ) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        {
          status: 400,
        },
      );
    }

    const [
      alunos,
      matriculas,
      funcionarios,
      professores,
    ] = await Promise.all([
      prisma.aluno.findMany({
        where: {
          instituicaoId,
        },

        orderBy: {
          nome: "asc",
        },

        select: {
          id: true,
          nome: true,
        },
      }),

      prisma.matricula.findMany({
        where: {
          instituicaoId,
          excluidaEm: null,
        },

        orderBy: {
          id: "desc",
        },

        select: {
          id: true,

          aluno: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),

      prisma.funcionario.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        orderBy: {
          nome: "asc",
        },

        select: {
          id: true,
          nome: true,
          cargo: true,
        },
      }),

      prisma.professor.findMany({
        where: {
          instituicaoId,
        },

        orderBy: {
          nome: "asc",
        },

        select: {
          id: true,
          nome: true,

          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              ativo: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        alunos,
        matriculas,
        funcionarios,
        professores,
      },
      {
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Erro ao carregar opções para emissão de documentos:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar opções para emissão de documentos.",
      },
      {
        status: 500,
      },
    );
  }
}
