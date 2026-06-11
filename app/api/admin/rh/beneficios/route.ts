import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function normalizarTexto(v: any) {
  return String(v || "").trim();
}

function numeroOuNull(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const beneficios = await prisma.beneficioRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });

    return NextResponse.json({ beneficios });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao listar benefícios." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const nome = normalizarTexto(body.nome);
    const tipo = normalizarTexto(body.tipo);
    const descricao = normalizarTexto(body.descricao);

    if (!nome) {
      return NextResponse.json(
        { error: "Informe o nome do benefício." },
        { status: 400 }
      );
    }

    const beneficio = await prisma.beneficioRH.create({
      data: {
        nome,
        tipo: tipo || "OUTRO",
        descricao: descricao || null,
        valorPadrao: numeroOuNull(body.valorPadrao) as any,
        percentual: numeroOuNull(body.percentual) as any,
        descontaFolha: Boolean(body.descontaFolha),
        ativo: body.ativo === undefined ? true : Boolean(body.ativo),
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json({ beneficio });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao criar benefício." },
      { status: 500 }
    );
  }
}