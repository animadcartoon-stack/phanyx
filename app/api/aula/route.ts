import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { titulo, videoUrl, disciplinaId } = body;

const aula = await prisma.aula.create({
  data: {
    titulo,
    video: videoUrl,  // ✅ aqui está a correção
    disciplinaId: Number(disciplinaId),
  },
});

    return NextResponse.json(aula);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar aula" },
      { status: 500 }
    );
  }
}