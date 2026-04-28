import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

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
    instituicaoId: decoded.instituicaoId,
    disciplinas: {
      some: {
        professorId: professor.id,
      },
    },
  },
  include: {
    disciplinas: {
      where: {
        professorId: professor.id,
      },
      include: {
        disciplina: {
  include: {
    curso: true,
  },
},
      },
    },
    itensMatricula: true,
  },
  orderBy: { id: "desc" },
});

    return NextResponse.json(
      turmas.flatMap((t) =>
  t.disciplinas.map((item) => ({
    id: t.id,
    turmaDisciplinaId: item.id,
    nome: t.nome,
    semestre: t.semestre,
    periodoLetivo: t.periodoLetivo,
    statusTurma: t.statusTurma,
    alunos: t.itensMatricula.length,

    curso: item.disciplina?.curso ?? null,

    disciplinaId: item.disciplinaId,
    disciplina: item.disciplina,

    statusDisciplina: item.status,
    dataInicio: item.dataInicio,
    dataFim: item.dataFim,
  }))
)
    );
  } catch (e: any) {
    console.error("ERRO API PROFESSOR TURMAS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar turmas" },
      { status: 500 }
    );
  }
}