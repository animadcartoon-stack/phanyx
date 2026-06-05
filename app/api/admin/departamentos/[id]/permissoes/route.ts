import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const departamentoId = Number(params.id);

    const departamento = await prisma.departamento.findFirst({
  where: {
    id: departamentoId,
    instituicaoId: user.instituicaoId,
  },
  select: {
    id: true,
    nome: true,
  },
});

if (!departamento) {
  return NextResponse.json(
    { error: "Departamento não encontrado." },
    { status: 404 }
  );
}

    const permissoes = await prisma.departamentoPermissao.findMany({
      where: {
        departamentoId,
        departamento: {
          instituicaoId: user.instituicaoId,
        },
      },
      orderBy: {
        chave: "asc",
      },
    });

    return NextResponse.json({
  departamento,
  permissoes,
});
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar permissões" },
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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const departamentoId = Number(params.id);
    const body = await req.json();
    const chaves = Array.isArray(body.chaves) ? body.chaves.map(String) : [];

    const departamento = await prisma.departamento.findFirst({
      where: {
        id: departamentoId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!departamento) {
      return NextResponse.json(
        { error: "Departamento não encontrado." },
        { status: 404 }
      );
    }

    await prisma.departamentoPermissao.deleteMany({
      where: {
        departamentoId,
      },
    });

    if (chaves.length > 0) {
      await prisma.departamentoPermissao.createMany({
        data: chaves.map((chave) => ({
          departamentoId,
          chave,
          ativo: true,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao salvar permissões" },
      { status: 500 }
    );
  }
}