import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const busca = String(searchParams.get("busca") || "").trim().toLowerCase();

    const alunos = await prisma.aluno.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        ...(busca
          ? {
              OR: [
                {
                  nome: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  matricula: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  user: {
                    email: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        user: true,
      },
      orderBy: {
        nome: "asc",
      },
      take: 30,
    });

    return NextResponse.json(
      alunos.map((aluno) => ({
        id: aluno.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
        email: aluno.user?.email || null,
        statusAluno: aluno.statusAluno,
      }))
    );
  } catch (error: any) {
    console.error("Erro ao buscar alunos:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar alunos" },
      { status: 500 }
    );
  }
}