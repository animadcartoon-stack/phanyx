import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function limparSomenteNumeros(valor: unknown) {
  return String(valor ?? "").replace(/\D/g, "");
}

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

    const nome = limparTexto(body.nome);
    const email = limparTexto(body.email).toLowerCase();
    const matricula = limparTexto(body.matricula);
    const cpf = limparSomenteNumeros(body.cpf);
    const rg = limparTexto(body.rg);
    const telefone = limparTexto(body.telefone);

    if (!nome) {
      return NextResponse.json(
        { error: "O nome do aluno é obrigatório." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "O email do aluno é obrigatório." },
        { status: 400 }
      );
    }

    const userExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (userExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado." },
        { status: 400 }
      );
    }

    if (matricula) {
      const matriculaExistente = await prisma.aluno.findFirst({
        where: {
          instituicaoId: user.instituicaoId,
          matricula,
        },
        select: { id: true, nome: true },
      });

      if (matriculaExistente) {
        return NextResponse.json(
          { error: "Já existe um aluno com esta matrícula nesta instituição." },
          { status: 400 }
        );
      }
    }

    if (cpf) {
      const cpfExistente = await prisma.aluno.findFirst({
        where: {
          instituicaoId: user.instituicaoId,
          cpf,
        },
        select: { id: true, nome: true },
      });

      if (cpfExistente) {
        return NextResponse.json(
          { error: "Já existe um aluno com este CPF nesta instituição." },
          { status: 400 }
        );
      }
    }

    const senhaTemporaria = "123456";
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const novoAluno = await prisma.$transaction(async (tx) => {
      const novoUser = await tx.user.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          role: "ALUNO",
          instituicaoId: user.instituicaoId,
        },
      });

      const alunoCriado = await tx.aluno.create({
        data: {
          nome,
          nomeSocial: limparTexto(body.nomeSocial) || null,
          genero: limparTexto(body.genero) || null,
          matricula: matricula || null,
          cpf: cpf || null,
          rg: rg || null,
          telefone: telefone || null,
          dataNascimento: body.dataNascimento
            ? new Date(body.dataNascimento)
            : null,
          cep: limparTexto(body.cep) || null,
          endereco: limparTexto(body.endereco) || null,
          numero: limparTexto(body.numero) || null,
          complemento: limparTexto(body.complemento) || null,
          bairro: limparTexto(body.bairro) || null,
          cidade: limparTexto(body.cidade) || null,
          estado: limparTexto(body.estado) || null,
          documentoUrl: limparTexto(body.documentoUrl) || null,
          nomeResponsavel: limparTexto(body.nomeResponsavel) || null,
          cpfResponsavel: limparSomenteNumeros(body.cpfResponsavel) || null,
          telefoneResponsavel: limparTexto(body.telefoneResponsavel) || null,
          emailResponsavel:
            limparTexto(body.emailResponsavel).toLowerCase() || null,
          parentescoResponsavel:
            limparTexto(body.parentescoResponsavel) || null,
          statusAluno: limparTexto(body.statusAluno) || "ATIVO",
          possuiNecessidadeEspecial: !!body.possuiNecessidadeEspecial,
          descricaoNecessidadeEspecial:
            limparTexto(body.descricaoNecessidadeEspecial) || null,
          observacoesAcessibilidade:
            limparTexto(body.observacoesAcessibilidade) || null,
          userId: novoUser.id,
          instituicaoId: user.instituicaoId,
        },
        include: {
          user: true,
        },
      });

      return alunoCriado;
    });

    return NextResponse.json(novoAluno);
  } catch (error: any) {
    console.error("ERRO AO CRIAR ALUNO:", error);

    if (error?.code === "P2002") {
      const alvo = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(", ")
        : String(error?.meta?.target || "");

      if (alvo.includes("email")) {
        return NextResponse.json(
          { error: "Este email já está cadastrado." },
          { status: 400 }
        );
      }

      if (alvo.includes("matricula")) {
        return NextResponse.json(
          { error: "Esta matrícula já está cadastrada." },
          { status: 400 }
        );
      }

      if (alvo.includes("cpf")) {
        return NextResponse.json(
          { error: "Este CPF já está cadastrado." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Já existe um cadastro com um dos dados informados." },
        { status: 400 }
      );
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Um relacionamento obrigatório do aluno é inválido." },
        { status: 400 }
      );
    }

    if (error?.message) {
      return NextResponse.json(
        {
          error: "Erro ao criar aluno.",
          detalhe: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar aluno." },
      { status: 500 }
    );
  }
}