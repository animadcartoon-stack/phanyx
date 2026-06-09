import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const documentos = await prisma.documentoRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: false,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return NextResponse.json(documentos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar documentos RH." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();

    const funcionarioId = Number(body.funcionarioId);
    const tipo = String(body.tipo || "DOCUMENTO_RH").trim();
    const titulo = String(body.titulo || "").trim();
    const conteudo = String(body.conteudo || "").trim();
    const templateId = body.templateId ? Number(body.templateId) : null;

    if (!funcionarioId) {
      return NextResponse.json(
        { error: "Selecione o funcionário." },
        { status: 400 }
      );
    }

    if (!titulo) {
      return NextResponse.json(
        { error: "Informe o título do documento." },
        { status: 400 }
      );
    }

    if (!conteudo) {
      return NextResponse.json(
        { error: "Informe o conteúdo do documento." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const documento = await prisma.documentoRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        templateId,
        tipo,
        titulo,
        conteudo,
        status: "GERADO",
        arquivado: false,
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "GERACAO_DOCUMENTO_RH",
        titulo: "Documento RH gerado",
        descricao: titulo,
        dataEvento: new Date(),
        observacoes:
          "Documento RH gerado e preservado para histórico funcional e auditoria.",
      },
    });

    return NextResponse.json(documento);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar documento RH." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const documentoId = Number(body.documentoId);
    const motivoArquivo = String(body.motivoArquivo || "").trim();

    if (!documentoId) {
      return NextResponse.json({ error: "Informe o documento." }, { status: 400 });
    }

    if (!motivoArquivo) {
      return NextResponse.json(
        { error: "Informe o motivo do arquivamento." },
        { status: 400 }
      );
    }

    const documento = await prisma.documentoRH.findFirst({
      where: {
        id: documentoId,
        instituicaoId: user.instituicaoId,
        arquivado: false,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.documentoRH.update({
      where: { id: documento.id },
      data: {
        arquivado: true,
        arquivadoEm: new Date(),
        arquivadoPorId: user.id,
        motivoArquivo,
        status: "ARQUIVADO",
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId: documento.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "ARQUIVAMENTO_DOCUMENTO_RH",
        titulo: "Documento RH arquivado",
        descricao: motivoArquivo,
        dataEvento: new Date(),
        observacoes:
          "Documento RH arquivado sem exclusão física. Registro mantido para auditoria.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao arquivar documento RH." },
      { status: 500 }
    );
  }
}