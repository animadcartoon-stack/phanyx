import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const presenca = await prisma.chatPresenca.findUnique({
      where: {
        usuarioId: user.id,
      },
    });

    return NextResponse.json({
      status: presenca?.status || "OFFLINE",
      ultimaAtividade: presenca?.ultimaAtividade || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Erro ao consultar presença",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const status =
      body?.status === "AUSENTE"
        ? "AUSENTE"
        : body?.status === "OFFLINE"
        ? "OFFLINE"
        : "ONLINE";

    const presenca = await prisma.chatPresenca.upsert({
      where: {
        usuarioId: user.id,
      },
      update: {
        status,
        ultimaAtividade: new Date(),
      },
      create: {
        usuarioId: user.id,
        instituicaoId: user.instituicaoId,
        status,
        ultimaAtividade: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      presenca,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Erro ao atualizar presença",
      },
      { status: 500 }
    );
  }
}