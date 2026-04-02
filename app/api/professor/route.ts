import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import bcrypt from "bcryptjs";

// LISTAR
export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const professores = await prisma.professor.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
        turmas: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(professores);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao listar professores" },
      { status: 500 }
    );
  }
}

// CRIAR
export async function POST(request: Request) {
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

    const body = await request.json();

    const userExistente = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (userExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const senhaTemporaria = "123456";
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const novoUser = await prisma.user.create({
      data: {
        nome: body.nome,
        email: body.email,
        senha: senhaHash,
        role: "PROFESSOR",
        instituicaoId: user.instituicaoId,
      },
    });

    const novoProfessor = await prisma.professor.create({
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
        userId: novoUser.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(novoProfessor);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar professor" },
      { status: 500 }
    );
  }
}