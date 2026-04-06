import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    const alunoIdParam = searchParams.get("alunoId");
    const canal = searchParams.get("canal");
    const acao = searchParams.get("acao");

    const historicos = await prisma.historicoCobranca.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        ...(alunoIdParam ? { alunoId: Number(alunoIdParam) } : {}),
        ...(canal ? { canal } : {}),
        ...(acao ? { acao } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    return NextResponse.json(historicos);
  } catch (error) {
    console.error("Erro ao listar histórico de cobrança:", error);
    return NextResponse.json(
      { error: "Erro ao listar histórico de cobrança" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const alunoId =
      body.alunoId !== undefined && body.alunoId !== null && body.alunoId !== ""
        ? Number(body.alunoId)
        : null;

    const alunoNome =
      body.alunoNome !== undefined && body.alunoNome !== null && body.alunoNome !== ""
        ? String(body.alunoNome).trim()
        : null;

    const lancamentoFinanceiroId =
      body.lancamentoFinanceiroId !== undefined &&
      body.lancamentoFinanceiroId !== null &&
      body.lancamentoFinanceiroId !== ""
        ? Number(body.lancamentoFinanceiroId)
        : null;

    const responsavelId =
      user?.id !== undefined && user?.id !== null ? Number(user.id) : null;

    const responsavelNome =
      body.responsavelNome && String(body.responsavelNome).trim()
        ? String(body.responsavelNome).trim()
        : user?.nome || user?.email || "Usuário";

    const canal = String(body.canal || "").trim().toUpperCase();
    const acao = String(body.acao || "").trim().toUpperCase();
    const observacao =
      body.observacao && String(body.observacao).trim()
        ? String(body.observacao).trim()
        : null;

    const metadata =
      body.metadata && typeof body.metadata === "object" ? body.metadata : null;

    if (!canal) {
      return NextResponse.json(
        { error: "Canal é obrigatório" },
        { status: 400 }
      );
    }

    if (!acao) {
      return NextResponse.json(
        { error: "Ação é obrigatória" },
        { status: 400 }
      );
    }

    const historico = await prisma.historicoCobranca.create({
      data: {
        instituicaoId: user.instituicaoId,
        alunoId,
        alunoNome,
        lancamentoFinanceiroId,
        responsavelId,
        responsavelNome,
        canal,
        acao,
        observacao,
        metadata,
      },
    });

    return NextResponse.json({
      message: "Histórico registrado com sucesso",
      data: historico,
    });
  } catch (error) {
    console.error("Erro ao registrar histórico de cobrança:", error);
    return NextResponse.json(
      { error: "Erro ao registrar histórico de cobrança" },
      { status: 500 }
    );
  }
}