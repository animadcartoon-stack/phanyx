import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const fotoPerfil = String(body?.fotoPerfil || "").trim();

    if (!fotoPerfil) {
      return NextResponse.json(
        { error: "URL da foto obrigatória." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.funcionario.update({
      where: {
        id: funcionario.id,
      },
      data: {
        fotoPerfil,
      },
      select: {
        id: true,
        nome: true,
        fotoPerfil: true,
      },
    });

    return NextResponse.json({
      funcionario: atualizado,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Erro ao salvar foto.",
      },
      { status: 500 }
    );
  }
}