import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id } = context.params;

    const professor = await prisma.professor.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
        turmas: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(professor);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar professor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const { id } = context.params;
    const body = await request.json();

    const professorExistente = await prisma.professor.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
    });

    if (!professorExistente) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    await prisma.professor.update({
      where: { id: Number(id) },
      data: {
        nome: body.nome,
        cpf: body.cpf || null,
        rg: body.rg || null,
        telefone: body.telefone || null,
        dataNascimento: body.dataNascimento
          ? new Date(body.dataNascimento)
          : null,
        titulacao: body.titulacao || null,
        especialidade: body.especialidade || null,
        formacao: body.formacao || null,
        miniBio: body.miniBio || null,
        codigoFuncionario: body.codigoFuncionario || null,
        fotoPerfil: body.fotoPerfil || null,
        documentoUrl: body.documentoUrl || null,
        slug: body.slug || null,
      },
    });

    await prisma.user.update({
      where: { id: professorExistente.userId },
      data: {
        nome: body.nome,
        email: body.email,
      },
    });

    return NextResponse.json({
      message: "Professor atualizado com sucesso",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar professor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const { id } = context.params;

    const professor = await prisma.professor.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    await prisma.professor.delete({
      where: { id: Number(id) },
    });

    await prisma.user.delete({
      where: { id: professor.userId },
    });

    return NextResponse.json({
      message: "Professor deletado com sucesso",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao deletar professor" },
      { status: 500 }
    );
  }
}