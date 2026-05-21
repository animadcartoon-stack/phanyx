import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || !["ADMIN", "SUPER_ADMIN", "SECRETARIA"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        googleAnalyticsId: true,
        googleAnalyticsPropertyId: true,
        googleAnalyticsAtivo: true,
      },
    });

    return NextResponse.json(instituicao);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !["ADMIN", "SUPER_ADMIN", "SECRETARIA"].includes(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    await prisma.instituicao.update({
      where: { id: user.instituicaoId },
      data: {
        googleAnalyticsId: body.googleAnalyticsId || null,
        googleAnalyticsPropertyId: body.googleAnalyticsPropertyId || null,
        googleAnalyticsAtivo: !!body.googleAnalyticsAtivo,
      },
    });

    return NextResponse.json({
      ok: true,
      mensagem: "Google Analytics salvo com sucesso",
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}