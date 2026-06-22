import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
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

  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
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

    const contentType = req.headers.get("content-type") || "";

    let funcionarioId = 0;
    let tipo = "DOCUMENTO_RH";
    let titulo = "";
    let conteudo = "";
    let arquivoUrl = "";
    let templateId: number | null = null;
    let arquivo: File | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();

      funcionarioId = Number(body.funcionarioId);
      tipo = String(body.tipo || "DOCUMENTO_RH").trim();
      titulo = String(body.titulo || "").trim();
      conteudo = String(body.conteudo || "").trim();
      arquivoUrl = String(body.arquivoUrl || "").trim();
      templateId = body.templateId ? Number(body.templateId) : null;
    } else {
      const formData = await req.formData();

      funcionarioId = Number(formData.get("funcionarioId") || 0);
      tipo = String(formData.get("tipo") || "DOCUMENTO_RH").trim();
      titulo = String(formData.get("titulo") || "").trim();
      conteudo = String(formData.get("conteudo") || "").trim();
      arquivoUrl = String(formData.get("arquivoUrl") || "").trim();
      templateId = formData.get("templateId")
        ? Number(formData.get("templateId"))
        : null;
      arquivo = formData.get("arquivo") as File | null;
    }

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

    if (!conteudo && !arquivoUrl && !arquivo) {
      return NextResponse.json(
        { error: "Informe o conteúdo do documento ou anexe um arquivo." },
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

    let urlFinal = arquivoUrl || null;

    if (arquivo && arquivo.size > 0) {
      const extensoesPermitidas = [
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".doc",
        ".docx",
      ];

      const nomeArquivo = arquivo.name.toLowerCase();
      const extensaoValida = extensoesPermitidas.some((ext) =>
        nomeArquivo.endsWith(ext)
      );

      if (!extensaoValida) {
        return NextResponse.json(
          { error: "Formato inválido. Envie PDF, DOCX, PNG, JPG ou JPEG." },
          { status: 400 }
        );
      }

      const tamanhoMaximo = 50 * 1024 * 1024;

      if (arquivo.size > tamanhoMaximo) {
        return NextResponse.json(
          { error: "Arquivo muito grande. O limite é 50MB." },
          { status: 400 }
        );
      }

      const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      const blob = await put(
        `rh/documentos/${user.instituicaoId}/${funcionarioId}/${Date.now()}-${nomeSeguro}`,
        arquivo,
        { access: "public" }
      );

      urlFinal = blob.url;
    }

    const documento = await prisma.documentoRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        templateId,
        tipo,
        titulo,
        conteudo: conteudo || null,
        arquivoUrl: urlFinal,
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
        observacoes: urlFinal
          ? "Documento RH gerado com anexo e preservado para auditoria."
          : "Documento RH gerado e preservado para histórico funcional e auditoria.",
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
