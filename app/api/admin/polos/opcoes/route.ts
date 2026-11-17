import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { filtroPolosVisiveis, obterContextoGestaoPolos } from "@/lib/polos-rede";

/** Consulta estritamente de opcoes de polo; nao concede permissao de gerencia. */
export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (!isAdminLike(user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    const contexto = await obterContextoGestaoPolos(user.instituicaoId);
    if (!contexto) return NextResponse.json({ error: "Instituição não encontrada" }, { status: 404 });
    const polos = await prisma.polo.findMany({
      where: filtroPolosVisiveis(contexto),
      select: {
        id: true, nome: true, codigo: true,
        tipoUnidade: true, ativo: true, statusComercial: true,
      },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });
    return NextResponse.json({ polos }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Erro ao buscar opções de polos:", error);
    return NextResponse.json({ error: "Erro ao buscar polos" }, { status: 500 });
  }
}
