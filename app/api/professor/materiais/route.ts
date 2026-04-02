import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";

const TIPOS_VALIDOS = ["arquivo", "pdf", "doc", "ppt", "link", "video"] as const;
type MaterialTipoPermitido = (typeof TIPOS_VALIDOS)[number];

export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const body = await req.json();

    const titulo = String(body.titulo || "").trim();
    const tipo = String(body.tipo || "").trim() as MaterialTipoPermitido;
    const url = body.url ? String(body.url).trim() : null;
    const arquivoNome = body.arquivoNome ? String(body.arquivoNome).trim() : null;
    const mimeType = body.mimeType ? String(body.mimeType).trim() : null;
    const tamanho =
      body.tamanho !== undefined && body.tamanho !== null
        ? Number(body.tamanho)
        : null;
    const aulaId = Number(body.aulaId);

    if (!titulo) {
      return NextResponse.json(
        { error: "Título é obrigatório." },
        { status: 400 }
      );
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de material inválido." },
        { status: 400 }
      );
    }

    if (!aulaId || Number.isNaN(aulaId)) {
      return NextResponse.json(
        { error: "Aula inválida." },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: "URL do material é obrigatória." },
        { status: 400 }
      );
    }

    const aula = await prisma.aula.findFirst({
      where: {
        id: aulaId,
        disciplina: {
          professorId: auth.professorId!,
          instituicaoId: auth.instituicaoId,
        },
      },
    });

    if (!aula) {
      return NextResponse.json(
        { error: "Aula não encontrada ou sem permissão." },
        { status: 404 }
      );
    }

    const material = await prisma.materialAula.create({
      data: {
        titulo,
        tipo,
        url,
        arquivoNome,
        mimeType,
        tamanho,
        aulaId,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (e: any) {
    console.error("Erro ao criar material:", e);

    return NextResponse.json(
      { error: e.message || "Erro ao criar material." },
      { status: 401 }
    );
  }
}