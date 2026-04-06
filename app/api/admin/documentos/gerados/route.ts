import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const documentos = await prisma.documentoGerado.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        aluno: true,
        matricula: true,
        template: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
      take: 100,
    });

    return NextResponse.json(documentos);
  } catch (error: any) {
    console.error("Erro ao listar documentos gerados:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar documentos gerados" },
      { status: 500 }
    );
  }
}