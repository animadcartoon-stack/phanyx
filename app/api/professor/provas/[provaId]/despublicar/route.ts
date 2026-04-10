import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const provaId = Number(params.provaId);

    const prova = await prisma.prova.findFirst({
      where: {
        id: provaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!prova) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.prova.update({
      where: { id: provaId },
      data: {
        ativa: false,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao despublicar prova" },
      { status: 500 }
    );
  }
}