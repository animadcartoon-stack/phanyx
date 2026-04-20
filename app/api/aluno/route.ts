import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserFromToken } from "@/lib/server-auth";

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function limparSomenteNumeros(valor: unknown) {
  return String(valor ?? "").replace(/\D/g, "");
}

function parseDataSegura(valor: unknown) {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) return null;

  return data;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const alunos = await prisma.aluno.findMany({
      where: {
        instituicaoId: user.instituicaoId ?? undefined,
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
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
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
          instituicaoId: user.instituicaoId!,
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
          dataNascimento: parseDataSegura(body.dataNascimento),
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
          instituicaoId: user.instituicaoId!,
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