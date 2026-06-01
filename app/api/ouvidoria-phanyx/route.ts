import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();

    const tipo = String(body.tipo || "").trim();
    const titulo = String(body.titulo || "").trim();
    const mensagem = String(body.mensagem || "").trim();
    const prioridade = String(body.prioridade || "NORMAL").trim();

    if (!tipo || !mensagem) {
      return NextResponse.json(
        { error: "Tipo e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const registro = await prisma.ouvidoriaPhanyx.create({
      data: {
        instituicaoId: user.instituicaoId,
        usuarioId: user.id,
        tipo,
        titulo,
        mensagem,
        prioridade,
        status: "ABERTO",
      },
    });

    return NextResponse.json({ ok: true, registro });
  } catch (error) {
    console.error("Erro ao criar ouvidoria PHANYX:", error);

    return NextResponse.json(
      { error: "Erro ao enviar manifestação para o PHANYX" },
      { status: 500 }
    );
  }
}