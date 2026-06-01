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

    const usuarios = await prisma.user.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        id: {
          not: user.id,
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
      orderBy: {
  nome: "asc",
},
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao carregar usuários" },
      { status: 500 }
    );
  }
}