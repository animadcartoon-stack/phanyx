import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toPositiveNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

type MatriculaBody = {
  id?: number | string;
  alunoId?: number | string;
  cursoId?: number | string;
  semestre?: number | string;
  turmaId?: number | string;
  turmaIds?: Array<number | string>;
  valorMatricula?: number | string;
  valorPagoMatricula?: number | string;
  valorMensalidade?: number | string;
  quantidadeParcelas?: number | string;
  quantidadeMensalidades?: number | string;
  dataPrimeiroVencimento?: string;
  primeiroVencimento?: string;
  nomeSocial?: string;
  genero?: string;
  status?: string;
};

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role === "ALUNO") {
      const aluno = await prisma.aluno.findFirst({
        where: { userId: user.id, instituicaoId: user.instituicaoId },
        select: { id: true },
      });

      if (!aluno) {
        return NextResponse.json(
          { error: "Aluno não encontrado" },
          { status: 404 }
        );
      }

      const matriculas = await prisma.matricula.findMany({
        where: {
          alunoId: aluno.id,
          instituicaoId: user.instituicaoId,
        },
        include: {
          aluno: true,
          curso: true,
          itens: {
            include: {
              turma: {
                include: {
                  disciplina: true,
                  professor: true,
                  _count: { select: { aulas: true } },
                },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      });

      return NextResponse.json(matriculas);
    }

    if (user.role === "ADMIN") {
      const matriculas = await prisma.matricula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
        },
        include: {
          aluno: true,
          curso: true,
          itens: {
            include: {
              turma: {
                include: {
                  disciplina: true,
                  professor: true,
                  _count: { select: { aulas: true } },
                },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      });

      return NextResponse.json(matriculas);
    }

    if (user.role === "PROFESSOR") {
      const professor = await prisma.professor.findFirst({
        where: { userId: user.id, instituicaoId: user.instituicaoId },
        select: { id: true },
      });

      if (!professor) {
        return NextResponse.json(
          { error: "Professor não encontrado" },
          { status: 404 }
        );
      }

      const matriculas = await prisma.matricula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          itens: {
            some: {
              turma: {
                professorId: professor.id,
              },
            },
          },
        },
        include: {
          aluno: true,
          curso: true,
          itens: {
            include: {
              turma: {
                include: {
                  disciplina: true,
                  professor: true,
                  _count: { select: { aulas: true } },
                },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      });

      return NextResponse.json(matriculas);
    }

    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  } catch (error: any) {
    console.error("ERRO AO BUSCAR MATRÍCULAS:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar matrículas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;

    const alunoId = Number(body.alunoId);
    const cursoIdBody = body.cursoId ? Number(body.cursoId) : null;
    const semestreBody =
      body.semestre !== undefined &&
      body.semestre !== null &&
      body.semestre !== ""
        ? Number(body.semestre)
        : null;

    const valorPagoMatricula = Number(body.valorPagoMatricula || 0);

    const turmaIdsRaw = Array.isArray(body.turmaIds)
      ? body.turmaIds
      : body.turmaId
      ? [body.turmaId]
      : [];

    const turmaIds = turmaIdsRaw
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (!alunoId || turmaIds.length === 0) {
      return NextResponse.json(
        { error: "Aluno e turmas são obrigatórios" },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const turmas = await prisma.turma.findMany({
      where: {
        id: { in: turmaIds },
        instituicaoId: user.instituicaoId,
      },
      include: {
        disciplina: {
          include: {
            curso: true,
          },
        },
        professor: true,
      },
    });

    if (turmas.length !== turmaIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais turmas são inválidas para esta instituição" },
        { status: 400 }
      );
    }

    const cursoIdsEncontrados: number[] = [];
    for (const turma of turmas) {
      const cursoId = turma.disciplina?.cursoId;
      if (
        typeof cursoId === "number" &&
        Number.isFinite(cursoId) &&
        !cursoIdsEncontrados.includes(cursoId)
      ) {
        cursoIdsEncontrados.push(cursoId);
      }
    }

    const semestresEncontrados: number[] = [];
    for (const turma of turmas) {
      const semestre = turma.disciplina?.semestre;
      if (
        typeof semestre === "number" &&
        Number.isFinite(semestre) &&
        !semestresEncontrados.includes(semestre)
      ) {
        semestresEncontrados.push(semestre);
      }
    }

    let cursoIdFinal = cursoIdBody;
    let semestreFinal = semestreBody;

    if (!cursoIdFinal) {
      if (cursoIdsEncontrados.length === 1) {
        cursoIdFinal = cursoIdsEncontrados[0];
      } else if (cursoIdsEncontrados.length > 1) {
        return NextResponse.json(
          {
            error:
              "As turmas selecionadas pertencem a cursos diferentes. Informe o curso corretamente.",
          },
          { status: 400 }
        );
      }
    }

    if (semestreFinal === null) {
      if (semestresEncontrados.length === 1) {
        semestreFinal = semestresEncontrados[0];
      } else if (semestresEncontrados.length > 1) {
        return NextResponse.json(
          {
            error:
              "As turmas selecionadas pertencem a semestres diferentes. Informe o semestre corretamente.",
          },
          { status: 400 }
        );
      }
    }

    const curso =
      cursoIdFinal !== null
        ? await prisma.curso.findFirst({
            where: {
              id: cursoIdFinal,
              instituicaoId: user.instituicaoId,
            },
          })
        : null;

    if (cursoIdFinal && !curso) {
      return NextResponse.json(
        { error: "Curso inválido para esta instituição" },
        { status: 400 }
      );
    }

    const existe = await prisma.matricula.findFirst({
      where: {
        alunoId,
        cursoId: cursoIdFinal,
        semestre: semestreFinal,
        instituicaoId: user.instituicaoId,
      },
    });

    if (existe) {
      return NextResponse.json(
        {
          error: "Já existe uma matrícula para este aluno nesse curso/semestre",
        },
        { status: 400 }
      );
    }

    const valorMatricula = Number(
      body.valorMatricula ??
        body.valorPagoMatricula ??
        curso?.valorMatricula ??
        0
    );

    const valorMensalidade = Number(
      body.valorMensalidade ?? curso?.valorMensalidade ?? 0
    );

    const quantidadeParcelas = Number(
      body.quantidadeParcelas ??
        body.quantidadeMensalidades ??
        curso?.quantidadeParcelas ??
        0
    );

    const dataPrimeiroVencimento = body.dataPrimeiroVencimento
      ? new Date(body.dataPrimeiroVencimento)
      : new Date();

    const matricula = await prisma.matricula.create({
      data: {
        alunoId,
        cursoId: cursoIdFinal,
        semestre: semestreFinal,
        instituicaoId: user.instituicaoId,
        status: "ATIVA",
        valorMatricula: Number.isFinite(valorMatricula) ? valorMatricula : null,
        valorMensalidade: Number.isFinite(valorMensalidade)
          ? valorMensalidade
          : null,
        quantidadeMensalidades: Number.isFinite(quantidadeParcelas)
          ? quantidadeParcelas
          : null,
        primeiroVencimento: dataPrimeiroVencimento,
        itens: {
          create: turmaIds.map((turmaId) => ({
            turmaId,
            instituicaoId: user.instituicaoId,
            status: "A_CURSAR",
          })),
        },
      },
      include: {
        aluno: true,
        curso: true,
        itens: {
          include: {
            turma: {
              include: {
                disciplina: true,
                professor: true,
              },
            },
          },
        },
      },
    });

    const nomesTurmas = matricula.itens
      .map((item) => item.turma?.disciplina?.nome ?? item.turma?.nome ?? "Turma")
      .join(", ");

    const contratoTexto = `
CONTRATO DE MATRÍCULA

Instituição ID: ${user.instituicaoId}
Aluno: ${aluno.nome ?? "Aluno"}
Email: ${aluno.user?.email ?? "-"}
Curso: ${curso?.nome ?? "Curso não informado"}
Semestre: ${semestreFinal ?? "-"}
Disciplinas/Turmas contratadas: ${nomesTurmas || "-"}
Data da matrícula: ${new Date().toLocaleDateString("pt-BR")}

CLÁUSULAS:
1. O aluno declara estar ciente das normas acadêmicas da instituição.
2. O pagamento da matrícula e das mensalidades seguirá as regras financeiras cadastradas.
3. O não pagamento poderá gerar bloqueio de acesso acadêmico, conforme política institucional.
4. Este contrato poderá ser assinado e arquivado pela instituição.

Assinatura do aluno/responsável: __________________________
Assinatura da instituição: ________________________________
`;

    await prisma.documentoAluno.create({
      data: {
        titulo: `Contrato de matrícula - ${aluno.nome ?? "Aluno"}`,
        tipo: "CONTRATO" as any,
        conteudo: contratoTexto,
        alunoId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (valorMatricula > 0) {
      let statusMatricula: "PENDENTE" | "PARCIAL" | "PAGO" = "PENDENTE";
      let pagoEm: Date | null = null;

      if (valorPagoMatricula >= valorMatricula) {
        statusMatricula = "PAGO";
        pagoEm = new Date();
      } else if (valorPagoMatricula > 0) {
        statusMatricula = "PARCIAL";
        pagoEm = new Date();
      }

      await prisma.lancamentoFinanceiro.create({
        data: {
          tipo: "MATRICULA",
          descricao: `Taxa de matrícula - ${curso?.nome ?? "Curso"}`,
          valorOriginal: valorMatricula,
          valorPago: valorPagoMatricula > 0 ? valorPagoMatricula : 0,
          pagoEm,
          status: statusMatricula,
          observacao: "Gerado automaticamente no ato da matrícula",
          alunoId,
          matriculaId: matricula.id,
          instituicaoId: user.instituicaoId,
        },
      });
    }

    if (valorMensalidade > 0 && quantidadeParcelas > 0) {
      for (let i = 0; i < quantidadeParcelas; i++) {
        const vencimento = addMonths(dataPrimeiroVencimento, i);

        await prisma.lancamentoFinanceiro.create({
          data: {
            tipo: "MENSALIDADE",
            descricao: `Mensalidade ${i + 1}/${quantidadeParcelas} - ${
              curso?.nome ?? "Curso"
            }`,
            valorOriginal: valorMensalidade,
            valorPago: 0,
            vencimento,
            status: "PENDENTE",
            observacao: "Gerado automaticamente na matrícula",
            alunoId,
            matriculaId: matricula.id,
            instituicaoId: user.instituicaoId,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Matrícula criada com sucesso",
      matricula,
      financeiro: {
        valorMatricula,
        valorPagoMatricula,
        valorMensalidade,
        quantidadeParcelas,
      },
    });
  } catch (error: any) {
    console.error("ERRO COMPLETO AO CRIAR MATRÍCULA:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar matrícula" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;

    const id = Number(body.id);
    const status = String(body.status || "").trim();

    const statusPermitidos = [
      "A_INICIAR",
      "ATIVA",
      "TRANCADA",
      "SUSPENSA",
      "CANCELADA",
      "CONCLUIDA",
    ];

    if (!id || !statusPermitidos.includes(status)) {
      return NextResponse.json(
        { error: "ID ou status inválido" },
        { status: 400 }
      );
    }

    const matricula = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      );
    }

    let statusItens: string | null = null;

    if (status === "A_INICIAR") statusItens = "A_CURSAR";
    if (status === "ATIVA") statusItens = "EM_CURSO";
    if (status === "TRANCADA") statusItens = "TRANCADO";
    if (status === "CANCELADA") statusItens = "CANCELADO";
    if (status === "CONCLUIDA") statusItens = "CONCLUIDO";

    if (statusItens) {
      await prisma.itemMatricula.updateMany({
        where: {
          matriculaId: id,
          instituicaoId: user.instituicaoId,
        },
        data: {
          status: statusItens as any,
        },
      });
    }

    const atualizada = await prisma.matricula.update({
      where: { id },
      data: {
        status: status as any,
      },
      include: {
        aluno: true,
        curso: true,
        itens: {
          include: {
            turma: {
              include: {
                disciplina: true,
                professor: true,
                _count: {
                  select: { aulas: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(atualizada);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar status da matrícula" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const matricula = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      );
    }

    await prisma.itemMatricula.deleteMany({
      where: {
        matriculaId: id,
        instituicaoId: user.instituicaoId,
      },
    });

    await prisma.lancamentoFinanceiro.deleteMany({
      where: {
        matriculaId: id,
        instituicaoId: user.instituicaoId,
      },
    });

    await prisma.matricula.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir matrícula" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;

    const id = Number(body.id);
    const alunoId = toPositiveNumberOrNull(body.alunoId);
    const cursoId = toPositiveNumberOrNull(body.cursoId);
    const semestre = toPositiveNumberOrNull(body.semestre);

    const turmaIdsRaw = Array.isArray(body.turmaIds)
      ? body.turmaIds
      : body.turmaId
      ? [body.turmaId]
      : [];

    const turmaIds = turmaIdsRaw
      .map((turmaId) => Number(turmaId))
      .filter((turmaId) => Number.isFinite(turmaId) && turmaId > 0);

    const valorPagoMatricula = toPositiveNumberOrNull(body.valorPagoMatricula);
    const valorMensalidade = toPositiveNumberOrNull(body.valorMensalidade);
    const quantidadeMensalidades = toPositiveNumberOrNull(
      body.quantidadeMensalidades ?? body.quantidadeParcelas
    );

    const primeiroVencimento = body.primeiroVencimento
      ? new Date(body.primeiroVencimento)
      : null;

    const nomeSocial =
      body.nomeSocial !== undefined ? String(body.nomeSocial || "") : undefined;
    const genero =
      body.genero !== undefined ? String(body.genero || "") : undefined;

    if (!id) {
      return NextResponse.json(
        { error: "ID da matrícula é obrigatório" },
        { status: 400 }
      );
    }

    const matriculaExistente = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        aluno: true,
      },
    });

    if (!matriculaExistente) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      );
    }

    if (alunoId) {
      const alunoExiste = await prisma.aluno.findFirst({
        where: {
          id: alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!alunoExiste) {
        return NextResponse.json(
          { error: "Aluno inválido para esta instituição" },
          { status: 400 }
        );
      }
    }

    if (cursoId) {
      const cursoExiste = await prisma.curso.findFirst({
        where: {
          id: cursoId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!cursoExiste) {
        return NextResponse.json(
          { error: "Curso inválido para esta instituição" },
          { status: 400 }
        );
      }
    }

    if (turmaIds.length > 0) {
      const turmasValidas = await prisma.turma.findMany({
        where: {
          id: { in: turmaIds },
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (turmasValidas.length !== turmaIds.length) {
        return NextResponse.json(
          { error: "Uma ou mais turmas são inválidas para esta instituição" },
          { status: 400 }
        );
      }
    }

    await prisma.matricula.update({
      where: { id },
      data: {
        alunoId: alunoId ?? matriculaExistente.alunoId,
        cursoId,
        semestre,
        valorMatricula: valorPagoMatricula,
        valorMensalidade,
        quantidadeMensalidades,
        primeiroVencimento,
      },
    });

    if (Array.isArray(body.turmaIds) || body.turmaId !== undefined) {
      await prisma.itemMatricula.deleteMany({
        where: {
          matriculaId: id,
          instituicaoId: user.instituicaoId,
        },
      });

      if (turmaIds.length > 0) {
        await prisma.itemMatricula.createMany({
          data: turmaIds.map((turmaId) => ({
            matriculaId: id,
            turmaId,
            instituicaoId: user.instituicaoId,
            status: "A_CURSAR" as any,
          })),
        });
      }
    }

    const alunoIdFinal = alunoId ?? matriculaExistente.alunoId;

    if (nomeSocial !== undefined || genero !== undefined) {
      await prisma.aluno.updateMany({
        where: {
          id: alunoIdFinal,
          instituicaoId: user.instituicaoId,
        },
        data: {
          nomeSocial:
            nomeSocial !== undefined ? nomeSocial || null : undefined,
          genero: genero !== undefined ? genero || null : undefined,
        },
      });
    }

    const retorno = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        aluno: true,
        curso: true,
        itens: {
          include: {
            turma: {
              include: {
                disciplina: true,
                professor: true,
                _count: { select: { aulas: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(retorno);
  } catch (error: any) {
    console.error("ERRO AO ATUALIZAR MATRÍCULA:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar matrícula" },
      { status: 500 }
    );
  }
}