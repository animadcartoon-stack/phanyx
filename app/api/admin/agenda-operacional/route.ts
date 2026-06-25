import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { criarEventoAgenda } from "./agenda-builder";
import { montarDisponibilidadeDocente } from "./disponibilidade-docente";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function inicioDoDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0);
}

function fimDoDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59);
}

function periodoPorFiltro(filtro: string) {
  const hoje = new Date();
  const inicioHoje = inicioDoDia(hoje);
  const ano = hoje.getFullYear();

  if (filtro === "DIA") {
    return { inicio: inicioHoje, fim: fimDoDia(hoje) };
  }

  if (filtro === "SEMANA") {
    const inicio = new Date(inicioHoje);
    inicio.setDate(inicio.getDate() - inicio.getDay());

    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);

    return { inicio, fim: fimDoDia(fim) };
  }

  if (filtro === "MES") {
    const inicio = new Date(ano, hoje.getMonth(), 1);
    const fim = new Date(ano, hoje.getMonth() + 1, 0);

    return { inicio, fim: fimDoDia(fim) };
  }

  if (filtro === "SEMESTRE_1") {
    return {
      inicio: new Date(ano, 0, 1),
      fim: fimDoDia(new Date(ano, 5, 30)),
    };
  }

  if (filtro === "SEMESTRE_2") {
    return {
      inicio: new Date(ano, 6, 1),
      fim: fimDoDia(new Date(ano, 11, 31)),
    };
  }

  if (filtro === "ANO") {
    return {
      inicio: new Date(ano, 0, 1),
      fim: fimDoDia(new Date(ano, 11, 31)),
    };
  }

  return { inicio: inicioHoje, fim: fimDoDia(hoje) };
}

