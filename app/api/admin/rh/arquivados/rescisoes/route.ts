import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const rescisoes = await prisma.rescisaoRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivada: true,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
          },
        },
      },
      orderBy: {
        arquivadaEm: "desc",
      },
    });

    return NextResponse.json(rescisoes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar rescisões arquivadas." },
      { status: 500 }
    );
  }
}