import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
  where: { id: user.instituicaoId },
  select: {
    plano: true,
    statusAssinatura: true,
  },
});

    return NextResponse.json({
  plano: instituicao?.plano || "ESSENCIAL",
  statusAssinatura: instituicao?.statusAssinatura || "ATIVA",
});
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar plano da instituição" },
      { status: 500 }
    );
  }
}