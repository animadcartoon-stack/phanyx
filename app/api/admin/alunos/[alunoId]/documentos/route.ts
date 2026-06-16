import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export async function GET(
  req: NextRequest,
  context: { params: { alunoId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const alunoId = Number(context.params.alunoId);

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const documentos = await prisma.documentoAluno.findMany({
      where: {
  alunoId,
  instituicaoId: user.instituicaoId!,
  arquivado: false,
},
      orderBy: {
        criadoEm: "desc",
      },
    });

    return NextResponse.json(documentos);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao buscar documentos." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: { alunoId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const alunoId = Number(context.params.alunoId);

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const titulo = String(formData.get("titulo") || "").trim();
    const tipo = String(formData.get("tipo") || "").trim();
    const proprietario = String(formData.get("proprietario") || "ALUNO").trim();
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
      `alunos/${user.instituicaoId}/${alunoId}/documentos/${Date.now()}-${nomeSeguro}`,
      arquivo,
      {
        access: "public",
      }
    );

    const documento = await prisma.documentoAluno.create({
      data: {
        alunoId,
        instituicaoId: user.instituicaoId!,
        titulo,
        tipo: tipo as any,
        proprietario,
        arquivoUrl: blob.url,
        arquivoNome: arquivo.name,
        mimeType: arquivo.type,
        tamanho: arquivo.size,
      },
    });

    return NextResponse.json(documento);
  } catch (error) {
    console.error("ERRO AO ENVIAR DOCUMENTO DO ALUNO:", error);

    return NextResponse.json(
      { error: "Erro ao enviar documento." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { alunoId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const alunoId = Number(context.params.alunoId);
    const body = await req.json();

    const documentoId = Number(body.documentoId);
    const motivo = String(body.motivo || "").trim();

    if (!documentoId) {
      return NextResponse.json(
        { error: "Documento inválido." },
        { status: 400 }
      );
    }

    const documento = await prisma.documentoAluno.findFirst({
      where: {
        id: documentoId,
        alunoId,
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

    const atualizado = await prisma.documentoAluno.update({
      where: { id: documentoId },
      data: {
        arquivado: true,
        arquivadoEm: new Date(),
        arquivadoPorId: user.id,
        motivoArquivamento: motivo || "Arquivado pelo administrador.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("ERRO AO ARQUIVAR DOCUMENTO DO ALUNO:", error);

    return NextResponse.json(
      { error: "Erro ao arquivar documento." },
      { status: 500 }
    );
  }
}