function datasDoPeriodoPorDiaSemana(inicio: Date, fim: Date, diaSemana: number) {
  const datas: Date[] = [];
  const atual = new Date(inicio);

  while (atual <= fim) {
    if (atual.getDay() === diaSemana) {
      datas.push(new Date(atual));
    }

    atual.setDate(atual.getDate() + 1);
  }

  return datas;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

const periodo = String(searchParams.get("periodo") || "SEMANA");

const cursoId = Number(searchParams.get("cursoId") || 0);
const turmaId = Number(searchParams.get("turmaId") || 0);
const professorId = Number(searchParams.get("professorId") || 0);
const funcionarioId = Number(searchParams.get("funcionarioId") || 0);
const disciplinaId = Number(searchParams.get("disciplinaId") || 0);
const departamentoId = Number(searchParams.get("departamentoId") || 0);
const poloId = Number(searchParams.get("poloId") || 0);

const pesquisa = String(searchParams.get("pesquisa") || "").trim();

const { inicio, fim } = periodoPorFiltro(periodo);
    const [
      horarios,
      provas,
      atividades,
      reunioes,
      ferias,
      escalasRH,
      disciplinasSemProfessor,
disponibilidadeDocente,
] = await Promise.all([
      prisma.turmaDisciplinaHorario.findMany({
  where: {
  instituicaoId: user.instituicaoId,
  ativo: true,

  AND: [
    ...(cursoId > 0
      ? [{ turmaDisciplina: { turma: { cursoId } } }]
      : []),

    ...(turmaId > 0
      ? [{ turmaDisciplina: { turmaId } }]
      : []),

    ...(professorId > 0
      ? [{ turmaDisciplina: { professorId } }]
      : []),

    ...(disciplinaId > 0
      ? [{ turmaDisciplina: { disciplinaId } }]
      : []),

    ...(poloId > 0
      ? [{ turmaDisciplina: { turma: { poloId } } }]
      : []),
  ],
},
        include: {
          turmaDisciplina: {
            include: {
              turma: { include: { curso: true, polo: true } },
              disciplina: true,
              professor: true,
            },
          },
        },
        orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      }),

      prisma.prova.findMany({
       where: {
  instituicaoId: user.instituicaoId,

  OR: [
    { disponivelEm: { gte: inicio, lte: fim } },
    { expiraEm: { gte: inicio, lte: fim } },
  ],

  ...(turmaId > 0 && { turmaId }),

  ...(cursoId > 0 && {
    turma: {
      cursoId,
    },
  }),

  ...(pesquisa && {
    titulo: {
      contains: pesquisa,
      mode: "insensitive",
    },
  }),
},
        include: {
  turma: {
    include: {
      curso: true,
      polo: true,
      professor: true,
    },
  },
},
        orderBy: [{ disponivelEm: "asc" }],
      }),

      prisma.atividade.findMany({
        where: {
  instituicaoId: user.instituicaoId,

  prazo: {
    gte: inicio,
    lte: fim,
  },

  ...(turmaId > 0 && { turmaId }),

  ...(disciplinaId > 0 && { disciplinaId }),

  ...(professorId > 0 && {
    professorResponsavelId: professorId,
  }),

  ...(pesquisa && {
    titulo: {
      contains: pesquisa,
      mode: "insensitive",
      },
  }),
},
        include: {
  turma: {
    include: {
      curso: true,
      polo: true,
    },
  },
  disciplina: true,
  professorResponsavel: true,
},
        orderBy: [{ prazo: "asc" }],
      }),

      prisma.reuniao.findMany({
        where: {
  instituicaoId: user.instituicaoId,

  dataHora: {
    gte: inicio,
    lte: fim,
  },

  ...(pesquisa && {
    OR: [
      {
        titulo: {
          contains: pesquisa,
          mode: "insensitive",
        },
      },
      {
        descricao: {
          contains: pesquisa,
          mode: "insensitive",
        },
      },
    ],
  }),
},
        orderBy: [{ dataHora: "asc" }],
      }),

      prisma.feriasRH.findMany({
        where: {
  instituicaoId: user.instituicaoId,
  arquivada: false,

  OR: [
    { dataInicio: { gte: inicio, lte: fim } },
    { dataFim: { gte: inicio, lte: fim } },
  ],

  ...(funcionarioId > 0 && {
    funcionarioId,
  }),

  ...(departamentoId > 0 && {
    funcionario: {
      departamentoId,
    },
  }),

  ...(pesquisa && {
    funcionario: {
      nome: {
        contains: pesquisa,
        mode: "insensitive",
      },
    },
  }),
},
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              departamento: { select: { nome: true } },
            },
          },
        },
        orderBy: [{ dataInicio: "asc" }],
      }),

      prisma.escalaTrabalhoRH.findMany({
        where: {
  instituicaoId: user.instituicaoId,
  ativo: true,

  ...(funcionarioId > 0 && {
    funcionarioId,
  }),

  ...(departamentoId > 0 && {
    funcionario: {
      departamentoId,
    },
  }),

  ...(pesquisa && {
    funcionario: {
      nome: {
        contains: pesquisa,
        mode: "insensitive",
      },
    },
  }),
},
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              departamento: { select: { nome: true } },
            },
          },
        },
      }),

      prisma.turmaDisciplina.findMany({
        where: {
  instituicaoId: user.instituicaoId,
  professorId: null,

  ...(cursoId > 0 && {
    turma: {
      cursoId,
    },
  }),

  ...(turmaId > 0 && {
    turmaId,
  }),

  ...(disciplinaId > 0 && {
    disciplinaId,
  }),

  ...(poloId > 0 && {
    turma: {
      poloId,
    },
  }),
},
        include: {
          turma: { include: { curso: true } },
          disciplina: true,
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      montarDisponibilidadeDocente(user.instituicaoId),
    ]);

    const aulasAgenda = horarios.flatMap((item) => {
  const datas = datasDoPeriodoPorDiaSemana(inicio, fim, item.diaSemana);

  return datas.map((dataAula) =>
  criarEventoAgenda({
  id: `aula-${item.id}-${dataAula.toISOString()}`,
  tipo: "AULA",

  data: dataAula,
  hora: item.horaInicio || "",

  curso: item.turmaDisciplina?.turma?.curso?.nome || "",
  turma: item.turmaDisciplina?.turma?.nome || "",
  disciplina: item.turmaDisciplina?.disciplina?.nome || "",
  professor: item.turmaDisciplina?.professor?.nome || "",
  funcionario: "",
  departamento: "",
  polo: item.turmaDisciplina?.turma?.polo?.nome || "",

  titulo: `${item.turmaDisciplina?.disciplina?.nome || "Aula"} - ${
    item.turmaDisciplina?.turma?.nome || "Turma"
  }`,
  evento: item.turmaDisciplina?.disciplina?.nome || "Aula",
  descricao: "",

  responsavel: item.turmaDisciplina?.professor?.nome ? "" : "Coordenação",
  local: "",
  observacoes: item.horaFim ? `Até ${item.horaFim}` : "",
  status: item.turmaDisciplina?.status || "PROGRAMADA",
})
);
});

const agenda = [
  ...aulasAgenda,

  ...provas.map((item) =>
  criarEventoAgenda({
  id: `prova-${item.id}`,
  tipo: "PROVA",
  data: item.disponivelEm || item.expiraEm,
  hora: item.disponivelEm
    ? new Date(item.disponivelEm).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
  titulo: item.titulo,
  evento: item.titulo,
  curso: item.turma?.curso?.nome || "",
  turma: item.turma?.nome || "",
  disciplina: "",
  professor: item.turma?.professor?.nome || "",
  funcionario: "",
  departamento: "",
  polo: item.turma?.polo?.nome || "",
  local: "",
  observacoes: "",
  descricao: "",
  responsavel: item.turma?.professor?.nome ? "" : "Coordenação",
  status: item.status,
})
),

  ...atividades.map((item) =>
  criarEventoAgenda({
  id: `atividade-${item.id}`,
  tipo: "ATIVIDADE",

  data: item.prazo,
  hora: item.prazo
    ? new Date(item.prazo).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",

  curso: item.turma?.curso?.nome || "",
  turma: item.turma?.nome || "",
  disciplina: item.disciplina?.nome || "",
  professor: item.professorResponsavel?.nome || "",
  funcionario: "",
  departamento: "",
  polo: item.turma?.polo?.nome || "",

  titulo: item.titulo,
  evento: item.titulo,
  descricao: "",

  responsavel: item.professorResponsavel?.nome ? "" : "Coordenação",
  local: "",
  observacoes: "",
  status: item.status,
})
),

  ...reunioes.map((item) =>
  criarEventoAgenda({
  id: `reuniao-${item.id}`,
  tipo: "REUNIAO",

  data: item.dataHora,
  hora: item.dataHora
    ? new Date(item.dataHora).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",

  curso: "",
  turma: "",
  disciplina: "",
  professor: "",
  funcionario: "",
  departamento: "",
  polo: "",

  titulo: item.titulo,
  evento: item.titulo,
  descricao: "",

  responsavel: "Administração",
  local: "",
  observacoes: item.publicoTipo || "",
  status: item.status,
})
),

  ...ferias.map((item) =>
  criarEventoAgenda({
  id: `ferias-${item.id}`,
  tipo: "FERIAS",

  data: item.dataInicio,
  hora: "",

  curso: "",
  turma: "",
  disciplina: "",
  professor: "",
  funcionario: item.funcionario?.nome || "",
  departamento: item.funcionario?.departamento?.nome || "",
  polo: "",

  titulo: `Férias - ${item.funcionario?.nome || "Funcionário"}`,
  evento: "Férias",
  descricao: "",

  responsavel: "RH",
  local: "",
  observacoes: item.funcionario?.cargo || "",
  status: item.status,
})
),

].sort((a, b) => {
  const dataA = a.data ? new Date(a.data).getTime() : 0;
  const dataB = b.data ? new Date(b.data).getTime() : 0;
  return dataA - dataB;
});

    return NextResponse.json({
      periodo,
      inicio,
      fim,
      agenda,
      resumo: {
        aulas: aulasAgenda.length,
        provas: provas.length,
        atividades: atividades.length,
        reunioes: reunioes.length,
        ferias: ferias.length,
        escalasRH: escalasRH.length,
        disciplinasSemProfessor: disciplinasSemProfessor.length,
        professoresAtivos: disponibilidadeDocente.length,
      },
      horarios,
      provas,
      atividades,
      reunioes,
      ferias,
      escalasRH,
      disciplinasSemProfessor,
      disponibilidadeDocente,
    });

  } catch (error: any) {
    console.error("Erro ao carregar agenda operacional:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar agenda operacional" },
      { status: 500 }
    );
  }
}