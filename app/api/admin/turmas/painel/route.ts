import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { carregarPainelTurmas } from "@/lib/academico/painel-turmas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const perfilAdministrativo = [
      "ADMIN", "SUPER_ADMIN", "FUNCIONARIO", "SECRETARIA",
      "FINANCEIRO", "COORDENADOR", "SUPORTE", "GERENCIA",
    ].includes(user.role);
    if (!perfilAdministrativo) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    if (!Number.isInteger(user.instituicaoId) || !user.instituicaoId || user.instituicaoId <= 0) {
      return NextResponse.json({ error: "Instituição inválida" }, { status: 403 });
    }

    const somenteTurmas = new URL(request.url).searchParams.get("somenteTurmas") === "1";
    // Preserve subject catalog permissions while staff can still list courses/classes.
    const dados = await carregarPainelTurmas(prisma, user.instituicaoId, somenteTurmas, isAdminLike(user.role));
    return NextResponse.json(dados, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Erro ao carregar painel de turmas", error);
    return NextResponse.json({ error: "Erro ao carregar turmas" }, { status: 500 });
  }
}
