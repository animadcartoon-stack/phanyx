import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const user = await prisma.user.findUnique({
  where: { id: decoded.id },
  select: {
    id: true,
    nome: true,
    email: true,
    role: true,
    isMasterAdmin: true,
    instituicaoId: true,
  },
});

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    let statusAluno: string | null = null;
    let bloqueioFinanceiroAtivo = false;

let plano: string | null = null;

if (user.instituicaoId) {
  const instituicao = await prisma.instituicao.findUnique({
    where: {
      id: user.instituicaoId,
    },
    select: {
      plano: true,
    },
  });

  plano = instituicao?.plano ?? null;
}

    if (String(user.role).toUpperCase() === "ALUNO") {
      const aluno = await prisma.aluno.findFirst({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          statusAluno: true,
          instituicaoId: true,
        },
      });

      statusAluno = aluno?.statusAluno ?? null;

      if (aluno?.instituicaoId) {
        const config =
          await prisma.configuracaoFinanceiraInstituicao.findUnique({
            where: {
              instituicaoId: aluno.instituicaoId,
            },
            select: {
              bloquearAlunoInadimplente: true,
            },
          });

        bloqueioFinanceiroAtivo = Boolean(config?.bloquearAlunoInadimplente);
      }
    }

    return NextResponse.json({
  user: {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    plano,
    isMasterAdmin: user.isMasterAdmin,
    statusAluno,
    bloqueioFinanceiroAtivo,
  },
});

  } catch {
    return NextResponse.json(
      { error: "Token inválido" },
      { status: 401 }
    );
  }
}