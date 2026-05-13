import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    return NextResponse.json(aluno);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar cadastro" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const atualizado = await prisma.aluno.update({
      where: { id: aluno.id },
      data: {
        cpf: body.cpf || null,
        rg: body.rg || null,
        telefone: body.telefone || null,
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
        cep: body.cep || null,
        endereco: body.endereco || null,
        numero: body.numero || null,
        complemento: body.complemento || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        estado: body.estado || null,
        nomeResponsavel: body.nomeResponsavel || null,
        cpfResponsavel: body.cpfResponsavel || null,
        telefoneResponsavel: body.telefoneResponsavel || null,
        emailResponsavel: body.emailResponsavel || null,
        parentescoResponsavel: body.parentescoResponsavel || null,
        possuiNecessidadeEspecial: Boolean(body.possuiNecessidadeEspecial),
        descricaoNecessidadeEspecial: body.descricaoNecessidadeEspecial || null,
        observacoesAcessibilidade: body.observacoesAcessibilidade || null,
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar cadastro" },
      { status: 500 }
    );
  }
}