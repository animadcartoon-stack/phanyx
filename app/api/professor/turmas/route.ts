import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id?: number;
  role?: string;
  instituicaoId?: number;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as TokenPayload;

    const role = String(decoded.role || "").toUpperCase();

    if (role !== "PROFESSOR" || !decoded.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: decoded.id,
        instituicaoId: decoded.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const turmas = await prisma.turma.findMany({
      where: {
        professorId: professor.id,
        instituicaoId: decoded.instituicaoId,
      },
      include: {
        disciplina: true,
        itensMatricula: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(
      turmas.map((t) => ({
        id: t.id,
        nome: t.nome,
        semestre: t.semestre,
        alunos: t.itensMatricula.length,
        disciplinaId: t.disciplinaId,
        disciplina: t.disciplina,
      }))
    );
  } catch (e: any) {
    console.error("ERRO API PROFESSOR TURMAS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar turmas" },
      { status: 500 }
    );
  }
}