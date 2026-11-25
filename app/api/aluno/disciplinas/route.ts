import { calcularIdadeContrato } from "@/lib/contratos/contrato-matricula";
import { lerCamposEscolha } from "@/lib/documentos/campos-interativos";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: { userId: user.id },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

const contratoPendente = await prisma.contrato.findFirst({
  where: {
    alunoId: aluno.id,
    instituicaoId: user.instituicaoId,
    status: "PENDENTE",
  },
  select: {
    id: true,
    tokenAssinatura: true,
    conteudo: true,
  },
});

if (contratoPendente) {
  const idade = calcularIdadeContrato(aluno.dataNascimento);
  const assinaturaDoResponsavel = idade !== null && idade < 18 &&
    lerCamposEscolha(contratoPendente.conteudo).length > 0;
  return NextResponse.json(
    {
      bloqueadoPorContrato: true,
      error: assinaturaDoResponsavel
        ? "O responsável deve assinar o contrato pelo link enviado ao e-mail cadastrado."
        : "Você precisa assinar seu contrato de matrícula antes de acessar as aulas.",
      ...(assinaturaDoResponsavel ? {} : { assinaturaUrl: `/assinatura/${contratoPendente.tokenAssinatura}` }),
    },
    { status: 403 }
  );
}

    const matriculas = await prisma.matricula.findMany({
  where: {
    alunoId: aluno.id,
    instituicaoId: user.instituicaoId,
  status: {
      not: "CANCELADA",
    },
    excluidaEm: null,
    },
  include: {
    itens: {
  where: {
          instituicaoId: user.instituicaoId,
          status: {
            in: ["A_CURSAR", "EM_CURSO"] as any,
          },
        },
        include: {
    disciplina: true,
    turma: {
      include: {
        disciplinas: {
          include: {
            disciplina: true,
          },
        },
        aulas: {
          where: { dataEncontro: null },
          include: {
            presencas: {
              where: {
                alunoId: aluno.id,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    },
  },
},
  },
  orderBy: {
    id: "desc",
  },
});

    return NextResponse.json(matriculas);
  } catch (error: any) {
    console.error("Erro ao buscar disciplinas do aluno:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao buscar disciplinas do aluno" },
      { status: 500 }
    );
  }
}
