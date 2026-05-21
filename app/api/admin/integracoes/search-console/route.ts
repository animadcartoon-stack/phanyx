import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        googleSearchConsoleMeta: true,
        googleSearchConsoleAtivo: true,
      },
    });

    return NextResponse.json({
      meta: instituicao?.googleSearchConsoleMeta || "",
      ativo: instituicao?.googleSearchConsoleAtivo || false,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    await prisma.instituicao.update({
      where: { id: user.instituicaoId },
      data: {
        googleSearchConsoleMeta: body.meta || null,
        googleSearchConsoleAtivo: !!body.ativo,
      },
    });

    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}