import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, temPermissao } from "@/lib/server-auth";

function normalizarChaves(chaves: unknown) {
  if (!Array.isArray(chaves)) return [];

  return Array.from(
    new Set(
      chaves
        .map((chave) => String(chave || "").trim())
        .filter(Boolean)
    )
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    if (!temPermissao(user, "funcionarios.permissoes.gerenciar")) {
  return NextResponse.json(
    { error: "Você não tem permissão para alterar permissões individuais." },
    { status: 403 }
  );
}

    const funcionarioId = Number(params.id);

    if (!Number.isFinite(funcionarioId)) {
      return NextResponse.json(
        { error: "Funcionário inválido." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        cargo: true,
        departamento: {
          select: {
            id: true,
            nome: true,
            permissoes: {
              where: { ativo: true },
              select: {
                chave: true,
                ativo: true,
              },
              orderBy: {
                chave: "asc",
              },
            },
          },
        },
        permissoes: {
          select: {
            chave: true,
            ativo: true,
          },
          orderBy: {
            chave: "asc",
          },
        },
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      funcionario,
      permissoesIndividuais: funcionario.permissoes,
      permissoesDepartamento: funcionario.departamento?.permissoes || [],
    });
  } catch (error) {
    console.error("Erro ao carregar permissões do funcionário:", error);

    return NextResponse.json(
      { error: "Erro ao carregar permissões do funcionário." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    if (!temPermissao(user, "funcionarios.permissoes.gerenciar")) {
  return NextResponse.json(
    { error: "Você não tem permissão para alterar permissões individuais." },
    { status: 403 }
  );
}

    const funcionarioId = Number(params.id);

    if (!Number.isFinite(funcionarioId)) {
      return NextResponse.json(
        { error: "Funcionário inválido." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const chaves = normalizarChaves(body?.chaves);

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.funcionarioPermissao.updateMany({
        where: {
          funcionarioId,
        },
        data: {
          ativo: false,
        },
      });

      for (const chave of chaves) {
        await tx.funcionarioPermissao.upsert({
          where: {
            funcionarioId_chave: {
              funcionarioId,
              chave,
            },
          },
          update: {
            ativo: true,
          },
          create: {
            funcionarioId,
            chave,
            ativo: true,
          },
        });
      }
    });

    const permissoes = await prisma.funcionarioPermissao.findMany({
      where: {
        funcionarioId,
        ativo: true,
      },
      select: {
        chave: true,
        ativo: true,
      },
      orderBy: {
        chave: "asc",
      },
    });

    return NextResponse.json({
      ok: true,
      permissoes,
    });
  } catch (error) {
    console.error("Erro ao salvar permissões do funcionário:", error);

    return NextResponse.json(
      { error: "Erro ao salvar permissões do funcionário." },
      { status: 500 }
    );
  }
}