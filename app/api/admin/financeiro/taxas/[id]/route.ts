import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function serializeTaxa(taxa: {
  id: number;
  instituicaoId: number;
  nome: string;
  descricao: string | null;
  categoria: string;
  valor: any;
  ativa: boolean;
  exigeVencimento: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...taxa,
    valor: Number(taxa.valor),
  };
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await context.params;
    const taxaId = Number(id);

    if (!Number.isFinite(taxaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const existente = await prisma.taxaAvulsa.findFirst({
      where: {
        id: taxaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Taxa não encontrada" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const descricao = body.descricao ? String(body.descricao).trim() : null;
    const categoria = String(body.categoria || "PERSONALIZADA").trim().toUpperCase();
    const valor = toNumber(body.valor);
    const ativa = Boolean(body.ativa);
    const exigeVencimento = Boolean(body.exigeVencimento);

    if (!nome) {
      return NextResponse.json(
        { error: "Nome da taxa é obrigatório" },
        { status: 400 }
      );
    }

    if (valor < 0) {
      return NextResponse.json(
        { error: "Valor da taxa inválido" },
        { status: 400 }
      );
    }

    const taxa = await prisma.taxaAvulsa.update({
      where: {
        id: taxaId,
      },
      data: {
        nome,
        descricao,
        categoria,
        valor,
        ativa,
        exigeVencimento,
      },
    });

    return NextResponse.json({
      message: "Taxa atualizada com sucesso",
      data: serializeTaxa(taxa),
    });
  } catch (error) {
    console.error("Erro ao atualizar taxa avulsa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar taxa avulsa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = await context.params;
    const taxaId = Number(id);

    if (!Number.isFinite(taxaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const existente = await prisma.taxaAvulsa.findFirst({
      where: {
        id: taxaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Taxa não encontrada" },
        { status: 404 }
      );
    }

    await prisma.taxaAvulsa.delete({
      where: {
        id: taxaId,
      },
    });

    return NextResponse.json({
      message: "Taxa removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover taxa avulsa:", error);
    return NextResponse.json(
      { error: "Erro ao remover taxa avulsa" },
      { status: 500 }
    );
  }
}