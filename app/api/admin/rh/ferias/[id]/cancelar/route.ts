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
        cancelada: true,
        canceladaEm: new Date(),
        canceladaPorId: user.id,
        motivoCancelamento: body?.motivo
          ? String(body.motivo).trim()
          : "Cancelamento realizado pelo Admin.",
        status: "CANCELADA",
      },
    });

    return NextResponse.json(atualizada);
  } catch (error: any) {
    console.error("Erro ao cancelar férias RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao cancelar férias RH" },
      { status: 500 }
    );
  }
}