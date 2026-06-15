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
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "admin") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const adminGeral =
  String(user.role).toUpperCase() === "ADMIN" ||
  String(user.role).toUpperCase() === "SUPER_ADMIN";

if (adminGeral) {
  // continua normalmente sem exigir permissão setorial
} else {
  return NextResponse.json(
    { error: "Você não tem permissão para acessar publicações acadêmicas." },
    { status: 403 }
  );
}

    const permissoes = await prisma.departamentoPermissao.findMany({
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
          in: ["*", "academico.publicacoes.gerenciar"],
        },
        ativo: true,
      },
      select: {
        chave: true,
      },
    });

    const temAcesso =
      permissoes.some((p) => p.chave === "*") ||
      permissoes.some((p) => p.chave === "academico.publicacoes.gerenciar");

    if (!temAcesso) {
      return NextResponse.json(
        { error: "Você não tem permissão para devolver atividades." },
        { status: 403 }
      );
    }

    const atividadeId = Number(params.atividadeId);

    if (!Number.isFinite(atividadeId) || atividadeId <= 0) {
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
            "Apenas atividades aguardando publicação podem ser devolvidas.",
        },
        { status: 400 }
      );
    }

    const devolvida = await prisma.atividade.update({
      where: {
        id: atividade.id,
      },
      data: {
        status: "RASCUNHO",
        publicadoPorId: null,
        publicadoPeloApoioDocenteEm: null,
      },
      select: {
        id: true,
        titulo: true,
        status: true,
      },
    });

    return NextResponse.json({
      ok: true,
      atividade: devolvida,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao devolver atividade" },
      { status: 500 }
    );
  }
}