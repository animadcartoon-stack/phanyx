import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarProvas } from "@/lib/permissoesPlano";

export async function GET(
  _req: Request,
  { params }: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!podeUsarProvas(user.plano || "ESSENCIAL")) {
      return NextResponse.json(
        { error: "Recurso disponível apenas nos planos Profissional e Enterprise" },
        { status: 403 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const provaId = Number(params.provaId);

    if (!Number.isFinite(provaId) || provaId <= 0) {
      return NextResponse.json({ error: "Prova inválida" }, { status: 400 });
    }

    const prova = await prisma.prova.findFirst({
      where: {
  id: provaId,
  instituicaoId: user.instituicaoId,
},
      include: {
        questoes: {
          orderBy: {
            ordem: "asc",
          },
          include: {
            alternativas: {
              orderBy: {
                ordem: "asc",
              },
              select: {
                id: true,
                texto: true,
              },
            },
          },
        },
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
    });

    if (!prova) {
      return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });
    }

    const agora = new Date();

    if (prova.disponivelEm && new Date(prova.disponivelEm) > agora) {
      return NextResponse.json(
        { error: "Prova ainda não está disponível." },
        { status: 403 }
      );
    }

    if (prova.expiraEm && new Date(prova.expiraEm) < agora) {
      return NextResponse.json(
        { error: "O prazo desta prova já expirou." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: prova.id,
      titulo: prova.titulo,
      notaMaxima: prova.notaMaxima ?? 10,
      ativa: prova.ativa,
      questoes: (prova.questoes ?? []).map((q) => ({
        id: q.id,
        pergunta: q.enunciado ?? "",
        tipo: q.tipo,
        valor: q.valor ?? 1,
        alternativas: (q.alternativas ?? []).map((a) => ({
          id: a.id,
          texto: a.texto,
        })),
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao buscar prova" },
      { status: 500 }
    );
  }
}