import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export async function PATCH(req: Request, { params }: any) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);
    const body = await req.json();

    const { statusFuncionario, motivoStatus } = body;

    const funcionario = await prisma.funcionario.update({
      where: { id },
      data: {
        statusFuncionario,
        motivoStatus,
        ativo: statusFuncionario === "ATIVO", // mantém compatibilidade
      },
    });

    return NextResponse.json(funcionario);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do funcionário" },
      { status: 500 }
    );
  }
}