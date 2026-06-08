import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { error: "Holerite inválido." },
        { status: 400 }
      );
    }

    const holerite = await prisma.holeriteRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!holerite) {
      return NextResponse.json(
        { error: "Holerite não encontrado." },
        { status: 404 }
      );
    }

    await prisma.holeriteRH.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Holerite excluído com sucesso.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao excluir holerite." },
      { status: 500 }
    );
  }
}