import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json({
      visitantes: 0,
      conversoes: 0,
      googleBusinessVisualizacoes: 0,
      reputacaoMedia: null,
      periodo: "Últimos 30 dias",
      status: "aguardando_integracao_real",
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar dashboard de marketing" },
      { status: 500 }
    );
  }
}