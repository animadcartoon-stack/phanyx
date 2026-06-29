import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function inicioDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcularStatus(
  dataInicio: Date,
  dataFim: Date | null,
  statusAtual: string
) {
  if (
    statusAtual === "CANCELADA" ||
    statusAtual === "ENCERRADA" ||
    statusAtual === "SUSPENSA"
  ) {
    return statusAtual;
  }

  const hoje = inicioDoDia(new Date());
  const inicio = inicioDoDia(dataInicio);
  const fim = dataFim ? inicioDoDia(dataFim) : null;

  if (fim && hoje > fim) return "ENCERRADA";
  if (hoje >= inicio && (!fim || hoje <= fim)) return "ATIVA";

  return "AGENDADA";
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const [registros, professores, turmasDisciplinas, professoresDisciplinas] = await Promise.all([
      prisma.substituicaoDocente.findMany({
        where: {
          instituicaoId: user.instituicaoId,
        },
        orderBy: {
          criadoEm: "desc",
        },
        include: {
          professorTitular: {
            select: {
              id: true,
              nome: true,
            },
          },
          professorSubstituto: {
            select: {
              id: true,
              nome: true,
            },
          },
          turma: {
  select: {
    id: true,
    nome: true,
    cursoId: true,
    professorId: true,
    curso: {
      select: {
        id: true,
        nome: true,
      },
    },
  },
},
          disciplina: {
            select: {
              id: true,
              nome: true,
              cursoId: true,
              curso: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      }),

      prisma.professor.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
        },
        orderBy: {
          nome: "asc",
        },
        select: {
          id: true,
          nome: true,
        },
      }),

      prisma.turmaDisciplina.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          turma: {
            instituicaoId: user.instituicaoId,
          },
          disciplina: {
            instituicaoId: user.instituicaoId,
          },
        },
        orderBy: [
          {
            turma: {
              nome: "asc",
            },
          },
          {
            disciplina: {
              nome: "asc",
            },
          },
        ],
        select: {
          id: true,
          professorId: true,
          turmaId: true,
          disciplinaId: true,
          turma: {
            select: {
              id: true,
              nome: true,
              cursoId: true,
              curso: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
         disciplina: {
  select: {
    id: true,
    nome: true,
    cursoId: true,
    professorId: true,
    curso: {
      select: {
        id: true,
        nome: true,
      },
    },
  },
},
          professor: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      prisma.professorDisciplina.findMany({
  where: {
    instituicaoId: user.instituicaoId,
    disciplina: {
      instituicaoId: user.instituicaoId,
      turmaDisciplinas: {
        some: {
          instituicaoId: user.instituicaoId,
        },
      },
    },
  },
  select: {
    professorId: true,
    disciplinaId: true,
  },
}),
    ]);

    const vinculosTitular = turmasDisciplinas
  .flatMap((item) => {
    const titulares = new Set<number>();

    if (item.professorId) {
      titulares.add(item.professorId);
    }

    if (item.professor?.id) {
      titulares.add(item.professor.id);
    }

    if ((item.disciplina as any)?.professorId) {
      titulares.add(Number((item.disciplina as any).professorId));
    }

    if ((item.turma as any)?.professorId) {
      titulares.add(Number((item.turma as any).professorId));
    }

    professoresDisciplinas
  .filter((pd) => pd.disciplinaId === item.disciplinaId)
  .forEach((pd) => titulares.add(pd.professorId));

    return Array.from(titulares).map((professorTitularId) => ({
      id: Number(`${item.id}${professorTitularId}`),
      professorTitularId,
      turmaId: item.turmaId,
      turmaNome: item.turma?.nome || "Turma sem nome",
      disciplinaId: item.disciplinaId,
      disciplinaNome: item.disciplina?.nome || "Disciplina sem nome",
      cursoId: item.turma?.curso?.id || item.disciplina?.curso?.id || null,
      cursoNome:
        item.turma?.curso?.nome ||
        item.disciplina?.curso?.nome ||
        "Curso não informado",
    }));
  });


    const items = registros.map((item) => ({
      id: item.id,
      status: calcularStatus(item.dataInicio, item.dataFim, item.status),
      professorTitular: item.professorTitular,
      professorSubstituto: item.professorSubstituto,
      curso: item.turma?.curso || item.disciplina?.curso || null,
      turma: item.turma,
      disciplina: item.disciplina,
      dataInicio: item.dataInicio,
      dataFim: item.dataFim,
      motivo: item.motivo,
      observacoes: item.observacoes,
    }));

    return NextResponse.json({
      ok: true,
      items,
      professores,
      vinculosTitular,
    });
  } catch (error) {
    console.error("Erro ao listar substituições docentes:", error);

    return NextResponse.json(
      { error: "Erro ao listar substituições docentes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const professorTitularId = Number(body.professorTitularId);
    const professorSubstitutoId = Number(body.professorSubstitutoId);
    const turmaId = Number(body.turmaId);
    const disciplinaId = Number(body.disciplinaId);
    const dataInicio = body.dataInicio ? new Date(body.dataInicio) : null;
    const dataFim = body.semDataFim
      ? null
      : body.dataFim
        ? new Date(body.dataFim)
        : null;

    if (
      !professorTitularId ||
      !professorSubstitutoId ||
      !turmaId ||
      !disciplinaId ||
      !dataInicio
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha professor titular, substituto, turma/disciplina e data inicial.",
        },
        { status: 400 }
      );
    }

    if (professorTitularId === professorSubstitutoId) {
      return NextResponse.json(
        {
          error:
            "O professor substituto não pode ser o mesmo professor titular.",
        },
        { status: 400 }
      );
    }

    if (dataFim && dataFim < dataInicio) {
      return NextResponse.json(
        { error: "A data final não pode ser anterior à data inicial." },
        { status: 400 }
      );
    }

    const vinculoTitular = await prisma.turmaDisciplina.findFirst({
  where: {
    instituicaoId: user.instituicaoId,
    turmaId,
    disciplinaId,
    OR: [
      {
        professorId: professorTitularId,
      },
      {
        turma: {
          professorId: professorTitularId,
        },
      },
      {
        disciplina: {
          professorId: professorTitularId,
        },
      },
      {
        disciplina: {
          professoresHabilitados: {
            some: {
              professorId: professorTitularId,
            },
          },
        },
      },
    ],
  },
  select: {
    id: true,
  },
});

    if (!vinculoTitular) {
      return NextResponse.json(
        {
          error:
            "Esta turma/disciplina não pertence ao professor titular selecionado.",
        },
        { status: 400 }
      );
    }

    const substituto = await prisma.professor.findFirst({
      where: {
        id: professorSubstitutoId,
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!substituto) {
      return NextResponse.json(
        { error: "Professor substituto não encontrado." },
        { status: 404 }
      );
    }

    const substituicaoAberta = await prisma.substituicaoDocente.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        turmaId,
        disciplinaId,
        status: {
          in: ["AGENDADA", "ATIVA", "SUSPENSA"],
        },
      },
      select: {
        id: true,
      },
    });

    if (substituicaoAberta) {
      return NextResponse.json(
        {
          error:
            "Já existe uma substituição aberta para esta turma e disciplina.",
        },
        { status: 400 }
      );
    }

    const statusInicial = calcularStatus(dataInicio, dataFim, "AGENDADA");

    const registro = await prisma.substituicaoDocente.create({
      data: {
        instituicaoId: user.instituicaoId,
        professorTitularId,
        professorSubstitutoId,
        turmaId,
        disciplinaId,
        dataInicio,
        dataFim,
        motivo: body.motivo || null,
        observacoes: body.observacoes || null,
        status: statusInicial,
        criadoPorId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      item: registro,
    });
  } catch (error) {
    console.error("Erro ao criar substituição docente:", error);

    return NextResponse.json(
      { error: "Erro ao criar substituição docente" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const id = Number(body.id);
    const acao = String(body.acao || "").toUpperCase();
    const motivo = body.motivo ? String(body.motivo).trim() : null;

    if (!id || !acao) {
      return NextResponse.json(
        { error: "Informe a substituição e a ação." },
        { status: 400 }
      );
    }

    const registro = await prisma.substituicaoDocente.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!registro) {
      return NextResponse.json(
        { error: "Substituição não encontrada." },
        { status: 404 }
      );
    }

    let novoStatus = registro.status;
    const dadosExtras: any = {};

    if (acao === "ENCERRAR") {
      novoStatus = "ENCERRADA";
    } else if (acao === "SUSPENDER") {
      novoStatus = "SUSPENSA";
    } else if (acao === "REATIVAR") {
      novoStatus = "ATIVA";
    } else if (acao === "CANCELAR") {
      novoStatus = "CANCELADA";
      dadosExtras.canceladoEm = new Date();
      dadosExtras.canceladoPorId = user.id;
      dadosExtras.motivoCancelamento = motivo || "Cancelada pelo administrador.";
    } else {
      return NextResponse.json(
        { error: "Ação inválida." },
        { status: 400 }
      );
    }

    const atualizado = await prisma.substituicaoDocente.update({
      where: { id },
      data: {
        status: novoStatus,
        ...dadosExtras,
      },
    });

    return NextResponse.json({
      ok: true,
      item: atualizado,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar substituição docente:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar substituição docente" },
      { status: 500 }
    );
  }
}