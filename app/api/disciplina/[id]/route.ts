import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

function disciplinaPertenceAInstituicao(
  disciplina: {
    curso?: { instituicaoId?: number | null } | null;
    turmaDisciplinas?:
      | Array<{
          instituicaoId?: number | null;
          turma?: { instituicaoId?: number | null } | null;
        }>
      | null;
  } | null,
  instituicaoId: number
) {
  if (!disciplina) return false;

  const cursoDaInstituicao = disciplina.curso?.instituicaoId === instituicaoId;

  const turmaDaInstituicao =
    Array.isArray(disciplina.turmaDisciplinas) &&
    disciplina.turmaDisciplinas.some(
      (vinculo) =>
        vinculo.instituicaoId === instituicaoId ||
        vinculo.turma?.instituicaoId === instituicaoId
    );

  return cursoDaInstituicao || turmaDaInstituicao;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    if (user.role === "ALUNO") {
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
        return NextResponse.json(
          { error: "Aluno não encontrado" },
          { status: 404 }
        );
      }

      const matricula = await prisma.matricula.findFirst({
        where: {
          alunoId: aluno.id,
          instituicaoId: user.instituicaoId,
        },
        include: {
          itens: {
            where: {
              instituicaoId: user.instituicaoId,
              disciplinaId: id,
            },
            include: {
              disciplina: {
                include: {
                  curso: true,
                },
              },
              turma: {
                include: {
                  aulas: {
                    where: {
                      instituicaoId: user.instituicaoId,
                    },
                    orderBy: {
                      ordem: "asc",
                    },
                    include: {
                      materiais: true,
                      presencas: {
                        where: {
                          alunoId: aluno.id,
                          instituicaoId: user.instituicaoId,
                        },
                        orderBy: {
                          createdAt: "desc",
                        },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              id: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const itemMatricula = matricula?.itens?.[0];
      const turma = itemMatricula?.turma ?? null;
      const disciplina = itemMatricula?.disciplina ?? null;

      if (!disciplina) {
        return NextResponse.json(
          { error: "Disciplina não encontrada" },
          { status: 404 }
        );
      }

      const aulas = (turma?.aulas ?? []).map((aula) => {
        const presenca = aula.presencas?.[0] ?? null;

        return {
          id: aula.id,
          titulo: aula.titulo,
          descricao: aula.descricao,
          videoUrl: aula.videoUrl,
          duracaoMin: aula.duracaoMin,
          ordem: aula.ordem,
          publicada: aula.publicada,
          materiais: (aula.materiais ?? []).map((material) => ({
            id: material.id,
            titulo: material.titulo,
            tipo: material.tipo,
            url: material.url,
            arquivoNome: material.arquivoNome,
            mimeType: material.mimeType,
            tamanho: material.tamanho,
          })),
          progresso: {
            aulaId: aula.id,
            concluida: !!presenca,
            concluidaEm: presenca ? presenca.createdAt : null,
            tempoAssistidoSegundos: 0,
            tempoMinimoSegundos: 0,
          },
        };
      });

      const totalAulas = aulas.length;
      const aulasConcluidas = aulas.filter(
        (aula) => aula.progresso?.concluida
      ).length;
      const progressoPercentual =
        totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

      return NextResponse.json({
        id: disciplina.id,
        nome: disciplina.nome,
        codigo: disciplina.codigo,
        descricao: disciplina.descricao,
        cargaHoraria: disciplina.cargaHoraria,
        semestre: disciplina.semestre,
        curso: disciplina.curso,
        turma: turma
          ? {
              id: turma.id,
              nome: turma.nome,
              semestre: turma.semestre,
            }
          : null,
        aulas,
        provaLiberada: totalAulas === 0 ? true : progressoPercentual === 100,
        progressoPercentual,
      });
    }

    if (user.role !== "ADMIN" && user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const disciplina = await prisma.disciplina.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
  curso: true,
  professor: {
    select: {
      id: true,
      nome: true,
    },
  },
  professoresHabilitados: {
  include: {
    professor: {
      select: {
        id: true,
        nome: true,
      },
    },
  },
},
  turmaDisciplinas: {
  include: {
    turma: {
      include: {
        _count: {
                  select: {
                    atividades: true,
                    itensMatricula: true,
                    modulos: true,
                    notas: true,
                    provas: true,
                    resultadosFinais: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (
      !disciplina ||
      !disciplinaPertenceAInstituicao(disciplina, user.instituicaoId)
    ) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(disciplina);
  } catch (error: any) {
    console.error("ERRO API DISCIPLINA GET:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar disciplina" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    const disciplinaExistente = await prisma.disciplina.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
        turmaDisciplinas: {
          include: {
            turma: {
              include: {
                professor: true,
              },
            },
          },
        },
      },
    });

    if (
      !disciplinaExistente ||
      !disciplinaPertenceAInstituicao(disciplinaExistente, user.instituicaoId)
    ) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }

    let cursoIdFinal: number | null | undefined = disciplinaExistente.cursoId;

    if (
      body.cursoId !== undefined &&
      body.cursoId !== null &&
      body.cursoId !== ""
    ) {
      const curso = await prisma.curso.findFirst({
        where: {
          id: Number(body.cursoId),
          instituicaoId: user.instituicaoId,
        },
      });

      if (!curso) {
        return NextResponse.json(
          { error: "Curso inválido para esta instituição" },
          { status: 400 }
        );
      }

      cursoIdFinal = curso.id;
    }

    if (body.cursoId === null || body.cursoId === "") {
      cursoIdFinal = null;
    }

let professorIdFinal: number | null = disciplinaExistente.professorId ?? null;

if (
  body.professorId !== undefined &&
  body.professorId !== null &&
  body.professorId !== ""
) {
  const professor = await prisma.professor.findFirst({
    where: {
      id: Number(body.professorId),
      instituicaoId: user.instituicaoId,
    },
  });

  if (!professor) {
    return NextResponse.json(
      { error: "Professor inválido para esta instituição" },
      { status: 400 }
    );
  }

  professorIdFinal = professor.id;
}

if (body.professorId === null || body.professorId === "") {
  professorIdFinal = null;
}

    const turmaIds = Array.isArray(body.turmaIds)
  ? body.turmaIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
  : [];

    if (turmaIds.length === 0) {
  return NextResponse.json(
    { error: "Selecione pelo menos uma turma." },
    { status: 400 }
  );
}

const professoresHabilitadosIds = Array.isArray(body.professoresHabilitadosIds)
  ? body.professoresHabilitadosIds
      .map((id: any) => Number(id))
      .filter((id: number) => Number.isFinite(id) && id > 0)
  : [];

if (professoresHabilitadosIds.length > 0) {
  const professoresValidos = await prisma.professor.findMany({
    where: {
      id: { in: professoresHabilitadosIds },
      instituicaoId: user.instituicaoId,
    },
    select: { id: true },
  });

  if (professoresValidos.length !== professoresHabilitadosIds.length) {
    return NextResponse.json(
      { error: "Um ou mais professores são inválidos para esta instituição." },
      { status: 400 }
    );
  }
}

    await prisma.$transaction(async (tx) => {
      await tx.disciplina.update({
        where: { id },
        data: {
          nome: String(body.nome ?? disciplinaExistente.nome).trim(),
          codigo: body.codigo ?? null,
          descricao: body.descricao ?? null,
          cargaHoraria:
            body.cargaHoraria !== null &&
            body.cargaHoraria !== undefined &&
            body.cargaHoraria !== ""
              ? Number(body.cargaHoraria)
              : null,
          semestre:
            body.semestre !== null &&
            body.semestre !== undefined &&
            body.semestre !== ""
              ? Number(body.semestre)
              : null,
          cursoId: cursoIdFinal,
          professorId: professorIdFinal,
        },
      });

await tx.professorDisciplina.deleteMany({
  where: {
    disciplinaId: id,
    instituicaoId: user.instituicaoId,
  },
});

if (professoresHabilitadosIds.length > 0) {
  await tx.professorDisciplina.createMany({
    data: professoresHabilitadosIds.map((professorId: number) => ({
      professorId,
      disciplinaId: id,
      instituicaoId: user.instituicaoId,
    })),
    skipDuplicates: true,
  });
}

      await tx.turmaDisciplina.deleteMany({
  where: {
    disciplinaId: id,
    instituicaoId: user.instituicaoId,
  },
});

if (turmaIds.length > 0) {
  await tx.turmaDisciplina.createMany({
    data: turmaIds.map((turmaId: number) => ({
  turmaId,
  disciplinaId: id,
  professorId: professorIdFinal,
  instituicaoId: user.instituicaoId,
})),
    skipDuplicates: true,
  });
}

    });

    const disciplinaAtualizada = await prisma.disciplina.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
  curso: true,
  professoresHabilitados: {
    include: {
      professor: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },
  turmaDisciplinas: {
  include: {
    turma: true,
  },
},
      },
    });

    return NextResponse.json(disciplinaAtualizada);
  } catch (error: any) {
    console.error("ERRO API DISCIPLINA PUT:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar disciplina" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const disciplina = await prisma.disciplina.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        turmaDisciplinas: {
          select: { id: true },
        },
      },
    });

    if (!disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (disciplina.turmaDisciplinas.length > 0) {
        await tx.turmaDisciplina.deleteMany({
          where: {
            disciplinaId: id,
            instituicaoId: user.instituicaoId,
          },
        });
      }

      await tx.disciplina.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("ERRO API DISCIPLINA DELETE:", error);

    return NextResponse.json(
      {
        error: error?.message || "Erro ao excluir disciplina",
      },
      { status: 500 }
    );
  }
}