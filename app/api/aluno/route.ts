import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const alunos = await prisma.aluno.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(alunos);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}

export async function POST(request: Request) {
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
        role: "ALUNO",
        instituicaoId: user.instituicaoId,
      },
    });

    const novoAluno = await prisma.aluno.create({
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
        userId: novoUser.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(novoAluno);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar aluno" },
      { status: 500 }
    );
  }
}