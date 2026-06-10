import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const eventos = await prisma.eventoFolhaRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        codigo: "asc",
      },
    });

    return NextResponse.json(eventos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar eventos da folha." },
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

    const codigo = String(body.codigo || "").trim();
    const descricao = String(body.descricao || "").trim();
    const tipo = String(body.tipo || "VENCIMENTO").trim();
    const natureza = body.natureza ? String(body.natureza).trim() : null;

    if (!codigo) {
      return NextResponse.json({ error: "Informe o código." }, { status: 400 });
    }

    if (!descricao) {
      return NextResponse.json({ error: "Informe a descrição." }, { status: 400 });
    }

    const evento = await prisma.eventoFolhaRH.create({
      data: {
        instituicaoId: user.instituicaoId!,
        codigo,
        descricao,
        tipo,
        natureza,
        incideINSS: Boolean(body.incideINSS),
        incideFGTS: Boolean(body.incideFGTS),
        incideIRRF: Boolean(body.incideIRRF),
        ativo: body.ativo !== false,
      },
    });

    return NextResponse.json(evento);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao criar evento da folha." },
      { status: 500 }
    );
  }
}