import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const aluno: any = await prisma.aluno.findFirst({
      where: {
        userId: auth.userId,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Perfil de aluno não encontrado" },
        { status: 404 }
      );
    }

    const atividades: any[] = await prisma.atividade.findMany({

      where: {
        status: "PUBLICADA",
      },
      include: {
  disciplina: true,
  turma: true,
  entregas: {
    where: {
      alunoId: aluno.id,
    },
    take: 1,
  },
},
      orderBy: {
        createdAt: "desc",
      } as any,
      
    });

    const items = atividades.map((atividade) => {
  const entrega = atividade.entregas?.[0] || null;

  return {
    id: atividade.id,
    titulo: atividade.titulo,
    descricao: atividade.descricao,
    prazo: atividade.prazo,
    status: atividade.status,
    notaMaxima: atividade.notaMaxima,

    disciplinaNome:
      atividade.disciplina?.nome ||
      atividade.disciplina?.titulo ||
      `Disciplina ${atividade.disciplinaId}`,

    turmaNome: atividade.turma?.nome || null,

    entrega: entrega
      ? {
          texto: entrega.texto,
          link: entrega.link,
          arquivoUrl: entrega.arquivoUrl,
          entregueEm: entrega.entregueEm,
        }
      : null,
  };
});

    return NextResponse.json({
      ok: true,
      total: items.length,
      items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao listar atividades do aluno" },
      { status: 401 }
    );
  }
}