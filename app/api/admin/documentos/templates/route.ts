import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const templates = await prisma.documentoTemplate.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: [{ ativo: "desc" }, { tipo: "asc" }, { nome: "asc" }],
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("Erro ao listar templates:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar templates" },
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

    const nome = String(body?.nome || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const tipo = String(body?.tipo || "").trim();
    const contexto = body?.contexto ? String(body.contexto).trim() : null;
    const conteudo = String(body?.conteudo || "").trim();
    const ativo = Boolean(body?.ativo ?? true);
    const exigeAssinatura = Boolean(body?.exigeAssinatura ?? false);

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo é obrigatório" },
        { status: 400 }
      );
    }

    if (!conteudo) {
      return NextResponse.json(
        { error: "Conteúdo do template é obrigatório" },
        { status: 400 }
      );
    }

    const template = await prisma.documentoTemplate.create({
      data: {
        nome,
        descricao,
        tipo: tipo as any,
        contexto,
        conteudo,
        ativo,
        exigeAssinatura,
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar template:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar template" },
      { status: 500 }
    );
  }
}