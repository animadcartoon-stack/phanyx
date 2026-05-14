import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

async function validarAulaDoProfessor(aulaId: number) {
  const user = await getUserFromToken();

  if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
    return { erro: "Sem permissão", status: 403 as const };
  }

  const professor = await prisma.professor.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
    select: { id: true },
  });

  if (!professor) {
    return { erro: "Professor não encontrado", status: 404 as const };
  }

  const aula = await prisma.aula.findFirst({
    where: {
      id: aulaId,
      instituicaoId: user.instituicaoId,
      disciplina: {
        OR: [
          { professorId: professor.id },
          {
            professoresHabilitados: {
              some: { professorId: professor.id },
            },
          },
        ],
      },
    },
    select: { id: true, instituicaoId: true },
  });

  if (!aula) {
    return { erro: "Aula não encontrada ou sem acesso", status: 404 as const };
  }

  return { user, professor, aula };
}

export async function GET(
  _req: Request,
  { params }: { params: { aulaId: string } }
) {
  try {
    const aulaId = Number(params.aulaId);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "aulaId inválido" }, { status: 400 });
    }

    const validacao = await validarAulaDoProfessor(aulaId);

    if ("erro" in validacao) {
      return NextResponse.json(
        { error: validacao.erro },
        { status: validacao.status }
      );
    }

    const materiais = await prisma.materialAula.findMany({
      where: {
        aulaId,
        instituicaoId: validacao.user.instituicaoId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(materiais);
  } catch (e: any) {
    console.error("ERRO AO LISTAR MATERIAIS DA AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar materiais da aula" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { aulaId: string } }
) {
  try {
    const aulaId = Number(params.aulaId);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "aulaId inválido" }, { status: 400 });
    }

    const validacao = await validarAulaDoProfessor(aulaId);

    if ("erro" in validacao) {
      return NextResponse.json(
        { error: validacao.erro },
        { status: validacao.status }
      );
    }

    const body = await req.json();

    const tipo = String(body?.tipo || "").trim().toUpperCase();
    const titulo = String(body?.titulo || "").trim();

    if (!titulo) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    if (!["ARQUIVO", "PDF", "DOC", "PPT", "LINK", "VIDEO"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de material inválido" },
        { status: 400 }
      );
    }

    const url = body?.url ? String(body.url).trim() : null;

    if (!url) {
      return NextResponse.json(
        { error: "URL ou arquivo é obrigatório" },
        { status: 400 }
      );
    }

    const material = await prisma.materialAula.create({
      data: {
        aulaId,
        instituicaoId: validacao.user.instituicaoId,
        tipo: tipo as any,
        titulo,
        url,
        arquivoNome: body?.arquivoNome || null,
        mimeType: body?.mimeType || null,
        tamanho: body?.tamanho ? Number(body.tamanho) : null,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (e: any) {
    console.error("ERRO AO CRIAR MATERIAL DA AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao criar material da aula" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { aulaId: string } }
) {
  try {
    const aulaId = Number(params.aulaId);
    const body = await req.json();
    const materialId = Number(body?.materialId);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "aulaId inválido" }, { status: 400 });
    }

    if (!Number.isFinite(materialId) || materialId <= 0) {
      return NextResponse.json({ error: "materialId inválido" }, { status: 400 });
    }

    const validacao = await validarAulaDoProfessor(aulaId);

    if ("erro" in validacao) {
      return NextResponse.json(
        { error: validacao.erro },
        { status: validacao.status }
      );
    }

    const material = await prisma.materialAula.findFirst({
      where: {
        id: materialId,
        aulaId,
        instituicaoId: validacao.user.instituicaoId,
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material não encontrado ou sem acesso" },
        { status: 404 }
      );
    }

    const atualizado = await prisma.materialAula.update({
      where: { id: material.id },
      data: {
        titulo: body?.titulo ? String(body.titulo).trim() : material.titulo,
        url: body?.url ? String(body.url).trim() : material.url,
      },
    });

    return NextResponse.json(atualizado);
  } catch (e: any) {
    console.error("ERRO AO EDITAR MATERIAL DA AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao editar material da aula" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { aulaId: string } }
) {
  try {
    const aulaId = Number(params.aulaId);
    const body = await req.json();
    const materialId = Number(body?.materialId);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "aulaId inválido" }, { status: 400 });
    }

    if (!Number.isFinite(materialId) || materialId <= 0) {
      return NextResponse.json({ error: "materialId inválido" }, { status: 400 });
    }

    const validacao = await validarAulaDoProfessor(aulaId);

    if ("erro" in validacao) {
      return NextResponse.json(
        { error: validacao.erro },
        { status: validacao.status }
      );
    }

    const material = await prisma.materialAula.findFirst({
      where: {
        id: materialId,
        aulaId,
        instituicaoId: validacao.user.instituicaoId,
      },
      select: { id: true },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material não encontrado ou sem acesso" },
        { status: 404 }
      );
    }

    await prisma.materialAula.delete({
      where: { id: material.id },
    });

    return NextResponse.json({
      success: true,
      message: "Material excluído com sucesso.",
    });
  } catch (e: any) {
    console.error("ERRO AO EXCLUIR MATERIAL DA AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao excluir material da aula" },
      { status: 500 }
    );
  }
}