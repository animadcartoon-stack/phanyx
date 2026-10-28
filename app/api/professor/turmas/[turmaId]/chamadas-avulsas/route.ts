import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { ErroChamada } from "@/lib/chamada-encontro";
import { autorizarChamadaTurmaAvulsa, carregarChamadaTurmaAvulsa, salvarChamadaTurmaAvulsa } from "@/lib/professor-chamada-turma-avulsa";
import { solicitarReanalisePorAlteracaoAcademica } from "@/lib/student-success/solicitar-reanalise-por-alteracao-academica";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
type ContextoRota = { params: Promise<{ turmaId: string }> };
function responderErro(error: unknown) {
  if (error instanceof ErroChamada) return NextResponse.json({ errorCode: error.codigo }, { status: error.status });
  console.error("[CHAMADA_TURMA_AVULSA]", error);
  return NextResponse.json({ errorCode: "unexpected" }, { status: 500 });
}

export async function GET(req: NextRequest, { params }: ContextoRota) {
  try {
    const user = await getUserFromToken();
    const { turmaId } = await params;
    const contexto = await autorizarChamadaTurmaAvulsa(user, Number(turmaId));
    return NextResponse.json(await carregarChamadaTurmaAvulsa(
      contexto, req.nextUrl.searchParams.get("data"), req.nextUrl.searchParams.get("hora"),
    ));
  } catch (error) { return responderErro(error); }
}

export async function POST(req: NextRequest, { params }: ContextoRota) {
  try {
    const user = await getUserFromToken();
    const { turmaId } = await params;
    const contexto = await autorizarChamadaTurmaAvulsa(user, Number(turmaId));
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { throw new ErroChamada("invalidAttendance"); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ErroChamada("invalidAttendance");
    const resultado = await salvarChamadaTurmaAvulsa(contexto, body, {
      usuarioId: user.impersonacao ? (user.masterOriginalId ?? user.id) : user.id,
      impersonacaoId: user.impersonacaoId,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) ?? null,
      userAgent: req.headers.get("user-agent")?.slice(0, 1000) ?? null,
    });
    try {
      await solicitarReanalisePorAlteracaoAcademica({
        instituicaoId: contexto.instituicaoId, alunoIds: resultado.alunoIds, executadoPorId: user.id,
      });
    } catch (error) { console.error("[CHAMADA_TURMA_AVULSA_REANALISE]", error); }
    return NextResponse.json({ ok: true });
  } catch (error) { return responderErro(error); }
}
