import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const ROLES_INSTITUICAO = [
  "ADMIN",
  "SECRETARIA",
  "COORDENADOR",
  "FINANCEIRO",
  "SUPORTE",
];

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    let where: any = {
      instituicaoId: user.instituicaoId,
      id: {
        not: user.id,
      },
      ativo: true,
    };

    if (user.role === "ALUNO") {
      where = {
        instituicaoId: user.instituicaoId,
        id: {
          not: user.id,
        },
        ativo: true,
        role: "PROFESSOR",
      };
    }

    if (user.role === "PROFESSOR") {
      where = {
        instituicaoId: user.instituicaoId,
        id: {
          not: user.id,
        },
        ativo: true,
        OR: [
          {
            role: {
              in: ROLES_INSTITUICAO,
            },
          },
          {
            role: "ALUNO",
          },
        ],
      };
    }

    if (ROLES_INSTITUICAO.includes(user.role)) {
      where = {
        instituicaoId: user.instituicaoId,
        id: {
          not: user.id,
        },
        ativo: true,
        role: {
          in: [
            "ADMIN",
            "SECRETARIA",
            "COORDENADOR",
            "FINANCEIRO",
            "SUPORTE",
            "PROFESSOR",
            "ALUNO",
          ],
        },
      };
    }

    if (user.role === "SUPER_ADMIN") {
      where = {
        id: {
          not: user.id,
        },
        ativo: true,
        role: {
          in: ["ADMIN", "SECRETARIA", "COORDENADOR", "SUPORTE"],
        },
      };
    }

    const usuarios = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json({
      usuarios,
    });
  } catch (error) {
    console.error("Erro ao carregar usuários do chat:", error);

    return NextResponse.json(
      { error: "Erro ao carregar usuários" },
      { status: 500 }
    );
  }
}