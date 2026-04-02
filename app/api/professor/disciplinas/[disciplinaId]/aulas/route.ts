import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id?: number;
  role?: string;
  email?: string;
  instituicaoId?: number;
};

function getTokenPayload(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

async function getProfessorAutorizado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      error: NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 }),
      auth: null,
      professor: null,
    };
  }

  const auth = getTokenPayload(token);

  if (!auth || String(auth.role || "").toUpperCase() !== "PROFESSOR" || !auth.id) {
    return {
      error: NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 }),
      auth: null,
      professor: null,
    };
  }

  const professor = await prisma.professor.findFirst({
    where: {
      userId: auth.id,
    },
  });

  if (!professor) {
    return {
      error: NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      ),
      auth,
      professor: null,
    };
  }

  return {
    error: null,
    auth,
    professor,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ disciplinaId: string }> }
) {
  try {
    const { error, professor } = await getProfessorAutorizado();
    if (error) return error;

    const { disciplinaId: disciplinaIdParam } = await params;
    const disciplinaId = Number(disciplinaIdParam);

    if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
      return NextResponse.json({ error: "Disciplina inválida" }, { status: 400 });
    }

    const disciplina = await prisma.disciplina.findFirst({
      where: {
        id: disciplinaId,
        professorId: professor.id,
      },
    });

    if (!disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const aulas = await prisma.aula.findMany({
      where: { disciplinaId },
      orderBy: [{ ordem: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(aulas);
  } catch (e: any) {
    console.error("ERRO GET AULAS PROFESSOR:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar aulas" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disciplinaId: string }> }
) {
  try {
    const { error, professor } = await getProfessorAutorizado();
    if (error) return error;

    const { disciplinaId: disciplinaIdParam } = await params;
    const disciplinaId = Number(disciplinaIdParam);

    if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
      return NextResponse.json({ error: "Disciplina inválida" }, { status: 400 });
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
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    if (duracaoMin !== null && (!Number.isFinite(duracaoMin) || duracaoMin <= 0)) {
      return NextResponse.json(
        { error: "Duração inválida" },
        { status: 400 }
      );
    }

    const disciplina = await prisma.disciplina.findFirst({
      where: {
        id: disciplinaId,
        professorId: professor.id,
      },
    });

    if (!disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const ultimaAula = await prisma.aula.findFirst({
      where: { disciplinaId },
      orderBy: [{ ordem: "desc" }, { id: "desc" }],
    });

    const novaAula = await prisma.aula.create({
      data: {
        titulo,
        descricao,
        duracaoMin,
        videoUrl,
        disciplinaId,
        ordem: ultimaAula?.ordem ? Number(ultimaAula.ordem) + 1 : 1,
      },
    });

    return NextResponse.json(novaAula, { status: 201 });
  } catch (e: any) {
    console.error("ERRO POST CRIAR AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao criar aula" },
      { status: 500 }
    );
  }
}