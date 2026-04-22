import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { enviarEmailPrimeiroAcesso } from "@/lib/email";

async function gerarCodigoFuncionario(instituicaoId: number) {
  const ultimoFuncionario = await prisma.funcionario.findFirst({
    where: {
      instituicaoId,
      codigoFuncionario: {
        not: null,
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      codigoFuncionario: true,
    },
  });

  const codigoAtual = String(ultimoFuncionario?.codigoFuncionario || "")
    .replace(/\D/g, "");

  const proximoNumero = codigoAtual ? Number(codigoAtual) + 1 : 1;

  return String(proximoNumero).padStart(4, "0");
}

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function gerarSenhaTemporaria() {
  const sufixo = crypto.randomBytes(4).toString("hex");
  return `Phx@${sufixo}`;
}

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

    if (!isAdminLike(user.role)) {
  return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
}

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const codigoInformado = String(body.codigoFuncionario || "").trim();

    const codigoFuncionario =
    codigoInformado || (await gerarCodigoFuncionario(Number(user.instituicaoId)));
    const nome = limparTexto(body.nome);
    const email = limparTexto(body.email).toLowerCase();
    const role = limparTexto(body.role).toUpperCase() || "SECRETARIA";

    if (!nome) {
      return NextResponse.json(
        { error: "O nome do funcionário é obrigatório." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "O email do funcionário é obrigatório." },
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
        role,
        instituicaoId: user.instituicaoId,
        precisaTrocarSenha: true,
      },
    });

    const funcionario = await prisma.funcionario.create({
      data: {
        nome,
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
        codigoFuncionario,
        departamentoId: body.departamentoId ? Number(body.departamentoId) : null,
        instituicaoId: user.instituicaoId,
        userId: novoUser.id,
      },
      include: {
        user: true,
        departamento: true,
      },
    });

    let avisoEmail: string | null = null;

    try {
      await enviarEmailPrimeiroAcesso({
        email,
        nome,
        senha: senhaTemporaria,
        instituicao: instituicao?.nome || "PHANYX",
        portal: "admin",
      });
    } catch (emailError) {
      console.error(
        "ERRO AO ENVIAR EMAIL DE ACESSO DO FUNCIONÁRIO:",
        emailError
      );
      avisoEmail =
        "Funcionário criado com sucesso, mas houve erro ao enviar o email de acesso.";
    }

    return NextResponse.json(
      {
        ...funcionario,
        senhaTemporaria,
        avisoEmail,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar funcionário" },
      { status: 500 }
    );
  }
}