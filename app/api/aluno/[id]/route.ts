import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    const aluno = await prisma.aluno.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(aluno);
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = context.params;

    const aluno = await prisma.aluno.findUnique({
      where: { id: Number(id) },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    await prisma.aluno.delete({
      where: { id: Number(id) },
    });

    await prisma.user.delete({
      where: { id: aluno.userId },
    });

    return NextResponse.json({
      message: "Aluno deletado com sucesso",
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao deletar aluno" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { id } = context.params;
    const body = await request.json();

    const alunoExistente = await prisma.aluno.findUnique({
      where: { id: Number(id) },
    });

    if (!alunoExistente) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    await prisma.aluno.update({
      where: { id: Number(id) },
      data: {
        nome: body.nome,
        nomeSocial: body.nomeSocial || null,
        genero: body.genero || null,
        matricula: body.matricula || null,
        cpf: body.cpf || null,
        rg: body.rg || null,
        telefone: body.telefone || null,
        dataNascimento: body.dataNascimento
          ? new Date(body.dataNascimento)
          : null,
        cep: body.cep || null,
        endereco: body.endereco || null,
        numero: body.numero || null,
        complemento: body.complemento || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        estado: body.estado || null,
        documentoUrl: body.documentoUrl || null,
        nomeResponsavel: body.nomeResponsavel || null,
        cpfResponsavel: body.cpfResponsavel || null,
        telefoneResponsavel: body.telefoneResponsavel || null,
        emailResponsavel: body.emailResponsavel || null,
        parentescoResponsavel: body.parentescoResponsavel || null,
        statusAluno: body.statusAluno || "ATIVO",
        possuiNecessidadeEspecial: !!body.possuiNecessidadeEspecial,
        descricaoNecessidadeEspecial:
          body.descricaoNecessidadeEspecial || null,
        observacoesAcessibilidade:
          body.observacoesAcessibilidade || null,
      },
    });

    await prisma.user.update({
      where: { id: alunoExistente.userId },
      data: {
        nome: body.nome,
        email: body.email,
      },
    });

    return NextResponse.json({
      message: "Aluno atualizado com sucesso",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar aluno" },
      { status: 500 }
    );
  }
}