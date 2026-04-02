import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contratoId = Number(params.id);

    if (!Number.isFinite(contratoId) || contratoId <= 0) {
      return NextResponse.json({ error: "Contrato inválido" }, { status: 400 });
    }

    const contrato = await prisma.contrato.findUnique({
      where: {
        id: contratoId,
      },
      include: {
        aluno: true,
        assinatura: true,
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: contrato.id,
      status: contrato.status,
      conteudo: contrato.conteudo,
      aluno: {
        id: contrato.aluno.id,
        nome: contrato.aluno.nome,
      },
      assinatura: contrato.assinatura,
    });
  } catch (error: any) {
    console.error("Erro ao carregar contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar contrato" },
      { status: 500 }
    );
  }
}