import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { ErroModalidades } from "./combos";

export async function administradorCombos() {
  const user = await getUserFromToken();
  if (!user?.instituicaoId || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    throw new ErroModalidades("SEM_PERMISSAO", 403);
  }
  return user as typeof user & { instituicaoId: number };
}

export function erroCombos(error: unknown) {
  if (error instanceof ErroModalidades) {
    return NextResponse.json(
      { codigo: error.codigo, detalhes: error.detalhes },
      { status: error.status },
    );
  }
  const codigo = (error as { code?: string })?.code;
  if (codigo === "P2002")
    return NextResponse.json({ codigo: "REGISTRO_DUPLICADO" }, { status: 409 });
  if (codigo === "P2034")
    return NextResponse.json({ codigo: "DADOS_ALTERADOS" }, { status: 409 });
  console.error("Erro em modalidades/combos:", error);
  return NextResponse.json({ codigo: "ERRO_INTERNO" }, { status: 500 });
}
