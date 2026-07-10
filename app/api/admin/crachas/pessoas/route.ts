import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type TipoPessoaCracha = "ALUNO" | "PROFESSOR" | "FUNCIONARIO" | "VISITANTE";

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarTipo(valor: unknown): TipoPessoaCracha {
  const tipo = limparTexto(valor).toUpperCase();

  if (tipo === "PROFESSOR") return "PROFESSOR";
  if (tipo === "FUNCIONARIO") return "FUNCIONARIO";
  if (tipo === "VISITANTE") return "VISITANTE";

  return "ALUNO";
}

function resumoPessoas(pessoas: any[]) {
  const total = pessoas.length;
  const aptos = pessoas.filter((p) => Boolean(p.fotoPerfil)).length;
  const pendentesFoto = total - aptos;

  return {
    total,
    aptos,
    pendentesFoto,
  };
}

function inicioFimHoje() {
  const agora = new Date();

  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);

  return { inicio, fim };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const tipo = normalizarTipo(searchParams.get("tipo"));
    const modo = limparTexto(searchParams.get("modo")).toUpperCase();
    const busca = limparTexto(searchParams.get("busca"));
    const filtro = limparTexto(searchParams.get("filtro")).toUpperCase();
    const evento = limparTexto(searchParams.get("evento"));

    const limite =
      modo === "LOTE"
        ? Math.min(1000, Math.max(10, Number(searchParams.get("limite") || 500)))
        : Math.min(50, Math.max(5, Number(searchParams.get("limite") || 20)));

    if (tipo === "ALUNO") {
      const where: any = {
        instituicaoId: user.instituicaoId,
      };

      if (modo === "LOTE" || filtro === "TODOS_ALUNOS_ATIVOS") {
        where.ativo = true;
      }

      if (busca) {
        where.OR = [
          { nome: { contains: busca, mode: "insensitive" } },
          { matricula: { contains: busca, mode: "insensitive" } },
        ];
      }

      const alunos = await prisma.aluno.findMany({
        where,
        orderBy: { nome: "asc" },
        take: limite,
        select: {
          id: true,
          nome: true,
          matricula: true,
          fotoPerfil: true,
          ativo: true,
        },
      });

      const pessoas = alunos.map((aluno) => ({
        id: aluno.id,
        tipo: "ALUNO",
        nome: aluno.nome,
        descricao: aluno.matricula
          ? `Matrícula: ${aluno.matricula}`
          : "Aluno",
        fotoPerfil: aluno.fotoPerfil,
        aptoParaCracha: Boolean(aluno.fotoPerfil),
        dados: aluno,
      }));

      return NextResponse.json({
        pessoas,
        resumo: resumoPessoas(pessoas),
      });
    }

    if (tipo === "PROFESSOR") {
      const where: any = {
        instituicaoId: user.instituicaoId,
      };

      if (busca) {
        where.OR = [
          { nome: { contains: busca, mode: "insensitive" } },
          { especialidade: { contains: busca, mode: "insensitive" } },
        ];
      }

      const professores = await prisma.professor.findMany({
        where,
        orderBy: { nome: "asc" },
        take: limite,
        select: {
          id: true,
          nome: true,
          especialidade: true,
          fotoPerfil: true,
        },
      });

      const pessoas = professores.map((professor) => ({
        id: professor.id,
        tipo: "PROFESSOR",
        nome: professor.nome,
        descricao: professor.especialidade
          ? `Área/disciplinas: ${professor.especialidade}`
          : "Professor",
        fotoPerfil: professor.fotoPerfil,
        aptoParaCracha: Boolean(professor.fotoPerfil),
        dados: professor,
      }));

      return NextResponse.json({
        pessoas,
        resumo: resumoPessoas(pessoas),
      });
    }

    if (tipo === "FUNCIONARIO") {
      const where: any = {
        instituicaoId: user.instituicaoId,
        ativo: true,
      };

      if (busca) {
        where.OR = [
          { nome: { contains: busca, mode: "insensitive" } },
          { cargo: { contains: busca, mode: "insensitive" } },
          { setor: { contains: busca, mode: "insensitive" } },
          { codigoFuncionario: { contains: busca, mode: "insensitive" } },
        ];
      }

      const funcionarios = await prisma.funcionario.findMany({
        where,
        orderBy: { nome: "asc" },
        take: limite,
        select: {
          id: true,
          nome: true,
          cargo: true,
          setor: true,
          codigoFuncionario: true,
          fotoPerfil: true,
          statusFuncionario: true,
        },
      });

      const pessoas = funcionarios.map((funcionario) => ({
        id: funcionario.id,
        tipo: "FUNCIONARIO",
        nome: funcionario.nome,
        descricao:
          funcionario.cargo || funcionario.setor
            ? `${funcionario.cargo || "Funcionário"}${
                funcionario.setor ? ` • ${funcionario.setor}` : ""
              }`
            : "Funcionário",
        fotoPerfil: funcionario.fotoPerfil,
        aptoParaCracha: Boolean(funcionario.fotoPerfil),
        dados: funcionario,
      }));

      return NextResponse.json({
        pessoas,
        resumo: resumoPessoas(pessoas),
      });
    }

    if (tipo === "VISITANTE") {
      const where: any = {
        instituicaoId: user.instituicaoId,
        arquivado: false,
      };

      if (filtro === "VISITANTES_DO_DIA") {
        const { inicio, fim } = inicioFimHoje();

        where.OR = [
          {
            entradaPrevistaEm: {
              gte: inicio,
              lte: fim,
            },
          },
          {
            criadoEm: {
              gte: inicio,
              lte: fim,
            },
          },
        ];
      }

      if (filtro === "POR_EVENTO" && evento) {
        where.evento = {
          contains: evento,
          mode: "insensitive",
        };
      }

      if (busca) {
        where.OR = [
          ...(Array.isArray(where.OR) ? where.OR : []),
          { nome: { contains: busca, mode: "insensitive" } },
          { documentoNumero: { contains: busca, mode: "insensitive" } },
          { empresa: { contains: busca, mode: "insensitive" } },
          { destino: { contains: busca, mode: "insensitive" } },
          { pessoaVisitada: { contains: busca, mode: "insensitive" } },
          { evento: { contains: busca, mode: "insensitive" } },
          { codigoVisitante: { contains: busca, mode: "insensitive" } },
        ];
      }

      const visitantes = await prisma.visitante.findMany({
        where,
        orderBy: { criadoEm: "desc" },
        take: limite,
        select: {
          id: true,
          nome: true,
          empresa: true,
          destino: true,
          pessoaVisitada: true,
          evento: true,
          fotoPerfil: true,
          codigoVisitante: true,
          codigoCracha: true,
          status: true,
          crachaValidoAte: true,
        },
      });

      const pessoas = visitantes.map((visitante) => ({
        id: visitante.id,
        tipo: "VISITANTE",
        nome: visitante.nome,
        descricao:
          visitante.empresa || visitante.destino || visitante.evento
            ? `${visitante.empresa || "Visitante"}${
                visitante.destino ? ` • Destino: ${visitante.destino}` : ""
              }${visitante.evento ? ` • Evento: ${visitante.evento}` : ""}`
            : "Visitante",
        fotoPerfil: visitante.fotoPerfil,
        aptoParaCracha: Boolean(visitante.fotoPerfil),
        dados: visitante,
      }));

      return NextResponse.json({
        pessoas,
        resumo: resumoPessoas(pessoas),
      });
    }

    return NextResponse.json(
      { error: "Tipo de pessoa inválido." },
      { status: 400 }
    );
  } catch (error) {
    console.error("ERRO AO BUSCAR PESSOAS PARA CRACHÁ:", error);

    return NextResponse.json(
      { error: "Erro ao buscar pessoas para emissão de crachá." },
      { status: 500 }
    );
  }
}