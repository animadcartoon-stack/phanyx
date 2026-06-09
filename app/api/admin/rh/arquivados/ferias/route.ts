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

    const ferias = await prisma.feriasRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivada: true,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
          },
        },
      },
      orderBy: {
        arquivadaEm: "desc",
      },
    });

    return NextResponse.json(ferias);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar férias arquivadas." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();

    const feriasId = Number(body.feriasId);
    const motivoRestauracao = String(
      body.motivoRestauracao || "Restauração solicitada pelo administrador."
    ).trim();

    if (!feriasId) {
      return NextResponse.json(
        { error: "Registro de férias inválido." },
        { status: 400 }
      );
    }

    const ferias = await prisma.feriasRH.findFirst({
      where: {
        id: feriasId,
        instituicaoId: user.instituicaoId,
        arquivada: true,
      },
    });

    if (!ferias) {
      return NextResponse.json(
        { error: "Férias arquivadas não encontradas." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.feriasRH.update({
      where: {
        id: ferias.id,
      },
      data: {
        arquivada: false,
        arquivadaEm: null,
        arquivadaPorId: null,
        motivoArquivo: null,
        restauradoEm: new Date(),
        restauradoPorId: user.id,
        motivoRestauracao,
        status: "PROGRAMADA",
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId: ferias.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "RESTAURACAO_FERIAS_RH",
        titulo: "Férias restauradas",
        descricao: motivoRestauracao,
        dataEvento: new Date(),
        observacoes:
          "Registro de férias restaurado para registros ativos. A restauração foi registrada para auditoria.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao restaurar férias." },
      { status: 500 }
    );
  }
}