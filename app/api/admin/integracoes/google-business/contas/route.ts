import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      mensagem: "Rota de contas Google Business criada. Próximo passo: conectar OAuth Google Business real.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro Google Business contas", detalhe: String(error) },
      { status: 500 }
    );
  }
}