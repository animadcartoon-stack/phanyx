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

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values.filter((v) => Number.isFinite(v) && v > 0)));
}

type TipoItemMatricula =
  | "GRADE_PRINCIPAL"
  | "EXTRA_MESMO_CURSO"
  | "EXTRA_OUTRO_CURSO";

type MatriculaBody = {
  id?: number | string;
  alunoId?: number | string;
  cursoId?: number | string;
  cursoSemestreId?: number | string;
  periodoMatriculaId?: number | string;
  semestre?: number | string;
  periodoLetivo?: string;
  turmaId?: number | string;
  turmaIds?: Array<number | string>;
  disciplinaIds?: Array<number | string>;
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
  realizadaPeloAluno?: boolean;
};

type TurmaComDisciplina = {
  id: number;
  nome: string;
  semestre: string;
  disciplinaId: number;
  disciplina: {
    id: number;
    nome: string;
    cursoId: number | null;
    semestre: number | null;
  };
};

async function buscarDisciplinasAprovadasDoAluno(
  alunoId: number,
  instituicaoId: number
) {
  const resultados = await prisma.resultadoFinal.findMany({
    where: {
      alunoId,
      instituicaoId,
      situacao: "APROVADO",
    },
    select: {
      disciplinaId: true,
    },
  });

  return new Set(resultados.map((r) => r.disciplinaId));
}

async function validarPreRequisitos(
  alunoId: number,
  instituicaoId: number,
  disciplinaIdsSelecionadas: number[]
) {
  const disciplinaIdsUnicas = uniqueNumbers(disciplinaIdsSelecionadas);

  if (disciplinaIdsUnicas.length === 0) {
    return { ok: true as const };
  }

  const preRequisitos = await prisma.disciplinaPreRequisito.findMany({
    where: {
      instituicaoId,
      disciplinaId: { in: disciplinaIdsUnicas },
    },
    include: {
      disciplina: {
        select: { id: true, nome: true },
      },
      prerequisito: {
        select: { id: true, nome: true },
      },
    },
  });

  if (preRequisitos.length === 0) {
    return { ok: true as const };
  }

  const aprovadas = await buscarDisciplinasAprovadasDoAluno(
    alunoId,
    instituicaoId
  );

  const faltantes = preRequisitos.filter(
    (item) => !aprovadas.has(item.prerequisitoId)
  );

  if (faltantes.length === 0) {
    return { ok: true as const };
  }

  const mensagens = faltantes.map(
    (item) =>
      `"${item.disciplina.nome}" exige "${item.prerequisito.nome}" concluída/aprovada`
  );

  return {
    ok: false as const,
    error:
      "O aluno não pode se matricular em algumas disciplinas por falta de pré-requisito: " +
      mensagens.join("; "),
  };
}

async function buscarDisciplinaIdsDaGradeDoSemestre(
  instituicaoId: number,
  cursoId: number | null,
  semestre: number | null,
  cursoSemestreId?: number | null
) {
  if (!cursoId) return new Set<number>();

  let cursoSemestre = null;

  if (cursoSemestreId) {
    cursoSemestre = await prisma.cursoSemestre.findFirst({
      where: {
        id: cursoSemestreId,
        cursoId,
        instituicaoId,
      },
      select: { id: true },
    });
  }

  if (!cursoSemestre && semestre !== null) {
    cursoSemestre = await prisma.cursoSemestre.findFirst({
      where: {
        cursoId,
        instituicaoId,
        numero: semestre,
      },
      select: { id: true },
    });
  }

  if (!cursoSemestre) return new Set<number>();

  const itens = await prisma.cursoSemestreDisciplina.findMany({
    where: {
      instituicaoId,
      cursoSemestreId: cursoSemestre.id,
    },
    select: {
      disciplinaId: true,
    },
  });

  return new Set(itens.map((item) => item.disciplinaId));
}

async function buscarDisciplinaIdsExtrasPermitidas(
  instituicaoId: number,
  cursoId: number | null
) {
  if (!cursoId) return new Set<number>();

  const itens = await prisma.cursoDisciplinaExtraPermitida.findMany({
    where: {
      instituicaoId,
      cursoId,
    },
    select: {
      disciplinaId: true,
    },
  });

  return new Set(itens.map((item) => item.disciplinaId));
}

function montarResumoContratacao(
  itens: Array<{
    turma: {
      nome: string;
    };
    disciplina: {
      nome: string;
    };
    tipoItem: TipoItemMatricula;
  }>
) {
  const linhas = itens.map((item) => {
    const rotuloTipo =
      item.tipoItem === "GRADE_PRINCIPAL"
        ? "Grade principal"
        : item.tipoItem === "EXTRA_MESMO_CURSO"
        ? "Extra do mesmo curso"
        : "Extra de outro curso";

    return `- ${item.disciplina.nome} (Turma: ${item.turma.nome}) — ${rotuloTipo}`;
  });

  return linhas.join("\n");
}

