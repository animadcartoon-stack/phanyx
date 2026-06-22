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
      return NextResponse.json({ error: "Rescisão inválida." }, { status: 400 });
    }

    const rescisao = await prisma.rescisaoRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!rescisao) {
      return NextResponse.json(
        { error: "Rescisão não encontrada." },
        { status: 404 }
      );
    }

    const motivo = body?.motivo
      ? String(body.motivo).trim()
      : "Cancelamento realizado pelo Admin.";

    const atualizada = await prisma.$transaction(async (tx) => {
      const rescisaoCancelada = await tx.rescisaoRH.update({
        where: { id },
        data: {
          cancelada: true,
          canceladaEm: new Date(),
          canceladaPorId: user.id,
          motivoCancelamento: motivo,
          status: "CANCELADA",
        },
      });

      await tx.historicoRH.create({
        data: {
          funcionarioId: rescisao.funcionarioId,
          instituicaoId: user.instituicaoId,
          criadoPorId: user.id,
          tipo: "RESCISAO",
          titulo: "Rescisão cancelada",
          descricao: "Registro de rescisão cancelado.",
          dataEvento: new Date(),
          observacoes: motivo,
        },
      });

      return rescisaoCancelada;
    });

    return NextResponse.json(atualizada);
  } catch (error: any) {
    console.error("Erro ao cancelar rescisão RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao cancelar rescisão RH" },
      { status: 500 }
    );
  }
}