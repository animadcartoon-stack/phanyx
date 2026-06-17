import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const funcionarioId = Number(context.params.id);

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    const documentos = await prisma.documentoRH.findMany({
      where: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        arquivado: false,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return NextResponse.json(documentos);
  } catch (error) {
    console.error("ERRO AO BUSCAR DOCUMENTOS DO FUNCIONÁRIO:", error);

    return NextResponse.json(
      { error: "Erro ao buscar documentos." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const funcionarioId = Number(context.params.id);

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const titulo = String(formData.get("titulo") || "").trim();
    const tipo = String(formData.get("tipo") || "").trim();
    const arquivo = formData.get("arquivo") as File | null;

    if (!titulo || !tipo || !arquivo) {
      return NextResponse.json(
        { error: "Título, tipo e arquivo são obrigatórios." },
        { status: 400 }
      );
    }

    const tiposPermitidos = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Envie PDF, PNG, JPG ou JPEG." },
        { status: 400 }
      );
    }

    const tamanhoMaximo = 10 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
      return NextResponse.json(
        { error: "Arquivo muito grande. O limite é 10MB." },
        { status: 400 }
      );
    }

    const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const blob = await put(
      `funcionarios/${user.instituicaoId}/${funcionarioId}/documentos/${Date.now()}-${nomeSeguro}`,
      arquivo,
      {
        access: "public",
      }
    );

    const documento = await prisma.documentoRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        titulo,
        tipo,
        status: "GERADO",
        arquivoUrl: blob.url,
      },
    });

    return NextResponse.json(documento);
  } catch (error) {
    console.error("ERRO AO ENVIAR DOCUMENTO DO FUNCIONÁRIO:", error);

    return NextResponse.json(
      { error: "Erro ao enviar documento." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const funcionarioId = Number(context.params.id);
    const body = await req.json();

    const documentoId = Number(body.documentoId);
    const motivo = String(body.motivo || "").trim();

    if (!documentoId) {
      return NextResponse.json(
        { error: "Documento inválido." },
        { status: 400 }
      );
    }

    const documento = await prisma.documentoRH.findFirst({
      where: {
        id: documentoId,
        funcionarioId,
        instituicaoId: user.instituicaoId!,
      },
      select: { id: true },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.documentoRH.update({
      where: { id: documentoId },
      data: {
        arquivado: true,
        arquivadoEm: new Date(),
        arquivadoPorId: user.id,
        motivoArquivo: motivo || "Arquivado pelo administrador.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("ERRO AO ARQUIVAR DOCUMENTO DO FUNCIONÁRIO:", error);

    return NextResponse.json(
      { error: "Erro ao arquivar documento." },
      { status: 500 }
    );
  }
}