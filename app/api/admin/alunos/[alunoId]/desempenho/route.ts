import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function isAdmin(role: unknown) {
  const r = String(role || "").toUpperCase();
  return r === "ADMIN" || r === "SUPER_ADMIN";
}

export async function GET(
  _req: NextRequest,
  ctx: { params: { alunoId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const alunoId = Number(ctx.params.alunoId);

    if (!Number.isFinite(alunoId) || alunoId <= 0) {
      return NextResponse.json({ error: "Aluno inválido" }, { status: 400 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        instituicaoId: true,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const entregas = await prisma.entregaAtividade.findMany({
      where: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
        nota: { not: null },
      },
      include: {
        atividade: {
          include: {
            disciplina: true,
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
        entregueEm: "desc",
      },
    });

    const disciplinasMap = new Map<number, any>();

    for (const entrega of entregas) {
      const disciplina =
        entrega.atividade?.disciplina ||
        entrega.atividade?.turma?.disciplinas?.[0]?.disciplina;

      if (!disciplina) continue;

      const disciplinaId = disciplina.id;

      if (!disciplinasMap.has(disciplinaId)) {
        disciplinasMap.set(disciplinaId, {
          disciplinaId,
          disciplinaNome: disciplina.nome || `Disciplina ${disciplina.id}`,
          avaliacoes: [],
          media: 0,
        });
      }

      const item = disciplinasMap.get(disciplinaId);

      item.avaliacoes.push({
        tipo: "ATIVIDADE",
        titulo: entrega.atividade?.titulo || "Atividade",
        nota: Number(entrega.nota ?? 0),
        notaMaxima: entrega.atividade?.notaMaxima ?? 10,
        feedback: entrega.feedback,
        entregueEm: entrega.entregueEm,
        corrigidaEm: entrega.corrigidaEm,
      });
    }

    const disciplinas = Array.from(disciplinasMap.values()).map((item) => {
      const soma = item.avaliacoes.reduce(
        (acc: number, avaliacao: any) => acc + Number(avaliacao.nota || 0),
        0
      );

      const media = item.avaliacoes.length > 0 ? soma / item.avaliacoes.length : 0;

      return {
        ...item,
        media: Number(media.toFixed(2)),
      };
    });

    const disciplinasComNota = disciplinas.filter((d) => d.avaliacoes.length > 0);

    const mediaGeral =
      disciplinasComNota.length > 0
        ? Number(
            (
              disciplinasComNota.reduce(
                (acc, d) => acc + Number(d.media || 0),
                0
              ) / disciplinasComNota.length
            ).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      ok: true,
      aluno,
      mediaGeral,
      totalDisciplinas: disciplinas.length,
      disciplinas,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar desempenho" },
      { status: 500 }
    );
  }
}