import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { buscarDescontoPontualidade } from "@/lib/financeiro/desconto-pontualidade-servidor";

export async function GET() {
  const user = await getUserFromToken();
  if (!user || !isAdminLike(user.role)) {
    return NextResponse.json({ error: "SEM_PERMISSAO" }, { status: 403 });
  }
  const descontoPontualidade = await buscarDescontoPontualidade(prisma, user.instituicaoId);
  return NextResponse.json({ descontoPontualidade }, { headers: { "Cache-Control": "private, no-store" } });
}
