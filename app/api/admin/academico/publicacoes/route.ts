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