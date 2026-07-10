import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";

type TipoPessoa = "ALUNO" | "PROFESSOR" | "FUNCIONARIO";

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

function statusProfessor(item: { ativo: boolean }) {
  return item.ativo ? "ATIVO" : "INATIVO";
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

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const mesParam = Number(searchParams.get("mes"));
    const mes =
      Number.isFinite(mesParam) && mesParam >= 1 && mesParam <= 12
        ? mesParam
        : new Date().getMonth() + 1;

    const tipo = String(searchParams.get("tipo") || "TODOS").toUpperCase();
    const busca = textoLimpo(searchParams.get("busca") || "");
    const statusFiltro = String(
      searchParams.get("status") || "TODOS"
    ).toUpperCase();

    const whatsappFiltro = String(
      searchParams.get("whatsapp") || "TODOS"
    ).toUpperCase();

    const departamentoIdParam = searchParams.get("departamentoId");
    const departamentoId =
      departamentoIdParam && departamentoIdParam !== "TODOS"
        ? Number(departamentoIdParam)
        : null;

    const podeBuscarAlunos = tipo === "TODOS" || tipo === "ALUNO";
    const podeBuscarProfessores = tipo === "TODOS" || tipo === "PROFESSOR";
    const podeBuscarFuncionarios = tipo === "TODOS" || tipo === "FUNCIONARIO";

    const [departamentos, alunos, professores, funcionarios] =
      await Promise.all([
        prisma.departamento.findMany({
          where: {
            instituicaoId: user.instituicaoId,
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

        podeBuscarAlunos && !departamentoId
          ? prisma.aluno.findMany({
              where: {
                instituicaoId: user.instituicaoId,
                dataNascimento: {
                  not: null,
                },
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
              },
              orderBy: {
                nome: "asc",
              },
            })
          : Promise.resolve([]),

        podeBuscarProfessores && !departamentoId
          ? prisma.professor.findMany({
              where: {
                instituicaoId: user.instituicaoId,
                dataNascimento: {
                  not: null,
                },
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
              },
              orderBy: {
                nome: "asc",
              },
            })
          : Promise.resolve([]),

        podeBuscarFuncionarios
          ? prisma.funcionario.findMany({
              where: {
                instituicaoId: user.instituicaoId,
                dataNascimento: {
                  not: null,
                },
                ...(departamentoId
                  ? {
                      departamentoId,
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

    const listaAlunos = alunos.map((aluno) => {
      const dataNascimento = aluno.dataNascimento as Date;
      const status = statusAluno(aluno);

      return {
        chave: `ALUNO-${aluno.id}`,
        id: aluno.id,
        tipo: "ALUNO" as TipoPessoa,
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
      };
    });

    const listaProfessores = professores.map((professor) => {
      const dataNascimento = professor.dataNascimento as Date;
      const status = statusProfessor(professor);

      return {
        chave: `PROFESSOR-${professor.id}`,
        id: professor.id,
        tipo: "PROFESSOR" as TipoPessoa,
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
          professor.especialidade ||
          professor.titulacao ||
          "Professor",
        departamentoId: null,
        departamento: null,
      };
    });

    const listaFuncionarios = funcionarios.map((funcionario) => {
      const dataNascimento = funcionario.dataNascimento as Date;
      const status = statusFuncionario(funcionario);

      return {
        chave: `FUNCIONARIO-${funcionario.id}`,
        id: funcionario.id,
        tipo: "FUNCIONARIO" as TipoPessoa,
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
      };
    });

    let aniversariantes = [
      ...listaAlunos,
      ...listaProfessores,
      ...listaFuncionarios,
    ];

    aniversariantes = aniversariantes.filter((item) => item.mes === mes);

    if (busca) {
      aniversariantes = aniversariantes.filter((item) =>
        textoLimpo(item.nome).includes(busca)
      );
    }

    if (statusFiltro !== "TODOS") {
      aniversariantes = aniversariantes.filter((item) =>
        statusCombina(item.status, statusFiltro)
      );
    }

    if (whatsappFiltro === "COM") {
      aniversariantes = aniversariantes.filter((item) => item.temWhatsapp);
    }

    if (whatsappFiltro === "SEM") {
      aniversariantes = aniversariantes.filter((item) => !item.temWhatsapp);
    }

    aniversariantes.sort((a, b) => {
      if (a.dia !== b.dia) return a.dia - b.dia;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

    return NextResponse.json({
      mes,
      total: aniversariantes.length,
      aniversariantes,
      departamentos,
    });
  } catch (error) {
    console.error("Erro ao listar aniversariantes:", error);

    return NextResponse.json(
      { error: "Erro ao listar aniversariantes." },
      { status: 500 }
    );
  }
}