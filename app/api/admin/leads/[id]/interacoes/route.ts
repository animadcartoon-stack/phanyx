import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function podeGerenciar(role?: string) {
  return ["ADMIN", "SECRETARIA", "FINANCEIRO"].includes(role || "");
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

    const leadId = Number(params.id);

    if (!Number.isFinite(leadId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const interacoes = await prisma.leadInteracao.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(interacoes);
  } catch (error) {
    console.error("Erro ao buscar interações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar interações." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciar(user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const leadId = Number(params.id);

    if (!Number.isFinite(leadId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = await req.json();

    const descricao = String(body?.descricao || "").trim();
    const tipo = String(body?.tipo || "OBSERVACAO").trim().toUpperCase();

    if (!descricao) {
      return NextResponse.json(
        { error: "Descrição é obrigatória." },
        { status: 400 }
      );
    }

    const interacao = await prisma.leadInteracao.create({
      data: {
        leadId,
        tipo,
        descricao,
        usuario: user.email || user.role || "Sistema",
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        ultimoContatoEm: new Date(),
      },
    });

    return NextResponse.json(interacao, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar interação:", error);
    return NextResponse.json(
      { error: "Erro ao criar interação." },
      { status: 500 }
    );
  }
}