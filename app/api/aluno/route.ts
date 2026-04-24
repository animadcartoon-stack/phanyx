import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { enviarEmailPrimeiroAcesso } from "@/lib/email";

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

    const alunos = await prisma.aluno.findMany({
      where: {
        instituicaoId: user.instituicaoId ?? undefined,
      },
      include: {
  user: true,
  polo: true,
        matriculas: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            curso: true,
            itens: {
              include: {
                turma: {
  include: {
    professor: true,
    disciplinas: {
      include: {
        disciplina: true,
      },
    },
  },
},
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const alunosFormatados = alunos.map((aluno) => {
      const matriculaRecente = aluno.matriculas?.[0] || null;

      return {
        ...aluno,
        resumoMatricula: matriculaRecente
          ? {
              id: matriculaRecente.id,
              status: matriculaRecente.status,
              semestre: matriculaRecente.semestre,
              curso: matriculaRecente.curso
                ? {
                    id: matriculaRecente.curso.id,
                    nome: matriculaRecente.curso.nome,
                  }
                : null,
              turmas: matriculaRecente.itens.map((item) => ({
                id: item.turma?.id,
                nome: item.turma?.nome || null,
                status: item.status,
                disciplina: item.turma?.disciplinas?.[0]?.disciplina
  ? {
      id: item.turma.disciplinas[0].disciplina.id,
      nome: item.turma.disciplinas[0].disciplina.nome,
    }
  : null,
                professor: item.turma?.professor
                  ? {
                      id: item.turma.professor.id,
                      nome: item.turma.professor.nome,
                    }
                  : null,
              })),
            }
          : null,
      };
    });

    return NextResponse.json(alunosFormatados);
  } catch (error: any) {
  console.error("ERRO AO BUSCAR ALUNOS:", error);

  return NextResponse.json(
    {
      error: "Erro ao buscar alunos.",
      detalhe: error?.message || "Erro interno",
    },
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

    const nome = limparTexto(body.nome);
    const email = limparTexto(body.email).toLowerCase();
    const matricula = limparTexto(body.matricula);
    const cpf = limparSomenteNumeros(body.cpf);
    const rg = limparTexto(body.rg);
    const telefone = limparTexto(body.telefone);
    const poloId =
      body.poloId !== undefined &&
      body.poloId !== null &&
      String(body.poloId).trim() !== ""
    ? Number(body.poloId)
    : null;

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

if (poloId !== null) {
  const polo = await prisma.polo.findFirst({
    where: {
      id: poloId,
      instituicaoId: user.instituicaoId,
    },
    select: { id: true },
  });

  if (!polo) {
    return NextResponse.json(
      { error: "Polo inválido para esta instituição." },
      { status: 400 }
    );
  }
}

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: { nome: true },
    });

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const novoAluno = await prisma.$transaction(async (tx) => {
      const novoUser = await tx.user.create({
  data: {
    nome,
    email,
    senha: senhaHash,
    role: "ALUNO",
    instituicaoId: user.instituicaoId!,
    precisaTrocarSenha: true,
  },
});

      const alunoCriado = await tx.aluno.create({
        data: {
          nome,
          nomeSocial: limparTexto(body.nomeSocial) || null,
          genero: limparTexto(body.genero) || null,
          matricula: matricula || null,
          poloId: poloId || null,
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

    let avisoEmail: string | null = null;

    try {
      await enviarEmailPrimeiroAcesso({
        email,
        nome,
        senha: senhaTemporaria,
        instituicao: instituicao?.nome || "PHANYX",
        portal: "aluno",
      });
    } catch (emailError) {
      console.error("ERRO AO ENVIAR EMAIL DE ACESSO DO ALUNO:", emailError);
      avisoEmail =
        "Aluno criado com sucesso, mas houve erro ao enviar o email de acesso.";
    }

    return NextResponse.json({
      ...novoAluno,
      senhaTemporaria,
      avisoEmail,
    });
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