async function classificarItensMatricula(params: {
  instituicaoId: number;
  cursoIdFinal: number | null;
  semestreFinal: number | null;
  cursoSemestreId?: number | null;
  turmas: TurmaComDisciplina[];
}) {
  const {
    instituicaoId,
    cursoIdFinal,
    semestreFinal,
    cursoSemestreId,
    turmas,
  } = params;

  const disciplinaIdsGrade = await buscarDisciplinaIdsDaGradeDoSemestre(
    instituicaoId,
    cursoIdFinal,
    semestreFinal,
    cursoSemestreId ?? null
  );

  const disciplinaIdsExtrasPermitidas = await buscarDisciplinaIdsExtrasPermitidas(
    instituicaoId,
    cursoIdFinal
  );

  const itens = turmas.map((turma) => {
    let tipoItem: TipoItemMatricula;

    if (disciplinaIdsGrade.has(turma.disciplinaId)) {
      tipoItem = "GRADE_PRINCIPAL";
    } else if (
      cursoIdFinal &&
      turma.disciplina.cursoId &&
      turma.disciplina.cursoId === cursoIdFinal
    ) {
      tipoItem = "EXTRA_MESMO_CURSO";
    } else if (disciplinaIdsExtrasPermitidas.has(turma.disciplinaId)) {
      tipoItem = "EXTRA_OUTRO_CURSO";
    } else {
      throw new Error(
        `A disciplina "${turma.disciplina.nome}" não pertence à grade principal nem às disciplinas extras permitidas para este curso.`
      );
    }

    return {
      turmaId: turma.id,
      disciplinaId: turma.disciplinaId,
      tipoItem,
    };
  });

  return itens;
}

function removerItensDuplicadosPorTurma(
  itens: Array<{
    turmaId: number;
    disciplinaId: number;
    tipoItem: TipoItemMatricula;
  }>
) {
  const vistos = new Set<number>();

  return itens.filter((item) => {
    if (vistos.has(item.turmaId)) return false;
    vistos.add(item.turmaId);
    return true;
  });
}

const includeMatricula = {
  aluno: true,
  curso: true,
  cursoSemestre: true,
  periodoMatricula: true,
  itens: {
    include: {
      disciplina: true,
      turma: {
        include: {
          disciplinas: {
            include: {
              disciplina: true,
            },
          },
          professor: true,
          _count: { select: { aulas: true } },
        },
      },
    },
  },
} as const;

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
        include: includeMatricula,
        orderBy: { id: "desc" },
      });

      return NextResponse.json(matriculas);
    }

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      const matriculas = await prisma.matricula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
        },
        include: includeMatricula,
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
        include: includeMatricula,
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

