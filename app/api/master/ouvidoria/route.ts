import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    const podeAcessar =
      user?.role === "SUPER_ADMIN" || Boolean((user as any)?.isMasterAdmin);

    if (!user || !podeAcessar) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const registros = await prisma.ouvidoriaPhanyx.findMany({
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        instituicao: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ registros });
  } catch (error) {
    console.error("Erro ao listar ouvidoria PHANYX:", error);

    return NextResponse.json(
      { error: "Erro ao listar manifestações PHANYX" },
      { status: 500 }
    );
  }
}