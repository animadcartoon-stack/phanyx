import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const notificacoes = await prisma.notificacao.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: [{ lida: "asc" }, { criadoEm: "desc" }],
      take: 100,
    });

    return NextResponse.json(notificacoes);
  } catch (error: any) {
    console.error("Erro ao listar notificações:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar notificações" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const tipo = String(body?.tipo || "").trim();
    const titulo = String(body?.titulo || "").trim();

    if (!tipo || !titulo) {
      return NextResponse.json(
        { error: "Tipo e título são obrigatórios." },
        { status: 400 }
      );
    }

    const notificacao = await prisma.notificacao.create({
      data: {
        instituicaoId: user.instituicaoId,
        usuarioId: body?.usuarioId ? Number(body.usuarioId) : null,
        tipo,
        categoria: body?.categoria ? String(body.categoria) : "SISTEMA",
        titulo,
        descricao: body?.descricao ? String(body.descricao) : null,
        link: body?.link ? String(body.link) : null,
        quantidade: Number(body?.quantidade || 1),
        chaveAgrupada: body?.chaveAgrupada
          ? String(body.chaveAgrupada)
          : null,
        lida: false,
      },
    });

    return NextResponse.json(notificacao, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar notificação:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar notificação" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body?.id || 0);

    if (!id) {
      return NextResponse.json(
        { error: "ID da notificação é obrigatório." },
        { status: 400 }
      );
    }

    const existente = await prisma.notificacao.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Notificação não encontrada." },
        { status: 404 }
      );
    }

    const atualizada = await prisma.notificacao.update({
      where: { id },
      data: {
        lida: Boolean(body?.lida ?? true),
      },
    });

    return NextResponse.json(atualizada);
  } catch (error: any) {
    console.error("Erro ao atualizar notificação:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar notificação" },
      { status: 500 }
    );
  }
}