async function buscarTurmasComDisciplinas(params: {
  turmaIds: number[];
  instituicaoId: number;
  disciplinaIdsBody?: number[];
}) {
  const { turmaIds, instituicaoId, disciplinaIdsBody = [] } = params;

  const turmas = await prisma.turma.findMany({
    where: {
      id: { in: turmaIds },
      instituicaoId,
    },
    include: {
      disciplinas: {
        include: {
          disciplina: {
            include: {
              curso: true,
            },
          },
        },
      },
      professor: true,
    },
  });

  const turmasComDisciplinas = turmas.flatMap((turma) => {
    let disciplinasParaUsar = turma.disciplinas;

    if (disciplinaIdsBody.length > 0) {
      const filtradas = turma.disciplinas.filter((td) =>
        disciplinaIdsBody.includes(td.disciplinaId)
      );

      if (filtradas.length > 0) {
        disciplinasParaUsar = filtradas;
      }
    }

    return disciplinasParaUsar.map((td) => ({
      id: turma.id,
      nome: turma.nome,
      semestre: turma.semestre,
      disciplinaId: td.disciplinaId,
      disciplina: td.disciplina,
    }));
  });

  return { turmas, turmasComDisciplinas };
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;

    const alunoId = Number(body.alunoId);
    const cursoIdBody = body.cursoId ? Number(body.cursoId) : null;
    const cursoSemestreId = toPositiveNumberOrNull(body.cursoSemestreId);
    const periodoMatriculaId = toPositiveNumberOrNull(body.periodoMatriculaId);
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

    const turmaIds = uniqueNumbers(
      turmaIdsRaw
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    );

    const disciplinaIdsBody = uniqueNumbers(
      Array.isArray(body.disciplinaIds)
        ? body.disciplinaIds.map((id) => Number(id))
        : []
    );

    if (!alunoId || turmaIds.length === 0) {
      return NextResponse.json(
        { error: "Aluno e disciplinas/turmas são obrigatórios" },
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

    const { turmas, turmasComDisciplinas } = await buscarTurmasComDisciplinas({
      turmaIds,
      instituicaoId: user.instituicaoId,
      disciplinaIdsBody,
    });

    if (turmas.length !== turmaIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais turmas são inválidas para esta instituição" },
        { status: 400 }
      );
    }

    if (turmasComDisciplinas.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma disciplina válida foi encontrada para a turma selecionada." },
        { status: 400 }
      );
    }

    const disciplinaIdsSelecionadas = uniqueNumbers(
      turmasComDisciplinas.map((turma) => turma.disciplinaId)
    );

    const validacaoPreReq = await validarPreRequisitos(
      alunoId,
      user.instituicaoId,
      disciplinaIdsSelecionadas
    );

    if (!validacaoPreReq.ok) {
      return NextResponse.json(
        { error: validacaoPreReq.error },
        { status: 400 }
      );
    }

    const cursoIdsEncontrados: number[] = [];
    for (const turma of turmasComDisciplinas) {
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
    for (const turma of turmasComDisciplinas) {
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

    const periodoMatricula =
      periodoMatriculaId !== null
        ? await prisma.periodoMatricula.findFirst({
            where: {
              id: periodoMatriculaId,
              instituicaoId: user.instituicaoId,
            },
          })
        : null;

    if (periodoMatriculaId && !periodoMatricula) {
      return NextResponse.json(
        { error: "Período de matrícula inválido para esta instituição" },
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

    const itensClassificados = removerItensDuplicadosPorTurma(
  await classificarItensMatricula({
    instituicaoId: user.instituicaoId,
    cursoIdFinal,
    semestreFinal,
    cursoSemestreId,
    turmas: turmasComDisciplinas as TurmaComDisciplina[],
  })
);

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

    const dataPrimeiroVencimento =
      toDateOrNull(body.dataPrimeiroVencimento) ??
      toDateOrNull(body.primeiroVencimento) ??
      new Date();

    const statusRecebido = String(body.status || "ATIVA").trim().toUpperCase();

    const statusInicialMatricula =
      statusRecebido === "A_INICIAR" ? "A_INICIAR" : "ATIVA";

    const statusInicialItens =
      statusInicialMatricula === "A_INICIAR" ? "A_CURSAR" : "EM_CURSO";

    const periodoLetivoFinal =
      String(body.periodoLetivo || "").trim() ||
      periodoMatricula?.periodoLetivo ||
      (semestreFinal !== null ? `${semestreFinal}` : null);

    const matricula = await prisma.matricula.create({
      data: {
        alunoId,
        cursoId: cursoIdFinal,
        cursoSemestreId,
        periodoMatriculaId,
        periodoLetivo: periodoLetivoFinal || null,
        realizadaPeloAluno: Boolean(body.realizadaPeloAluno),
        confirmadaEm: new Date(),
        semestre: semestreFinal,
        instituicaoId: user.instituicaoId,
        status: statusInicialMatricula as any,
        valorMatricula: Number.isFinite(valorMatricula) ? valorMatricula : null,
        valorMensalidade: Number.isFinite(valorMensalidade)
          ? valorMensalidade
          : null,
        quantidadeMensalidades: Number.isFinite(quantidadeParcelas)
          ? quantidadeParcelas
          : null,
        primeiroVencimento: dataPrimeiroVencimento,
        itens: {
          create: itensClassificados.map((item) => ({
            turmaId: item.turmaId,
            disciplinaId: item.disciplinaId,
            tipoItem: item.tipoItem as any,
            instituicaoId: user.instituicaoId,
            status: statusInicialItens as any,
          })),
        },
      },
      include: includeMatricula,
    });

    const resumoContratacao = montarResumoContratacao(
      matricula.itens.map((item) => ({
        turma: { nome: item.turma.nome },
        disciplina: { nome: item.disciplina.nome },
        tipoItem: item.tipoItem as TipoItemMatricula,
      }))
    );

    const contratoTexto = `
CONTRATO DE MATRÍCULA

Instituição ID: ${user.instituicaoId}
Aluno: ${aluno.nome ?? "Aluno"}
Email: ${aluno.user?.email ?? "-"}
Curso: ${curso?.nome ?? "Curso não informado"}
Semestre: ${semestreFinal ?? "-"}
Período letivo: ${periodoLetivoFinal ?? "-"}
Disciplinas contratadas:
${resumoContratacao || "-"}

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
        matriculaId: matricula.id,
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
      include: includeMatricula,
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

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
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

    await prisma.documentoAluno.deleteMany({
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

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;

    const id = Number(body.id);
    const alunoId = toPositiveNumberOrNull(body.alunoId);
    const cursoId = toPositiveNumberOrNull(body.cursoId);
    const cursoSemestreId = toPositiveNumberOrNull(body.cursoSemestreId);
    const periodoMatriculaId = toPositiveNumberOrNull(body.periodoMatriculaId);
    const semestre = toPositiveNumberOrNull(body.semestre);

    const turmaIdsRaw = Array.isArray(body.turmaIds)
      ? body.turmaIds
      : body.turmaId
      ? [body.turmaId]
      : [];

    const turmaIds = uniqueNumbers(
      turmaIdsRaw
        .map((turmaId) => Number(turmaId))
        .filter((turmaId) => Number.isFinite(turmaId) && turmaId > 0)
    );

    const disciplinaIdsBody = uniqueNumbers(
      Array.isArray(body.disciplinaIds)
        ? body.disciplinaIds.map((disciplinaId) => Number(disciplinaId))
        : []
    );

    const valorPagoMatricula = toPositiveNumberOrNull(body.valorPagoMatricula);
    const valorMensalidade = toPositiveNumberOrNull(body.valorMensalidade);
    const quantidadeMensalidades = toPositiveNumberOrNull(
      body.quantidadeMensalidades ?? body.quantidadeParcelas
    );

    const primeiroVencimento =
      toDateOrNull(body.primeiroVencimento) ??
      toDateOrNull(body.dataPrimeiroVencimento);

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

    const alunoIdFinal = alunoId ?? matriculaExistente.alunoId;
    const cursoIdFinal = cursoId ?? matriculaExistente.cursoId ?? null;
    const semestreFinal = semestre ?? matriculaExistente.semestre ?? null;

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

    if (cursoIdFinal) {
      const cursoExiste = await prisma.curso.findFirst({
        where: {
          id: cursoIdFinal,
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

    let itensClassificados: Array<{
      turmaId: number;
      disciplinaId: number;
      tipoItem: TipoItemMatricula;
    }> = [];

    if (Array.isArray(body.turmaIds) || body.turmaId !== undefined) {
      const { turmas, turmasComDisciplinas } = await buscarTurmasComDisciplinas({
        turmaIds,
        instituicaoId: user.instituicaoId,
        disciplinaIdsBody,
      });

      if (turmas.length !== turmaIds.length) {
        return NextResponse.json(
          { error: "Uma ou mais turmas são inválidas para esta instituição" },
          { status: 400 }
        );
      }

      const disciplinaIdsSelecionadas = uniqueNumbers(
        turmasComDisciplinas.map((turma) => turma.disciplinaId)
      );

      const validacaoPreReq = await validarPreRequisitos(
        alunoIdFinal,
        user.instituicaoId,
        disciplinaIdsSelecionadas
      );

      if (!validacaoPreReq.ok) {
        return NextResponse.json(
          { error: validacaoPreReq.error },
          { status: 400 }
        );
      }

      itensClassificados = removerItensDuplicadosPorTurma(
        await classificarItensMatricula({
          instituicaoId: user.instituicaoId,
          cursoIdFinal,
          semestreFinal,
          cursoSemestreId:
            cursoSemestreId ?? matriculaExistente.cursoSemestreId ?? null,
          turmas: turmasComDisciplinas as TurmaComDisciplina[],
        })
      );
    }

    await prisma.matricula.update({
      where: { id },
      data: {
        alunoId: alunoIdFinal,
        cursoId: cursoIdFinal,
        cursoSemestreId:
          cursoSemestreId ?? matriculaExistente.cursoSemestreId ?? null,
        periodoMatriculaId:
          periodoMatriculaId ?? matriculaExistente.periodoMatriculaId ?? null,
        periodoLetivo:
          String(body.periodoLetivo || "").trim() ||
          matriculaExistente.periodoLetivo ||
          null,
        semestre: semestreFinal,
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

      if (itensClassificados.length > 0) {
        await prisma.itemMatricula.createMany({
          data: itensClassificados.map((item) => ({
            matriculaId: id,
            turmaId: item.turmaId,
            disciplinaId: item.disciplinaId,
            tipoItem: item.tipoItem as any,
            instituicaoId: user.instituicaoId,
            status: "A_CURSAR" as any,
          })),
        });
      }
    }

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
      include: includeMatricula,
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
