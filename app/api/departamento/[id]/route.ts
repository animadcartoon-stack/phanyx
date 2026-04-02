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

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(context.params.id);
    const body = await request.json();

    const departamento = await prisma.departamento.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!departamento) {
      return NextResponse.json(
        { error: "Departamento não encontrado" },
        { status: 404 }
      );
    }

    const slug = body.slug?.trim()
      ? gerarSlug(body.slug)
      : body.nome
      ? gerarSlug(body.nome)
      : departamento.slug;

    const atualizado = await prisma.departamento.update({
      where: { id },
      data: {
        nome: body.nome,
        slug,
        ativo: body.ativo,
      },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar departamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(context.params.id);

    const departamento = await prisma.departamento.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!departamento) {
      return NextResponse.json(
        { error: "Departamento não encontrado" },
        { status: 404 }
      );
    }

    await prisma.departamento.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Departamento excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir departamento" },
      { status: 500 }
    );
  }
}