import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error) {
    return NextResponse.redirect(
      "https://phanyx.com.br/admin/integracoes/marketing?meta=erro"
    );
  }

  if (!code) {
    return NextResponse.redirect(
      "https://phanyx.com.br/admin/integracoes/marketing?meta=sem_codigo"
    );
  }

  // Próxima etapa: trocar esse code por token e salvar no banco.
  return NextResponse.redirect(
    "https://phanyx.com.br/admin/integracoes/marketing?meta=callback_ok"
  );
}