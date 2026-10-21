import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { cancelarCobrancaFinanceira } from "@/lib/financeiro/cancelar-cobranca";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromToken();
  if (!user?.instituicaoId || user.impersonacao ||
      (!user.isMasterAdmin && !["ADMIN", "FINANCEIRO", "GERENCIA", "SUPER_ADMIN"].includes(user.role))) {
    return NextResponse.json({ codigo: "SEM_PERMISSAO_CANCELAMENTO" }, { status: 403 });
  }
  if (!planoTemRecurso(user.plano || "ESSENCIAL", "FINANCEIRO")) {
    return NextResponse.json({ codigo: "PLANO_SEM_FINANCEIRO" }, { status: 403 });
  }
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const motivo = String(body?.motivo || "").trim();
  if (!Number.isInteger(id) || id <= 0 || motivo.length < 3 || motivo.length > 1000) {
    return NextResponse.json({ codigo: "CANCELAMENTO_INVALIDO" }, { status: 400 });
  }
  try {
    const resultado = await cancelarCobrancaFinanceira({ id, instituicaoId: user.instituicaoId, motivo,
      operador: { id: user.id, nome: user.nome || user.email || "Admin",
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: req.headers.get("user-agent") } });
    return NextResponse.json(resultado, { status: resultado.pendente ? 202 : 200 });
  } catch (e) {
    const codigo = e instanceof Error ? e.message : "FALHA_CANCELAMENTO_BANCARIO";
    return NextResponse.json({ codigo }, { status: codigo === "COBRANCA_NAO_ENCONTRADA" ? 404 : 409 });
  }
}
