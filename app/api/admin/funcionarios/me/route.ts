import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        nome: true,
        fotoPerfil: true,
      },
    });

    return NextResponse.json(funcionario || {});
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar funcionário" },
      { status: 500 }
    );
  }
}