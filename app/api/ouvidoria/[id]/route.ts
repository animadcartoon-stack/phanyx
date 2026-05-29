import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const id = Number(ctx.params.id);

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    const status = body.status ? String(body.status) : undefined;
    const resposta = body.resposta ? String(body.resposta) : undefined;

    const atualizado = await prisma.ouvidoria.updateMany({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      data: {
        ...(status ? { status } : {}),
        ...(resposta
          ? {
              resposta,
              respondidoEm: new Date(),
              status: "RESOLVIDO",
            }
          : {}),
      },
    });

    if (atualizado.count === 0) {
      return NextResponse.json(
        { error: "Manifestação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao atualizar ouvidoria:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar manifestação" },
      { status: 500 }
    );
  }
}