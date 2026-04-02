import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = await req.json();

    const data: any = {};

    if (body.nome !== undefined) data.nome = String(body.nome || "").trim();
    if (body.email !== undefined) data.email = String(body.email || "").trim();
    if (body.telefone !== undefined)
      data.telefone = body.telefone ? String(body.telefone).trim() : null;
    if (body.instituicao !== undefined)
      data.instituicao = body.instituicao
        ? String(body.instituicao).trim()
        : null;
    if (body.mensagem !== undefined)
      data.mensagem = body.mensagem ? String(body.mensagem).trim() : null;
    if (body.origem !== undefined)
      data.origem = body.origem ? String(body.origem).trim() : null;
    if (body.interessePlano !== undefined)
      data.interessePlano = body.interessePlano
        ? String(body.interessePlano).trim()
        : null;
    if (body.cidade !== undefined)
      data.cidade = body.cidade ? String(body.cidade).trim() : null;
    if (body.quantidadeAlunos !== undefined)
      data.quantidadeAlunos = body.quantidadeAlunos
        ? Number(body.quantidadeAlunos)
        : null;
    if (body.valorEstimado !== undefined)
      data.valorEstimado = body.valorEstimado
        ? Number(body.valorEstimado)
        : null;
    if (body.score !== undefined) data.score = Number(body.score);
    if (body.responsavel !== undefined)
      data.responsavel = body.responsavel
        ? String(body.responsavel).trim()
        : null;
    if (body.status !== undefined) data.status = body.status;
    if (body.observacoes !== undefined)
      data.observacoes = body.observacoes
        ? String(body.observacoes).trim()
        : null;
    if (body.ultimoContatoEm !== undefined) {
      data.ultimoContatoEm = body.ultimoContatoEm
        ? new Date(body.ultimoContatoEm)
        : null;
    }
    if (body.proximoFollowUp !== undefined) {
      data.proximoFollowUp = body.proximoFollowUp
        ? new Date(body.proximoFollowUp)
        : null;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lead." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const id = Number(params.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir lead:", error);
    return NextResponse.json(
      { error: "Erro ao excluir lead." },
      { status: 500 }
    );
  }
}