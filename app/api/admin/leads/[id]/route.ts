import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const STATUS_VALIDOS = ["NOVO", "CONTATO", "PROPOSTA", "FECHADO", "PERDIDO"] as const;
const PRIORIDADES_VALIDAS = ["BAIXA", "MEDIA", "ALTA"] as const;

function normalizarStatus(valor: unknown) {
  const texto = String(valor || "")
    .trim()
    .toUpperCase();

  return STATUS_VALIDOS.includes(texto as any) ? (texto as any) : "NOVO";
}

function normalizarPrioridade(valor: unknown) {
  const texto = String(valor || "")
    .trim()
    .toUpperCase();

  return PRIORIDADES_VALIDAS.includes(texto as any) ? (texto as any) : "MEDIA";
}

function podeGerenciar(role?: string) {
  return ["ADMIN", "SECRETARIA", "FINANCEIRO"].includes(role || "");
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciar(user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao buscar lead:", error);
    return NextResponse.json(
      { error: "Não foi possível buscar o lead." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciar(user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = await req.json();

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        nome: body?.nome !== undefined ? String(body.nome).trim() : undefined,
        email: body?.email !== undefined ? String(body.email).trim() : undefined,
        telefone:
          body?.telefone !== undefined
            ? body.telefone
              ? String(body.telefone).trim()
              : null
            : undefined,
        instituicao:
          body?.instituicao !== undefined
            ? body.instituicao
              ? String(body.instituicao).trim()
              : null
            : undefined,
        cargo:
          body?.cargo !== undefined
            ? body.cargo
              ? String(body.cargo).trim()
              : null
            : undefined,
        mensagem:
          body?.mensagem !== undefined
            ? body.mensagem
              ? String(body.mensagem).trim()
              : null
            : undefined,
        origem:
          body?.origem !== undefined ? String(body.origem).trim() : undefined,
        interessePlano:
          body?.interessePlano !== undefined
            ? body.interessePlano
              ? String(body.interessePlano).trim()
              : null
            : undefined,
        interesse:
          body?.interesse !== undefined
            ? body.interesse
              ? String(body.interesse).trim()
              : null
            : undefined,
        observacoes:
          body?.observacoes !== undefined
            ? body.observacoes
              ? String(body.observacoes).trim()
              : null
            : undefined,
        cidade:
          body?.cidade !== undefined
            ? body.cidade
              ? String(body.cidade).trim()
              : null
            : undefined,
        quantidadeAlunos:
          body?.quantidadeAlunos !== undefined
            ? body.quantidadeAlunos === "" || body.quantidadeAlunos === null
              ? null
              : Number(body.quantidadeAlunos)
            : undefined,
        valorEstimado:
          body?.valorEstimado !== undefined
            ? body.valorEstimado === "" || body.valorEstimado === null
              ? null
              : Number(body.valorEstimado)
            : undefined,
        status:
  body?.status !== undefined ? normalizarStatus(body.status) : undefined,
        prioridade:
  body?.prioridade !== undefined
    ? normalizarPrioridade(body.prioridade)
    : undefined,
        proximoContatoEm:
          body?.proximoContatoEm !== undefined
            ? body.proximoContatoEm
              ? new Date(body.proximoContatoEm)
              : null
            : undefined,
        ultimoContatoEm:
          body?.ultimoContatoEm !== undefined
            ? body.ultimoContatoEm
              ? new Date(body.ultimoContatoEm)
              : null
            : undefined,
        responsavelNome:
          body?.responsavelNome !== undefined
            ? body.responsavelNome
              ? String(body.responsavelNome).trim()
              : null
            : undefined,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o lead." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciar(user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir lead:", error);
    return NextResponse.json(
      { error: "Não foi possível excluir o lead." },
      { status: 500 }
    );
  }
}