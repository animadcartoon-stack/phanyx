import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id?: number;
  role?: string;
  email?: string;
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
      professor: null,
    };
  }

  const auth = getTokenPayload(token);

  if (!auth || String(auth.role || "").toUpperCase() !== "PROFESSOR" || !auth.id) {
    return {
      error: NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 }),
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
      professor: null,
    };
  }

  return {
    error: null,
    professor,
  };
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ disciplinaId: string }> }
) {
  try {
    const { error, professor } = await getProfessorAutorizado();
    if (error) return error;

    const { disciplinaId: disciplinaIdParam } = await params;
    const disciplinaId = Number(disciplinaIdParam);

    if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
      return NextResponse.json(
        { error: "Disciplina inválida" },
        { status: 400 }
      );
    }

    const disciplina = await prisma.disciplina.findFirst({
      where: {
        id: disciplinaId,
        professorId: professor.id,
      },
      include: {
        aulas: { select: { id: true } },
        turmas: { select: { id: true } },
        provas: { select: { id: true } },
      },
    });

    if (!disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const possuiAulas = disciplina.aulas.length > 0;
    const possuiTurmas = disciplina.turmas.length > 0;
    const possuiProvas = disciplina.provas.length > 0;

    if (possuiAulas || possuiTurmas || possuiProvas) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir a disciplina porque ela possui aulas, turmas ou provas vinculadas.",
        },
        { status: 400 }
      );
    }

    await prisma.disciplina.delete({
      where: {
        id: disciplinaId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Disciplina excluída com sucesso.",
    });
  } catch (e: any) {
    console.error("ERRO AO EXCLUIR DISCIPLINA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao excluir disciplina" },
      { status: 500 }
    );
  }
}