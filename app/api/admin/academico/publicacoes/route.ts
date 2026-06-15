import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
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

if (!adminGeral) {
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
        in: [
          "*",
          "academico.publicacoes.ver",
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
    permissoes.some((p) => p.chave === "academico.publicacoes.ver") ||
    permissoes.some((p) => p.chave === "academico.publicacoes.gerenciar");

  if (!temAcesso) {
    return NextResponse.json(
      { error: "Você não tem permissão para acessar publicações acadêmicas." },
      { status: 403 }
    );
  }
}

    const atividades = await prisma.atividade.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        status: "AGUARDANDO_PUBLICACAO",
      },
      orderBy: {
        enviadoParaApoioDocenteEm: "desc",
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        prazo: true,
        notaMaxima: true,
        status: true,
        enviadoParaApoioDocenteEm: true,
        createdAt: true,
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
        disciplina: {
          select: {
            id: true,
            nome: true,
          },
        },
        professorResponsavel: {
          select: {
            id: true,
            nome: true,
          },
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        anexos: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            titulo: true,
            url: true,
            arquivoNome: true,
            mimeType: true,
            tamanho: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      atividades,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar publicações" },
      { status: 500 }
    );
  }
}