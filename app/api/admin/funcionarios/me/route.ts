import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const camposPerfil = {
  nome: true,
  telefone: true,
  cargo: true,
  fotoPerfil: true,
} as const;

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
      select: { id: true, ...camposPerfil },
    });

    if (funcionario) {
      return NextResponse.json(funcionario);
    }

    const perfil = await prisma.perfilAdministrativoUsuario.findUnique({
      where: { userId: user.id },
      select: camposPerfil,
    });

    return NextResponse.json({
      id: null,
      nome: perfil?.nome ?? (user.nome || "Administrador"),
      telefone: perfil ? perfil.telefone : "",
      cargo: perfil ? perfil.cargo : "Administrativo",
      fotoPerfil: perfil?.fotoPerfil ?? null,
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

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true, nome: true, fotoPerfil: true },
    });

    if (funcionario) {
      const atualizado = await prisma.funcionario.update({
        where: { id: funcionario.id },
        data: {
          nome: String(body.nome || funcionario.nome || "Administrador").trim(),
          telefone: body.telefone === undefined ? undefined : body.telefone || null,
          cargo: body.cargo === undefined ? undefined : body.cargo || null,
          fotoPerfil: body.fotoPerfil || funcionario.fotoPerfil || null,
        },
        select: { id: true, ...camposPerfil },
      });
      return NextResponse.json(atualizado);
    }

    const nome = typeof body.nome === "string" && body.nome.trim() ? body.nome.trim() : undefined;
    const telefone = typeof body.telefone === "string" ? body.telefone || null : undefined;
    const cargo = typeof body.cargo === "string" ? body.cargo || null : undefined;
    const fotoPerfil = typeof body.fotoPerfil === "string" && body.fotoPerfil ? body.fotoPerfil : undefined;
    const perfil = await prisma.perfilAdministrativoUsuario.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        nome: nome ?? (user.nome || "Administrador"),
        telefone,
        cargo: cargo ?? "Administrativo",
        fotoPerfil,
      },
      update: { nome, telefone, cargo, fotoPerfil },
      select: camposPerfil,
    });

    return NextResponse.json({ id: null, ...perfil });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
