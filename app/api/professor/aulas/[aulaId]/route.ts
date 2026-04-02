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
  { params }: { params: Promise<{ aulaId: string }> }
) {
  try {
    const { error, professor } = await getProfessorAutorizado();
    if (error) return error;

    const { aulaId: aulaIdParam } = await params;
    const aulaId = Number(aulaIdParam);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "Aula inválida" }, { status: 400 });
    }

    const aula = await prisma.aula.findFirst({
      where: {
        id: aulaId,
        disciplina: {
          professorId: professor.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!aula) {
      return NextResponse.json(
        { error: "Aula não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    await prisma.aula.delete({
      where: {
        id: aulaId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Aula excluída com sucesso.",
    });
  } catch (e: any) {
    console.error("ERRO AO EXCLUIR AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao excluir aula" },
      { status: 500 }
    );
  }
}