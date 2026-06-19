import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

async function buscarUsuarioCompleto(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      instituicaoId: true,
      isMasterAdmin: true,
    },
  });
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuarioBanco = await buscarUsuarioCompleto(user.id);

    if (!usuarioBanco) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const role = String(usuarioBanco.role || "").toUpperCase();

    const whereBase =
      role === "ADMIN" || role === "SUPER_ADMIN" || usuarioBanco.isMasterAdmin
        ? {
            OR: [
              { usuarioId: usuarioBanco.id },
              {
                instituicaoId: usuarioBanco.instituicaoId,
                usuarioId: null,
              },
            ],
          }
        : {
            usuarioId: usuarioBanco.id,
          };

    const notificacoes = await prisma.notificacao.findMany({
      where: whereBase,
      orderBy: [{ lida: "asc" }, { criadoEm: "desc" }],
      take: 20,
    });

    const totalNaoLidas = await prisma.notificacao.count({
      where: {
        ...whereBase,
        lida: false,
      },
    });

    return NextResponse.json({
      notificacoes,
      totalNaoLidas,
    });
  } catch (error: any) {
    console.error("Erro ao listar notificações:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar notificações" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const id = Number(body?.id || 0);

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const notificacao = await prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: user.id },
          { instituicaoId: user.instituicaoId },
        ],
      },
    });

    if (!notificacao) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    const atualizada = await prisma.notificacao.update({
      where: { id },
      data: {
        lida: Boolean(body?.lida ?? true),
      },
    });

    return NextResponse.json(atualizada);
  } catch (error: any) {
    console.error("Erro ao atualizar notificação:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar notificação" },
      { status: 500 }
    );
  }
}