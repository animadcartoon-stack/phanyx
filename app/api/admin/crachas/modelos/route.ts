import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const modelos = await prisma.crachaModelo.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
      orderBy: {
        atualizadoEm: "desc",
      },
    });

    return NextResponse.json({ modelos });
  } catch (error) {
    console.error("Erro ao listar modelos de crachá:", error);
    return NextResponse.json(
      { error: "Erro ao listar modelos de crachá." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();

    const modelo = await prisma.crachaModelo.create({
      data: {
        instituicaoId: user.instituicaoId,
        nome: body.nome || "Novo modelo de crachá",
        tipoPessoa: body.tipoPessoa || "ALUNO",
        formato: body.formato || "RETRATO",
        larguraMm: Number(body.larguraMm || 53.98),
        alturaMm: Number(body.alturaMm || 85.6),
        frenteJson: body.frenteJson || null,
        versoJson: body.versoJson || null,
      },
    });

    return NextResponse.json({ modelo });
  } catch (error) {
    console.error("Erro ao criar modelo de crachá:", error);
    return NextResponse.json(
      { error: "Erro ao criar modelo de crachá." },
      { status: 500 }
    );
  }
}