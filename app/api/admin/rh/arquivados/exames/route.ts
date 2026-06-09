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

    const exames = await prisma.exameMedicoRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: true,
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
        arquivadoEm: "desc",
      },
    });

    return NextResponse.json(exames);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar exames arquivados." },
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

    const exameId = Number(body.exameId);
    const motivoRestauracao = String(
      body.motivoRestauracao || "Restauração solicitada pelo administrador."
    ).trim();

    if (!exameId) {
      return NextResponse.json(
        { error: "Exame inválido." },
        { status: 400 }
      );
    }

    const exame = await prisma.exameMedicoRH.findFirst({
      where: {
        id: exameId,
        instituicaoId: user.instituicaoId,
        arquivado: true,
      },
    });

    if (!exame) {
      return NextResponse.json(
        { error: "Exame arquivado não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.exameMedicoRH.update({
      where: {
        id: exame.id,
      },
      data: {
        arquivado: false,
        arquivadoEm: null,
        arquivadoPorId: null,
        motivoArquivo: null,
        restauradoEm: new Date(),
        restauradoPorId: user.id,
        motivoRestauracao,
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId: exame.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "RESTAURACAO_EXAME_RH",
        titulo: "Exame médico restaurado",
        descricao: motivoRestauracao,
        dataEvento: new Date(),
        observacoes:
          "Exame médico restaurado para registros ativos. A restauração foi registrada para auditoria.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao restaurar exame." },
      { status: 500 }
    );
  }
}