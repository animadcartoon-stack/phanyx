import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { enviarEmailPrimeiroAcesso } from "@/lib/email";

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

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function gerarSenhaTemporaria() {
  const sufixo = crypto.randomBytes(4).toString("hex");
  return `Phx@${sufixo}`;
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

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const nome = limparTexto(body.nome);
    const email = limparTexto(body.email).toLowerCase();

    if (!nome) {
      return NextResponse.json(
        { error: "O nome do professor é obrigatório." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "O email do professor é obrigatório." },
        { status: 400 }
      );
    }

    const userExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (userExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: { nome: true },
    });

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const novoUser = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        role: "PROFESSOR",
        instituicaoId: user.instituicaoId,
        precisaTrocarSenha: true,
      },
    });

    const novoProfessor = await prisma.professor.create({
      data: {
        nome,
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

    let avisoEmail: string | null = null;

    try {
      await enviarEmailPrimeiroAcesso({
        email,
        nome,
        senha: senhaTemporaria,
        instituicao: instituicao?.nome || "PHANYX",
        portal: "professor",
      });
    } catch (emailError) {
      console.error(
        "ERRO AO ENVIAR EMAIL DE ACESSO DO PROFESSOR:",
        emailError
      );
      avisoEmail =
        "Professor criado com sucesso, mas houve erro ao enviar o email de acesso.";
    }

    return NextResponse.json({
      ...novoProfessor,
      senhaTemporaria,
      avisoEmail,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar professor" },
      { status: 500 }
    );
  }
}