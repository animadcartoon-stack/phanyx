import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        nome: true,
        fotoPerfil: true,
      },
    });

    return NextResponse.json(funcionario || {});
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar funcionário" },
      { status: 500 }
    );
  }
}
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

    const funcionarioExistente = await prisma.funcionario.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!funcionarioExistente) {
      const usuarioAtualizado = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          nome: String(body.nome || "").trim(),
        },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      });

      return NextResponse.json(usuarioAtualizado);
    }

    const funcionario = await prisma.funcionario.update({
      where: {
        id: funcionarioExistente.id,
      },
      data: {
        nome: body.nome,
        telefone: body.telefone,
        cargo: body.cargo,
        fotoPerfil: body.fotoPerfil || null,
      },
      select: {
        id: true,
        nome: true,
        telefone: true,
        cargo: true,
        fotoPerfil: true,
      },
    });

    return NextResponse.json(funcionario);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}