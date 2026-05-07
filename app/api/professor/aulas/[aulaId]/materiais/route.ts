import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(
  req: Request,
  { params }: { params: { aulaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "PROFESSOR" && user.role !== "professor")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const aulaId = Number(params.aulaId);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "aulaId inválido" }, { status: 400 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const aula = await prisma.aula.findFirst({
  where: {
    id: aulaId,
    instituicaoId: user.instituicaoId,
    turma: {
      instituicaoId: user.instituicaoId,
      OR: [
        {
          professorId: professor.id,
        },
        {
          disciplinas: {
            some: {
              disciplina: {
                professorId: professor.id,
              },
            },
          },
        },
      ],
    },
  },
  select: { id: true },
});

    if (!aula) {
      return NextResponse.json(
        { error: "Aula não encontrada ou sem acesso" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const tipo = String(body?.tipo || "").trim().toLowerCase();
    const titulo = String(body?.titulo || "").trim();

    if (!titulo) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    if (!["arquivo", "pdf", "doc", "ppt", "link", "video"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de material inválido" },
        { status: 400 }
      );
    }

    const url = body?.url ? String(body.url).trim() : null;
    const arquivoNome = body?.arquivoNome
      ? String(body.arquivoNome).trim()
      : null;
    const mimeType = body?.mimeType ? String(body.mimeType).trim() : null;
    const tamanho =
      body?.tamanho !== undefined &&
      body?.tamanho !== null &&
      body?.tamanho !== ""
        ? Number(body.tamanho)
        : null;

    if ((tipo === "link" || tipo === "video") && !url) {
      return NextResponse.json(
        { error: "URL é obrigatória para link ou vídeo" },
        { status: 400 }
      );
    }

    if ((tipo === "arquivo" || tipo === "pdf" || tipo === "doc" || tipo === "ppt") && !url) {
      return NextResponse.json(
        { error: "Envie o arquivo antes de salvar o material" },
        { status: 400 }
      );
    }

    const material = await prisma.materialAula.create({
      data: {
        aulaId,
        instituicaoId: user.instituicaoId,
        tipo,
        titulo,
        url,
        arquivoNome,
        mimeType,
        tamanho,
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