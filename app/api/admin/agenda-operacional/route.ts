import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

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
    ] = await Promise.all([
      prisma.turmaDisciplinaHorario.findMany({
  where: {
    instituicaoId: user.instituicaoId,
    ativo: true,

    ...(cursoId > 0 && {
      turmaDisciplina: {
        turma: {
          cursoId,
        },
      },
    }),
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
        },
        include: {
          turma: true,
        },
        orderBy: [{ disponivelEm: "asc" }],
      }),

      prisma.atividade.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          prazo: { gte: inicio, lte: fim },
        },
        include: {
          turma: true,
          disciplina: true,
          professorResponsavel: true,
        },
        orderBy: [{ prazo: "asc" }],
      }),

      prisma.reuniao.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          dataHora: { gte: inicio, lte: fim },
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
        },
        include: {
          turma: { include: { curso: true } },
          disciplina: true,
        },
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    const aulasAgenda = horarios.flatMap((item) => {
  const datas = datasDoPeriodoPorDiaSemana(inicio, fim, item.diaSemana);

  return datas.map((dataAula) => ({
    id: `aula-${item.id}-${dataAula.toISOString()}`,
    tipo: "AULA",
    data: dataAula,
    hora: item.horaInicio || "",
    titulo: `${item.turmaDisciplina?.disciplina?.nome || "Aula"} - ${
      item.turmaDisciplina?.turma?.nome || "Turma"
    }`,
    descricao: item.turmaDisciplina?.turma?.curso?.nome || "",
    responsavel: item.turmaDisciplina?.professor?.nome || "Sem professor",
    status: item.turmaDisciplina?.status || "PROGRAMADA",
  }));
});

const agenda = [
  ...aulasAgenda,

  ...provas.map((item) => ({
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
    descricao: item.turma?.nome || "",
    responsavel: "Professor / Coordenação",
    status: item.status,
  })),

  ...atividades.map((item) => ({
    id: `atividade-${item.id}`,
    tipo: "ATIVIDADE",
    data: item.prazo,
    hora: item.prazo
      ? new Date(item.prazo).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    titulo: item.titulo,
    descricao: item.turma?.nome || item.disciplina?.nome || "",
    responsavel: item.professorResponsavel?.nome || "Professor / Coordenação",
    status: item.status,
  })),

  ...reunioes.map((item) => ({
    id: `reuniao-${item.id}`,
    tipo: "REUNIAO",
    data: item.dataHora,
    hora: item.dataHora
      ? new Date(item.dataHora).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    titulo: item.titulo,
    descricao: item.publicoTipo || "",
    responsavel: "Administração",
    status: item.status,
  })),

  ...ferias.map((item) => ({
    id: `ferias-${item.id}`,
    tipo: "FERIAS",
    data: item.dataInicio,
    hora: "",
    titulo: `Férias - ${item.funcionario?.nome || "Funcionário"}`,
    descricao: `${item.funcionario?.cargo || ""} ${
      item.funcionario?.departamento?.nome
        ? `• ${item.funcionario.departamento.nome}`
        : ""
    }`,
    responsavel: "RH",
    status: item.status,
  })),
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
      },
      horarios,
      provas,
      atividades,
      reunioes,
      ferias,
      escalasRH,
      disciplinasSemProfessor,
    });
  } catch (error: any) {
    console.error("Erro ao carregar agenda operacional:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar agenda operacional" },
      { status: 500 }
    );
  }
}