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

    const holerites = await prisma.holeriteRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: true,
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
        arquivadoEm: "desc",
      },
    });

    return NextResponse.json(holerites);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar holerites arquivados." },
      { status: 500 }
    );
  }
}