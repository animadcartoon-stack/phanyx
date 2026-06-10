import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const rescisoes = await prisma.rescisaoRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivada: true,
      },
      include: {
  funcionario: {
    select: { id: true, nome: true, cargo: true },
  },
  criadoPor: {
    select: { id: true, nome: true, email: true },
  },
  arquivadaPor: {
    select: { id: true, nome: true, email: true },
  },
},
      orderBy: {
        arquivadaEm: "desc",
      },
    });

    return NextResponse.json(rescisoes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar rescisões arquivadas." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const rescisaoId = Number(body.rescisaoId);

    const motivoRestauracao = String(
      body.motivoRestauracao ||
        "Restauração solicitada pelo administrador."
    ).trim();

    if (!rescisaoId) {
      return NextResponse.json(
        { error: "Rescisão inválida." },
        { status: 400 }
      );
    }

    const rescisao = await prisma.rescisaoRH.findFirst({
      where: {
        id: rescisaoId,
        instituicaoId: user.instituicaoId,
        arquivada: true,
      },
    });

    if (!rescisao) {
      return NextResponse.json(
        { error: "Rescisão arquivada não encontrada." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.rescisaoRH.update({
      where: {
        id: rescisao.id,
      },
      data: {
        arquivada: false,
        arquivadaEm: null,
        arquivadaPorId: null,
        motivoArquivo: null,

        restauradoEm: new Date(),
        restauradoPorId: user.id,
        motivoRestauracao,

        status: "ATIVA",
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId: rescisao.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,

        tipo: "RESTAURACAO_RESCISAO_RH",

        titulo: "Rescisão restaurada",

        descricao: motivoRestauracao,

        dataEvento: new Date(),

        observacoes:
          "Registro de rescisão restaurado para registros ativos. A restauração foi registrada para auditoria.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao restaurar rescisão.",
      },
      { status: 500 }
    );
  }
}