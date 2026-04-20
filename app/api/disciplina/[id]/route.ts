import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

function disciplinaPertenceAInstituicao(
  disciplina: {
    curso?: { instituicaoId?: number | null } | null;
    turmas?: Array<{ instituicaoId?: number | null }> | null;
  } | null,
  instituicaoId: number
) {
  if (!disciplina) return false;

  const cursoDaInstituicao = disciplina.curso?.instituicaoId === instituicaoId;
  const turmaDaInstituicao =
    Array.isArray(disciplina.turmas) &&
    disciplina.turmas.some((turma) => turma.instituicaoId === instituicaoId);

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
              turma: {
                disciplinaId: id,
                instituicaoId: user.instituicaoId,
              },
            },
            include: {
              turma: {
                include: {
                  disciplina: {
                    include: {
                      curso: true,
                    },
                  },
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
      const turma = itemMatricula?.turma;
      const disciplina = turma?.disciplina;

      if (!disciplina || !turma) {
        return NextResponse.json(
          { error: "Disciplina não encontrada" },
          { status: 404 }
        );
      }

      const aulas = (turma.aulas ?? []).map((aula) => {
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
        turma: {
          id: turma.id,
          nome: turma.nome,
          semestre: turma.semestre,
        },
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
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
        turmas: {
          include: {
            professor: true,
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

    if (user.role !== "ADMIN") {
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
        turmas: {
          include: {
            professor: true,
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

    if (!body.turmaId) {
      return NextResponse.json(
        { error: "Selecione uma turma para vincular à disciplina." },
        { status: 400 }
      );
    }

    const turma = await prisma.turma.findFirst({
      where: {
        id: Number(body.turmaId),
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        disciplinaId: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma inválida para esta instituição." },
        { status: 400 }
      );
    }

    if (turma.disciplinaId && turma.disciplinaId !== id) {
      return NextResponse.json(
        { error: "Esta turma já está vinculada a outra disciplina." },
        { status: 400 }
      );
    }

    if (!body.professorId) {
      return NextResponse.json(
        { error: "Selecione um professor para a turma." },
        { status: 400 }
      );
    }

    const professor = await prisma.professor.findFirst({
      where: {
        id: Number(body.professorId),
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor inválido para esta instituição." },
        { status: 400 }
      );
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
        },
      });

      await tx.turma.update({
        where: {
          id: Number(body.turmaId),
        },
        data: {
          disciplinaId: id,
          professorId: Number(body.professorId),
        },
      });
    });

    const disciplinaAtualizada = await prisma.disciplina.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
        turmas: {
          include: {
            professor: true,
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
        curso: true,
        turmas: {
          select: {
            id: true,
            instituicaoId: true,
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

    if (disciplina.turmas.length > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir a disciplina porque ela possui turmas vinculadas.",
        },
        { status: 400 }
      );
    }

    await prisma.disciplina.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("ERRO API DISCIPLINA DELETE:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir disciplina" },
      { status: 500 }
    );
  }
}