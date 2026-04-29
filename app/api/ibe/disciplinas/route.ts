import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const instituicaoId = 1; // IBE

    const disciplinas = await prisma.disciplina.findMany({
      where: {
        instituicaoId,
        ativo: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(disciplinas);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar disciplinas" },
      { status: 500 }
    );
  }
}