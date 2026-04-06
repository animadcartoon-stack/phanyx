import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function podeGerenciarCurso(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const cursos = await prisma.curso.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(cursos);
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);

    return NextResponse.json(
      { error: "Erro ao buscar cursos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarCurso(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      nome,
      codigo,
      descricao,
      quantidadeSemestres,
      valorMatricula,
      valorMensalidade,
      quantidadeParcelas,
    } = body;

    if (!nome || !String(nome).trim()) {
      return NextResponse.json(
        { error: "Nome do curso é obrigatório" },
        { status: 400 }
      );
    }

    const cursoExistente = await prisma.curso.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        nome: String(nome).trim(),
      },
    });

    if (cursoExistente) {
      return NextResponse.json(
        { error: "Já existe um curso com este nome" },
        { status: 400 }
      );
    }

    const novoCurso = await prisma.curso.create({
      data: {
        nome: String(nome).trim(),
        codigo: codigo ? String(codigo).trim() : null,
        descricao: descricao ? String(descricao).trim() : null,
        quantidadeSemestres:
          quantidadeSemestres !== null && quantidadeSemestres !== undefined
            ? Number(quantidadeSemestres)
            : null,
        valorMatricula:
          valorMatricula !== null && valorMatricula !== undefined
            ? Number(valorMatricula)
            : null,
        valorMensalidade:
          valorMensalidade !== null && valorMensalidade !== undefined
            ? Number(valorMensalidade)
            : null,
        quantidadeParcelas:
          quantidadeParcelas !== null && quantidadeParcelas !== undefined
            ? Number(quantidadeParcelas)
            : null,
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json(novoCurso, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar curso:", error);

    return NextResponse.json(
      { error: "Erro ao criar curso" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarCurso(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      id,
      nome,
      codigo,
      descricao,
      quantidadeSemestres,
      valorMatricula,
      valorMensalidade,
      quantidadeParcelas,
      ativo,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do curso é obrigatório" },
        { status: 400 }
      );
    }

    if (!nome || !String(nome).trim()) {
      return NextResponse.json(
        { error: "Nome do curso é obrigatório" },
        { status: 400 }
      );
    }

    const cursoExistente = await prisma.curso.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
    });

    if (!cursoExistente) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    const conflitoNome = await prisma.curso.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        nome: String(nome).trim(),
        NOT: {
          id: Number(id),
        },
      },
    });

    if (conflitoNome) {
      return NextResponse.json(
        { error: "Já existe outro curso com este nome" },
        { status: 400 }
      );
    }

    const cursoAtualizado = await prisma.curso.update({
      where: {
        id: Number(id),
      },
      data: {
        nome: String(nome).trim(),
        codigo: codigo ? String(codigo).trim() : null,
        descricao: descricao ? String(descricao).trim() : null,
        quantidadeSemestres:
          quantidadeSemestres !== null && quantidadeSemestres !== undefined
            ? Number(quantidadeSemestres)
            : null,
        valorMatricula:
          valorMatricula !== null && valorMatricula !== undefined
            ? Number(valorMatricula)
            : null,
        valorMensalidade:
          valorMensalidade !== null && valorMensalidade !== undefined
            ? Number(valorMensalidade)
            : null,
        quantidadeParcelas:
          quantidadeParcelas !== null && quantidadeParcelas !== undefined
            ? Number(quantidadeParcelas)
            : null,
        ativo: typeof ativo === "boolean" ? ativo : cursoExistente.ativo,
      },
    });

    return NextResponse.json(cursoAtualizado);
  } catch (error) {
    console.error("Erro ao editar curso:", error);

    return NextResponse.json(
      { error: "Erro ao editar curso" },
      { status: 500 }
    );
  }
}