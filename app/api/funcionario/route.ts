import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const funcionarios = await prisma.funcionario.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
        departamento: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(funcionarios);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao listar funcionários" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
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
        role: body.role || "SECRETARIA",
        instituicaoId: user.instituicaoId,
      },
    });

    const funcionario = await prisma.funcionario.create({
      data: {
        nome: body.nome,
        cpf: body.cpf || null,
        rg: body.rg || null,
        telefone: body.telefone || null,
        dataNascimento: body.dataNascimento
          ? new Date(body.dataNascimento)
          : null,
        endereco: body.endereco || null,
        numero: body.numero || null,
        complemento: body.complemento || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        estado: body.estado || null,
        cep: body.cep || null,
        cargo: body.cargo || null,
        setor: body.setor || null,
        fotoPerfil: body.fotoPerfil || null,
        documentoUrl: body.documentoUrl || null,
        codigoFuncionario: body.codigoFuncionario || null,
        departamentoId: body.departamentoId ? Number(body.departamentoId) : null,
        instituicaoId: user.instituicaoId,
        userId: novoUser.id,
      },
      include: {
        user: true,
        departamento: true,
      },
    });

    return NextResponse.json(funcionario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar funcionário" },
      { status: 500 }
    );
  }
}