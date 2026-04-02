import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id?: number;
  role?: string;
  instituicaoId?: number;
  email?: string;
};

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as TokenPayload;

    const role = String(decoded.role || "").toUpperCase();
    const userId = Number(decoded.id);

    if (role !== "ALUNO" || !userId) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Perfil de aluno não encontrado" },
        { status: 404 }
      );
    }

    // 🚫 BLOQUEIO POR INADIMPLÊNCIA
    if (aluno.statusAluno === "INADIMPLENTE") {
      return NextResponse.json(
        {
          error: "INADIMPLENTE",
          message:
            "Seu acesso está temporariamente bloqueado por pendências financeiras. Procure a instituição.",
        },
        { status: 403 }
      );
    }

    

    const tentativas = await prisma.tentativaProva.findMany({
      where: {
        alunoId: aluno.id,
        finalizada: true,
      },
      include: {
        prova: {
          include: {
            turma: {
              include: {
                disciplina: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const provasUnicasMap = new Map<number, any>();

    for (const tentativa of tentativas) {
      if (!provasUnicasMap.has(tentativa.provaId)) {
        provasUnicasMap.set(tentativa.provaId, tentativa);
      }
    }

    const provasUnicas = Array.from(provasUnicasMap.values());

    const disciplinasMap = new Map<number, string>();

for (const tentativa of provasUnicas) {
  const disciplina = tentativa.prova?.turma?.disciplina;
  if (disciplina?.id) {
    disciplinasMap.set(disciplina.id, disciplina.nome);
  }
}

const totalDisciplinas = disciplinasMap.size;
    const totalProvasConcluidas = provasUnicas.length;

    const somaNotas = provasUnicas.reduce(
      (acc, tentativa) => acc + Number(tentativa.notaFinal || 0),
      0
    );

    const mediaGeral =
      totalProvasConcluidas > 0
        ? Number((somaNotas / totalProvasConcluidas).toFixed(2))
        : 0;

    const ultimasProvas = provasUnicas.slice(0, 5).map((tentativa) => ({
      tentativaId: tentativa.id,
      provaId: tentativa.provaId,
      titulo: tentativa.prova?.titulo || `Prova ${tentativa.provaId}`,
      disciplinaNome:
        tentativa.prova?.turma?.disciplina?.nome ||
        `Disciplina ${tentativa.prova?.turma?.disciplinaId ?? ""}`,
      nota: tentativa.notaFinal ?? 0,
      notaMaxima: tentativa.prova?.notaMaxima ?? 10,
      finishedAt: tentativa.createdAt,
    }));

    return NextResponse.json({
      aluno: {
        id: aluno.id,
        userId: aluno.userId,
        statusAluno: aluno.statusAluno,
      },
      resumo: {
        totalDisciplinas,
        totalProvasConcluidas,
        mediaGeral,
      },
      ultimasProvas,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar dashboard do aluno" },
      { status: 401 }
    );
  }
}