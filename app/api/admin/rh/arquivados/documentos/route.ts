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

    const documentos = await prisma.documentoRH.findMany({
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
        arquivadaEm: "desc",
      },
    });

    return NextResponse.json(documentos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar documentos arquivados." },
      { status: 500 }
    );
  }
}