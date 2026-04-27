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
    const userId = Number(decoded.id);

    if (role !== "ALUNO" || !userId) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const aluno: any = await prisma.aluno.findFirst({
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

    const tentativas: any[] = await prisma.tentativaProva.findMany({
      where: {
        alunoId: aluno.id,
        finalizada: true,
      },
      include: {
        prova: {
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const provasMap = new Map<number, any>();

    for (const tentativa of tentativas) {
      const provaId = tentativa.provaId;

      if (!provasMap.has(provaId)) {
        provasMap.set(provaId, tentativa);
      }
    }

    const tentativasUnicas = Array.from(provasMap.values());

    const disciplinasMap = new Map<number, any>();

    for (const tentativa of tentativasUnicas) {
      const disciplina =
  tentativa.prova?.turma?.disciplinas?.[0]?.disciplina;
      if (!disciplina) continue;

      const disciplinaId = disciplina.id;

      if (!disciplinasMap.has(disciplinaId)) {
        disciplinasMap.set(disciplinaId, {
          disciplinaId,
          disciplinaNome:
            disciplina.nome ||
            disciplina.titulo ||
            `Disciplina ${disciplina.id}`,
          provas: [],
          media: 0,
        });
      }

      const item = disciplinasMap.get(disciplinaId);

      item.provas.push({
        tentativaId: tentativa.id,
        provaId: tentativa.provaId,
        titulo: tentativa.prova?.titulo || `Prova ${tentativa.provaId}`,
        nota: tentativa.notaFinal ?? 0,
        notaMaxima: tentativa.prova?.notaMaxima ?? 10,
        finalizada: tentativa.finalizada,
        startedAt: tentativa.startedAt,
        finishedAt: tentativa.finishedAt,
        status:
          tentativa.finalizada === true ? "FINALIZADA" : "EM_ANDAMENTO",
      });
    }

    const boletim = Array.from(disciplinasMap.values()).map((item) => {
      const total = item.provas.length;

      const somaNotas = item.provas.reduce(
        (acc: number, prova: any) => acc + Number(prova.nota || 0),
        0
      );

      const media = total > 0 ? somaNotas / total : 0;

      return {
        ...item,
        media: Number(media.toFixed(2)),
      };
    });

    return NextResponse.json({
      aluno: {
        id: aluno.id,
        userId: aluno.userId,
      },
      totalDisciplinas: boletim.length,
      boletim,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao carregar boletim" },
      { status: 401 }
    );
  }
}