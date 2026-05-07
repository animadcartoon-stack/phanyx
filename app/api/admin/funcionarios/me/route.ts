import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        telefone: true,
        cargo: true,
        fotoPerfil: true,
      },
    });

    if (funcionario) {
      return NextResponse.json(funcionario);
    }

    return NextResponse.json({
      id: null,
      nome: user.nome || "Administrador",
      telefone: "",
      cargo: "Administrativo",
      fotoPerfil: null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar perfil" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();

    let funcionario = await prisma.funcionario.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!funcionario) {
      funcionario = await prisma.funcionario.create({
        data: {
          nome: String(body.nome || user.nome || "Administrador").trim(),
          telefone: body.telefone || null,
          cargo: body.cargo || "Administrativo",
          fotoPerfil: body.fotoPerfil || null,
          userId: user.id,
          instituicaoId: user.instituicaoId!,
        },
      });
    } else {
      funcionario = await prisma.funcionario.update({
        where: { id: funcionario.id },
        data: {
          nome: String(body.nome || funcionario.nome || "Administrador").trim(),
          telefone: body.telefone || null,
          cargo: body.cargo || null,
          fotoPerfil: body.fotoPerfil || funcionario.fotoPerfil || null,
        },
      });
    }

    return NextResponse.json({
      id: funcionario.id,
      nome: funcionario.nome,
      telefone: funcionario.telefone,
      cargo: funcionario.cargo,
      fotoPerfil: funcionario.fotoPerfil,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}