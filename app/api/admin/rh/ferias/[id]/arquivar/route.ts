import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);
    const body = await req.json().catch(() => ({}));

    if (!id) {
      return NextResponse.json({ error: "Férias inválida." }, { status: 400 });
    }

    const ferias = await prisma.feriasRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!ferias) {
      return NextResponse.json(
        { error: "Férias não encontrada." },
        { status: 404 }
      );
    }

    const atualizada = await prisma.feriasRH.update({
      where: { id },
      data: {
        arquivada: true,
        arquivadaEm: new Date(),
        arquivadaPorId: user.id,
        motivoArquivo: body?.motivo
          ? String(body.motivo).trim()
          : "Arquivamento realizado pelo Admin.",
      },
    });

    return NextResponse.json(atualizada);
  } catch (error: any) {
    console.error("Erro ao arquivar férias RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao arquivar férias RH" },
      { status: 500 }
    );
  }
}