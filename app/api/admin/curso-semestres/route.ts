import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    orderBy: {
      disciplina: {
        nome: "asc",
      },
    },
  },
},
      orderBy: {
        numero: "asc",
      },
    });

    return NextResponse.json(semestres);
  } catch (error: any) {
  console.error("Erro ao buscar semestres do curso:", error);
  return NextResponse.json(
    {
      error: "Erro ao buscar semestres do curso",
      detalhe: error?.message || "Erro interno",
    },
    { status: 500 }
  );
}
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !isAdminLike(user.role)) {
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
export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Semestre inválido" }, { status: 400 });
    }

    const semestreExistente = await prisma.cursoSemestre.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!semestreExistente) {
      return NextResponse.json(
        { error: "Semestre não encontrado" },
        { status: 404 }
      );
    }

    const atualizado = await prisma.cursoSemestre.update({
      where: { id },
      data: {
        cargaMinima: body.cargaMinima !== "" && body.cargaMinima !== null && body.cargaMinima !== undefined
          ? Number(body.cargaMinima)
          : null,
        cargaMaxima: body.cargaMaxima !== "" && body.cargaMaxima !== null && body.cargaMaxima !== undefined
          ? Number(body.cargaMaxima)
          : null,
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    console.error("Erro ao atualizar carga do semestre:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar semestre" },
      { status: 500 }
    );
  }
}