import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ turmaId: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const { turmaId: turmaIdParam } = await params;
    const turmaId = Number(turmaIdParam);

    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
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

    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
      },
      select: {
        id: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const aulas = await prisma.aula.findMany({
  where: {
    turmaId: turma.id,
    instituicaoId: user.instituicaoId,
  },
  orderBy: [{ ordem: "asc" }, { id: "asc" }],
});

    return NextResponse.json(aulas);
  } catch (e: any) {
    console.error("ERRO GET AULAS DA TURMA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar aulas" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ turmaId: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const { turmaId: turmaIdParam } = await params;
    const turmaId = Number(turmaIdParam);

    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
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

    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
      },
      select: {
        id: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const titulo = String(body?.titulo || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const duracaoMin =
      body?.duracaoMin !== undefined &&
      body?.duracaoMin !== null &&
      body?.duracaoMin !== ""
        ? Number(body.duracaoMin)
        : null;
    const videoUrl = body?.videoUrl ? String(body.videoUrl).trim() : null;

    if (!titulo) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    if (
      duracaoMin !== null &&
      (!Number.isFinite(duracaoMin) || duracaoMin <= 0)
    ) {
      return NextResponse.json({ error: "Duração inválida" }, { status: 400 });
    }

    const ultimaAula = await prisma.aula.findFirst({
      where: {
        turmaId: turma.id,
      },
      orderBy: [{ ordem: "desc" }, { id: "desc" }],
    });

    const novaAula = await prisma.aula.create({
  data: {
    titulo,
    descricao,
    duracaoMin,
    videoUrl,
    instituicaoId: user.instituicaoId,
    turmaId: turma.id,
    ordem: ultimaAula?.ordem ? Number(ultimaAula.ordem) + 1 : 1,
  },
});

    return NextResponse.json(novaAula, { status: 201 });
  } catch (e: any) {
    console.error("ERRO POST CRIAR AULA DA TURMA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao criar aula" },
      { status: 500 }
    );
  }
}