import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getId(params: { id: string }) {
  return Number(params.id);
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = getId(params);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const template = await prisma.documentoTemplate.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Erro ao buscar template:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar template" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = getId(params);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const existente = await prisma.documentoTemplate.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const nome =
      body?.nome !== undefined ? String(body.nome || "").trim() : undefined;
    const descricao =
      body?.descricao !== undefined
        ? body.descricao
          ? String(body.descricao).trim()
          : null
        : undefined;
    const tipo =
      body?.tipo !== undefined ? String(body.tipo || "").trim() : undefined;
    const contexto =
      body?.contexto !== undefined
        ? body.contexto
          ? String(body.contexto).trim()
          : null
        : undefined;
    const conteudo =
      body?.conteudo !== undefined
        ? String(body.conteudo || "").trim()
        : undefined;
    const ativo =
      body?.ativo !== undefined ? Boolean(body.ativo) : undefined;
    const exigeAssinatura =
      body?.exigeAssinatura !== undefined
        ? Boolean(body.exigeAssinatura)
        : undefined;

    const atualizado = await prisma.documentoTemplate.update({
      where: { id },
      data: {
        ...(nome !== undefined ? { nome } : {}),
        ...(descricao !== undefined ? { descricao } : {}),
        ...(tipo !== undefined ? { tipo: tipo as any } : {}),
        ...(contexto !== undefined ? { contexto } : {}),
        ...(conteudo !== undefined ? { conteudo } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
        ...(exigeAssinatura !== undefined
          ? { exigeAssinatura }
          : {}),
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    console.error("Erro ao atualizar template:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = getId(params);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const existente = await prisma.documentoTemplate.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    await prisma.documentoTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Erro ao excluir template:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao excluir template" },
      { status: 500 }
    );
  }
}