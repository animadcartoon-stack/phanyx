import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function isAdmin(role: unknown) {
  const r = String(role || "").toUpperCase();
  return r === "ADMIN" || r === "SUPER_ADMIN";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const atividadeId = Number(body?.atividadeId);
    const url = String(body?.url || "").trim();
    const arquivoNome = String(body?.arquivoNome || "").trim();
    const mimeType = body?.mimeType ? String(body.mimeType) : null;
    const tamanho =
      body?.tamanho !== undefined && body?.tamanho !== null
        ? Number(body.tamanho)
        : null;

    if (!atividadeId || !Number.isFinite(atividadeId)) {
      return NextResponse.json({ error: "Atividade inválida" }, { status: 400 });
    }

    if (!url) {
      return NextResponse.json({ error: "URL do arquivo é obrigatória" }, { status: 400 });
    }

    const atividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!atividade) {
      return NextResponse.json({ error: "Atividade não encontrada" }, { status: 404 });
    }

    const anexo = await prisma.atividadeAnexo.create({
      data: {
        atividadeId,
        instituicaoId: user.instituicaoId,
        criadoPorId: user.id,
        titulo: arquivoNome || "Arquivo da publicação",
        url,
        arquivoNome: arquivoNome || null,
        mimeType,
        tamanho:
          tamanho !== null && Number.isFinite(tamanho)
            ? Math.min(tamanho, 2147483647)
            : null,
      },
      select: {
        id: true,
        titulo: true,
        url: true,
        arquivoNome: true,
      },
    });

    return NextResponse.json({ ok: true, anexo }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao registrar anexo" },
      { status: 500 }
    );
  }
}