import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursoId = searchParams.get("cursoId");

    if (!cursoId) {
      return NextResponse.json(
        { error: "cursoId é obrigatório" },
        { status: 400 }
      );
    }

    const semestres = await prisma.cursoSemestre.findMany({
      where: {
        cursoId: Number(cursoId),
        instituicaoId: user.instituicaoId,
      },
      include: {
        disciplinas: {
          include: {
            disciplina: true,
          },
        },
      },
      orderBy: {
        numero: "asc",
      },
    });

    return NextResponse.json(semestres);
  } catch (error) {
    console.error("Erro ao buscar semestres do curso:", error);
    return NextResponse.json(
      { error: "Erro ao buscar semestres do curso" },
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
    const { cursoId, numero, titulo, descricao } = body;

    if (!cursoId || !numero) {
      return NextResponse.json(
        { error: "cursoId e número do semestre são obrigatórios" },
        { status: 400 }
      );
    }

    const existente = await prisma.cursoSemestre.findFirst({
      where: {
        cursoId: Number(cursoId),
        numero: Number(numero),
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Este semestre já foi cadastrado para o curso" },
        { status: 400 }
      );
    }

    const semestre = await prisma.cursoSemestre.create({
      data: {
        cursoId: Number(cursoId),
        numero: Number(numero),
        titulo: titulo ? String(titulo).trim() : null,
        descricao: descricao ? String(descricao).trim() : null,
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json(semestre, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar semestre do curso:", error);
    return NextResponse.json(
      { error: "Erro ao criar semestre do curso" },
      { status: 500 }
    );
  }
}