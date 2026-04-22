import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
  return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
}

    const id = Number(context.params.id);
    const body = await request.json();

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    await prisma.funcionario.update({
      where: { id },
      data: {
        nome: body.nome,
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
        codigoFuncionario: body.codigoFuncionario || null,
        departamentoId: body.departamentoId ? Number(body.departamentoId) : null,
      },
    });

    await prisma.user.update({
      where: { id: funcionario.userId },
      data: {
        nome: body.nome,
        email: body.email,
        role: body.role,
      },
    });

    return NextResponse.json({ message: "Funcionário atualizado com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar funcionário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
  return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
}

    const id = Number(context.params.id);

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    await prisma.funcionario.delete({
      where: { id },
    });

    await prisma.user.delete({
      where: { id: funcionario.userId },
    });

    return NextResponse.json({ message: "Funcionário excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir funcionário" },
      { status: 500 }
    );
  }
}