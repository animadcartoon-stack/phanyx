import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const departamentos = await prisma.departamento.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(departamentos);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao listar departamentos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.nome) {
      return NextResponse.json(
        { error: "Nome do departamento é obrigatório" },
        { status: 400 }
      );
    }

    const slug = body.slug?.trim()
      ? gerarSlug(body.slug)
      : gerarSlug(body.nome);

    const existente = await prisma.departamento.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        nome: body.nome,
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Departamento já cadastrado" },
        { status: 400 }
      );
    }

    const departamento = await prisma.departamento.create({
      data: {
        nome: body.nome,
        slug,
        ativo: body.ativo ?? true,
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json(departamento, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar departamento" },
      { status: 500 }
    );
  }
}