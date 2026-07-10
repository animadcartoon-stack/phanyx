import { prisma } from "@/lib/prisma";

export type TipoPessoaAniversariante = "ALUNO" | "PROFESSOR" | "FUNCIONARIO";

export type FiltrosAniversariantes = {
  mes: number;
  tipo: string;
  busca: string;
  status: string;
  whatsapp: string;
  departamentoId: number | null;
  poloId: number | null;
};

export type AniversarianteItem = {
  chave: string;
  id: number;
  tipo: TipoPessoaAniversariante;
  nome: string;
  dataNascimento: string;
  dataAniversario: string;
  dia: number;
  mes: number;
  telefone: string | null;
  whatsapp: string;
  temWhatsapp: boolean;
  userId: number;
  fotoPerfil: string | null;
  status: string;
  contexto: string;
  departamentoId: number | null;
  departamento: string | null;
  poloId: number | null;
  polo: string | null;
};

function textoLimpo(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mesNascimento(data: Date) {
  return data.getUTCMonth() + 1;
}

function diaNascimento(data: Date) {
  return data.getUTCDate();
}

function dataDiaMes(data: Date) {
  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

function somenteNumeros(valor: string | null | undefined) {
  return String(valor || "").replace(/\D/g, "");
}

function statusAluno(item: { ativo: boolean; statusAluno: unknown }) {
  if (!item.ativo) return "INATIVO";
  return String(item.statusAluno || "ATIVO");
}

function statusProfessor(item: {
  ativo: boolean;
  statusProfessor?: string | null;
}) {
  if (!item.ativo) return "INATIVO";
  return String(item.statusProfessor || "ATIVO");
}

function statusFuncionario(item: {
  ativo: boolean;
  statusFuncionario: string | null;
}) {
  if (!item.ativo) return "INATIVO";
  return String(item.statusFuncionario || "ATIVO");
}

function statusCombina(statusAtual: string, filtro: string) {
  if (!filtro || filtro === "TODOS") return true;

  const atual = textoLimpo(statusAtual);
  const procurado = textoLimpo(filtro);

  return atual.includes(procurado);
}

export function obterFiltrosAniversariantes(
  req: Request
): FiltrosAniversariantes {
  const { searchParams } = new URL(req.url);

  const mesParam = Number(searchParams.get("mes"));

  const mes =
    Number.isFinite(mesParam) && mesParam >= 1 && mesParam <= 12
      ? mesParam
      : new Date().getMonth() + 1;

  const tipo = String(searchParams.get("tipo") || "TODOS").toUpperCase();
  const busca = textoLimpo(searchParams.get("busca") || "");
  const status = String(searchParams.get("status") || "TODOS").toUpperCase();
  const whatsapp = String(
    searchParams.get("whatsapp") || "TODOS"
  ).toUpperCase();

  const departamentoIdParam = searchParams.get("departamentoId");
  const departamentoId =
    departamentoIdParam && departamentoIdParam !== "TODOS"
      ? Number(departamentoIdParam)
      : null;

  const poloIdParam = searchParams.get("poloId");
  const poloId =
    poloIdParam && poloIdParam !== "TODOS" ? Number(poloIdParam) : null;

  return {
    mes,
    tipo,
    busca,
    status,
    whatsapp,
    departamentoId:
      departamentoId && Number.isFinite(departamentoId)
        ? departamentoId
        : null,
    poloId: poloId && Number.isFinite(poloId) ? poloId : null,
  };
}

export async function listarAniversariantes({
  instituicaoId,
  filtros,
}: {
  instituicaoId: number;
  filtros: FiltrosAniversariantes;
}) {
  const podeBuscarAlunos =
    filtros.tipo === "TODOS" || filtros.tipo === "ALUNO";

  const podeBuscarProfessores =
    filtros.tipo === "TODOS" || filtros.tipo === "PROFESSOR";

  const podeBuscarFuncionarios =
    filtros.tipo === "TODOS" || filtros.tipo === "FUNCIONARIO";

  const [
    instituicao,
    departamentos,
    polos,
    alunos,
    professores,
    funcionarios,
  ] = await Promise.all([
    prisma.instituicao.findUnique({
  where: {
    id: instituicaoId,
  },
  select: {
    nome: true,
    telefone: true,
  },
}),

    prisma.departamento.findMany({
      where: {
        instituicaoId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: "asc",
      },
    }),

    prisma.polo.findMany({
      where: {
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: "asc",
      },
    }),

    podeBuscarAlunos && !filtros.departamentoId
      ? prisma.aluno.findMany({
          where: {
            instituicaoId,
            dataNascimento: {
              not: null,
            },
            ...(filtros.poloId
              ? {
                  poloId: filtros.poloId,
                }
              : {}),
          },
          select: {
            id: true,
            nome: true,
            dataNascimento: true,
            telefone: true,
            ativo: true,
            statusAluno: true,
            userId: true,
            fotoPerfil: true,
            poloId: true,
            polo: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            nome: "asc",
          },
        })
      : Promise.resolve([]),

    podeBuscarProfessores && !filtros.departamentoId
      ? prisma.professor.findMany({
          where: {
            instituicaoId,
            dataNascimento: {
              not: null,
            },
            ...(filtros.poloId
              ? {
                  poloId: filtros.poloId,
                }
              : {}),
          },
          select: {
            id: true,
            nome: true,
            dataNascimento: true,
            telefone: true,
            ativo: true,
            userId: true,
            fotoPerfil: true,
            especialidade: true,
            titulacao: true,
            poloId: true,
            polo: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            nome: "asc",
          },
        })
      : Promise.resolve([]),

    podeBuscarFuncionarios && !filtros.poloId
      ? prisma.funcionario.findMany({
          where: {
            instituicaoId,
            dataNascimento: {
              not: null,
            },
            ...(filtros.departamentoId
              ? {
                  departamentoId: filtros.departamentoId,
                }
              : {}),
          },
          select: {
            id: true,
            nome: true,
            dataNascimento: true,
            telefone: true,
            ativo: true,
            statusFuncionario: true,
            userId: true,
            fotoPerfil: true,
            cargo: true,
            setor: true,
            departamentoId: true,
            departamento: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            nome: "asc",
          },
        })
      : Promise.resolve([]),
  ]);

  const listaAlunos: AniversarianteItem[] = alunos.map((aluno) => {
    const dataNascimento = aluno.dataNascimento as Date;
    const status = statusAluno(aluno);

    return {
      chave: `ALUNO-${aluno.id}`,
      id: aluno.id,
      tipo: "ALUNO",
      nome: aluno.nome,
      dataNascimento: dataNascimento.toISOString(),
      dataAniversario: dataDiaMes(dataNascimento),
      dia: diaNascimento(dataNascimento),
      mes: mesNascimento(dataNascimento),
      telefone: aluno.telefone,
      whatsapp: somenteNumeros(aluno.telefone),
      temWhatsapp: somenteNumeros(aluno.telefone).length >= 10,
      userId: aluno.userId,
      fotoPerfil: aluno.fotoPerfil,
      status,
      contexto: "Aluno",
      departamentoId: null,
      departamento: null,
      poloId: aluno.poloId,
      polo: aluno.polo?.nome || null,
    };
  });

  const listaProfessores: AniversarianteItem[] = professores.map(
    (professor) => {
      const dataNascimento = professor.dataNascimento as Date;
      const status = statusProfessor(professor);

      return {
        chave: `PROFESSOR-${professor.id}`,
        id: professor.id,
        tipo: "PROFESSOR",
        nome: professor.nome,
        dataNascimento: dataNascimento.toISOString(),
        dataAniversario: dataDiaMes(dataNascimento),
        dia: diaNascimento(dataNascimento),
        mes: mesNascimento(dataNascimento),
        telefone: professor.telefone,
        whatsapp: somenteNumeros(professor.telefone),
        temWhatsapp: somenteNumeros(professor.telefone).length >= 10,
        userId: professor.userId,
        fotoPerfil: professor.fotoPerfil,
        status,
        contexto:
          professor.especialidade || professor.titulacao || "Professor",
        departamentoId: null,
        departamento: null,
        poloId: professor.poloId,
        polo: professor.polo?.nome || null,
      };
    }
  );

  const listaFuncionarios: AniversarianteItem[] = funcionarios.map(
    (funcionario) => {
      const dataNascimento = funcionario.dataNascimento as Date;
      const status = statusFuncionario(funcionario);

      return {
        chave: `FUNCIONARIO-${funcionario.id}`,
        id: funcionario.id,
        tipo: "FUNCIONARIO",
        nome: funcionario.nome,
        dataNascimento: dataNascimento.toISOString(),
        dataAniversario: dataDiaMes(dataNascimento),
        dia: diaNascimento(dataNascimento),
        mes: mesNascimento(dataNascimento),
        telefone: funcionario.telefone,
        whatsapp: somenteNumeros(funcionario.telefone),
        temWhatsapp: somenteNumeros(funcionario.telefone).length >= 10,
        userId: funcionario.userId,
        fotoPerfil: funcionario.fotoPerfil,
        status,
        contexto:
          funcionario.departamento?.nome ||
          funcionario.cargo ||
          funcionario.setor ||
          "Funcionário",
        departamentoId: funcionario.departamentoId,
        departamento: funcionario.departamento?.nome || null,
        poloId: null,
        polo: null,
      };
    }
  );

  let aniversariantes = [
    ...listaAlunos,
    ...listaProfessores,
    ...listaFuncionarios,
  ];

  aniversariantes = aniversariantes.filter((item) => item.mes === filtros.mes);

  if (filtros.busca) {
    aniversariantes = aniversariantes.filter((item) =>
      textoLimpo(item.nome).includes(filtros.busca)
    );
  }

  if (filtros.status !== "TODOS") {
    aniversariantes = aniversariantes.filter((item) =>
      statusCombina(item.status, filtros.status)
    );
  }

  if (filtros.whatsapp === "COM") {
    aniversariantes = aniversariantes.filter((item) => item.temWhatsapp);
  }

  if (filtros.whatsapp === "SEM") {
    aniversariantes = aniversariantes.filter((item) => !item.temWhatsapp);
  }

  aniversariantes.sort((a, b) => {
    if (a.dia !== b.dia) return a.dia - b.dia;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  const poloSelecionado = filtros.poloId
    ? polos.find((polo) => polo.id === filtros.poloId) || null
    : null;

  return {
    mes: filtros.mes,
    total: aniversariantes.length,
    aniversariantes,
    departamentos,
    polos,
    instituicao: {
  nome: instituicao?.nome || "Instituição",
  telefone: instituicao?.telefone || null,
  whatsapp: somenteNumeros(instituicao?.telefone || null),
},
    poloSelecionado,
  };
}