import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const aulaId = Number(searchParams.get("aulaId"));

    if (!aulaId) {
      return NextResponse.json(
        { error: "aulaId é obrigatório" },
        { status: 400 }
      );
    }

    const materiais = await prisma.materialAula.findMany({
      where: {
        aulaId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(materiais);
  } catch (error) {
    console.error("Erro ao buscar materiais:", error);

    return NextResponse.json(
      { error: "Erro ao buscar materiais" },
      { status: 500 }
    );
  }
}