import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // usuário do aluno teste (id 3)
    const userId = 3;

    // verifica se já existe aluno
    let aluno = await prisma.aluno.findFirst({
      where: { userId },
    });

    if (!aluno) {
      aluno = await prisma.aluno.create({
        data: {
          nome: "Aluno Teste",
          userId: userId,
          instituicaoId: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      aluno,
    });
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
    });
  }
}