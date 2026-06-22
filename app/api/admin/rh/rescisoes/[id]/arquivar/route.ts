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
      : "Arquivamento realizado pelo Admin.";

    const atualizada = await prisma.$transaction(async (tx) => {
      const rescisaoArquivada = await tx.rescisaoRH.update({
        where: { id },
        data: {
          arquivada: true,
          arquivadaEm: new Date(),
          arquivadaPorId: user.id,
          motivoArquivo: motivo,
        },
      });

      await tx.historicoRH.create({
        data: {
          funcionarioId: rescisao.funcionarioId,
          instituicaoId: user.instituicaoId,
          criadoPorId: user.id,
          tipo: "RESCISAO",
          titulo: "Rescisão arquivada",
          descricao: "Registro de rescisão arquivado.",
          dataEvento: new Date(),
          observacoes: motivo,
        },
      });

      return rescisaoArquivada;
    });

    return NextResponse.json(atualizada);
  } catch (error: any) {
    console.error("Erro ao arquivar rescisão RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao arquivar rescisão RH" },
      { status: 500 }
    );
  }
}