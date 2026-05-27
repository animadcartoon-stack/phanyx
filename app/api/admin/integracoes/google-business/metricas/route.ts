import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    return NextResponse.json({
      conectado: true,
      mensagem: "Google Business pronto para integrar métricas reais",
      visualizacoes: 0,
      cliques: 0,
      ligacoes: 0,
      rotas: 0,
      avaliacoes: 0,
      notaMedia: null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro Google Business", detalhe: String(error) },
      { status: 500 }
    );
  }
}