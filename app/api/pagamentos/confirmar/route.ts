import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do pagamento é obrigatório" },
        { status: 400 }
      );
    }

    // 1. Atualiza pagamento
    const pagamento = await prisma.checkoutPagamento.update({
      where: { id: String(id) },
      data: {
        status: "PAID",
      },
    });

const senhaHash = await bcrypt.hash("123456", 10);

    // 2. CRIA ALUNO AUTOMATICAMENTE (simulação)
   const aluno = await prisma.aluno.create({
  data: {
    nome: pagamento.nome,
    user: {
      create: {
        nome: pagamento.nome,
        email: pagamento.email || `user${Date.now()}@formax.com`,
        senha: senhaHash,
        role: "ALUNO",
        instituicao: {
          connect: { id: 1 },
        },
      },
    },
    instituicao: {
      connect: { id: 1 },
    },
  },
  include: {
    user: true,
  },
});

const curso = await prisma.curso.findFirst({
  where: {
    instituicaoId: 1,
    ativo: true,
  },
  orderBy: {
    id: "asc",
  },
});

const hoje = new Date();

const matricula = await prisma.matricula.create({
  data: {
    alunoId: aluno.id,
    instituicaoId: 1,
    cursoId: curso?.id || null,
    semestre: 1,
    status: "ATIVA",
    dataPrimeiroVencimento: hoje,
    primeiroVencimento: hoje,
    quantidadeParcelas: curso?.quantidadeParcelas || 1,
    quantidadeMensalidades: curso?.quantidadeParcelas || 1,
    valorMatricula:
      curso?.valorMatricula != null
        ? Number(curso.valorMatricula)
        : undefined,
    valorMensalidade:
      curso?.valorMensalidade != null
        ? Number(curso.valorMensalidade)
        : undefined,
  },
});

// Busca uma turma disponível
const turma = await prisma.turma.findFirst({
  where: {
    instituicaoId: 1,
  },
  orderBy: {
    id: "asc",
  },
});

// Cria item da matrícula (liga aluno à turma)
let itemMatricula = null;

if (turma) {
  itemMatricula = await prisma.itemMatricula.create({
    data: {
      instituicao: {
        connect: { id: 1 },
      },
      matricula: {
        connect: { id: matricula.id },
      },
      turma: {
        connect: { id: turma.id },
      },
      status: "A_CURSAR",
    },
  });
}

    return NextResponse.json({
  success: true,
  pagamento,
  aluno,
  user: aluno.user,
  curso,
  matricula,
  turma,
  itemMatricula,
});

  } catch (error: any) {
    console.error("ERRO CONFIRMAR PAGAMENTO:", error);

    return NextResponse.json(
      {
        error: "Erro ao confirmar pagamento",
        detalhe: error?.message,
      },
      { status: 500 }
    );
  }
}