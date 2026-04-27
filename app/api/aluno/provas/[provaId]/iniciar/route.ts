import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarProvas } from "@/lib/permissoesPlano";

export async function POST(
  _req: Request,
  { params }: { params: { provaId: string } }
) {
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
    select: { id: true },
  });

  if (!aluno) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  const provaId = Number(params.provaId);

  if (!Number.isFinite(provaId) || provaId <= 0) {
    return NextResponse.json({ error: "provaId inválido" }, { status: 400 });
  }

  const prova = await prisma.prova.findFirst({
    where: {
      id: provaId,
      ativa: true,
      instituicaoId: user.instituicaoId,
    },
    include: {
      questoes: {
        include: {
          alternativas: true,
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

  const aulasDaTurma = await prisma.aula.findMany({
    where: {
      turmaId: prova.turmaId,
      instituicaoId: user.instituicaoId,
      publicada: true,
    },
    select: {
      id: true,
    },
    orderBy: {
      ordem: "asc",
    },
  });

  if (aulasDaTurma.length > 0) {
    const progressos = await prisma.progressoAula.findMany({
      where: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
        aulaId: {
          in: aulasDaTurma.map((aula) => aula.id),
        },
        concluida: true,
      },
      select: {
        aulaId: true,
      },
    });

    const aulaIdsConcluidas = new Set(progressos.map((p) => p.aulaId));

    const todasConcluidas = aulasDaTurma.every((aula) =>
      aulaIdsConcluidas.has(aula.id)
    );

    if (!todasConcluidas) {
      return NextResponse.json(
        {
          error: "Você precisa concluir todas as aulas antes de fazer a prova.",
        },
        { status: 403 }
      );
    }
  }

  const tentativaExistente = await prisma.tentativaProva.findFirst({
  where: {
    alunoId: aluno.id,
    provaId: prova.id,
    instituicaoId: user.instituicaoId,
  },
  orderBy: {
    tentativaNumero: "desc",
  },
  select: {
    id: true,
    alunoId: true,
    provaId: true,
    finalizada: true,
    tentativaNumero: true,
  },
});

if (tentativaExistente?.finalizada) {
  return NextResponse.json(
    { error: "Você já finalizou esta prova." },
    { status: 409 }
  );
}

const tentativa =
  tentativaExistente ??
  (await prisma.tentativaProva.create({
    data: {
      alunoId: aluno.id,
      provaId: prova.id,
      instituicaoId: user.instituicaoId,
      tentativaNumero: 1,
    },
    select: {
      id: true,
      alunoId: true,
      provaId: true,
      finalizada: true,
      tentativaNumero: true,
    },
  }));

  const questoesOrdenadas = (prova.questoes ?? [])
    .slice()
    .sort((a: any, b: any) => {
      const ao = a?.ordem ?? 0;
      const bo = b?.ordem ?? 0;
      if (ao !== bo) return ao - bo;
      return (a?.id ?? 0) - (b?.id ?? 0);
    })
    .map((q: any) => ({
      id: q.id,
      enunciado: q.enunciado ?? q.pergunta ?? "",
      tipo: q.tipo,
      valor: q.valor ?? 1,
      ordem: q.ordem ?? 0,
      alternativas: (q.alternativas ?? [])
        .slice()
        .sort((a: any, b: any) => {
          const ao = a?.ordem ?? 0;
          const bo = b?.ordem ?? 0;
          if (ao !== bo) return ao - bo;
          return (a?.id ?? 0) - (b?.id ?? 0);
        })
        .map((a: any) => ({
          id: a.id,
          texto: a.texto ?? "",
          ordem: a.ordem ?? 0,
        })),
    }));

  return NextResponse.json({
    tentativa,
    prova: {
      id: prova.id,
      titulo: (prova as any).titulo ?? "Prova",
      notaMaxima: (prova as any).notaMaxima ?? 10,
      disciplinaId: (prova as any).turma?.disciplinas?.[0]?.disciplina?.id ?? null,
      turmaId: (prova as any).turmaId,
      disciplinaNome: (prova as any).turma?.disciplinas?.[0]?.disciplina?.nome ?? null,
      questoes: questoesOrdenadas,
    },
  });
}