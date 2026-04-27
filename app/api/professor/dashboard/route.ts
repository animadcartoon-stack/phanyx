import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as TokenPayload;

    const role = String(decoded.role || "").toUpperCase();

    if (role !== "PROFESSOR" || !decoded.id) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: decoded.id,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const provas = await prisma.prova.findMany({
  where: {
    turma: {
      professorId: professor.id,
      instituicaoId: decoded.instituicaoId,
    },
  },
  include: {
    turma: {
  include: {
    disciplinas: {
      include: {
        disciplina: true,
      },
    },
      },
    },
    tentativas: {
      where: {
        finalizada: true,
      },
      select: {
        id: true,
        notaFinal: true,
        finalizada: true,
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
});

    const totalProvas = provas.length;
    const provasRascunho = provas.filter((p: any) => p.status === "RASCUNHO").length;
    const provasPublicadas = provas.filter((p: any) => p.status === "PUBLICADA").length;
    const provasEncerradas = provas.filter((p: any) => p.status === "ENCERRADA").length;

    const totalTentativasFinalizadas = provas.reduce(
      (acc: number, prova: any) => acc + (prova.tentativas?.length || 0),
      0
    );

const notasFinais = provas.flatMap((prova: any) =>
  (prova.tentativas || [])
    .map((t: any) => Number(t.notaFinal))
    .filter((n: number) => !Number.isNaN(n))
);

const aprovados = notasFinais.filter((nota: number) => nota >= 7).length;
const reprovados = notasFinais.filter((nota: number) => nota < 7).length;

const mediaGeral =
  notasFinais.length > 0
    ? Number(
        (
          notasFinais.reduce((acc: number, n: number) => acc + n, 0) /
          notasFinais.length
        ).toFixed(2)
      )
    : 0;

    const provasRecentes = provas.slice(0, 5).map((prova: any) => {
      const notas = (prova.tentativas || [])
        .map((t: any) => Number(t.notaFinal ?? 0))
        .filter((n: number) => !Number.isNaN(n));

      const media =
        notas.length > 0
          ? Number((notas.reduce((acc: number, n: number) => acc + n, 0) / notas.length).toFixed(2))
          : 0;

      return {
        id: prova.id,
        titulo: prova.titulo,
        status: prova.status,
        notaMaxima: Number(prova.notaMaxima ?? 10),
        disciplinaNome: prova.disciplina?.nome ?? "Sem disciplina",
        totalTentativas: prova.tentativas?.length ?? 0,
        media,
      };
    });

    return NextResponse.json({
  resumo: {
    totalProvas,
    provasRascunho,
    provasPublicadas,
    provasEncerradas,
    totalTentativasFinalizadas,
    aprovados,
    reprovados,
    mediaGeral,
  },
  provasRecentes,
});
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar dashboard" },
      { status: 500 }
    );
  }
}