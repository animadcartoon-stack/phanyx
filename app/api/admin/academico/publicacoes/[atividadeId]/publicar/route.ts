import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(
  _req: Request,
  { params }: { params: { atividadeId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const role = String(user.role || "").toUpperCase();

    const adminGeral =
      role === "ADMIN" ||
      role === "SUPER_ADMIN";

    // ADMIN e SUPER_ADMIN têm acesso direto.
    // Outros usuários precisam possuir permissão setorial.
    if (!adminGeral) {
      const permissoes =
        await prisma.departamentoPermissao.findMany({
          where: {
            departamento: {
              funcionarios: {
                some: {
                  userId: user.id,
                  instituicaoId: user.instituicaoId,
                },
              },
            },
            chave: {
              in: [
                "*",
                "academico.publicacoes.gerenciar",
              ],
            },
            ativo: true,
          },
          select: {
            chave: true,
          },
        });

      const temAcesso =
        permissoes.some((p) => p.chave === "*") ||
        permissoes.some(
          (p) =>
            p.chave ===
            "academico.publicacoes.gerenciar"
        );

      if (!temAcesso) {
        return NextResponse.json(
          {
            error:
              "Você não tem permissão para publicar atividades.",
          },
          { status: 403 }
        );
      }
    }

    const atividadeId = Number(params.atividadeId);

    if (
      !Number.isFinite(atividadeId) ||
      atividadeId <= 0
    ) {
      return NextResponse.json(
        { error: "Atividade inválida" },
        { status: 400 }
      );
    }

    const atividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        titulo: true,
        status: true,
      },
    });

    if (!atividade) {
      return NextResponse.json(
        { error: "Atividade não encontrada" },
        { status: 404 }
      );
    }

    if (atividade.status !== "AGUARDANDO_PUBLICACAO") {
      return NextResponse.json(
        {
          error:
            "Apenas atividades aguardando publicação podem ser publicadas.",
        },
        { status: 400 }
      );
    }

    const agora = new Date();

    const publicada = await prisma.atividade.update({
      where: {
        id: atividade.id,
      },
      data: {
        status: "PUBLICADA",
        publicadaAt: agora,
        publicadoPorId: user.id,
        publicadoPeloApoioDocenteEm: agora,
      },
      select: {
        id: true,
        titulo: true,
        status: true,
        publicadaAt: true,
        publicadoPorId: true,
        publicadoPeloApoioDocenteEm: true,
      },
    });

    return NextResponse.json({
      ok: true,
      atividade: publicada,
    });
  } catch (error: any) {
    console.error(
      "Erro ao publicar atividade acadêmica:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao publicar atividade",
      },
      { status: 500 }
    );
  }
}